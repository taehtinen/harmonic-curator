import { prisma } from "@/lib/prisma";
import { recordPlaylistTrackEdit } from "@/lib/playlist-timestamps";

function normalizePlaylistGenres(genres: string[]): string[] {
  return [...new Set(genres.map((g) => g.trim().toLowerCase()).filter(Boolean))];
}

export async function fetchTrackIdsMatchingPlaylistCriteria(
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
    orderBy: [
      { album: { releaseDate: "desc" } },
      { popularity: "desc" },
      { trackNumber: "asc" },
    ],
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

export async function replacePlaylistTracksFromDbCriteria(playlistDbId: bigint): Promise<void> {
  const playlist = await prisma.playlist.findUniqueOrThrow({
    where: { id: playlistDbId },
    select: { id: true, genres: true, maxFollowers: true, size: true },
  });

  const trackIds = await fetchTrackIdsMatchingPlaylistCriteria(
    playlist.genres,
    playlist.maxFollowers,
    playlist.size,
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
