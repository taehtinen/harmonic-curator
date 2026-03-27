import Link from "next/link";
import type { ReactElement } from "react";
import type { Artist } from "@prisma/client";

type SortColumn = "name" | "spotifyId" | "popularity" | "followers";

export default function ArtistsTable({
  artists,
  panelOpen,
  selectedArtistId,
  sortArrow,
  nameSortHref,
  spotifySortHref,
  popularitySortHref,
  followersSortHref,
  getRowHref,
}: {
  artists: Artist[];
  panelOpen: boolean;
  selectedArtistId?: string;
  sortArrow: (col: SortColumn) => ReactElement | null;
  nameSortHref: string;
  spotifySortHref: string;
  popularitySortHref: string;
  followersSortHref: string;
  getRowHref: (artistId: string) => string;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
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
          </tr>
        </thead>
        <tbody>
          {artists.length === 0 ? (
            <tr>
              <td
                colSpan={panelOpen ? 4 : 5}
                className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
              >
                No artists found. Seed the database to see data here.
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
                      <Link href={rowHref} className={`${rowBaseClass} truncate`}>
                        {artist.genres.join(", ")}
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}
