import { prisma } from "@/lib/prisma";
import {
  SpotifyClient,
  getPlaylistTrackTotal,
  type SpotifyTrack,
} from "@/lib/spotifyClient";

function normalizeSpotifyPlaylistId(raw: string): string {
  const s = raw.trim();
  const uri = /^spotify:playlist:(.+)$/.exec(s);
  if (uri) return uri[1];
  const openUrl = /open\.spotify\.com\/playlist\/([^/?#]+)/.exec(s);
  if (openUrl) return openUrl[1];
  return s;
}

/**
 * Load every artist credited on these tracks from Spotify and upsert rows so
 * `syncAlbumTracksForExistingArtists` can persist tracks and track_artist links.
 */
async function ensureArtistsForPlaylistTracks(
  spotifyClient: SpotifyClient,
  trackSpotifyIds: string[],
): Promise<void> {
  const uniqueTrackIds = [...new Set(trackSpotifyIds)];
  if (uniqueTrackIds.length === 0) return;

  const fullTracks = await spotifyClient.getTracksByIds(uniqueTrackIds);
  const artistSpotifyIds = new Set<string>();
  for (const t of fullTracks) {
    for (const a of t.artists ?? []) {
      artistSpotifyIds.add(a.id);
    }
  }
  if (artistSpotifyIds.size === 0) return;

  const existing = await prisma.artist.findMany({
    where: { spotifyId: { in: [...artistSpotifyIds] } },
    select: { spotifyId: true },
  });
  const existingSet = new Set(existing.map((e) => e.spotifyId));
  const missing = [...artistSpotifyIds].filter((id) => !existingSet.has(id));
  if (missing.length === 0) return;

  const fetched = await spotifyClient.getArtistsByIds(missing);
  for (const artist of fetched) {
    await prisma.artist.upsert({
      where: { spotifyId: artist.id },
      update: {
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
      },
      create: {
        spotifyId: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        followers: artist.followers.total,
      },
    });
  }

  if (fetched.length < missing.length) {
    console.warn(
      `Spotify returned ${fetched.length} of ${missing.length} artist object(s); some ids may be invalid.`,
    );
  }
  console.log(
    `Upserted ${fetched.length} artist row(s) that were missing from the database.`,
  );
}

/**
 * Persist every playable track on the album that credits at least one artist row in our DB.
 * Matches the curation rules in `seed-artist-catalog.ts` / `seed-top-tracks.ts`.
 */
async function syncAlbumTracksForExistingArtists(
  spotifyClient: SpotifyClient,
  albumSpotifyId: string,
): Promise<void> {
  const fullAlbum = await spotifyClient.getAlbum(albumSpotifyId);
  if (!fullAlbum) {
    console.warn(`Could not load album ${albumSpotifyId} from Spotify`);
    return;
  }

  const stubs = await spotifyClient.getAlbumTracks(albumSpotifyId);
  const fullTracks = await spotifyClient.getTracksByIds(stubs.map((t) => t.id));
  const fullById = new Map<string, SpotifyTrack>(fullTracks.map((t) => [t.id, t]));

  const albumArtistSpotifyIds = fullAlbum.artists.map((a) => a.id);
  const albumArtistsInDb = await prisma.artist.findMany({
    where: { spotifyId: { in: albumArtistSpotifyIds } },
    select: { id: true, spotifyId: true },
  });
  const albumArtistIdBySpotifyId = new Map(
    albumArtistsInDb.map((a) => [a.spotifyId, a.id]),
  );

  let albumRow = await prisma.album.findUnique({
    where: { spotifyId: albumSpotifyId },
    select: { id: true },
  });

  for (const stub of stubs) {
    const full = fullById.get(stub.id);
    if (!full || !full.is_playable) continue;

    const spotifyArtistIdsOnTrack = [
      ...new Set((full.artists ?? []).map((a) => a.id)),
    ];
    const linkedArtists = await prisma.artist.findMany({
      where: { spotifyId: { in: spotifyArtistIdsOnTrack } },
      select: { id: true, spotifyId: true },
    });
    if (linkedArtists.length === 0) continue;

    const primarySpotifyId = spotifyArtistIdsOnTrack.find((sid) =>
      linkedArtists.some((a) => a.spotifyId === sid),
    );
    if (!primarySpotifyId) continue;
    const primaryArtistId = linkedArtists.find(
      (a) => a.spotifyId === primarySpotifyId,
    )!.id;

    if (!albumRow) {
      const albumOwnerArtistId =
        albumArtistSpotifyIds
          .map((sid) => albumArtistIdBySpotifyId.get(sid))
          .find((id): id is bigint => id !== undefined) ?? primaryArtistId;

      albumRow = await prisma.album.create({
        data: {
          spotifyId: fullAlbum.id,
          artistId: albumOwnerArtistId,
          name: fullAlbum.name,
          releaseDate: fullAlbum.release_date,
        },
        select: { id: true },
      });
    }

    let persisted = await prisma.track.findUnique({
      where: { spotifyId: full.id },
      select: { id: true },
    });

    if (!persisted) {
      persisted = await prisma.track.create({
        data: {
          spotifyId: full.id,
          artistId: primaryArtistId,
          albumId: albumRow.id,
          name: full.name,
          popularity: full.popularity,
          trackNumber: full.track_number,
        },
        select: { id: true },
      });
    }

    const artistIdsToLink = new Set(linkedArtists.map((a) => a.id));
    await prisma.trackArtist.createMany({
      data: [...artistIdsToLink].map((artistId) => ({
        trackId: persisted.id,
        artistId,
      })),
      skipDuplicates: true,
    });
  }
}

async function ensureTrackInDb(
  spotifyClient: SpotifyClient,
  spotifyTrackId: string,
  albumSyncCache: Set<string>,
): Promise<bigint | null> {
  const existing = await prisma.track.findUnique({
    where: { spotifyId: spotifyTrackId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const [full] = await spotifyClient.getTracksByIds([spotifyTrackId]);
  if (!full || !full.is_playable) return null;

  if (!albumSyncCache.has(full.album.id)) {
    await syncAlbumTracksForExistingArtists(spotifyClient, full.album.id);
    albumSyncCache.add(full.album.id);
  }

  const again = await prisma.track.findUnique({
    where: { spotifyId: spotifyTrackId },
    select: { id: true },
  });
  return again?.id ?? null;
}

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error(
      "Usage: tsx scripts/seed-playlist-tracks.ts <spotifyPlaylistId|spotify:playlist:…|open.spotify.com/playlist/…>",
    );
    process.exitCode = 1;
    return;
  }

  const playlistSpotifyId = normalizeSpotifyPlaylistId(raw);
  const spotifyClient = new SpotifyClient();

  let playlist = await prisma.playlist.findUnique({
    where: { spotifyId: playlistSpotifyId },
  });

  if (!playlist) {
    const meta = await spotifyClient.getPlaylist(playlistSpotifyId);
    playlist = await prisma.playlist.create({
      data: {
        spotifyId: meta.id,
        name: meta.name,
        description: meta.description ?? "",
        genres: [],
        maxFollowers: null,
        size: getPlaylistTrackTotal(meta),
      },
    });
    console.log(
      `Created playlist row: ${playlist.name} (db id=${playlist.id}, spotifyId=${playlist.spotifyId})`,
    );
  }

  const orderedSpotifyTrackIds =
    await spotifyClient.getPlaylistTrackIds(playlistSpotifyId);

  await ensureArtistsForPlaylistTracks(spotifyClient, orderedSpotifyTrackIds);

  const albumSyncCache = new Set<string>();
  const dbIdBySpotifyId = new Map<string, bigint>();

  for (const sid of new Set(orderedSpotifyTrackIds)) {
    const id = await ensureTrackInDb(spotifyClient, sid, albumSyncCache);
    if (id) dbIdBySpotifyId.set(sid, id);
  }

  const unresolved: string[] = [];
  const resolvedTrackIds: bigint[] = [];

  for (const sid of orderedSpotifyTrackIds) {
    const trackId = dbIdBySpotifyId.get(sid);
    if (trackId !== undefined) resolvedTrackIds.push(trackId);
    else unresolved.push(sid);
  }

  if (unresolved.length > 0) {
    const unique = [...new Set(unresolved)];
    console.warn(
      `Skipping ${unresolved.length} playlist position(s) (${unique.length} unique track id(s)) not in DB or not matching a seeded artist:`,
    );
    console.warn(unique.join("\n"));
  }

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.deleteMany({
      where: { playlistId: playlist!.id },
    });

    if (resolvedTrackIds.length > 0) {
      await tx.playlistTrack.createMany({
        data: resolvedTrackIds.map((trackId, index) => ({
          playlistId: playlist!.id,
          trackId,
          position: index + 1,
        })),
      });
    }
  });

  console.log(
    `Synced ${resolvedTrackIds.length} playlist_track row(s) for playlist "${playlist.name}" (db id=${playlist.id}).` +
      (unresolved.length > 0 ? ` Skipped ${unresolved.length} unresolved.` : ""),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
