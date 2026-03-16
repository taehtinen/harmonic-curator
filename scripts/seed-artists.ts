import { prisma } from "@/lib/prisma";
import { SpotifyArtist, SpotifyClient } from "@/lib/spotifyClient";

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

