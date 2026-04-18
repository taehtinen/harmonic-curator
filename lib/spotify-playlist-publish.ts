import { prisma } from "@/lib/prisma";
import {
  getValidAccessTokenForAccount,
} from "@/lib/user-spotify-account";
import type { SpotifyPaging, SpotifyPlaylistItem } from "@/lib/spotifyClient";

const API = "https://api.spotify.com/v1";

function requireMarket(): string {
  const m = process.env.SPOTIFY_MARKET?.trim();
  if (!m) throw new Error("SPOTIFY_MARKET is not set");
  return m;
}

function rowFromPlaylistItem(
  row: SpotifyPlaylistItem,
): { id: string; uri: string } | null {
  const node = row.item ?? row.track;
  if (!node) return null;
  if ("type" in node && node.type === "episode") {
    return { id: `episode:${node.id}`, uri: `spotify:episode:${node.id}` };
  }
  return { id: node.id, uri: `spotify:track:${node.id}` };
}

async function userSpotifyFetch(
  accessToken: string,
  method: string,
  url: string,
  body?: unknown,
): Promise<Response> {
  for (;;) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      const wait = parseInt(res.headers.get("Retry-After") ?? "1", 10);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    return res;
  }
}

async function ensureOk(res: Response, what: string): Promise<void> {
  if (res.ok) return;
  const text = await res.text();
  throw new Error(`${what}: ${res.status} ${text}`);
}

async function fetchAllPlaylistItemRows(
  accessToken: string,
  playlistSpotifyId: string,
): Promise<{ id: string; uri: string }[]> {
  const market = requireMarket();
  const limit = 50;
  let url: string | null =
    `${API}/playlists/${playlistSpotifyId}/items?market=${encodeURIComponent(market)}&limit=${limit}`;
  const rows: { id: string; uri: string }[] = [];

  while (url) {
    const res = await userSpotifyFetch(accessToken, "GET", url);
    await ensureOk(res, "Spotify GET playlist items");
    const page = (await res.json()) as SpotifyPaging<SpotifyPlaylistItem>;
    for (const item of page.items) {
      const r = rowFromPlaylistItem(item);
      if (r) rows.push(r);
    }
    url = page.next;
  }

  return rows;
}

/**
 * Match Spotify's current list to `desired` track ids: remove non-matching rows (minimal removals),
 * then append any missing tracks. Survivors keep their relative order and stay at the front.
 */
function planSync(
  current: { id: string; uri: string }[],
  desiredTrackIds: string[],
): { removeUris: string[]; appendTrackIds: string[] } {
  let wantIdx = 0;
  const removeUris: string[] = [];

  for (const row of current) {
    const wantId = desiredTrackIds[wantIdx];
    const rowIsDesiredTrack =
      !row.id.startsWith("episode:") && row.id === wantId;

    if (rowIsDesiredTrack) {
      wantIdx++;
    } else {
      removeUris.push(row.uri);
    }
  }

  return {
    removeUris,
    appendTrackIds: desiredTrackIds.slice(wantIdx),
  };
}

const ITEM_BATCH = 100;

async function deletePlaylistItems(
  accessToken: string,
  playlistSpotifyId: string,
  uris: string[],
): Promise<void> {
  if (uris.length === 0) return;
  const url = `${API}/playlists/${playlistSpotifyId}/items`;
  for (let i = 0; i < uris.length; i += ITEM_BATCH) {
    const chunk = uris.slice(i, i + ITEM_BATCH);
    const res = await userSpotifyFetch(accessToken, "DELETE", url, {
      items: chunk.map((uri) => ({ uri })),
    });
    await ensureOk(res, "Spotify DELETE playlist items");
  }
}

/** Spotify limits for POST /users/{id}/playlists */
const SPOTIFY_PLAYLIST_NAME_MAX = 100;
const SPOTIFY_PLAYLIST_DESCRIPTION_MAX = 300;

async function createUserSpotifyPlaylist(
  accessToken: string,
  spotifyUserId: string,
  name: string,
  description: string,
): Promise<string> {
  const url = `${API}/users/${encodeURIComponent(spotifyUserId)}/playlists`;
  const res = await userSpotifyFetch(accessToken, "POST", url, {
    name: name.slice(0, SPOTIFY_PLAYLIST_NAME_MAX),
    public: true,
    collaborative: false,
    description: description.slice(0, SPOTIFY_PLAYLIST_DESCRIPTION_MAX),
  });
  await ensureOk(res, "Spotify POST create playlist");
  const body = (await res.json()) as { id?: string };
  if (!body.id) {
    throw new Error("Spotify POST create playlist: missing id in response");
  }
  return body.id;
}

async function postPlaylistItems(
  accessToken: string,
  playlistSpotifyId: string,
  trackIds: string[],
): Promise<void> {
  if (trackIds.length === 0) return;
  const url = `${API}/playlists/${playlistSpotifyId}/items`;
  for (let i = 0; i < trackIds.length; i += ITEM_BATCH) {
    const chunk = trackIds.slice(i, i + ITEM_BATCH);
    const res = await userSpotifyFetch(accessToken, "POST", url, {
      uris: chunk.map((id) => `spotify:track:${id}`),
    });
    await ensureOk(res, "Spotify POST playlist items");
  }
}

async function syncOnce(
  accessToken: string,
  playlistSpotifyId: string,
  desiredTrackIds: string[],
): Promise<void> {
  const current = await fetchAllPlaylistItemRows(accessToken, playlistSpotifyId);
  const { removeUris, appendTrackIds } = planSync(current, desiredTrackIds);
  await deletePlaylistItems(accessToken, playlistSpotifyId, removeUris);
  await postPlaylistItems(accessToken, playlistSpotifyId, appendTrackIds);
}

export async function publishPlaylistTracksForUser(input: {
  appUserId: bigint;
  playlistDbId: bigint;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  let playlist = await prisma.playlist.findFirst({
    where: { id: input.playlistDbId, userId: input.appUserId },
    include: {
      playlistTracks: {
        orderBy: { position: "asc" },
        include: { track: { select: { spotifyId: true } } },
      },
    },
  });

  if (!playlist) {
    return { ok: false, message: "Playlist not found." };
  }

  const desiredTrackIds = playlist.playlistTracks.map((pt) => pt.track.spotifyId);

  const accounts = await prisma.userSpotifyAccount.findMany({
    where: { userId: input.appUserId },
    select: { id: true, spotifyUserId: true },
    orderBy: { createdAt: "desc" },
  });

  if (accounts.length === 0) {
    return {
      ok: false,
      message: "No linked Spotify account. Link one in Settings first.",
    };
  }

  let lastMessage = "Could not publish with any linked Spotify account.";
  for (const { id: accountId, spotifyUserId } of accounts) {
    try {
      const token = await getValidAccessTokenForAccount(accountId);

      let spotifyPlaylistId: string | null = playlist.spotifyId;
      if (spotifyPlaylistId == null) {
        const newSpotifyId = await createUserSpotifyPlaylist(
          token,
          spotifyUserId,
          playlist.name,
          playlist.description,
        );
        const linked = await prisma.playlist.updateMany({
          where: {
            id: playlist.id,
            userId: input.appUserId,
            spotifyId: null,
          },
          data: { spotifyId: newSpotifyId },
        });
        if (linked.count === 0) {
          const row: { spotifyId: string | null } | null = await prisma.playlist.findFirst({
            where: { id: playlist.id, userId: input.appUserId },
            select: { spotifyId: true },
          });
          spotifyPlaylistId = row?.spotifyId ?? null;
          if (spotifyPlaylistId == null) {
            throw new Error("Could not save new Spotify playlist id.");
          }
        } else {
          spotifyPlaylistId = newSpotifyId;
        }
        playlist = { ...playlist, spotifyId: spotifyPlaylistId };
      }

      await syncOnce(token, spotifyPlaylistId, desiredTrackIds);
      await prisma.playlist.update({
        where: { id: playlist.id },
        data: { lastSpotifyPublishAt: new Date() },
      });
      return { ok: true };
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : String(e);
    }
  }

  return { ok: false, message: lastMessage };
}
