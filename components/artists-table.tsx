import Link from "next/link";
import type { ReactElement } from "react";
import type { Artist } from "@prisma/client";
import type { ArtistsHrefContext, ArtistsListSort } from "@/lib/artists-url";
import ArtistsAddArtistButton from "@/components/artists-add-artist-button";

export type ArtistListRow = Artist & {
  _count: { tracks: number };
  albums: { releaseDate: string }[];
};

type SortColumn = ArtistsListSort;

export default function ArtistsTable({
  artists,
  panelOpen,
  selectedArtistId,
  sort,
  order,
  searchQuery,
  noGenresFilter,
  sortArrow,
  nameSortHref,
  spotifySortHref,
  popularitySortHref,
  followersSortHref,
  tracksSortHref,
  latestReleaseSortHref,
  getRowHref,
  canAddArtist,
  addArtistUrlContext,
}: {
  artists: ArtistListRow[];
  panelOpen: boolean;
  selectedArtistId?: string;
  sort: string;
  order: string;
  searchQuery: string;
  noGenresFilter: boolean;
  sortArrow: (col: SortColumn) => ReactElement | null;
  nameSortHref: string;
  spotifySortHref: string;
  popularitySortHref: string;
  followersSortHref: string;
  tracksSortHref: string;
  latestReleaseSortHref: string;
  getRowHref: (artistId: string) => string;
  canAddArtist: boolean;
  addArtistUrlContext: ArtistsHrefContext;
}) {
  const hasSearch = searchQuery.length > 0;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <form
          method="get"
          action="/artists"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="order" value={order} />
          {selectedArtistId ? (
            <input type="hidden" name="artist" value={selectedArtistId} />
          ) : null}
          <label htmlFor="artists-name-search" className="sr-only">
            Search artists by name
          </label>
          <input
            id="artists-name-search"
            name="q"
            type="search"
            placeholder="Search by name…"
            defaultValue={searchQuery}
            autoComplete="off"
            className="min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
          />
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              name="noGenres"
              value="1"
              defaultChecked={noGenresFilter}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500/30"
            />
            No genres
          </label>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Search
          </button>
        </form>
        {canAddArtist ? (
          <ArtistsAddArtistButton urlContext={addArtistUrlContext} />
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-100/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
            <th className="px-4 py-3">
              <Link
                href={nameSortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Name</span>
                {sortArrow("name")}
              </Link>
            </th>
            <th className="px-4 py-3">
              <Link
                href={spotifySortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Spotify ID</span>
                {sortArrow("spotifyId")}
              </Link>
            </th>
            {!panelOpen && <th className="px-4 py-3">Genres</th>}
            <th className="px-4 py-3 text-right">
              <Link
                href={popularitySortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Popularity</span>
                {sortArrow("popularity")}
              </Link>
            </th>
            <th className="px-4 py-3 text-right">
              <Link
                href={followersSortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Followers</span>
                {sortArrow("followers")}
              </Link>
            </th>
            <th className="px-4 py-3 text-right">
              <Link
                href={tracksSortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Tracks</span>
                {sortArrow("tracks")}
              </Link>
            </th>
            <th className="px-4 py-3">
              <Link
                href={latestReleaseSortHref}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <span>Latest release</span>
                {sortArrow("latestRelease")}
              </Link>
            </th>
          </tr>
        </thead>
        <tbody>
          {artists.length === 0 ? (
            <tr>
              <td
                colSpan={panelOpen ? 6 : 7}
                className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
              >
                {hasSearch
                  ? "No artists match your search."
                  : noGenresFilter
                    ? "No artists without genres."
                    : "No artists found. Seed the database to see data here."}
              </td>
            </tr>
          ) : (
            artists.map((artist) => {
              const artistId = artist.id.toString();
              const isSelected = selectedArtistId === artistId;
              const rowHref = getRowHref(artistId);
              const rowBaseClass =
                "block w-full px-4 py-3 hover:text-zinc-900 dark:hover:text-zinc-50";

              return (
                <tr
                  key={artistId}
                  className={`border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80 ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800/80"
                      : "hover:bg-zinc-100/60 dark:hover:bg-zinc-900"
                  }`}
                >
                  <td className="max-w-xs truncate p-0 font-medium">
                    <Link href={rowHref} className={`${rowBaseClass} truncate`}>
                      {artist.name}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate p-0 text-xs text-zinc-500 dark:text-zinc-400">
                    <Link href={rowHref} className={`${rowBaseClass} truncate`}>
                      {artist.spotifyId}
                    </Link>
                  </td>
                  {!panelOpen && (
                    <td className="p-0 text-xs text-zinc-600 dark:text-zinc-300">
                      <Link
                        href={rowHref}
                        className={`${rowBaseClass} flex flex-wrap items-center gap-1.5`}
                      >
                        {artist.genres.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-flex shrink-0 text-amber-600 dark:text-amber-500"
                              title="No genres"
                              aria-label="No genres"
                            >
                              <svg
                                aria-hidden
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-3.5 w-3.5"
                              >
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
                              key={`${artistId}-${genre}-${index}`}
                              className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200"
                            >
                              <span className="truncate">{genre}</span>
                            </span>
                          ))
                        )}
                      </Link>
                    </td>
                  )}
                  <td className="p-0 text-right tabular-nums">
                    <Link href={rowHref} className={rowBaseClass}>
                      {artist.popularity}
                    </Link>
                  </td>
                  <td className="p-0 text-right tabular-nums">
                    <Link href={rowHref} className={rowBaseClass}>
                      {artist.followers.toLocaleString()}
                    </Link>
                  </td>
                  <td className="p-0 text-right tabular-nums">
                    <Link href={rowHref} className={rowBaseClass}>
                      {artist._count.tracks.toLocaleString()}
                    </Link>
                  </td>
                  <td className="max-w-[8rem] truncate p-0 text-xs text-zinc-600 dark:text-zinc-300">
                    <Link href={rowHref} className={rowBaseClass}>
                      {artist.albums[0]?.releaseDate ?? "—"}
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </div>
    </section>
  );
}
