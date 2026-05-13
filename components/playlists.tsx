import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PlaylistArtistAlgorithm } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, userIsAdmin } from "@/lib/auth";
import {
  normalizePlaylistGenres,
  replacePlaylistTracksFromDbCriteria,
} from "@/lib/playlist-generate-from-criteria";
import { publishPlaylistTracksForUser } from "@/lib/spotify-playlist-publish";
import PlaylistSidebar from "@/components/playlist-sidebar";
import PlaylistSidebarEdit from "@/components/playlist-sidebar-edit";
import PlaylistSidebarNew from "@/components/playlist-sidebar-new";
import PlaylistsTable, { type PlaylistTableRow } from "@/components/playlists-table";
import ShowOthersPlaylistsCheckbox from "@/components/show-others-playlists-checkbox";
import {
  buildPlaylistsUrl,
  type PlaylistsListOrder,
  type PlaylistsListSort,
} from "@/lib/playlists-url";
import type { ArtistsHrefContext } from "@/lib/artists-url";
import type { PlaylistArtistTag } from "@/components/playlist-artist-picker";

const PLAYLISTS_PER_PAGE = 100;

const SORT_COLUMNS: PlaylistsListSort[] = ["name", "lastSpotifyPublishAt"];

function parseSort(sortParam: string | undefined): PlaylistsListSort {
  if (sortParam && SORT_COLUMNS.includes(sortParam as PlaylistsListSort))
    return sortParam as PlaylistsListSort;
  return "name";
}

function parseOrder(orderParam: string | undefined): PlaylistsListOrder {
  if (orderParam === "asc" || orderParam === "desc") return orderParam;
  return "asc";
}

const MAX_PG_INT = 2147483647;

async function resolvePlaylistArtistTags(
  artistIds: string[] | undefined | null,
): Promise<PlaylistArtistTag[]> {
  const ids = artistIds ?? [];
  if (ids.length === 0) return [];
  const rows = await prisma.artist.findMany({
    where: { id: { in: ids.map((s) => BigInt(s)) } },
    select: { id: true, name: true },
  });
  const byId = new Map(rows.map((r) => [r.id.toString(), r.name]));
  return ids.map((id) => ({
    id,
    name: byId.get(id) ?? `Artist #${id}`,
  }));
}

function artistIdsFromFormData(formData: FormData): string[] {
  const raw = formData.getAll("artistIds");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string" || !/^\d+$/.test(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function genresFromFormData(formData: FormData): string[] {
  const raw = formData.getAll("genres");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

async function persistableArtistIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const found = await prisma.artist.findMany({
    where: { id: { in: ids.map((s) => BigInt(s)) } },
    select: { id: true },
  });
  const allowed = new Set(found.map((f) => f.id.toString()));
  return ids.filter((id) => allowed.has(id));
}

function parseMaxFollowersFromForm(raw: FormDataEntryValue | null): number | null {
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+$/.test(t)) {
    throw new Error("Max followers must be a whole number, or left blank for no limit.");
  }
  const n = Number(t);
  if (n > MAX_PG_INT) {
    throw new Error("Max followers is too large.");
  }
  return n;
}

const MIN_PLAYLIST_SIZE = 1;
const MAX_PLAYLIST_SIZE = 1000;

function parseArtistAlgorithmFromForm(
  formData: FormData,
  hasSelectedArtists: boolean,
): PlaylistArtistAlgorithm {
  if (!hasSelectedArtists) {
    return PlaylistArtistAlgorithm.DEFAULT;
  }
  const raw = formData.get("artistAlgorithm");
  const s = typeof raw === "string" ? raw.trim() : "";
  if (s === PlaylistArtistAlgorithm.FEATURED) {
    return PlaylistArtistAlgorithm.FEATURED;
  }
  return PlaylistArtistAlgorithm.DEFAULT;
}

function parsePlaylistSizeFromForm(raw: FormDataEntryValue | null): number {
  if (raw == null || typeof raw !== "string") {
    throw new Error("Max tracks is required.");
  }
  const t = raw.trim();
  if (t === "" || !/^\d+$/.test(t)) {
    throw new Error("Max tracks must be a whole number between 1 and 1000.");
  }
  const n = Number(t);
  if (n < MIN_PLAYLIST_SIZE || n > MAX_PLAYLIST_SIZE) {
    throw new Error("Max tracks must be between 1 and 1000.");
  }
  return n;
}

export default async function Playlists({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    q?: string;
    others?: string;
    playlist?: string;
    new?: string;
    edit?: string;
    publish?: string;
    publish_err?: string;
    saved?: string;
  }>;
}) {
  const {
    page: pageParam,
    sort: sortParam,
    order: orderParam,
    q: qParam,
    others: othersParam,
    playlist: playlistParam,
    new: newParam,
    edit: editParam,
    publish: publishParam,
    publish_err: publishErrParam,
    saved: savedParam,
  } = await searchParams;
  const q = (qParam ?? "").trim();
  const showOthersPlaylists = othersParam !== "0";
  const sort = parseSort(sortParam);
  const order = parseOrder(orderParam);
  const rawPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const sessionUser = await requireUser();
  const ownerUserId = BigInt(sessionUser.id);

  const linkedSpotifyCount = await prisma.userSpotifyAccount.count({
    where: { userId: ownerUserId },
  });
  const hasLinkedSpotify = linkedSpotifyCount > 0;

  const publishOk = publishParam === "1";
  const publishErr = publishErrParam?.trim() ?? null;

  const saveFlash =
    savedParam === "created" || savedParam === "updated" ? savedParam : null;

  const mineWhere = {
    userId: ownerUserId,
    ...(q
      ? {
          name: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const othersWhere = {
    userId: { not: ownerUserId },
    ...(q
      ? {
          name: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const total = await prisma.playlist.count({ where: mineWhere });
  const totalPages = Math.ceil(total / PLAYLISTS_PER_PAGE);
  const page = Math.min(rawPage, Math.max(1, totalPages));
  const skip = (page - 1) * PLAYLISTS_PER_PAGE;
  const minePlaylists = await prisma.playlist.findMany({
    where: mineWhere,
    orderBy: { [sort]: order },
    take: PLAYLISTS_PER_PAGE,
    skip,
  });

  let othersTotal = 0;
  let othersRows: PlaylistTableRow[] = [];
  if (showOthersPlaylists) {
    othersTotal = await prisma.playlist.count({ where: othersWhere });
    const othersFromDb = await prisma.playlist.findMany({
      where: othersWhere,
      orderBy: { [sort]: order },
      take: PLAYLISTS_PER_PAGE,
      include: { user: { select: { username: true } } },
    });
    othersRows = othersFromDb.map(({ user, ...p }) => ({
      ...p,
      ownerUsername: user.username,
    }));
  }
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const pl = (overrides: Partial<Parameters<typeof buildPlaylistsUrl>[0]> = {}) =>
    buildPlaylistsUrl({
      page,
      sort,
      order,
      q,
      showOthersPlaylists,
      ...overrides,
    });

  function nextOrder(col: PlaylistsListSort): PlaylistsListOrder {
    if (col === sort) return order === "asc" ? "desc" : "asc";
    return col === "name" ? "asc" : "desc";
  }

  function pageForSort(col: PlaylistsListSort) {
    return col === sort ? page : 1;
  }

  const sortArrow = (col: PlaylistsListSort) =>
    sort === col ? (
      <span className="tabular-nums">{order === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const selectedPlaylistIdParam =
    playlistParam && /^\d+$/.test(playlistParam) ? BigInt(playlistParam) : null;
  const selectedPlaylist = selectedPlaylistIdParam
    ? await prisma.playlist.findFirst({
        where: { id: selectedPlaylistIdParam },
        include: {
          user: { select: { username: true } },
          playlistTracks: {
            orderBy: { position: "asc" },
            include: {
              track: {
                include: {
                  artist: { select: { id: true, name: true } },
                  album: { select: { releaseDate: true } },
                  trackArtists: {
                    include: { artist: { select: { id: true, name: true } } },
                  },
                },
              },
            },
          },
        },
      })
    : null;

  if (
    selectedPlaylist &&
    editParam === "1" &&
    selectedPlaylist.userId !== ownerUserId
  ) {
    redirect(
      pl({
        playlistId: selectedPlaylist.id.toString(),
      }),
    );
  }

  const selectedIsOwned =
    selectedPlaylist != null && selectedPlaylist.userId === ownerUserId;

  const showNewPlaylist = newParam === "1" && !selectedPlaylist;
  const showEditPlaylist = editParam === "1" && Boolean(selectedPlaylist) && selectedIsOwned;
  const panelOpen = Boolean(selectedPlaylist) || showNewPlaylist;
  const openPlaylistId = selectedPlaylist?.id.toString();
  const closePlaylistHref = pl();
  const newPlaylistHref = pl({ newPlaylist: true });
  const playlistViewHref = openPlaylistId
    ? pl({ playlistId: openPlaylistId })
    : closePlaylistHref;
  const playlistEditHref = openPlaylistId
    ? pl({
        playlistId: openPlaylistId,
        editPlaylist: true,
      })
    : closePlaylistHref;
  const playlistPanelReturnToHref = playlistViewHref;
  const newPlaylistSaveReturnTo = pl();

  const artistsHrefContext: ArtistsHrefContext = {
    page: 1,
    sort: "popularity",
    order: "desc",
    q: "",
  };

  const editDefaultArtists =
    selectedPlaylist && showEditPlaylist && selectedIsOwned
      ? await resolvePlaylistArtistTags(selectedPlaylist.artistIds)
      : [];

  async function generatePlaylistFromCriteria(formData: FormData) {
    "use server";

    const actingUser = await requireUser();
    if (!userIsAdmin(actingUser)) {
      throw new Error("Only admins can generate playlists.");
    }

    const playlistIdValue = formData.get("playlistId");
    const returnToValue = formData.get("returnTo");
    if (typeof playlistIdValue !== "string" || typeof returnToValue !== "string") {
      throw new Error("Invalid generate playlist request payload.");
    }

    if (!/^\d+$/.test(playlistIdValue)) {
      throw new Error("Invalid playlist id.");
    }

    const playlistId = BigInt(playlistIdValue);
    const owned = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: BigInt(actingUser.id) },
      select: { id: true },
    });
    if (!owned) {
      throw new Error("Playlist not found.");
    }

    await replacePlaylistTracksFromDbCriteria(playlistId);
    redirect(returnToValue);
  }

  async function publishPlaylistToSpotify(formData: FormData) {
    "use server";

    const actingUser = await requireUser();
    const playlistIdValue = formData.get("playlistId");
    const returnToValue = formData.get("returnTo");
    if (typeof playlistIdValue !== "string" || typeof returnToValue !== "string") {
      throw new Error("Invalid publish request payload.");
    }

    if (!/^\d+$/.test(playlistIdValue)) {
      throw new Error("Invalid playlist id.");
    }

    const playlistDbId = BigInt(playlistIdValue);
    const owned = await prisma.playlist.findFirst({
      where: { id: playlistDbId, userId: BigInt(actingUser.id) },
      select: { id: true },
    });
    if (!owned) {
      throw new Error("Playlist not found.");
    }

    const result = await publishPlaylistTracksForUser({
      appUserId: BigInt(actingUser.id),
      playlistDbId,
    });

    const flashUrl = new URL(returnToValue, "http://localhost");
    flashUrl.searchParams.delete("publish");
    flashUrl.searchParams.delete("publish_err");
    if (result.ok) {
      flashUrl.searchParams.set("publish", "1");
    } else {
      flashUrl.searchParams.set("publish_err", result.message.slice(0, 400));
    }
    redirect(`${flashUrl.pathname}${flashUrl.search}`);
  }

  async function savePlaylistDetails(formData: FormData) {
    "use server";

    const actingUser = await requireUser();
    const userId = BigInt(actingUser.id);
    const returnToValue = formData.get("returnTo");
    const nameRaw = formData.get("name");
    const descRaw = formData.get("description");
    const sizeRaw = formData.get("size");
    const maxFollowersRaw = formData.get("maxFollowers");
    const playlistIdValue = formData.get("playlistId");

    if (typeof returnToValue !== "string") {
      throw new Error("Invalid save playlist request payload.");
    }

    const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
    const description = typeof descRaw === "string" ? descRaw.trim() : "";
    if (!name) {
      throw new Error("Name is required.");
    }

    const artistIds = await persistableArtistIds(artistIdsFromFormData(formData));
    const hasSelectedArtists = artistIds.length > 0;
    const artistAlgorithm = parseArtistAlgorithmFromForm(formData, hasSelectedArtists);
    const maxFollowers =
      hasSelectedArtists ? null : parseMaxFollowersFromForm(maxFollowersRaw);
    const size = parsePlaylistSizeFromForm(sizeRaw);
    const genres =
      hasSelectedArtists ? [] : normalizePlaylistGenres(genresFromFormData(formData));

    if (typeof playlistIdValue === "string" && /^\d+$/.test(playlistIdValue)) {
      const playlistId = BigInt(playlistIdValue);
      const owned = await prisma.playlist.findFirst({
        where: { id: playlistId, userId },
        select: { id: true },
      });
      if (!owned) {
        throw new Error("Playlist not found.");
      }
      await prisma.playlist.update({
        where: { id: playlistId },
        data: {
          name,
          description,
          size,
          maxFollowers,
          artistIds,
          artistAlgorithm,
          genres,
        },
      });
      const updatedUrl = new URL(returnToValue, "http://localhost");
      updatedUrl.searchParams.set("edit", "1");
      updatedUrl.searchParams.delete("saved");
      updatedUrl.searchParams.set("saved", "updated");
      redirect(`${updatedUrl.pathname}${updatedUrl.search}`);
    } else {
      const created = await prisma.playlist.create({
        data: {
          userId,
          spotifyId: null,
          name,
          description,
          genres,
          artistIds,
          artistAlgorithm,
          maxFollowers,
          size,
        },
        select: { id: true },
      });
      const createdUrl = new URL(returnToValue, "http://localhost");
      createdUrl.searchParams.set("playlist", created.id.toString());
      createdUrl.searchParams.delete("new");
      createdUrl.searchParams.set("edit", "1");
      createdUrl.searchParams.delete("saved");
      createdUrl.searchParams.set("saved", "created");
      redirect(`${createdUrl.pathname}${createdUrl.search}`);
    }
  }

  async function deletePlaylist(formData: FormData) {
    "use server";

    const actingUser = await requireUser();
    const playlistIdValue = formData.get("playlistId");
    const returnToValue = formData.get("returnTo");
    if (typeof playlistIdValue !== "string" || typeof returnToValue !== "string") {
      throw new Error("Invalid delete playlist request payload.");
    }

    if (!/^\d+$/.test(playlistIdValue)) {
      throw new Error("Invalid playlist id.");
    }

    const playlistId = BigInt(playlistIdValue);
    const owned = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: BigInt(actingUser.id) },
      select: { id: true },
    });
    if (!owned) {
      throw new Error("Playlist not found.");
    }

    await prisma.playlist.delete({ where: { id: playlistId } });
    redirect(returnToValue);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-hidden bg-white px-6 py-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">Playlists</h1>
        </header>
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <form
                method="get"
                action="/playlists"
                className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
              >
                <input type="hidden" name="sort" value={sort} />
                <input type="hidden" name="order" value={order} />
                {openPlaylistId ? (
                  <input type="hidden" name="playlist" value={openPlaylistId} />
                ) : null}
                {showNewPlaylist ? <input type="hidden" name="new" value="1" /> : null}
                {showEditPlaylist ? <input type="hidden" name="edit" value="1" /> : null}
                {!showOthersPlaylists ? (
                  <input type="hidden" name="others" value="0" />
                ) : null}
                <label htmlFor="playlists-name-search" className="sr-only">
                  Search playlists by name
                </label>
                <input
                  id="playlists-name-search"
                  name="q"
                  type="search"
                  placeholder="Search by name…"
                  defaultValue={q}
                  autoComplete="off"
                  className="min-w-[12rem] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Search
                </button>
              </form>
              <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
                <Link
                  href={newPlaylistHref}
                  className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  New playlist
                </Link>
                <Suspense
                  fallback={
                    <span className="text-sm text-zinc-400 dark:text-zinc-500">…</span>
                  }
                >
                  <ShowOthersPlaylistsCheckbox />
                </Suspense>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
              <PlaylistsTable
                sectionTitle="Your playlists"
                secondaryColumn="description"
                playlists={minePlaylists}
                emptyMessageNoSearch="No playlists found. Seed the database to see data here."
                emptyMessageWithSearch="No playlists match your search."
                panelOpen={panelOpen}
                selectedPlaylistId={openPlaylistId}
                searchQuery={q}
                sortArrow={sortArrow}
                nameSortHref={pl({
                  page: pageForSort("name"),
                  sort: "name",
                  order: nextOrder("name"),
                  playlistId: openPlaylistId,
                  newPlaylist: showNewPlaylist,
                  editPlaylist: showEditPlaylist,
                })}
                lastPublishedSortHref={pl({
                  page: pageForSort("lastSpotifyPublishAt"),
                  sort: "lastSpotifyPublishAt",
                  order: nextOrder("lastSpotifyPublishAt"),
                  playlistId: openPlaylistId,
                  newPlaylist: showNewPlaylist,
                  editPlaylist: showEditPlaylist,
                })}
                getRowHref={(playlistId) =>
                  pl({
                    playlistId,
                    editPlaylist: showEditPlaylist,
                  })
                }
              />

              {totalPages > 1 && (
                <nav className="flex shrink-0 items-center justify-between gap-4 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Page {page} of {totalPages} · {total.toLocaleString()} playlists
                  </span>
                  <div className="flex gap-2">
                    {hasPrev && (
                      <Link
                        href={pl({
                          page: page - 1,
                          playlistId: openPlaylistId,
                          newPlaylist: showNewPlaylist,
                          editPlaylist: showEditPlaylist,
                        })}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Previous
                      </Link>
                    )}
                    {hasNext && (
                      <Link
                        href={pl({
                          page: page + 1,
                          playlistId: openPlaylistId,
                          newPlaylist: showNewPlaylist,
                          editPlaylist: showEditPlaylist,
                        })}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                </nav>
              )}
            </div>

            {showOthersPlaylists ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <PlaylistsTable
                  sectionTitle="Created by others"
                  supplementalNote={
                    othersTotal > PLAYLISTS_PER_PAGE
                      ? `Showing the first ${PLAYLISTS_PER_PAGE.toLocaleString()} of ${othersTotal.toLocaleString()}. Refine search to narrow the list.`
                      : undefined
                  }
                  secondaryColumn="user"
                  playlists={othersRows}
                  emptyMessageNoSearch="No playlists from other users."
                  emptyMessageWithSearch="No other users' playlists match your search."
                  panelOpen={panelOpen}
                  selectedPlaylistId={openPlaylistId}
                  searchQuery={q}
                  sortArrow={sortArrow}
                  nameSortHref={pl({
                    page: pageForSort("name"),
                    sort: "name",
                    order: nextOrder("name"),
                    playlistId: openPlaylistId,
                    newPlaylist: showNewPlaylist,
                    editPlaylist: showEditPlaylist,
                  })}
                  lastPublishedSortHref={pl({
                    page: pageForSort("lastSpotifyPublishAt"),
                    sort: "lastSpotifyPublishAt",
                    order: nextOrder("lastSpotifyPublishAt"),
                    playlistId: openPlaylistId,
                    newPlaylist: showNewPlaylist,
                    editPlaylist: showEditPlaylist,
                  })}
                  getRowHref={(playlistId) =>
                    pl({
                      playlistId,
                    })
                  }
                />
              </div>
            ) : null}
          </div>

          {selectedPlaylist && showEditPlaylist ? (
            <PlaylistSidebarEdit
              playlistId={selectedPlaylist.id.toString()}
              defaultName={selectedPlaylist.name}
              defaultDescription={selectedPlaylist.description}
              defaultArtists={editDefaultArtists}
              defaultArtistAlgorithm={selectedPlaylist.artistAlgorithm}
              defaultGenres={selectedPlaylist.genres}
              defaultMaxFollowers={selectedPlaylist.maxFollowers}
              defaultSize={selectedPlaylist.size}
              cancelHref={playlistViewHref}
              savePlaylistDetailsAction={savePlaylistDetails}
              saveReturnTo={playlistViewHref}
              saveFlash={saveFlash}
            />
          ) : selectedPlaylist && selectedIsOwned ? (
            <PlaylistSidebar
              playlist={selectedPlaylist}
              closeHref={closePlaylistHref}
              editHref={playlistEditHref}
              deletePlaylistAction={deletePlaylist}
              deleteReturnToHref={closePlaylistHref}
              generatePlaylistAction={generatePlaylistFromCriteria}
              generatePlaylistReturnToHref={playlistPanelReturnToHref}
              publishPlaylistAction={publishPlaylistToSpotify}
              hasLinkedSpotify={hasLinkedSpotify}
              publishFlash={
                publishOk
                  ? { kind: "ok" }
                  : publishErr
                    ? { kind: "error", message: publishErr }
                    : null
              }
              artistsHrefContext={artistsHrefContext}
            />
          ) : selectedPlaylist ? (
            <PlaylistSidebar
              readOnly
              ownerUsername={selectedPlaylist.user.username}
              playlist={selectedPlaylist}
              closeHref={closePlaylistHref}
              artistsHrefContext={artistsHrefContext}
            />
          ) : showNewPlaylist ? (
            <PlaylistSidebarNew
              closeHref={closePlaylistHref}
              savePlaylistDetailsAction={savePlaylistDetails}
              saveReturnTo={newPlaylistSaveReturnTo}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
