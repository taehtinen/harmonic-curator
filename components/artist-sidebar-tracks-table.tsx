"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SpotifyIcon from "@/components/spotify-icon";
import type { ArtistSidebarFeatTrackRow, ArtistSidebarTrackRow } from "@/components/artist-sidebar-types";
import { buildArtistsUrl, type ArtistsHrefContext } from "@/lib/artists-url";

function collaboratorArtists(
  track: ArtistSidebarTrackRow,
  excludeArtistId?: bigint
): Array<{ id: bigint; name: string }> {
  const byId = new Map<string, { id: bigint; name: string }>();
  for (const ta of track.trackArtists) {
    if (ta.artist.id === track.artistId) continue;
    if (excludeArtistId !== undefined && ta.artist.id === excludeArtistId) continue;
    byId.set(ta.artist.id.toString(), { id: ta.artist.id, name: ta.artist.name });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

type SortColumn = "track" | "album" | "release" | "popularity";

type SortState = { col: SortColumn; order: "asc" | "desc" };

/** Matches Prisma `orderBy: [{ album: { releaseDate: "desc" } }, { trackNumber: "asc" }]`. */
const DEFAULT_SORT: SortState = { col: "release", order: "desc" };

function defaultOrder(col: SortColumn): "asc" | "desc" {
  return col === "track" || col === "album" ? "asc" : "desc";
}

function compareTracks(
  a: ArtistSidebarTrackRow,
  b: ArtistSidebarTrackRow,
  col: SortColumn,
  order: "asc" | "desc"
): number {
  const dir = order === "asc" ? 1 : -1;
  let cmp = 0;
  if (col === "track") {
    cmp = a.name.localeCompare(b.name);
  } else if (col === "album") {
    cmp = a.album.name.localeCompare(b.album.name);
  } else if (col === "release") {
    cmp = a.album.releaseDate.localeCompare(b.album.releaseDate);
    if (cmp === 0) cmp = a.trackNumber - b.trackNumber;
  } else {
    cmp = a.popularity - b.popularity;
  }
  return cmp * dir;
}

export default function ArtistSidebarTracksTable({
  tracks,
  artistsHrefContext,
  creditLine = "collaborators",
  excludeCollaboratorArtistId,
  emptyMessage = "No tracks available.",
}: {
  tracks: ArtistSidebarTrackRow[];
  artistsHrefContext: ArtistsHrefContext;
  /** When `primary`, shows the billed lead artist under the title (feat. appearances). */
  creditLine?: "collaborators" | "primary";
  /** Omit this artist from the "feat." collaborator line (e.g. the artist whose sidebar is open). */
  excludeCollaboratorArtistId?: bigint;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const sortedTracks = useMemo(() => {
    if (tracks.length === 0) return tracks;
    return [...tracks].sort((a, b) => compareTracks(a, b, sort.col, sort.order));
  }, [tracks, sort]);

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
          <th scope="col" aria-sort={ariaSort("track")} className="px-3 py-2">
            <button
              type="button"
              onClick={() => onHeaderClick("track")}
              className="flex w-full cursor-pointer select-none items-center justify-between gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span>Track</span>
              {sortArrow("track")}
            </button>
          </th>
          <th scope="col" aria-sort={ariaSort("album")} className="px-3 py-2">
            <button
              type="button"
              onClick={() => onHeaderClick("album")}
              className="flex w-full cursor-pointer select-none items-center justify-between gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span>Album</span>
              {sortArrow("album")}
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
          <th scope="col" aria-sort={ariaSort("popularity")} className="px-3 py-2 text-right">
            <button
              type="button"
              onClick={() => onHeaderClick("popularity")}
              className="flex w-full cursor-pointer select-none items-center justify-end gap-2 uppercase hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <span className="ml-auto">Popularity</span>
              {sortArrow("popularity")}
            </button>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {sortedTracks.length > 0 ? (
          sortedTracks.map((track) => {
            const feats = collaboratorArtists(track, excludeCollaboratorArtistId);
            const primaryArtist =
              creditLine === "primary"
                ? (track as ArtistSidebarFeatTrackRow).artist
                : null;
            return (
            <tr key={track.id.toString()}>
              <td className="max-w-[16rem] px-3 py-2">
                <div className="min-w-0">
                  <a
                    href={`https://open.spotify.com/track/${track.spotifyId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open “${track.name}” on Spotify`}
                    className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-50 dark:hover:text-blue-400"
                  >
                    <span className="truncate">{track.name}</span>
                    <SpotifyIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  </a>
                </div>
                {primaryArtist ? (
                  <div className="mt-0.5 min-w-0 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    <span className="whitespace-nowrap">by </span>
                    <Link
                      href={buildArtistsUrl({
                        ...artistsHrefContext,
                        artistId: primaryArtist.id.toString(),
                      })}
                      className="text-zinc-700 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      {primaryArtist.name}
                    </Link>
                  </div>
                ) : null}
                {feats.length > 0 ? (
                  <div className="mt-0.5 min-w-0 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    <span className="whitespace-nowrap">feat. </span>
                    {feats.map((a, i) => (
                      <span key={a.id.toString()}>
                        {i > 0 ? ", " : null}
                        <Link
                          href={buildArtistsUrl({
                            ...artistsHrefContext,
                            artistId: a.id.toString(),
                          })}
                          className="text-zinc-700 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                        >
                          {a.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="max-w-[14rem] px-3 py-2">
                <a
                  href={`https://open.spotify.com/album/${track.album.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open “${track.album.name}” on Spotify`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-zinc-600 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  <span className="truncate">{track.album.name}</span>
                  <SpotifyIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {track.album.releaseDate}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{track.popularity}</td>
            </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={4} className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
