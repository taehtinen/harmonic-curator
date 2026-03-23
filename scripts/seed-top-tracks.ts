import { prisma } from "@/lib/prisma";
import { SpotifyClient } from "@/lib/spotifyClient";

// Controls how many artists are refreshed per run.
// Set `SEED_TOP_TRACKS_BATCH` to a positive integer to override the default.
function getBatchSize(): number {
  const raw = process.env.SEED_TOP_TRACKS_BATCH;
  const parsed = raw ? Number.parseInt(raw, 10) : 10;
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return parsed;
}

async function main() {
  const spotifyClient = new SpotifyClient();
  const batchSize = getBatchSize();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const neverRefreshed = await prisma.artist.findMany({
    where: { topTracksRefreshedAt: null },
    take: batchSize,
    orderBy: { createdAt: "asc" },
    select: { id: true, spotifyId: true },
  });

  let artists = neverRefreshed;
  if (artists.length < batchSize) {
    const remainder = batchSize - artists.length;
    const moreStale = await prisma.artist.findMany({
      where: { topTracksRefreshedAt: { lte: cutoff } },
      take: remainder,
      orderBy: { topTracksRefreshedAt: "asc" },
      select: { id: true, spotifyId: true },
    });
    artists = artists.concat(moreStale);
  }

  if (artists.length === 0) {
    console.log("No artists require a top-tracks refresh in the last 24h window.");
    return;
  }

  console.log(`Refreshing top tracks for ${artists.length} artist(s).`);

  for (const artist of artists) {
    const refreshedAt = new Date();
    try {
      console.log(`Fetching Spotify top-tracks for artist ${artist.spotifyId}`);
      const tracks = await spotifyClient.getArtistsTopTracks(artist.spotifyId);

      for (const track of tracks) {
        if (!track.is_playable) continue;

        const album = await prisma.album.upsert({
          where: { spotifyId: track.album.id },
          update: {
            name: track.album.name,
            releaseDate: track.album.release_date,
            artistId: artist.id,
          },
          create: {
            spotifyId: track.album.id,
            artistId: artist.id,
            name: track.album.name,
            releaseDate: track.album.release_date,
          },
          select: { id: true },
        });

        await prisma.track.upsert({
          where: { spotifyId: track.id },
          update: {
            name: track.name,
            popularity: track.popularity,
            trackNumber: track.track_number,
            albumId: album.id,
            artistId: artist.id,
          },
          create: {
            spotifyId: track.id,
            artistId: artist.id,
            albumId: album.id,
            name: track.name,
            popularity: track.popularity,
            trackNumber: track.track_number,
          },
        });
      }

      await prisma.artist.update({
        where: { id: artist.id },
        data: { topTracksRefreshedAt: refreshedAt },
      });
    } catch (err) {
      console.error(`Failed to refresh top tracks for artist ${artist.spotifyId}:`, err);
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

