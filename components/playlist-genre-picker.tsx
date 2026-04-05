"use client";

import { startTransition, useCallback, useEffect, useId, useState } from "react";

const tagClassName =
  "inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100/80 py-0.5 pl-2.5 pr-1 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200";

const removeButtonClassName =
  "-mr-0.5 flex h-6 w-6 items-center justify-center rounded-full p-0 leading-none text-zinc-500 hover:bg-zinc-200/90 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/90 dark:hover:text-zinc-100";

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
    <div className="flex flex-col gap-2">
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
              <span className="block translate-y-px text-sm leading-none" aria-hidden>
                ×
              </span>
            </button>
          </span>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <label htmlFor={`${idPrefix}-playlist-genre-search`} className="sr-only">
          Search genres to add
        </label>
        <div className="flex flex-wrap items-stretch gap-2">
          <input
            id={`${idPrefix}-playlist-genre-search`}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            aria-controls={listboxId}
            aria-autocomplete="list"
          />
          <button
            type="button"
            disabled={
              !searchActive ||
              loading ||
              !results.some((g) => !selected.some((s) => genreKey(s) === genreKey(g)))
            }
            onClick={() => {
              const next = results.find((g) => !selected.some((s) => genreKey(s) === genreKey(g)));
              if (next) addGenre(next);
            }}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Add
          </button>
        </div>
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-48 overflow-auto rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-900"
        >
          {loading && searchActive ? (
            <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">Searching…</li>
          ) : query.trim().length < 2 ? (
            <li className="px-3 py-2 text-zinc-500 dark:text-zinc-400">
              Type at least 2 characters
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
      </div>
      {selected.map((g) => (
        <input key={genreKey(g)} type="hidden" name="genres" value={g} />
      ))}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Optional. When set, generation only considers tracks from artists tagged with at least one of
        these genres. Leave empty to allow any genre (still subject to max followers).
      </p>
    </div>
  );
}
