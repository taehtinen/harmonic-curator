import { prisma } from "@/lib/prisma";
import { recordPlaylistTrackEdit } from "@/lib/playlist-timestamps";

function normalizePlaylistGenres(genres: string[]): string[] {
  return [...new Set(genres.map((g) => g.trim().toLowerCase()).filter(Boolean))];
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

/** All tracks from the given artists (non-ignored), album sequence as above, capped at `size`. */
async function fetchTrackIdsForSelectedArtists(
  artistIds: string[],
  size: number,
): Promise<bigint[]> {
  const limit = Math.max(0, size);
  if (limit === 0) return [];

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
): Promise<bigint[]> {
  if (artistIds.length > 0) {
    return fetchTrackIdsForSelectedArtists(artistIds, size);
  }
  return fetchTrackIdsByGenreAndFollowerCriteria(genres, maxFollowers, size);
}

export async function replacePlaylistTracksFromDbCriteria(playlistDbId: bigint): Promise<void> {
  const playlist = await prisma.playlist.findUniqueOrThrow({
    where: { id: playlistDbId },
    select: { id: true, genres: true, maxFollowers: true, size: true, artistIds: true },
  });

  const trackIds = await fetchTrackIdsMatchingPlaylistCriteria(
    playlist.genres,
    playlist.maxFollowers,
    playlist.size,
    playlist.artistIds ?? [],
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
