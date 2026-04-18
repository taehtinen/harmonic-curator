import { seedArtistCatalog } from "@/temporal/workflows";
import { getTemporalClient } from "@/lib/temporal/client";
import { normalizeSpotifyArtistId } from "@/lib/seed/seedArtistFromSpotifyId";
import { temporalMaximumAttempts } from "@/lib/temporal/maximumAttempts";
import { temporalTaskQueue } from "@/lib/temporal/taskQueue";

async function main() {
  const raw = process.argv[2];
  if (!raw) {
    console.error(
      "Usage: tsx scripts/start-seed-artist-catalog-workflow.ts <spotifyArtistId>",
    );
    process.exitCode = 1;
    return;
  }

  const client = await getTemporalClient();
  const normalized = normalizeSpotifyArtistId(raw);
  const handle = await client.workflow.start(seedArtistCatalog, {
    taskQueue: temporalTaskQueue(),
    workflowId: `seed-artist-catalog-${normalized}-${Date.now()}`,
    args: [raw],
    retry: { maximumAttempts: temporalMaximumAttempts },
  });

  console.log(`Started workflow ${handle.workflowId} run ${handle.firstExecutionRunId}`);
  const result = await handle.result();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
