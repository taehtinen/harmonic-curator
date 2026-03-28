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

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error("Usage: tsx scripts/seed-artist.ts <spotifyArtistId>");
    process.exitCode = 1;
    return;
  }

  const spotifyId = normalizeSpotifyArtistId(raw);
  const spotifyClient = new SpotifyClient();
  const artist = await spotifyClient.getArtist(spotifyId);

  if (!artist) {
    console.error(`Could not fetch artist from Spotify for id: ${spotifyId}`);
    process.exitCode = 1;
    return;
  }

  const row = await prisma.artist.upsert({
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

  console.log(
    `Upserted artist: ${row.name} (db id=${row.id}, spotifyId=${row.spotifyId})`,
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
