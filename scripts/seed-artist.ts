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
    const profile = await seedArtistFromSpotifyId(raw);
    console.log(
      `Upserted artist: ${profile.name} (db id=${profile.artistDbId}, spotifyId=${profile.spotifyId})`,
    );
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
