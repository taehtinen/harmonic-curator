import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities";

const { seedArtistActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: "10 minutes",
});

export async function seedArtist(spotifyArtistId: string): Promise<string> {
  return await seedArtistActivity(spotifyArtistId);
}
