"use client";

import { startTransition, useCallback, useEffect, useId, useState } from "react";

const tagClassName =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 py-1 pl-3 pr-1.5 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200";

const removeButtonClassName =
  "-mr-0.5 flex h-7 w-7 items-center justify-center rounded-full p-0 leading-none text-zinc-500 hover:bg-zinc-200/90 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/90 dark:hover:text-zinc-100";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function genreKey(g: string): string {
  return g.trim().toLowerCase();
}

export default function PlaylistGenrePicker({
  defaultGenres,
  idPrefix,
  onSelectionChange,
}: {
  defaultGenres: string[];
  idPrefix: string;
  onSelectionChange?: (genres: string[]) => void;
}) {
  const listboxId = useId();
  const [selected, setSelected] = useState<string[]>(() =>
    [...new Set(defaultGenres.map((g) => g.trim()).filter(Boolean))],
  );

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [selected, onSelectionChange]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const searchActive = debouncedQuery.trim().length >= 2;
  const queryReady = query.trim().length >= 2;
  const awaitingDebounce = queryReady && debouncedQuery.trim().length < 2;
  const suggestionsOpen = queryReady;

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

  const addGenre = useCallback((genre: string) => {
    const t = genre.trim();
    if (!t) return;
    const key = genreKey(t);
    setSelected((prev) => {
      if (prev.some((g) => genreKey(g) === key)) return prev;
      return [...prev, t];
    });
    setQuery("");
    setResults([]);
  }, []);

  const removeGenre = useCallback((genre: string) => {
    const key = genreKey(genre);
    setSelected((prev) => prev.filter((g) => genreKey(g) !== key));
  }, []);

  return (
    <div className="relative z-20 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((genre) => (
          <span key={genreKey(genre)} className={tagClassName}>
            <span className="min-w-0 truncate">{genre}</span>
            <button
              type="button"
              onClick={() => removeGenre(genre)}
              className={removeButtonClassName}
              aria-label={`Remove ${genre}`}
            >
              <span className="block translate-y-px text-base leading-none" aria-hidden>
                ×
              </span>
            </button>
          </span>
        ))}
      </div>

      <div className="relative w-full">
        <label htmlFor={`${idPrefix}-playlist-genre-search`} className="sr-only">
          Search genres to add
        </label>
        <input
          id={`${idPrefix}-playlist-genre-search`}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
          aria-expanded={suggestionsOpen}
          aria-controls={suggestionsOpen ? listboxId : undefined}
          aria-autocomplete="list"
        />
        {suggestionsOpen ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg ring-1 ring-zinc-950/5 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-white/10"
          >
            {loading || awaitingDebounce ? (
              <li className="min-h-10 px-3 py-2 text-zinc-500 dark:text-zinc-400">
                Searching…
              </li>
            ) : results.length === 0 ? (
              <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">No matches</li>
            ) : (
              results.map((g) => {
                const disabled = selected.some((s) => genreKey(s) === genreKey(g));
                return (
                  <li key={g} role="option" aria-selected={false}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addGenre(g)}
                      className={`flex w-full px-3 py-2 text-left ${
                        disabled
                          ? "cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                          : "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {g}
                      {disabled ? " (added)" : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      {selected.map((g) => (
        <input key={genreKey(g)} type="hidden" name="genres" value={g} />
      ))}
    </div>
  );
}
