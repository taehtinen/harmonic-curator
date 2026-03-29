export type ArtistsListSort = "name" | "spotifyId" | "popularity" | "followers";
export type ArtistsListOrder = "asc" | "desc";

export type ArtistsHrefContext = {
  page: number;
  sort: ArtistsListSort;
  order: ArtistsListOrder;
  /** Normalized search query (trimmed); use "" when absent */
  q: string;
};

export function buildArtistsUrl(
  params: {
    page: number;
    sort: ArtistsListSort;
    order: ArtistsListOrder;
    artistId?: string;
    /** Omit or pass "" when there is no search query */
    q?: string;
  },
): string {
  const { page, sort, order, artistId, q = "" } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  if (artistId) sp.set("artist", artistId);
  const trimmedQ = q.trim();
  if (trimmedQ) sp.set("q", trimmedQ);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}
