import Link from "next/link";
import type { ReactElement } from "react";
import type { Playlist } from "@prisma/client";

import type { PlaylistsListSort } from "@/lib/playlists-url";

export type PlaylistTableRow = Playlist & {
  ownerUsername?: string;
};

function formatLastPublished(value: Date | null) {
  if (value == null) return "—";
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PlaylistsTable({
  sectionTitle,
  supplementalNote,
  secondaryColumn,
  playlists,
  emptyMessageNoSearch,
  emptyMessageWithSearch,
  panelOpen,
  selectedPlaylistId,
  searchQuery,
  sortArrow,
  nameSortHref,
  lastPublishedSortHref,
  getRowHref,
}: {
  sectionTitle: string;
  supplementalNote?: string;
  secondaryColumn: "description" | "user";
  playlists: PlaylistTableRow[];
  emptyMessageNoSearch: string;
  emptyMessageWithSearch: string;
  panelOpen: boolean;
  selectedPlaylistId?: string;
  searchQuery: string;
  sortArrow: (col: PlaylistsListSort) => ReactElement | null;
  nameSortHref: string;
  lastPublishedSortHref: string;
  getRowHref: (playlistId: string) => string;
}) {
  const hasSearch = searchQuery.length > 0;
  const emptyColSpan = panelOpen ? 2 : 3;
  const secondaryHeader =
    secondaryColumn === "user" ? "User" : "Description";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="w-full text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {sectionTitle}
        </h2>
        {supplementalNote ? (
          <p className="w-full text-xs font-normal normal-case tracking-normal text-zinc-500 dark:text-zinc-400">
            {supplementalNote}
          </p>
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
              {!panelOpen && <th className="px-4 py-3">{secondaryHeader}</th>}
              <th className="px-4 py-3 text-right whitespace-nowrap">
                <Link
                  href={lastPublishedSortHref}
                  className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <span className="ml-auto">Last published</span>
                  {sortArrow("lastSpotifyPublishAt")}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {playlists.length === 0 ? (
              <tr>
                <td
                  colSpan={emptyColSpan}
                  className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {hasSearch ? emptyMessageWithSearch : emptyMessageNoSearch}
                </td>
              </tr>
            ) : (
              playlists.map((playlist) => {
                const playlistKey = playlist.id.toString();
                const isSelected = selectedPlaylistId === playlistKey;
                const rowHref = getRowHref(playlistKey);
                const rowBaseClass =
                  "block w-full px-4 py-3 hover:text-zinc-900 dark:hover:text-zinc-50";

                return (
                  <tr
                    key={playlistKey}
                    className={`border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/80 ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800/80"
                        : "hover:bg-zinc-100/60 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <td className="max-w-xs truncate p-0 font-medium">
                      <Link href={rowHref} className={`${rowBaseClass} truncate`}>
                        {playlist.name}
                      </Link>
                    </td>
                    {!panelOpen && (
                      <td
                        className="max-w-xs truncate p-0 text-zinc-600 dark:text-zinc-300"
                        title={
                          secondaryColumn === "description"
                            ? playlist.description || undefined
                            : playlist.ownerUsername || undefined
                        }
                      >
                        <Link href={rowHref} className={`${rowBaseClass} truncate`}>
                          {secondaryColumn === "description" ? (
                            <>
                              {playlist.description || (
                                <span className="text-zinc-400 dark:text-zinc-500">—</span>
                              )}
                            </>
                          ) : (
                            <>
                              {playlist.ownerUsername || (
                                <span className="text-zinc-400 dark:text-zinc-500">—</span>
                              )}
                            </>
                          )}
                        </Link>
                      </td>
                    )}
                    <td className="p-0 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                      <Link href={rowHref} className={rowBaseClass}>
                        {formatLastPublished(playlist.lastSpotifyPublishAt)}
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
