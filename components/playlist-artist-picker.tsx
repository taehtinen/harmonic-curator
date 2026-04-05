"use client";

import { startTransition, useCallback, useEffect, useId, useState } from "react";

export type PlaylistArtistTag = { id: string; name: string };

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

export default function PlaylistArtistPicker({
  defaultArtists,
  idPrefix,
  onSelectionChange,
}: {
  defaultArtists: PlaylistArtistTag[];
  idPrefix: string;
  onSelectionChange?: (artists: PlaylistArtistTag[]) => void;
}) {
  const listboxId = useId();
  const [selected, setSelected] = useState<PlaylistArtistTag[]>(defaultArtists);

  useEffect(() => {
    onSelectionChange?.(selected);
  }, [selected, onSelectionChange]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [results, setResults] = useState<PlaylistArtistTag[]>([]);
  const [loading, setLoading] = useState(false);

  const searchActive = debouncedQuery.trim().length >= 2;

  useEffect(() => {
    if (!searchActive) return;

    let cancelled = false;
    startTransition(() => {
      setLoading(true);
    });
    const url = new URL("/api/artists/search", window.location.origin);
    url.searchParams.set("q", debouncedQuery.trim());

    fetch(url.toString())
      .then((res) => {
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<{ artists: PlaylistArtistTag[] }>;
      })
      .then((data) => {
        if (!cancelled) setResults(data.artists ?? []);
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

  const addArtist = useCallback((artist: PlaylistArtistTag) => {
    setSelected((prev) => {
      if (prev.some((a) => a.id === artist.id)) return prev;
      return [...prev, artist];
    });
    setQuery("");
    setResults([]);
  }, []);

  const removeArtist = useCallback((id: string) => {
    setSelected((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((artist) => (
          <span key={artist.id} className={tagClassName}>
            <span className="min-w-0 truncate">{artist.name}</span>
            <button
              type="button"
              onClick={() => removeArtist(artist.id)}
              className={removeButtonClassName}
              aria-label={`Remove ${artist.name}`}
            >
              <span className="block translate-y-px text-sm leading-none" aria-hidden>
                ×
              </span>
            </button>
          </span>
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <label htmlFor={`${idPrefix}-playlist-artist-search`} className="sr-only">
          Search artists to add
        </label>
        <div className="flex flex-wrap items-stretch gap-2">
          <input
            id={`${idPrefix}-playlist-artist-search`}
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
              !results.some((a) => !selected.some((s) => s.id === a.id))
            }
            onClick={() => {
              const next = results.find((a) => !selected.some((s) => s.id === a.id));
              if (next) addArtist(next);
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
            results.map((a) => {
              const disabled = selected.some((s) => s.id === a.id);
              return (
                <li key={a.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => addArtist(a)}
                    className={`flex w-full px-3 py-2 text-left ${
                      disabled
                        ? "cursor-not-allowed text-zinc-400 dark:text-zinc-500"
                        : "text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {a.name}
                    {disabled ? " (added)" : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
      {selected.map((a) => (
        <input key={a.id} type="hidden" name="artistIds" value={a.id} />
      ))}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        When set, generation uses only tracks from these artists. Playlist genres and max followers
        are cleared and ignored until you remove all artists.
      </p>
    </div>
  );
}
