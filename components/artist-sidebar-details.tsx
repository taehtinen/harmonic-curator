import Link from "next/link";
import SpotifyIcon from "@/components/spotify-icon";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import ArtistSidebarAddGenre from "@/components/artist-sidebar-add-genre";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

export default function ArtistSidebarDetails({
  artist,
  closeHref,
  canIgnore,
  ignoreAction,
  returnToHref,
  canAddGenre,
  addGenreAction,
  addGenreReturnToHref,
}: {
  artist: ArtistWithSidebarData;
  closeHref: string;
  canIgnore: boolean;
  ignoreAction: (formData: FormData) => Promise<void>;
  returnToHref: string;
  canAddGenre: boolean;
  addGenreAction: (formData: FormData) => Promise<void>;
  addGenreReturnToHref: string;
}) {
  return (
    <section className="flex h-1/2 min-h-0 flex-col overflow-auto p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="min-w-0 text-xl font-semibold tracking-tight">
          <a
            href={`https://open.spotify.com/artist/${artist.spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open artist on Spotify"
            className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            <span className="truncate">{artist.name}</span>
            <SpotifyIcon className="h-4 w-4 shrink-0 opacity-90" />
          </a>
        </h2>
        <div className="flex items-center gap-2">
          {canIgnore && (
            <form action={ignoreAction}>
              <input type="hidden" name="artistId" value={artist.id.toString()} />
              <input type="hidden" name="returnTo" value={returnToHref} />
              <ConfirmSubmitButton
                confirmMessage={`Ignore ${artist.name}? This artist will no longer appear in the artists list.`}
                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
              >
                Ignore
              </ConfirmSubmitButton>
            </form>
          )}
          <Link
            href={closeHref}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </Link>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Spotify ID</dt>
        <dd className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{artist.spotifyId}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Popularity</dt>
        <dd>{artist.popularity}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Followers</dt>
        <dd>{artist.followers.toLocaleString()}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Genres</dt>
        <dd className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {artist.genres.length === 0 ? (
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
              artist.genres.map((genre, index) => (
                <span
                  key={`${genre}-${index}`}
                  className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
                >
                  <span className="truncate">{genre}</span>
                </span>
              ))
            )}
            {canAddGenre && (
              <ArtistSidebarAddGenre
                artistId={artist.id.toString()}
                addGenreAction={addGenreAction}
                addGenreReturnToHref={addGenreReturnToHref}
              />
            )}
          </div>
        </dd>
      </dl>
    </section>
  );
}
