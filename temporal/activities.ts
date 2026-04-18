import { seedArtistFromSpotifyId } from "@/lib/seed/seedArtistFromSpotifyId";

export async function seedArtistActivity(rawSpotifyArtistId: string): Promise<string> {
  return seedArtistFromSpotifyId(rawSpotifyArtistId);
}
