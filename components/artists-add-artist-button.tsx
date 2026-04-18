"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  buildArtistsUrl,
  type ArtistsHrefContext,
} from "@/lib/artists-url";
import type { SeedArtistWorkflowResult } from "@/lib/seed/seedArtistTypes";

type PollState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "running"; progress: string }
  | { phase: "failed"; message: string };

export default function ArtistsAddArtistButton({
  urlContext,
}: {
  urlContext: ArtistsHrefContext;
}) {
  const router = useRouter();
  const dialogTitleId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [poll, setPoll] = useState<PollState>({ phase: "idle" });
  /** Only one poll request at a time; `setInterval` overlapped ticks and losing fetches hit the catch after success. */
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingActiveRef = useRef(false);

  const stopPolling = useCallback(() => {
    pollingActiveRef.current = false;
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const closeModal = useCallback(() => {
    stopPolling();
    setOpen(false);
    setPoll({ phase: "idle" });
    setInput("");
  }, [stopPolling]);

  const startPoll = useCallback(
    (workflowId: string) => {
      stopPolling();
      pollingActiveRef.current = true;

      const parseJsonBody = async (res: Response): Promise<unknown> => {
        const text = await res.text();
        if (!text.trim()) return null;
        try {
          return JSON.parse(text) as unknown;
        } catch {
          throw new Error("Server response was not valid JSON");
        }
      };

      const tick = async () => {
        if (!pollingActiveRef.current) return;
        try {
          const res = await fetch(
            `/api/artists/seed-workflow?workflowId=${encodeURIComponent(workflowId)}`,
          );
          if (!pollingActiveRef.current) return;

          const data: unknown = await parseJsonBody(res);

          if (!pollingActiveRef.current) return;

          if (!res.ok) {
            const msg =
              typeof data === "object" &&
              data !== null &&
              "error" in data &&
              typeof (data as { error: unknown }).error === "string"
                ? (data as { error: string }).error
                : res.statusText;
            stopPolling();
            setPoll({ phase: "failed", message: msg });
            return;
          }

          if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            (data as { status: string }).status === "running"
          ) {
            const progress =
              "progress" in data && typeof (data as { progress: unknown }).progress === "string"
                ? (data as { progress: string }).progress
                : "Working…";
            setPoll({ phase: "running", progress });
            if (pollingActiveRef.current) {
              pollTimeoutRef.current = setTimeout(() => void tick(), 1200);
            }
            return;
          }

          if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            String((data as { status: unknown }).status).toLowerCase() === "completed" &&
            "result" in data
          ) {
            const result = (data as { result: SeedArtistWorkflowResult }).result;
            const artistId = result.profile?.artistDbId;
            if (!artistId) {
              stopPolling();
              setPoll({ phase: "failed", message: "Import finished but artist id was missing." });
              return;
            }
            const href = buildArtistsUrl({
              ...urlContext,
              artistId,
            });
            stopPolling();
            // Commit close before navigation so the overlay never survives a no-op router transition.
            flushSync(() => {
              setOpen(false);
              setInput("");
              setPoll({ phase: "idle" });
            });
            try {
              await router.replace(href);
              router.refresh();
            } catch {
              window.location.assign(href);
            }
            return;
          }

          if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            (data as { status: string }).status === "failed"
          ) {
            const message =
              "error" in data && typeof (data as { error: unknown }).error === "string"
                ? (data as { error: string }).error
                : "Workflow failed";
            stopPolling();
            setPoll({ phase: "failed", message });
            return;
          }

          if (
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            (data as { status: string }).status === "stopped"
          ) {
            const message =
              "error" in data && typeof (data as { error: unknown }).error === "string"
                ? (data as { error: string }).error
                : "Workflow stopped";
            stopPolling();
            setPoll({ phase: "failed", message });
            return;
          }

          stopPolling();
          setPoll({ phase: "failed", message: "Unexpected response from server" });
        } catch (e) {
          if (!pollingActiveRef.current) return;
          const msg = e instanceof Error ? e.message : "Network error while checking workflow status";
          stopPolling();
          setPoll({ phase: "failed", message: msg });
        }
      };

      void tick();
    },
    [router, stopPolling, urlContext],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = input.trim();
    if (!trimmed) return;

    setPoll({ phase: "starting" });
    try {
      const res = await fetch("/api/artists/seed-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrlOrId: trimmed }),
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : res.statusText;
        setPoll({ phase: "failed", message: msg });
        return;
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("workflowId" in data) ||
        typeof (data as { workflowId: unknown }).workflowId !== "string"
      ) {
        setPoll({ phase: "failed", message: "Invalid start response" });
        return;
      }

      setPoll({ phase: "running", progress: "Workflow started…" });
      startPoll((data as { workflowId: string }).workflowId);
    } catch {
      setPoll({ phase: "failed", message: "Network error while starting workflow" });
    }
  };

  const busy = poll.phase === "starting" || poll.phase === "running";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          stopPolling();
          setOpen(true);
          setPoll({ phase: "idle" });
        }}
        className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Add artist
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(ev) => {
            if (ev.target === ev.currentTarget && !busy) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby={dialogTitleId}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onMouseDown={(ev) => ev.stopPropagation()}
          >
            <h2
              id={dialogTitleId}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Add artist from Spotify
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Paste a Spotify artist ID or URL. A background job imports the profile and catalog; this
              can take several minutes for large discographies.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Spotify ID or URL
                <input
                  value={input}
                  onChange={(ev) => setInput(ev.target.value)}
                  disabled={busy}
                  placeholder="https://open.spotify.com/artist/…"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                  autoComplete="off"
                />
              </label>

              {poll.phase === "running" || poll.phase === "starting" ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
                      aria-hidden
                    />
                    <span>
                      {poll.phase === "starting"
                        ? "Starting workflow…"
                        : poll.progress}
                    </span>
                  </div>
                </div>
              ) : null}

              {poll.phase === "failed" ? (
                <p className="text-sm text-red-600 dark:text-red-400">{poll.message}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={busy}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {busy ? "Working…" : "Start import"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
