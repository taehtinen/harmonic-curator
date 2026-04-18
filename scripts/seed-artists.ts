import { prisma } from "@/lib/prisma";
import { SpotifyArtist, SpotifyClient } from "@/lib/spotifyClient";

/** Spotify order first, then DB-only genres (e.g. admin-added) not matched case-insensitively. */
function mergeSpotifyGenresWithExisting(
  existingGenres: string[],
  spotifyGenres: string[],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const g of spotifyGenres) {
    const key = g.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(g);
    }
  }

  for (const g of existingGenres) {
    const key = g.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(g);
    }
  }

  return merged;
}

async function main() {
  const spotifyClient = new SpotifyClient();

  const searches = ['finnish', 'finnish rock', 'finnish pop', 'iskelmä', 'finnish hip hop'];
  const artistPromises = searches.map(search => spotifyClient.searchArtists(search));
  const artists = await Promise.all(artistPromises);
  const allArtists = artists.flat();
  const allUniqueArtists: Map<string, SpotifyArtist> = new Map();
  for (const artist of allArtists) {
    allUniqueArtists.set(artist.id, artist);
  }
  console.log("Found", allUniqueArtists.size, "unique Spotify artists");

  for (const artist of Array.from(allUniqueArtists.values())) {
    const existing = await prisma.artist.findUnique({
      where: { spotifyId: artist.id },
      select: { genres: true },
    });

    await prisma.artist.upsert({
      where: { spotifyId: artist.id },
      update: {
        name: artist.name,
        genres: existing
          ? mergeSpotifyGenresWithExisting(existing.genres, artist.genres)
          : artist.genres,
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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

