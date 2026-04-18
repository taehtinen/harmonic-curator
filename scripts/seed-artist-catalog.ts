import { prisma } from "@/lib/prisma";
import { seedArtistCatalogFromSpotifyId } from "@/lib/seed/seedArtistCatalogFromSpotifyId";

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error(
      "Usage: tsx scripts/seed-artist-catalog.ts <spotifyArtistId|spotify:artist:…|open.spotify.com/artist/…>",
    );
    process.exitCode = 1;
    return;
  }

  const summary = await seedArtistCatalogFromSpotifyId(raw);
  console.log(
    `Finished. Albums: ${summary.albumsCount}; tracks created: ${summary.tracksCreated}; skipped: ${summary.skippedTracks}`,
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
