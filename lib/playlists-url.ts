export type PlaylistsListSort = "name" | "lastSpotifyPublishAt";
export type PlaylistsListOrder = "asc" | "desc";

export function buildPlaylistsUrl(params: {
  page: number;
  sort: PlaylistsListSort;
  order: PlaylistsListOrder;
  playlistId?: string;
  /** Omit or pass "" when there is no search query */
  q?: string;
  /** Opens the “new playlist” sidebar when no playlistId is set */
  newPlaylist?: boolean;
  /** Opens the edit-details sidebar for the selected playlist */
  editPlaylist?: boolean;
}): string {
  const { page, sort, order, playlistId, q = "", newPlaylist, editPlaylist } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  if (playlistId) {
    sp.set("playlist", playlistId);
    if (editPlaylist) sp.set("edit", "1");
  } else if (newPlaylist) sp.set("new", "1");
  const trimmedQ = q.trim();
  if (trimmedQ) sp.set("q", trimmedQ);
  const qs = sp.toString();
  return qs ? `/playlists?${qs}` : "/playlists";
}

/** Use after creating a playlist: set `playlist`, strip `new`. */
export function withPlaylistParam(returnPathAndQuery: string, playlistId: string): string {
  const u = new URL(returnPathAndQuery, "http://localhost");
  u.searchParams.set("playlist", playlistId);
  u.searchParams.delete("new");
  return `${u.pathname}${u.search}`;
}
