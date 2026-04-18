import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { seedArtistActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
});

const { seedArtistCatalogActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 hours",
});

export async function seedArtist(spotifyArtistId: string): Promise<string> {
  const artistSummary = await seedArtistActivity(spotifyArtistId);
  const catalogSummary = await seedArtistCatalogActivity(spotifyArtistId);
  return `${artistSummary}\n${catalogSummary}`;
}

export async function seedArtistCatalog(spotifyArtistId: string): Promise<string> {
  return await seedArtistCatalogActivity(spotifyArtistId);
}
