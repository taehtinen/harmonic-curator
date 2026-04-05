"use client";

import { useCallback, useId, useState } from "react";
import PlaylistArtistPicker, {
  type PlaylistArtistTag,
} from "@/components/playlist-artist-picker";

type ArtistsTab = "filters" | "search";

export default function PlaylistArtistsFormSection({
  defaultArtists,
  defaultMaxFollowers,
  idPrefix,
  fieldClassName,
}: {
  defaultArtists: PlaylistArtistTag[];
  defaultMaxFollowers: number | null;
  idPrefix: string;
  fieldClassName: string;
}) {
  const baseId = useId();
  const tabFiltersId = `${idPrefix}-tab-filters-${baseId}`;
  const tabSearchId = `${idPrefix}-tab-artist-search-${baseId}`;
  const panelFiltersId = `${idPrefix}-panel-filters-${baseId}`;
  const panelSearchId = `${idPrefix}-panel-artist-search-${baseId}`;

  const [activeTab, setActiveTab] = useState<ArtistsTab>(() =>
    defaultArtists.length > 0 ? "search" : "filters",
  );
  const [hasSelectedArtists, setHasSelectedArtists] = useState(
    () => defaultArtists.length > 0,
  );

  const handleSelectionChange = useCallback((artists: PlaylistArtistTag[]) => {
    const has = artists.length > 0;
    setHasSelectedArtists(has);
    if (has) {
      setActiveTab("search");
    }
  }, []);

  const tabButtonClass = (isActive: boolean, disabled?: boolean) =>
    `rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition-colors ${
      disabled
        ? "cursor-not-allowed border-transparent bg-zinc-100/50 text-zinc-400 opacity-70 dark:bg-zinc-900/40 dark:text-zinc-600"
        : isActive
          ? "relative z-[1] border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          : "border-transparent bg-zinc-100/80 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Artists</h3>

      <div className="flex flex-col gap-0">
        <div
          role="tablist"
          aria-label="Artist criteria"
          className="flex flex-wrap gap-0.5"
        >
          <button
            type="button"
            role="tab"
            id={tabFiltersId}
            aria-selected={activeTab === "filters" && !hasSelectedArtists}
            aria-controls={panelFiltersId}
            aria-disabled={hasSelectedArtists}
            disabled={hasSelectedArtists}
            tabIndex={
              hasSelectedArtists ? -1 : activeTab === "filters" ? 0 : -1
            }
            onClick={() => {
              if (!hasSelectedArtists) setActiveTab("filters");
            }}
            title={
              hasSelectedArtists
                ? "Remove all selected artists to use follower filters"
                : undefined
            }
            className={tabButtonClass(
              activeTab === "filters",
              hasSelectedArtists,
            )}
          >
            Filters
          </button>
          <button
            type="button"
            role="tab"
            id={tabSearchId}
            aria-selected={activeTab === "search" || hasSelectedArtists}
            aria-controls={panelSearchId}
            tabIndex={
              hasSelectedArtists ? 0 : activeTab === "search" ? 0 : -1
            }
            onClick={() => setActiveTab("search")}
            className={tabButtonClass(activeTab === "search")}
          >
            Select artists
          </button>
        </div>

        <div
          role="tabpanel"
          id={panelFiltersId}
          aria-labelledby={tabFiltersId}
          hidden={activeTab !== "filters"}
          className="rounded-b-md rounded-tr-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {!hasSelectedArtists ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${idPrefix}-playlist-max-followers`}
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Max followers
              </label>
              <input
                id={`${idPrefix}-playlist-max-followers`}
                name="maxFollowers"
                type="number"
                inputMode="numeric"
                min={0}
                max={2147483647}
                step={1}
                autoComplete="off"
                placeholder="No limit"
                defaultValue={defaultMaxFollowers ?? ""}
                className={fieldClassName}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Only include artists that have at most this many Spotify followers.
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This playlist uses specific artists. Remove all artists on the Select artists tab to set
              a follower cap again.
            </p>
          )}
        </div>

        <div
          role="tabpanel"
          id={panelSearchId}
          aria-labelledby={tabSearchId}
          hidden={activeTab !== "search"}
          className="rounded-b-md rounded-tr-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <PlaylistArtistPicker
            defaultArtists={defaultArtists}
            idPrefix={idPrefix}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}
