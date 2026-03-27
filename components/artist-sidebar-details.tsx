import Link from "next/link";
import ConfirmSubmitButton from "@/components/confirm-submit-button";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

export default function ArtistSidebarDetails({
  artist,
  closeHref,
  canIgnore,
  ignoreAction,
  returnToHref,
}: {
  artist: ArtistWithSidebarData;
  closeHref: string;
  canIgnore: boolean;
  ignoreAction: (formData: FormData) => Promise<void>;
  returnToHref: string;
}) {
  return (
    <section className="flex h-1/2 min-h-0 flex-col overflow-auto p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{artist.name}</h2>
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
        <dd className="font-mono text-xs">
          <a
            href={`https://open.spotify.com/artist/${artist.spotifyId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            {artist.spotifyId}
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M5 6a1 1 0 0 1 1-1h5a1 1 0 1 1 0 2H8.414l6.293 6.293a1 1 0 0 1-1.414 1.414L7 8.414V11a1 1 0 1 1-2 0V6Z" />
              <path d="M5 9a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
            </svg>
          </a>
        </dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Popularity</dt>
        <dd>{artist.popularity}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Followers</dt>
        <dd>{artist.followers.toLocaleString()}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Genres</dt>
        <dd>{artist.genres.length > 0 ? artist.genres.join(", ") : "No genres listed"}</dd>
      </dl>
    </section>
  );
}
