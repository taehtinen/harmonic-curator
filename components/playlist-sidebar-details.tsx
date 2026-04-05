import Link from "next/link";
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

export default function PlaylistSidebarDetails({
  playlist,
  closeHref,
  editHref,
  generatePlaylistAction,
  generatePlaylistReturnToHref,
  publishPlaylistAction,
  hasLinkedSpotify,
  publishFlash,
}: {
  playlist: Playlist;
  closeHref: string;
  editHref: string;
  generatePlaylistAction: (formData: FormData) => Promise<void>;
  generatePlaylistReturnToHref: string;
  publishPlaylistAction: (formData: FormData) => Promise<void>;
  hasLinkedSpotify: boolean;
  publishFlash: PublishFlash;
}) {
  const canPublishToSpotify = hasLinkedSpotify && playlist.spotifyId != null;

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

          <dt className="text-zinc-500 dark:text-zinc-400">Description</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words text-zinc-800 dark:text-zinc-200">
            {playlist.description.trim() ? (
              playlist.description
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500">—</span>
            )}
          </dd>

          <dt className="text-zinc-500 dark:text-zinc-400">Genres</dt>
          <dd className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {playlist.genres.length === 0 ? (
                <span className="text-zinc-400 dark:text-zinc-500">—</span>
              ) : (
                playlist.genres.map((genre, index) => (
                  <span
                    key={`${genre}-${index}`}
                    className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
                  >
                    <span className="truncate">{genre}</span>
                  </span>
                ))
              )}
            </div>
          </dd>

          <dt className="text-zinc-500 dark:text-zinc-400">Max followers</dt>
          <dd className="tabular-nums">
            {playlist.maxFollowers == null ? (
              <span className="text-zinc-400 dark:text-zinc-500" title="No follower limit">
                —
              </span>
            ) : (
              playlist.maxFollowers.toLocaleString()
            )}
          </dd>

          <dt className="text-zinc-500 dark:text-zinc-400">Size</dt>
          <dd className="tabular-nums">{playlist.size.toLocaleString()}</dd>
        </dl>

        <dl className="shrink-0 space-y-3 border-zinc-200 text-sm sm:w-52 sm:border-l sm:pl-6 dark:border-zinc-700">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Last edited</dt>
            <dd className="mt-0.5 tabular-nums text-zinc-800 dark:text-zinc-200">
              {formatDateTimeOrDash(playlist.lastTrackEditAt)}
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
            <dt className="text-zinc-500 dark:text-zinc-400">Last published</dt>
            <dd className="mt-0.5 tabular-nums text-zinc-800 dark:text-zinc-200">
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
                    : !hasLinkedSpotify
                      ? "Link a Spotify account in Settings to publish."
                      : "This playlist is not linked to Spotify yet."
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
