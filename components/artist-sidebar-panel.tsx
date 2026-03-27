"use client";

import { useState } from "react";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

export default function ArtistSidebarPanel({ artist }: { artist: ArtistWithSidebarData }) {
  const [activeTab, setActiveTab] = useState<"tracks" | "albums">("tracks");

  return (
    <section className="flex h-1/2 min-h-0 flex-col border-t border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("tracks")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            activeTab === "tracks"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          Tracks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("albums")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            activeTab === "albums"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          Albums
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {activeTab === "tracks" ? (
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-100/80 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Track
                </th>
                <th scope="col" className="px-3 py-2">
                  Album
                </th>
                <th scope="col" className="px-3 py-2">
                  Release
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Popularity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {artist.tracks.length > 0 ? (
                artist.tracks.map((track) => (
                  <tr key={track.id.toString()}>
                    <td className="max-w-[16rem] truncate px-3 py-2 font-medium">{track.name}</td>
                    <td className="max-w-[14rem] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {track.album.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {track.album.releaseDate}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{track.popularity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    No tracks available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            <thead className="bg-zinc-100/80 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Album
                </th>
                <th scope="col" className="px-3 py-2">
                  Release
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Tracks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {artist.albums.length > 0 ? (
                artist.albums.map((album) => (
                  <tr key={album.id.toString()}>
                    <td className="max-w-[16rem] truncate px-3 py-2 font-medium">{album.name}</td>
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
        )}
      </div>
    </section>
  );
}
