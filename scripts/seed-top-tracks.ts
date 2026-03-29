import { prisma } from "@/lib/prisma";
import { SpotifyClient } from "@/lib/spotifyClient";

function normalizeSpotifyArtistId(raw: string): string {
  const s = raw.trim();
  const uri = /^spotify:artist:(.+)$/.exec(s);
  if (uri) return uri[1];
  const openUrl = /open\.spotify\.com\/artist\/([^/?#]+)/.exec(s);
  if (openUrl) return openUrl[1];
  return s;
}

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
  const targetedRaw = process.argv[2];

  let artists: { id: bigint; spotifyId: string }[];

  if (targetedRaw) {
    const spotifyId = normalizeSpotifyArtistId(targetedRaw);
    const one = await prisma.artist.findUnique({
      where: { spotifyId },
      select: { id: true, spotifyId: true },
    });
    if (!one) {
      console.error(
        `No artist in DB with spotifyId=${spotifyId}. Seed the artist first (e.g. scripts/seed-artist.ts).`,
      );
      process.exitCode = 1;
      return;
    }
    artists = [one];
  } else {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const neverRefreshed = await prisma.artist.findMany({
      where: { topTracksRefreshedAt: null },
      take: batchSize,
      orderBy: { createdAt: "asc" },
      select: { id: true, spotifyId: true },
    });

    artists = neverRefreshed;
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

        let album = await prisma.album.findUnique({
          where: { spotifyId: track.album.id },
          select: { id: true },
        });
        if (!album) {
          album = await prisma.album.create({
            data: {
              spotifyId: track.album.id,
              artistId: artist.id,
              name: track.album.name,
              releaseDate: track.album.release_date,
            },
            select: { id: true },
          });
        }

        let persisted = await prisma.track.findUnique({
          where: { spotifyId: track.id },
          select: { id: true },
        });
        if (!persisted) {
          persisted = await prisma.track.create({
            data: {
              spotifyId: track.id,
              artistId: artist.id,
              albumId: album.id,
              name: track.name,
              popularity: track.popularity,
              trackNumber: track.track_number,
            },
            select: { id: true },
          });
        }

        const spotifyArtistIds = [
          ...new Set((track.artists ?? []).map((a) => a.id)),
        ];
        const linkedArtists = await prisma.artist.findMany({
          where: { spotifyId: { in: spotifyArtistIds } },
          select: { id: true },
        });
        const artistIdsToLink = new Set(linkedArtists.map((a) => a.id));
        artistIdsToLink.add(artist.id);

        await prisma.trackArtist.createMany({
          data: [...artistIdsToLink].map((artistId) => ({
            trackId: persisted.id,
            artistId,
          })),
          skipDuplicates: true,
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

