"use client";

import { useMemo, useState } from "react";
import SpotifyIcon from "@/components/spotify-icon";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

type SortColumn = "name" | "release" | "tracks";

type SortState = { col: SortColumn; order: "asc" | "desc" };

/** Matches Prisma `orderBy: [{ releaseDate: "desc" }, { name: "asc" }]`. */
const DEFAULT_SORT: SortState = { col: "release", order: "desc" };

function defaultOrder(col: SortColumn): "asc" | "desc" {
  return col === "name" ? "asc" : "desc";
}

function compareAlbums(
  a: ArtistWithSidebarData["albums"][number],
  b: ArtistWithSidebarData["albums"][number],
  col: SortColumn,
  order: "asc" | "desc"
): number {
  const dir = order === "asc" ? 1 : -1;
  let cmp = 0;
  if (col === "name") {
    cmp = a.name.localeCompare(b.name);
  } else if (col === "release") {
    cmp = a.releaseDate.localeCompare(b.releaseDate);
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
  } else {
    cmp = a._count.tracks - b._count.tracks;
  }
  return cmp * dir;
}

export default function ArtistSidebarAlbumsTable({
  albums,
}: {
  albums: ArtistWithSidebarData["albums"];
}) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const sortedAlbums = useMemo(() => {
    if (albums.length === 0) return albums;
    return [...albums].sort((a, b) => compareAlbums(a, b, sort.col, sort.order));
  }, [albums, sort]);

  function onHeaderClick(col: SortColumn) {
    setSort((prev) => {
      if (prev.col === col) {
        return { col, order: prev.order === "asc" ? "desc" : "asc" };
      }
      return { col, order: defaultOrder(col) };
    });
  }

  const sortArrow = (col: SortColumn) =>
    sort.col === col ? (
      <span className="tabular-nums">{sort.order === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const ariaSort = (col: SortColumn): "ascending" | "descending" | "none" =>
    sort.col === col ? (sort.order === "asc" ? "ascending" : "descending") : "none";

  return (
    <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
      <thead className="bg-zinc-100/80 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th scope="col" aria-sort={ariaSort("name")} className="px-3 py-2">
            <button
              type="button"
              onClick={() => onHeaderClick("name")}
              className="flex w-full cursor-pointer select-none items-center justify-between gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span>Album</span>
              {sortArrow("name")}
            </button>
          </th>
          <th scope="col" aria-sort={ariaSort("release")} className="px-3 py-2">
            <button
              type="button"
              onClick={() => onHeaderClick("release")}
              className="flex w-full cursor-pointer select-none items-center justify-between gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span>Release</span>
              {sortArrow("release")}
            </button>
          </th>
          <th scope="col" aria-sort={ariaSort("tracks")} className="px-3 py-2 text-right">
            <button
              type="button"
              onClick={() => onHeaderClick("tracks")}
              className="flex w-full cursor-pointer select-none items-center justify-end gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span className="ml-auto">Tracks</span>
              {sortArrow("tracks")}
            </button>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {sortedAlbums.length > 0 ? (
          sortedAlbums.map((album) => (
            <tr key={album.id.toString()}>
              <td className="max-w-[16rem] px-3 py-2">
                <a
                  href={`https://open.spotify.com/album/${album.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open “${album.name}” on Spotify`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-50 dark:hover:text-blue-400"
                >
                  <span className="truncate">{album.name}</span>
                  <SpotifyIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {album.releaseDate}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{album._count.tracks}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400">
              No albums available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
