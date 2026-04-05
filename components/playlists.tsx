import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, userIsAdmin } from "@/lib/auth";
import { replacePlaylistTracksFromDbCriteria } from "@/lib/playlist-generate-from-criteria";
import { publishPlaylistTracksForUser } from "@/lib/spotify-playlist-publish";
import PlaylistSidebar from "@/components/playlist-sidebar";
import PlaylistSidebarEdit from "@/components/playlist-sidebar-edit";
import PlaylistSidebarNew from "@/components/playlist-sidebar-new";
import PlaylistsTable from "@/components/playlists-table";
import {
  buildPlaylistsUrl,
  withPlaylistParam,
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

export default async function Playlists({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    q?: string;
    playlist?: string;
    new?: string;
    edit?: string;
    publish?: string;
    publish_err?: string;
  }>;
}) {
  const {
    page: pageParam,
    sort: sortParam,
    order: orderParam,
    q: qParam,
    playlist: playlistParam,
    new: newParam,
    edit: editParam,
    publish: publishParam,
    publish_err: publishErrParam,
  } = await searchParams;
  const q = (qParam ?? "").trim();
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

  const listWhere = {
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

  const total = await prisma.playlist.count({ where: listWhere });
  const totalPages = Math.ceil(total / PLAYLISTS_PER_PAGE);
  const page = Math.min(rawPage, Math.max(1, totalPages));
  const skip = (page - 1) * PLAYLISTS_PER_PAGE;
  const playlists = await prisma.playlist.findMany({
    where: listWhere,
    orderBy: { [sort]: order },
    take: PLAYLISTS_PER_PAGE,
    skip,
  });
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

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
        where: { id: selectedPlaylistIdParam, userId: ownerUserId },
        include: {
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

  const showNewPlaylist = newParam === "1" && !selectedPlaylist;
  const showEditPlaylist = editParam === "1" && Boolean(selectedPlaylist);
  const panelOpen = Boolean(selectedPlaylist) || showNewPlaylist;
  const openPlaylistId = selectedPlaylist?.id.toString();
  const closePlaylistHref = buildPlaylistsUrl({ page, sort, order, q });
  const newPlaylistHref = buildPlaylistsUrl({
    page,
    sort,
    order,
    q,
    newPlaylist: true,
  });
  const playlistViewHref = openPlaylistId
    ? buildPlaylistsUrl({ page, sort, order, playlistId: openPlaylistId, q })
    : closePlaylistHref;
  const playlistEditHref = openPlaylistId
    ? buildPlaylistsUrl({
        page,
        sort,
        order,
        playlistId: openPlaylistId,
        q,
        editPlaylist: true,
      })
    : closePlaylistHref;
  const playlistPanelReturnToHref = playlistViewHref;
  const newPlaylistSaveReturnTo = buildPlaylistsUrl({ page, sort, order, q });

  const artistsHrefContext: ArtistsHrefContext = {
    page: 1,
    sort: "popularity",
    order: "desc",
    q: "",
  };

  const editDefaultArtists =
    selectedPlaylist && showEditPlaylist
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
    const maxFollowers =
      artistIds.length > 0 ? null : parseMaxFollowersFromForm(maxFollowersRaw);

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
          maxFollowers,
          artistIds,
          ...(artistIds.length > 0 ? { genres: [] } : {}),
        },
      });
      redirect(returnToValue);
    } else {
      const created = await prisma.playlist.create({
        data: {
          userId,
          spotifyId: null,
          name,
          description,
          genres: [],
          artistIds,
          maxFollowers,
          size: 0,
        },
        select: { id: true },
      });
      redirect(withPlaylistParam(returnToValue, created.id.toString()));
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-hidden bg-white px-6 py-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">Playlists</h1>
        </header>
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            <PlaylistsTable
              playlists={playlists}
              panelOpen={panelOpen}
              selectedPlaylistId={openPlaylistId}
              preserveNewPlaylist={showNewPlaylist}
              preserveEditPlaylist={showEditPlaylist}
              newPlaylistHref={newPlaylistHref}
              sort={sort}
              order={order}
              searchQuery={q}
              clearSearchHref={buildPlaylistsUrl({
                page: 1,
                sort,
                order,
                playlistId: openPlaylistId,
                q,
                newPlaylist: showNewPlaylist,
                editPlaylist: showEditPlaylist,
              })}
              sortArrow={sortArrow}
              nameSortHref={buildPlaylistsUrl({
                page: pageForSort("name"),
                sort: "name",
                order: nextOrder("name"),
                playlistId: openPlaylistId,
                q,
                newPlaylist: showNewPlaylist,
                editPlaylist: showEditPlaylist,
              })}
              lastPublishedSortHref={buildPlaylistsUrl({
                page: pageForSort("lastSpotifyPublishAt"),
                sort: "lastSpotifyPublishAt",
                order: nextOrder("lastSpotifyPublishAt"),
                playlistId: openPlaylistId,
                q,
                newPlaylist: showNewPlaylist,
                editPlaylist: showEditPlaylist,
              })}
              getRowHref={(playlistId) =>
                buildPlaylistsUrl({
                  page,
                  sort,
                  order,
                  playlistId,
                  q,
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
                      href={buildPlaylistsUrl({
                        page: page - 1,
                        sort,
                        order,
                        playlistId: openPlaylistId,
                        q,
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
                      href={buildPlaylistsUrl({
                        page: page + 1,
                        sort,
                        order,
                        playlistId: openPlaylistId,
                        q,
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

          {selectedPlaylist && showEditPlaylist ? (
            <PlaylistSidebarEdit
              playlistId={selectedPlaylist.id.toString()}
              defaultName={selectedPlaylist.name}
              defaultDescription={selectedPlaylist.description}
              defaultArtists={editDefaultArtists}
              defaultMaxFollowers={selectedPlaylist.maxFollowers}
              cancelHref={playlistViewHref}
              savePlaylistDetailsAction={savePlaylistDetails}
              saveReturnTo={playlistViewHref}
            />
          ) : selectedPlaylist ? (
            <PlaylistSidebar
              playlist={selectedPlaylist}
              closeHref={closePlaylistHref}
              editHref={playlistEditHref}
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
