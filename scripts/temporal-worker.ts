import { join } from "node:path";
import { NativeConnection, Worker } from "@temporalio/worker";
import { temporalTaskQueue } from "@/lib/temporal/taskQueue";
import * as activities from "../temporal/activities";

function temporalAddress(): string {
  return process.env.TEMPORAL_ADDRESS?.trim() || "127.0.0.1:7233";
}

function temporalNamespace(): string {
  return process.env.TEMPORAL_NAMESPACE?.trim() || "default";
}

async function main() {
  const connection = await NativeConnection.connect({
    address: temporalAddress(),
  });

  const worker = await Worker.create({
    connection,
    namespace: temporalNamespace(),
    taskQueue: temporalTaskQueue(),
    workflowsPath: join(process.cwd(), "temporal", "workflows.ts"),
    activities,
  });

  console.log(
    `Temporal worker listening on ${temporalAddress()} namespace=${temporalNamespace()} taskQueue=${temporalTaskQueue()}`,
  );
  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
