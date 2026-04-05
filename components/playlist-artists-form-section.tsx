"use client";

import { PlaylistArtistAlgorithm } from "@prisma/client";
import { useCallback, useEffect, useId, useState } from "react";
import PlaylistArtistPicker, {
  type PlaylistArtistTag,
} from "@/components/playlist-artist-picker";
import PlaylistGenrePicker from "@/components/playlist-genre-picker";

type PlaylistLogicTab = "genre" | "artists";

export default function PlaylistArtistsFormSection({
  defaultArtists,
  artistAlgorithm,
  onArtistAlgorithmChange,
  defaultGenres,
  defaultMaxFollowers,
  disableSelectArtistsWhenCriteriaFilled = false,
  idPrefix,
  fieldClassName,
}: {
  defaultArtists: PlaylistArtistTag[];
  artistAlgorithm: (typeof PlaylistArtistAlgorithm)[keyof typeof PlaylistArtistAlgorithm];
  onArtistAlgorithmChange: (
    v: (typeof PlaylistArtistAlgorithm)[keyof typeof PlaylistArtistAlgorithm],
  ) => void;
  defaultGenres: string[];
  defaultMaxFollowers: number | null;
  /** When true, lock the Select artists tab if genres or max followers are set (edit sidebar). */
  disableSelectArtistsWhenCriteriaFilled?: boolean;
  idPrefix: string;
  fieldClassName: string;
}) {
  const baseId = useId();
  const tabGenreId = `${idPrefix}-tab-genre-${baseId}`;
  const tabArtistsId = `${idPrefix}-tab-artist-search-${baseId}`;
  const panelGenreId = `${idPrefix}-panel-genre-${baseId}`;
  const panelArtistsId = `${idPrefix}-panel-artist-search-${baseId}`;
  const artistAlgoLegendId = `${idPrefix}-artist-algo-legend-${baseId}`;

  const [activeTab, setActiveTab] = useState<PlaylistLogicTab>(() =>
    defaultArtists.length > 0 ? "artists" : "genre",
  );
  const [hasSelectedArtists, setHasSelectedArtists] = useState(
    () => defaultArtists.length > 0,
  );
  const [selectedGenreCount, setSelectedGenreCount] = useState(
    () =>
      new Set(defaultGenres.map((g) => g.trim()).filter(Boolean)).size,
  );
  const [maxFollowersFilled, setMaxFollowersFilled] = useState(
    () => defaultMaxFollowers != null,
  );

  const criteriaLocksArtistTab =
    disableSelectArtistsWhenCriteriaFilled &&
    !hasSelectedArtists &&
    (selectedGenreCount > 0 || maxFollowersFilled);

  useEffect(() => {
    if (!criteriaLocksArtistTab || activeTab !== "artists") return;
    setActiveTab("genre");
  }, [criteriaLocksArtistTab, activeTab]);

  const handleSelectionChange = useCallback((artists: PlaylistArtistTag[]) => {
    const has = artists.length > 0;
    setHasSelectedArtists(has);
    if (has) {
      setActiveTab("artists");
    }
  }, []);

  const handleGenreSelectionChange = useCallback((genres: string[]) => {
    setSelectedGenreCount(genres.length);
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
      <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Playlist logic</h3>

      <div className="flex flex-col gap-0">
        <div
          role="tablist"
          aria-label="Playlist generation criteria"
          className="flex flex-wrap gap-0.5"
        >
          <button
            type="button"
            role="tab"
            id={tabGenreId}
            aria-selected={activeTab === "genre" && !hasSelectedArtists}
            aria-controls={panelGenreId}
            aria-disabled={hasSelectedArtists}
            disabled={hasSelectedArtists}
            tabIndex={
              hasSelectedArtists ? -1 : activeTab === "genre" ? 0 : -1
            }
            onClick={() => {
              if (!hasSelectedArtists) setActiveTab("genre");
            }}
            className={tabButtonClass(
              activeTab === "genre",
              hasSelectedArtists,
            )}
          >
            Genre
          </button>
          <button
            type="button"
            role="tab"
            id={tabArtistsId}
            aria-selected={activeTab === "artists" || hasSelectedArtists}
            aria-controls={panelArtistsId}
            aria-disabled={criteriaLocksArtistTab}
            disabled={criteriaLocksArtistTab}
            tabIndex={
              criteriaLocksArtistTab
                ? -1
                : hasSelectedArtists
                  ? 0
                  : activeTab === "artists"
                    ? 0
                    : -1
            }
            onClick={() => {
              if (!criteriaLocksArtistTab) setActiveTab("artists");
            }}
            className={tabButtonClass(activeTab === "artists", criteriaLocksArtistTab)}
          >
            Select artists
          </button>
        </div>

        <div
          role="tabpanel"
          id={panelGenreId}
          aria-labelledby={tabGenreId}
          hidden={activeTab !== "genre"}
          className="rounded-b-md rounded-tr-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {!hasSelectedArtists ? (
            <div className="flex flex-col gap-4">
              <PlaylistGenrePicker
                defaultGenres={defaultGenres}
                idPrefix={idPrefix}
                onSelectionChange={handleGenreSelectionChange}
              />
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
                  onChange={(e) =>
                    setMaxFollowersFilled(e.target.value.trim() !== "")
                  }
                />
              </div>
            </div>
          ) : null}
        </div>

        <div
          role="tabpanel"
          id={panelArtistsId}
          aria-labelledby={tabArtistsId}
          hidden={activeTab !== "artists"}
          className="rounded-b-md rounded-tr-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <PlaylistArtistPicker
            defaultArtists={defaultArtists}
            idPrefix={idPrefix}
            onSelectionChange={handleSelectionChange}
          />

          <fieldset className="mt-4 flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <legend
              id={artistAlgoLegendId}
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Track selection
            </legend>
            <div
              role="radiogroup"
              aria-labelledby={artistAlgoLegendId}
              className="flex flex-col gap-2.5"
            >
              <label
                htmlFor={`${idPrefix}-artist-algo-default-${baseId}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-transparent px-0.5 py-0.5 text-sm text-zinc-800 hover:border-zinc-200 dark:text-zinc-200 dark:hover:border-zinc-600"
              >
                <input
                  id={`${idPrefix}-artist-algo-default-${baseId}`}
                  type="radio"
                  name={`${idPrefix}-artist-algo-ui`}
                  value={PlaylistArtistAlgorithm.DEFAULT}
                  checked={artistAlgorithm === PlaylistArtistAlgorithm.DEFAULT}
                  onChange={() => onArtistAlgorithmChange(PlaylistArtistAlgorithm.DEFAULT)}
                  className="mt-0.5 h-4 w-4 shrink-0 border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <span className="font-medium">All recent tracks</span>
              </label>
              <label
                htmlFor={`${idPrefix}-artist-algo-featured-${baseId}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-transparent px-0.5 py-0.5 text-sm text-zinc-800 hover:border-zinc-200 dark:text-zinc-200 dark:hover:border-zinc-600"
              >
                <input
                  id={`${idPrefix}-artist-algo-featured-${baseId}`}
                  type="radio"
                  name={`${idPrefix}-artist-algo-ui`}
                  value={PlaylistArtistAlgorithm.FEATURED}
                  checked={artistAlgorithm === PlaylistArtistAlgorithm.FEATURED}
                  onChange={() => onArtistAlgorithmChange(PlaylistArtistAlgorithm.FEATURED)}
                  className="mt-0.5 h-4 w-4 shrink-0 border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <span className="font-medium">Featured artists</span>
              </label>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}
