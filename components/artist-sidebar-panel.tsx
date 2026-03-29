"use client";

import { useState } from "react";
import ArtistSidebarAlbumsTable from "@/components/artist-sidebar-albums-table";
import ArtistSidebarTracksTable from "@/components/artist-sidebar-tracks-table";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";
import type { ArtistsHrefContext } from "@/lib/artists-url";

export default function ArtistSidebarPanel({
  artist,
  artistsHrefContext,
}: {
  artist: ArtistWithSidebarData;
  artistsHrefContext: ArtistsHrefContext;
}) {
  const [activeTab, setActiveTab] = useState<"tracks" | "featTracks" | "albums">("tracks");

  return (
    <section className="flex h-1/2 min-h-0 flex-col border-t border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("tracks")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium uppercase tracking-wide ${
            activeTab === "tracks"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          Tracks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("featTracks")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium uppercase tracking-wide ${
            activeTab === "featTracks"
              ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
              : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
          }`}
        >
          Feat. Tracks
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("albums")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium uppercase tracking-wide ${
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
          <ArtistSidebarTracksTable
            tracks={artist.tracks}
            artistsHrefContext={artistsHrefContext}
          />
        ) : activeTab === "featTracks" ? (
          <ArtistSidebarTracksTable
            tracks={artist.featTracks}
            artistsHrefContext={artistsHrefContext}
            creditLine="primary"
            excludeCollaboratorArtistId={artist.id}
            emptyMessage="No featured appearances on other artists' tracks."
          />
        ) : (
          <ArtistSidebarAlbumsTable albums={artist.albums} />
        )}
      </div>
    </section>
  );
}
