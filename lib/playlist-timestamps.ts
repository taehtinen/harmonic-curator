import { prisma } from "@/lib/prisma";

/** Call after local `playlist_track` rows change (reorder, add, remove) without a full Spotify import. */
export async function recordPlaylistTrackEdit(
  playlistDbId: bigint,
  at: Date = new Date(),
): Promise<void> {
  await prisma.playlist.update({
    where: { id: playlistDbId },
    data: { lastTrackEditAt: at },
  });
}

/** Call after import seed: local mirror updated plus latest Spotify `added_at` among kept tracks. */
export async function recordPlaylistAfterSpotifyImport(
  playlistDbId: bigint,
  latestTrackAddedAtFromSpotify: Date | null,
): Promise<void> {
  await prisma.playlist.update({
    where: { id: playlistDbId },
    data: {
      lastTrackEditAt: new Date(),
      lastSpotifyPublishAt: latestTrackAddedAtFromSpotify,
    },
  });
}

/** Call after this app successfully writes playlist tracks to Spotify (add/remove/replace). */
export async function recordPlaylistSpotifyPublish(
  playlistDbId: bigint,
  at: Date = new Date(),
): Promise<void> {
  await prisma.playlist.update({
    where: { id: playlistDbId },
    data: { lastSpotifyPublishAt: at },
  });
}
