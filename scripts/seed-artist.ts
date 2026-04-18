import { prisma } from "@/lib/prisma";
import { seedArtistFromSpotifyId } from "@/lib/seed/seedArtistFromSpotifyId";

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error("Usage: tsx scripts/seed-artist.ts <spotifyArtistId>");
    process.exitCode = 1;
    return;
  }

  try {
    const message = await seedArtistFromSpotifyId(raw);
    console.log(message);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
