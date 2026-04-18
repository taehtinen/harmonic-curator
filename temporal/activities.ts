import { seedArtistFromSpotifyId } from "@/lib/seed/seedArtistFromSpotifyId";
import { seedArtistCatalogFromSpotifyId } from "@/lib/seed/seedArtistCatalogFromSpotifyId";
import type {
  SeedArtistCatalogResult,
  SeedArtistProfileResult,
} from "@/lib/seed/seedArtistTypes";

export async function seedArtistActivity(
  rawSpotifyArtistId: string,
): Promise<SeedArtistProfileResult> {
  return seedArtistFromSpotifyId(rawSpotifyArtistId);
}

export async function seedArtistCatalogActivity(
  rawSpotifyArtistId: string,
): Promise<SeedArtistCatalogResult> {
  return seedArtistCatalogFromSpotifyId(rawSpotifyArtistId);
}
