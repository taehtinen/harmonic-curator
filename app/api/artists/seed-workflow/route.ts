import { WorkflowFailedError, WorkflowNotFoundError } from "@temporalio/client";
import { getCurrentUser, userIsAdmin } from "@/lib/auth";
import { getTemporalClient } from "@/lib/temporal/client";
import { temporalTaskQueue } from "@/lib/temporal/taskQueue";
import type { SeedArtistWorkflowResult } from "@/lib/seed/seedArtistTypes";
import { normalizeSpotifyArtistId } from "@/lib/seed/seedArtistFromSpotifyId";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SEED_ARTIST_WORKFLOW = "seedArtist";
const SEED_ARTIST_PROGRESS_QUERY = "seedArtistProgress";

function workflowErrorMessage(err: unknown): string {
  if (err instanceof WorkflowFailedError) {
    return err.cause?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return "Workflow failed";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!userIsAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const spotifyUrlOrId =
    typeof body === "object" &&
    body !== null &&
    "spotifyUrlOrId" in body &&
    typeof (body as { spotifyUrlOrId: unknown }).spotifyUrlOrId === "string"
      ? (body as { spotifyUrlOrId: string }).spotifyUrlOrId.trim()
      : "";

  if (!spotifyUrlOrId) {
    return NextResponse.json(
      { error: "Missing or empty spotifyUrlOrId" },
      { status: 400 },
    );
  }

  try {
    normalizeSpotifyArtistId(spotifyUrlOrId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid Spotify artist id or URL";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const client = await getTemporalClient();
    const workflowId = `seed-artist-ui-${crypto.randomUUID()}`;
    const handle = await client.workflow.start(SEED_ARTIST_WORKFLOW, {
      taskQueue: temporalTaskQueue(),
      workflowId,
      args: [spotifyUrlOrId],
    });

    return NextResponse.json({
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Temporal error";
    return NextResponse.json(
      { error: `Could not start workflow: ${message}` },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userIsAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workflowId = new URL(request.url).searchParams.get("workflowId")?.trim();
  if (!workflowId) {
    return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });
  }

  try {
    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(workflowId);
    const desc = await handle.describe();
    const status = desc.status.name;

    if (status === "RUNNING") {
      let progress = "Working…";
      try {
        progress = await handle.query<string>(SEED_ARTIST_PROGRESS_QUERY);
      } catch {
        // Query handler may not be registered yet on the first poll.
      }
      return NextResponse.json({ status: "running", progress });
    }

    if (status === "COMPLETED") {
      const result = (await handle.result()) as SeedArtistWorkflowResult;
      return NextResponse.json({ status: "completed", result });
    }

    if (status === "FAILED") {
      try {
        await handle.result();
      } catch (e) {
        return NextResponse.json(
          { status: "failed", error: workflowErrorMessage(e) },
          { status: 200 },
        );
      }
      return NextResponse.json(
        { status: "failed", error: "Workflow failed with no details" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        status: "stopped",
        error: `Workflow is ${status.toLowerCase().replaceAll("_", " ")}`,
      },
      { status: 200 },
    );
  } catch (e) {
    if (e instanceof WorkflowNotFoundError) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Temporal error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
