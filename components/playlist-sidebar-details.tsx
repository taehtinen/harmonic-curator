import Link from "next/link";
import type { Playlist } from "@prisma/client";

function formatDateTime(value: Date) {
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PlaylistSidebarDetails({
  playlist,
  closeHref,
}: {
  playlist: Playlist;
  closeHref: string;
}) {
  return (
    <section className="shrink-0 p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{playlist.name}</h2>
        <Link
          href={closeHref}
          className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Close
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Spotify ID</dt>
        <dd className="font-mono text-xs">
          <a
            href={`https://open.spotify.com/playlist/${playlist.spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            {playlist.spotifyId}
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M5 6a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H8.414l6.293 6.293a1 1 0 0 1-1.414 1.414L7 8.414V11a1 1 0 1 1-2 0V6Z" />
              <path d="M5 9a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
            </svg>
          </a>
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
              <span className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                <span
                  className="inline-flex shrink-0 text-amber-600 dark:text-amber-500"
                  title="No genres"
                  aria-hidden
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                No genres listed
              </span>
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

        <dt className="text-zinc-500 dark:text-zinc-400">Created</dt>
        <dd>{formatDateTime(playlist.createdAt)}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Updated</dt>
        <dd>{formatDateTime(playlist.updatedAt)}</dd>
      </dl>
    </section>
  );
}
