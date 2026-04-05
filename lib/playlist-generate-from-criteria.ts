import type { PlaylistArtistAlgorithm } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordPlaylistTrackEdit } from "@/lib/playlist-timestamps";

export function normalizePlaylistGenres(genres: string[]): string[] {
  return [...new Set(genres.map((g) => g.trim().toLowerCase()).filter(Boolean))];
}

/** YYYY-MM-DD for UTC "today" minus `years` (lexicographic compare with Spotify-style `album.releaseDate`). */
function isoDateUtcYearsAgo(years: number): string {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/** Artist playlists: newest albums first; same-album tracks in disc order (track number). */
const trackOrderForArtistPlaylist = [
  { album: { releaseDate: "desc" as const } },
  { albumId: "asc" as const },
  { trackNumber: "asc" as const },
  { popularity: "desc" as const },
] as const;

/**
 * Genre/follower curation: when taking one track per artist, walk candidates in this order so the
 * chosen row is the most popular among ties on the same album (same release date).
 */
const trackOrderForGenreFollowerPick = [
  { album: { releaseDate: "desc" as const } },
  { popularity: "desc" as const },
  { trackNumber: "asc" as const },
] as const;

/** Lead-artist tracks for a guest: newest release first; same-day ties by popularity. */
const trackOrderForFeaturedGuestPick = [
  { album: { releaseDate: "desc" as const } },
  { popularity: "desc" as const },
  { trackNumber: "asc" as const },
] as const;

async function fetchTrackIdsDefaultForSelectedArtists(
  artistIds: string[],
  limit: number,
): Promise<bigint[]> {
  const tracks = await prisma.track.findMany({
    where: {
      artist: {
        isIgnored: false,
        id: { in: artistIds.map((s) => BigInt(s)) },
      },
    },
    select: { id: true },
    orderBy: [...trackOrderForArtistPlaylist],
    take: limit,
  });
  return tracks.map((t) => t.id);
}

/**
 * Featured playlist: collaboration rows (primary in selection, multiple credits), then after each row
 * the lead tracks of each non-primary credited artist — newest release first, popularity within date,
 * album `releaseDate` not before one year ago (UTC). Repeated guest appearances use the next lead
 * track in that order; skips ids already on the playlist.
 */
async function fetchTrackIdsFeaturedForSelectedArtists(
  artistIds: string[],
  limit: number,
): Promise<bigint[]> {
  const target = Math.max(0, limit);
  if (target === 0) return [];

  const minGuestAlbumReleaseDate = isoDateUtcYearsAgo(1);
  const ids = artistIds.map((s) => BigInt(s));
  const out: bigint[] = [];
  const used = new Set<string>();
  const guestNextStartIndex = new Map<string, number>();
  const guestTrackCache = new Map<string, bigint[]>();

  async function orderedLeadTracksForGuest(artistId: bigint): Promise<bigint[]> {
    const key = artistId.toString();
    const hit = guestTrackCache.get(key);
    if (hit) return hit;

    const row = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { isIgnored: true },
    });
    if (!row || row.isIgnored) {
      guestTrackCache.set(key, []);
      return [];
    }

    const tracks = await prisma.track.findMany({
      where: {
        artistId,
        album: { releaseDate: { gte: minGuestAlbumReleaseDate } },
      },
      select: { id: true },
      orderBy: [...trackOrderForFeaturedGuestPick],
    });
    const list = tracks.map((t) => t.id);
    guestTrackCache.set(key, list);
    return list;
  }

  function pickNextUnusedFrom(
    ordered: bigint[],
    startFrom: number,
  ): { id: bigint; nextStart: number } | null {
    for (let i = startFrom; i < ordered.length; i++) {
      const id = ordered[i];
      if (!used.has(id.toString())) {
        return { id, nextStart: i + 1 };
      }
    }
    return null;
  }

  const batchSize = 80;
  let offset = 0;

  while (out.length < target) {
    const baseRows = await prisma.$queryRaw<{ id: bigint }[]>`
      SELECT t.id
      FROM track t
      INNER JOIN artist a ON a.id = t."artistId"
      INNER JOIN album al ON al.id = t."albumId"
      WHERE a."isIgnored" = false
        AND t."artistId" IN (${Prisma.join(ids)})
        AND (
          SELECT COUNT(*)::int FROM track_artist ta WHERE ta."trackId" = t.id
        ) > 1
      ORDER BY al."releaseDate" DESC, t."albumId" ASC, t."trackNumber" ASC, t.popularity DESC
      OFFSET ${offset}
      LIMIT ${batchSize}
    `;
    if (baseRows.length === 0) break;
    offset += baseRows.length;

    const detailById = new Map(
      (
        await prisma.track.findMany({
          where: { id: { in: baseRows.map((r) => r.id) } },
          select: {
            id: true,
            artistId: true,
            trackArtists: { select: { artistId: true } },
          },
        })
      ).map((t) => [t.id, t]),
    );

    for (const { id: baseId } of baseRows) {
      if (out.length >= target) break;

      const baseKey = baseId.toString();
      if (used.has(baseKey)) continue;

      const detail = detailById.get(baseId);
      if (!detail) continue;

      used.add(baseKey);
      out.push(baseId);

      const primaryId = detail.artistId;
      const guestIds = detail.trackArtists
        .map((ta) => ta.artistId)
        .filter((aid) => aid !== primaryId)
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

      for (const guestId of guestIds) {
        if (out.length >= target) break;

        const guestKey = guestId.toString();
        const ordered = await orderedLeadTracksForGuest(guestId);
        const start = guestNextStartIndex.get(guestKey) ?? 0;
        const picked = pickNextUnusedFrom(ordered, start);
        if (!picked) {
          guestNextStartIndex.set(guestKey, ordered.length);
          continue;
        }

        guestNextStartIndex.set(guestKey, picked.nextStart);
        used.add(picked.id.toString());
        out.push(picked.id);
      }
    }
  }

  return out;
}

/** All tracks from the given artists (non-ignored), algorithm-specific filter/order, capped at `size`. */
async function fetchTrackIdsForSelectedArtists(
  artistIds: string[],
  size: number,
  algorithm: PlaylistArtistAlgorithm,
): Promise<bigint[]> {
  const limit = Math.max(0, size);
  if (limit === 0) return [];

  switch (algorithm) {
    case "DEFAULT":
      return fetchTrackIdsDefaultForSelectedArtists(artistIds, limit);
    case "FEATURED":
      return fetchTrackIdsFeaturedForSelectedArtists(artistIds, limit);
    default:
      throw new Error(`Unsupported artist playlist algorithm: ${algorithm}`);
  }
}

/** Genre + follower caps; at most one track per artist until `size` is reached. */
async function fetchTrackIdsByGenreAndFollowerCriteria(
  genres: string[],
  maxFollowers: number | null,
  size: number,
): Promise<bigint[]> {
  const normalizedGenres = normalizePlaylistGenres(genres);
  const limit = Math.max(0, size);
  if (limit === 0) return [];

  const tracks = await prisma.track.findMany({
    where: {
      artist: {
        isIgnored: false,
        ...(maxFollowers != null ? { followers: { lte: maxFollowers } } : {}),
        ...(normalizedGenres.length > 0 ? { genres: { hasSome: normalizedGenres } } : {}),
      },
    },
    select: { id: true, artistId: true },
    orderBy: [...trackOrderForGenreFollowerPick],
  });

  const picked: bigint[] = [];
  const seenArtist = new Set<string>();
  for (const row of tracks) {
    if (picked.length >= limit) break;
    const key = row.artistId.toString();
    if (seenArtist.has(key)) continue;
    seenArtist.add(key);
    picked.push(row.id);
  }
  return picked;
}

export async function fetchTrackIdsMatchingPlaylistCriteria(
  genres: string[],
  maxFollowers: number | null,
  size: number,
  artistIds: string[],
  artistAlgorithm: PlaylistArtistAlgorithm,
): Promise<bigint[]> {
  if (artistIds.length > 0) {
    return fetchTrackIdsForSelectedArtists(artistIds, size, artistAlgorithm);
  }
  return fetchTrackIdsByGenreAndFollowerCriteria(genres, maxFollowers, size);
}

export async function replacePlaylistTracksFromDbCriteria(playlistDbId: bigint): Promise<void> {
  const playlist = await prisma.playlist.findUniqueOrThrow({
    where: { id: playlistDbId },
    select: {
      id: true,
      genres: true,
      maxFollowers: true,
      size: true,
      artistIds: true,
      artistAlgorithm: true,
    },
  });

  const trackIds = await fetchTrackIdsMatchingPlaylistCriteria(
    playlist.genres,
    playlist.maxFollowers,
    playlist.size,
    playlist.artistIds ?? [],
    playlist.artistAlgorithm,
  );

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.deleteMany({ where: { playlistId: playlist.id } });
    if (trackIds.length > 0) {
      await tx.playlistTrack.createMany({
        data: trackIds.map((trackId, index) => ({
          playlistId: playlist.id,
          trackId,
          position: index + 1,
        })),
      });
    }
  });

  await recordPlaylistTrackEdit(playlist.id);
}
