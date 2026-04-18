import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { normalizeSpotifyArtistId } from "@/lib/seed/seedArtistFromSpotifyId";
import { getTemporalClient } from "@/lib/temporal/client";
import { temporalTaskQueue } from "@/lib/temporal/taskQueue";
import { SpotifyClient } from "@/lib/spotifyClient";
import { seedArtist } from "@/temporal/workflows";

function normalizeSpotifyPlaylistId(raw: string): string {
  const s = raw.trim();
  const uri = /^spotify:playlist:(.+)$/.exec(s);
  if (uri) return uri[1];
  const openUrl = /open\.spotify\.com\/playlist\/([^/?#]+)/.exec(s);
  if (openUrl) return openUrl[1];
  return s;
}

async function collectArtistSpotifyIdsFromPlaylist(
  spotifyClient: SpotifyClient,
  playlistSpotifyId: string,
): Promise<Map<string, string>> {
  const trackIds = await spotifyClient.getPlaylistTrackIds(playlistSpotifyId);
  const uniqueTrackIds = [...new Set(trackIds)];
  const idToName = new Map<string, string>();

  for (let i = 0; i < uniqueTrackIds.length; i += 50) {
    const chunk = uniqueTrackIds.slice(i, i + 50);
    const tracks = await spotifyClient.getTracksByIds(chunk);
    for (const t of tracks) {
      for (const a of t.artists ?? []) {
        if (!idToName.has(a.id)) idToName.set(a.id, a.name);
      }
    }
  }

  return idToName;
}

async function main() {
  const raw = process.argv[2];
  if (!raw?.trim()) {
    console.error(
      "Usage: tsx scripts/start-seed-playlist-artists-workflows.ts <spotifyPlaylistId|spotify:playlist:…|open.spotify.com/playlist/…>",
    );
    process.exitCode = 1;
    return;
  }

  const wait =
    process.argv.includes("--wait") || process.argv.includes("-w");

  const playlistSpotifyId = normalizeSpotifyPlaylistId(raw);
  const spotifyClient = new SpotifyClient();

  const meta = await spotifyClient.getPlaylist(playlistSpotifyId);
  console.log(
    `Playlist "${meta.name}" (${playlistSpotifyId}) — ${meta.items?.total ?? "?"} track(s) on Spotify`,
  );

  const artistIdToName = await collectArtistSpotifyIdsFromPlaylist(
    spotifyClient,
    playlistSpotifyId,
  );
  console.log(`Unique artists credited on playlist tracks: ${artistIdToName.size}`);

  const spotifyIds = [...artistIdToName.keys()];
  if (spotifyIds.length === 0) {
    console.log("No artists found (empty playlist or only non-track items).");
    return;
  }

  const existing = await prisma.artist.findMany({
    where: { spotifyId: { in: spotifyIds } },
    select: { spotifyId: true },
  });
  const existingSet = new Set(existing.map((e) => e.spotifyId));
  const missing = spotifyIds.filter((id) => !existingSet.has(id));

  console.log(`Already in database: ${existing.length}`);
  console.log(`Missing from database: ${missing.length}`);

  if (missing.length === 0) {
    return;
  }

  const client = await getTemporalClient();

  for (const spotifyArtistId of missing) {
    const normalized = normalizeSpotifyArtistId(spotifyArtistId);
    const workflowId = `seed-artist-pl-${normalized}-${randomUUID()}`;
    const handle = await client.workflow.start(seedArtist, {
      taskQueue: temporalTaskQueue(),
      workflowId,
      args: [spotifyArtistId],
    });
    const label = artistIdToName.get(spotifyArtistId) ?? spotifyArtistId;
    console.log(
      `Started seedArtist for ${label} (${spotifyArtistId}) — workflowId=${handle.workflowId} run=${handle.firstExecutionRunId}`,
    );
    if (wait) {
      const result = await handle.result();
      console.log(JSON.stringify(result, null, 2));
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
