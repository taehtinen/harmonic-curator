export type ArtistsListSort =
  | "name"
  | "spotifyId"
  | "popularity"
  | "followers"
  | "tracks"
  | "latestRelease";
export type ArtistsListOrder = "asc" | "desc";

export type ArtistsHrefContext = {
  page: number;
  sort: ArtistsListSort;
  order: ArtistsListOrder;
  /** Normalized search query (trimmed); use "" when absent */
  q: string;
  /** When true, list URL includes `noGenres=1` (artists with empty `genres`). */
  noGenres?: boolean;
};

export function buildArtistsUrl(
  params: {
    page: number;
    sort: ArtistsListSort;
    order: ArtistsListOrder;
    artistId?: string;
    /** Omit or pass "" when there is no search query */
    q?: string;
    noGenres?: boolean;
  },
): string {
  const { page, sort, order, artistId, q = "", noGenres = false } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  if (artistId) sp.set("artist", artistId);
  const trimmedQ = q.trim();
  if (trimmedQ) sp.set("q", trimmedQ);
  if (noGenres) sp.set("noGenres", "1");
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}
