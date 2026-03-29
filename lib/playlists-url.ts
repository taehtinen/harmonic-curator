export type PlaylistsListSort = "name" | "spotifyId" | "maxFollowers" | "size";
export type PlaylistsListOrder = "asc" | "desc";

export function buildPlaylistsUrl(params: {
  page: number;
  sort: PlaylistsListSort;
  order: PlaylistsListOrder;
  playlistId?: string;
  /** Omit or pass "" when there is no search query */
  q?: string;
}): string {
  const { page, sort, order, playlistId, q = "" } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  if (playlistId) sp.set("playlist", playlistId);
  const trimmedQ = q.trim();
  if (trimmedQ) sp.set("q", trimmedQ);
  const qs = sp.toString();
  return qs ? `/playlists?${qs}` : "/playlists";
}
