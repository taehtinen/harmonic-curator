import Link from "next/link";
import PlaylistDeleteForm from "@/components/playlist-delete-form";
import SpotifyIcon from "@/components/spotify-icon";
import type { PublishFlash } from "@/components/playlist-sidebar-types";
import type { Playlist } from "@prisma/client";

function formatDateTime(value: Date) {
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateTimeOrDash(value: Date | null) {
  return value == null ? "—" : formatDateTime(value);
}

/** Latest of track-list edits and any playlist row update (name, settings, etc.). */
function playlistLastEditedAt(playlist: Playlist): Date {
  const row = playlist.updatedAt.getTime();
  const tracks = playlist.lastTrackEditAt?.getTime();
  if (tracks == null) return playlist.updatedAt;
  return new Date(Math.max(tracks, row));
}

function isPublishedOlderThanEditedByOneSecond(
  published: Date | null,
  edited: Date,
): boolean {
  return published != null && published.getTime() < edited.getTime() - 1000;
}

function StalePublishWarningIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );
}

export default function PlaylistSidebarDetails({
  playlist,
  closeHref,
  editHref,
  deletePlaylistAction,
  deleteReturnToHref,
  generatePlaylistAction,
  generatePlaylistReturnToHref,
  publishPlaylistAction,
  hasLinkedSpotify,
  publishFlash,
}: {
  playlist: Playlist;
  closeHref: string;
  editHref: string;
  deletePlaylistAction: (formData: FormData) => Promise<void>;
  deleteReturnToHref: string;
  generatePlaylistAction: (formData: FormData) => Promise<void>;
  generatePlaylistReturnToHref: string;
  publishPlaylistAction: (formData: FormData) => Promise<void>;
  hasLinkedSpotify: boolean;
  publishFlash: PublishFlash;
}) {
  const canPublishToSpotify = hasLinkedSpotify;
  const lastEditedAt = playlistLastEditedAt(playlist);
  const publishedOutOfDate = isPublishedOlderThanEditedByOneSecond(
    playlist.lastSpotifyPublishAt,
    lastEditedAt,
  );

  return (
    <section className="shrink-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 text-xl font-semibold tracking-tight">
          {playlist.spotifyId ? (
            <a
              href={`https://open.spotify.com/playlist/${playlist.spotifyId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open playlist on Spotify"
              className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
            >
              <span className="truncate">{playlist.name}</span>
              <SpotifyIcon className="h-4 w-4 shrink-0 opacity-90" />
            </a>
          ) : (
            <span className="block min-w-0 truncate">{playlist.name}</span>
          )}
        </h2>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Link
            href={editHref}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </Link>
          <PlaylistDeleteForm
            action={deletePlaylistAction}
            playlistId={playlist.id.toString()}
            returnTo={deleteReturnToHref}
            playlistName={playlist.name}
          />
          <Link
            href={closeHref}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <dl className="grid min-w-0 flex-1 grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">Spotify ID</dt>
          <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {playlist.spotifyId ?? (
              <span className="font-sans text-zinc-400 dark:text-zinc-500">—</span>
            )}
          </dd>
          <dt className="self-start text-zinc-500 dark:text-zinc-400">Description</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
            {playlist.description.trim() ? playlist.description : "—"}
          </dd>
        </dl>

        <dl className="shrink-0 space-y-3 border-zinc-200 text-sm sm:w-52 sm:border-l sm:pl-6 dark:border-zinc-700">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Last edited</dt>
            <dd className="mt-0.5 tabular-nums text-zinc-800 dark:text-zinc-200">
              {formatDateTime(lastEditedAt)}
            </dd>
          </div>
          <div className="space-y-2">
            <form action={generatePlaylistAction} className="mt-1">
              <input type="hidden" name="playlistId" value={playlist.id.toString()} />
              <input type="hidden" name="returnTo" value={generatePlaylistReturnToHref} />
              <button
                type="submit"
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Generate playlist
              </button>
            </form>
          </div>
          <div>
            <dt
              className={
                publishedOutOfDate
                  ? "inline-flex items-center gap-1 text-amber-700 dark:text-amber-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }
              title={
                publishedOutOfDate
                  ? "Playlist changed after this publish; publish again to sync Spotify."
                  : undefined
              }
            >
              {publishedOutOfDate ? (
                <StalePublishWarningIcon className="h-3.5 w-3.5 shrink-0" />
              ) : null}
              Last published
            </dt>
            <dd
              className={
                publishedOutOfDate
                  ? "mt-0.5 tabular-nums text-amber-800 dark:text-amber-300"
                  : "mt-0.5 tabular-nums text-zinc-800 dark:text-zinc-200"
              }
              title={
                publishedOutOfDate
                  ? "Playlist changed after this publish; publish again to sync Spotify."
                  : undefined
              }
            >
              {formatDateTimeOrDash(playlist.lastSpotifyPublishAt)}
            </dd>
          </div>
          <div className="space-y-2">
            <form action={publishPlaylistAction} className="mt-1">
              <input type="hidden" name="playlistId" value={playlist.id.toString()} />
              <input type="hidden" name="returnTo" value={generatePlaylistReturnToHref} />
              <button
                type="submit"
                disabled={!canPublishToSpotify}
                title={
                  canPublishToSpotify
                    ? undefined
                    : "Link a Spotify account in Settings to publish."
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Publish to Spotify
              </button>
            </form>
            {publishFlash?.kind === "ok" ? (
              <p
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs leading-snug text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                role="status"
              >
                Spotify playlist updated to match your local track list.
              </p>
            ) : null}
            {publishFlash?.kind === "error" ? (
              <p
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs leading-snug text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                Could not publish to Spotify: {publishFlash.message}
              </p>
            ) : null}
          </div>
        </dl>
      </div>
    </section>
  );
}
