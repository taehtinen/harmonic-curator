/**
 * Temporal gRPC client for server-side code (Route Handlers, Server Actions).
 * Use `export const runtime = "nodejs"` on routes if they might otherwise run on Edge.
 *
 * Workers are long-lived: run them in a separate process (e.g. `tsx scripts/temporal-worker.ts`)
 * and add an npm script when you define workflows — not inside `next dev`.
 */
import { Client, Connection } from "@temporalio/client";

const globalForTemporal = globalThis as unknown as {
  temporalConnection: Connection | undefined;
  temporalClient: Client | undefined;
};

function temporalAddress(): string {
  const addr = process.env.TEMPORAL_ADDRESS?.trim();
  if (!addr) {
    throw new Error(
      "TEMPORAL_ADDRESS is not set. With local Docker Compose, use 127.0.0.1:7233 (see .env.example).",
    );
  }
  return addr;
}

function temporalNamespace(): string {
  return process.env.TEMPORAL_NAMESPACE?.trim() || "default";
}

export async function getTemporalConnection(): Promise<Connection> {
  if (!globalForTemporal.temporalConnection) {
    globalForTemporal.temporalConnection = await Connection.connect({
      address: temporalAddress(),
    });
  }
  return globalForTemporal.temporalConnection;
}

export async function getTemporalClient(): Promise<Client> {
  if (!globalForTemporal.temporalClient) {
    const connection = await getTemporalConnection();
    globalForTemporal.temporalClient = new Client({
      connection,
      namespace: temporalNamespace(),
    });
  }
  return globalForTemporal.temporalClient;
}
