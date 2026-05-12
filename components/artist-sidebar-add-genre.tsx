"use client";

import {
  MAIN_FINNISH_GENRE_LABELS,
  MAIN_FINNISH_GENRE_VALUES,
} from "@/lib/main-finnish-genres";
import { genreDedupeKey, normalizeGenreForStorage } from "@/lib/genre-normalize";
import { createPortal } from "react-dom";
import {
  startTransition,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function artistHasGenre(existing: string[], value: string): boolean {
  const k = genreDedupeKey(value);
  return existing.some((g) => genreDedupeKey(g) === k);
}

const chipBaseClass =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors";

const chipAvailableClass = `${chipBaseClass} border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800`;

const chipOnArtistClass = `${chipBaseClass} cursor-default border-emerald-600/75 bg-emerald-100 text-emerald-950 shadow-sm ring-1 ring-emerald-600/15 dark:border-emerald-500/70 dark:bg-emerald-950/55 dark:text-emerald-100 dark:ring-emerald-500/20`;

const secondaryTriggerClass =
  "shrink-0 self-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

const secondaryButtonClass =
  "shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

const GENRE_FORM_ID = "artist-sidebar-add-genre-form";

export default function ArtistSidebarAddGenre({
  artistId,
  existingGenres,
  addGenreAction,
  addGenreReturnToHref,
}: {
  artistId: string;
  existingGenres: string[];
  addGenreAction: (formData: FormData) => Promise<void>;
  addGenreReturnToHref: string;
}) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLUListElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  /** After outside click; cleared on query change or search input focus. */
  const [listboxDismissed, setListboxDismissed] = useState(false);

  const searchActive = debouncedQuery.trim().length >= 2;
  const queryReady = query.trim().length >= 2;
  const awaitingDebounce = queryReady && debouncedQuery.trim().length < 2;
  const listboxVisible = queryReady && !listboxDismissed;

  useEffect(() => {
    if (!searchActive) return;

    let cancelled = false;
    startTransition(() => {
      setLoading(true);
    });
    const url = new URL("/api/genres/search", window.location.origin);
    url.searchParams.set("q", debouncedQuery.trim());

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<{ genres: string[] }>;
      })
      .then((data) => {
        if (!cancelled) setResults(data.genres ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      startTransition(() => {
        setLoading(false);
      });
    };
  }, [searchActive, debouncedQuery]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open || !queryReady) return;

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (dropdownListRef.current?.contains(t)) return;
      setListboxDismissed(true);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, queryReady]);

  useLayoutEffect(() => {
    const syncDropdownRect = () => {
      const el = searchAnchorRef.current;
      if (!open || !listboxVisible || !el) {
        setDropdownRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setDropdownRect({
        top: r.bottom + 4,
        left: r.left,
        width: r.width,
      });
    };

    syncDropdownRect();
    window.addEventListener("scroll", syncDropdownRect, true);
    window.addEventListener("resize", syncDropdownRect);
    return () => {
      window.removeEventListener("scroll", syncDropdownRect, true);
      window.removeEventListener("resize", syncDropdownRect);
    };
  }, [
    open,
    listboxVisible,
    loading,
    results.length,
    queryReady,
    awaitingDebounce,
  ]);

  const dropdownPortal =
    typeof document !== "undefined" &&
    open &&
    listboxVisible &&
    dropdownRect &&
    createPortal(
      <ul
        ref={dropdownListRef}
        id={listboxId}
        role="listbox"
        className="fixed z-[100] max-h-48 overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-white/10"
        style={{
          top: dropdownRect.top,
          left: dropdownRect.left,
          width: dropdownRect.width,
        }}
      >
        {loading || awaitingDebounce ? (
          <li className="min-h-10 px-3 py-2 text-zinc-500 dark:text-zinc-400">Searching…</li>
        ) : results.length === 0 ? (
          <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">No matches</li>
        ) : (
          results.map((g) => {
            const stored = normalizeGenreForStorage(g);
            const onArtist = artistHasGenre(existingGenres, stored);
            return (
              <li key={g} role="option" aria-selected={onArtist}>
                {onArtist ? (
                  <button
                    type="button"
                    className="flex w-full cursor-default bg-emerald-50 px-3 py-2 text-left text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50"
                    aria-label={`${g}, already on this artist`}
                  >
                    <span className="min-w-0 truncate">{g}</span>
                    <span className="ml-2 shrink-0 font-medium text-emerald-800 dark:text-emerald-300/90">
                      On artist
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    form={GENRE_FORM_ID}
                    name="genre"
                    value={stored}
                    className="flex w-full px-3 py-2 text-left text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="min-w-0 truncate">{g}</span>
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>,
      document.body,
    );

  return (
    <>
      {dropdownPortal}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={secondaryTriggerClass}
          aria-expanded={false}
          aria-controls={GENRE_FORM_ID}
        >
          Add genre
        </button>
      )}
      {open && (
        <div
          ref={panelRef}
          className="mt-1 w-full basis-full rounded-lg border-2 border-zinc-300 bg-zinc-50 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.05)] dark:border-zinc-600 dark:bg-zinc-900/70 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          aria-label="Genre editor"
        >
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Add genre
          </h3>
          <form
            id={GENRE_FORM_ID}
            action={addGenreAction}
            className="flex flex-col gap-3"
          >
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="returnTo" value={addGenreReturnToHref} />

            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Suggested
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MAIN_FINNISH_GENRE_VALUES.map((value) => {
                  const onArtist = artistHasGenre(existingGenres, value);
                  return onArtist ? (
                    <button
                      key={value}
                      type="button"
                      className={chipOnArtistClass}
                      title="Already on this artist"
                      aria-label={`${MAIN_FINNISH_GENRE_LABELS[value] ?? value}, already on this artist`}
                    >
                      {MAIN_FINNISH_GENRE_LABELS[value] ?? value}
                    </button>
                  ) : (
                    <button
                      key={value}
                      type="submit"
                      name="genre"
                      value={value}
                      className={chipAvailableClass}
                    >
                      {MAIN_FINNISH_GENRE_LABELS[value] ?? value}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative" ref={searchAnchorRef}>
              <label htmlFor="artist-sidebar-genre-search" className="sr-only">
                Search genres to add
              </label>
              <input
                id="artist-sidebar-genre-search"
                type="search"
                role="combobox"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setListboxDismissed(false);
                }}
                onFocus={() => setListboxDismissed(false)}
                placeholder="Search genres..."
                className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
                aria-expanded={listboxVisible}
                aria-controls={listboxVisible ? listboxId : undefined}
                aria-autocomplete="list"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  setListboxDismissed(false);
                }}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
