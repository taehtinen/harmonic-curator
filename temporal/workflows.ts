import { defineQuery, proxyActivities, setHandler } from "@temporalio/workflow";
import type * as activities from "./activities";
import type {
  SeedArtistCatalogResult,
  SeedArtistWorkflowResult,
} from "@/lib/seed/seedArtistTypes";

const { seedArtistActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
});

const { seedArtistCatalogActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 hours",
});

/** Queried by the app while `seedArtist` is running (human-readable step). */
export const seedArtistProgress = defineQuery<string>("seedArtistProgress");

export async function seedArtist(
  spotifyArtistId: string,
): Promise<SeedArtistWorkflowResult> {
  let progress = "Starting…";
  setHandler(seedArtistProgress, () => progress);

  progress = "Fetching artist profile from Spotify…";
  const profile = await seedArtistActivity(spotifyArtistId);
  progress = "Importing albums and tracks from Spotify…";
  const catalog = await seedArtistCatalogActivity(spotifyArtistId);
  progress = "Done";

  return {
    spotifyId: profile.spotifyId,
    profile,
    catalog,
  };
}

export async function seedArtistCatalog(
  spotifyArtistId: string,
): Promise<SeedArtistCatalogResult> {
  return await seedArtistCatalogActivity(spotifyArtistId);
}
