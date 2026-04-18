import { seedArtistFromSpotifyId } from "@/lib/seed/seedArtistFromSpotifyId";
import { seedArtistCatalogFromSpotifyId } from "@/lib/seed/seedArtistCatalogFromSpotifyId";

export async function seedArtistActivity(rawSpotifyArtistId: string): Promise<string> {
  return seedArtistFromSpotifyId(rawSpotifyArtistId);
}

export async function seedArtistCatalogActivity(
  rawSpotifyArtistId: string,
): Promise<string> {
  return seedArtistCatalogFromSpotifyId(rawSpotifyArtistId);
}
