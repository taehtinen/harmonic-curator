import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, userIsAdmin } from "@/lib/auth";
import ArtistsTable, { type ArtistListRow } from "@/components/artists-table";
import ArtistSidebar from "@/components/artist-sidebar";
import {
  buildArtistsUrl,
  type ArtistsListOrder,
  type ArtistsListSort,
} from "@/lib/artists-url";

const ARTISTS_PER_PAGE = 100;

type SortColumn = ArtistsListSort;
type SortOrder = ArtistsListOrder;

const SORT_COLUMNS: SortColumn[] = [
  "name",
  "spotifyId",
  "popularity",
  "followers",
  "tracks",
  "latestRelease",
];

function escapeLikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function artistListOrderBy(
  sort: Exclude<SortColumn, "latestRelease">,
  order: SortOrder,
): Prisma.ArtistOrderByWithRelationInput {
  switch (sort) {
    case "name":
      return { name: order };
    case "spotifyId":
      return { spotifyId: order };
    case "popularity":
      return { popularity: order };
    case "followers":
      return { followers: order };
    case "tracks":
      return { tracks: { _count: order } };
  }
}

function parseSort(sortParam: string | undefined): SortColumn {
  if (sortParam && SORT_COLUMNS.includes(sortParam as SortColumn))
    return sortParam as SortColumn;
  return "latestRelease";
}

function parseOrder(orderParam: string | undefined): SortOrder {
  if (orderParam === "asc" || orderParam === "desc") return orderParam;
  return "desc";
}

function parseNoGenresFilter(param: string | undefined): boolean {
  return param === "1" || param === "on" || param === "true";
}

export default async function Artists({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    artist?: string;
    q?: string;
    noGenres?: string;
  }>;
}) {
  const {
    page: pageParam,
    sort: sortParam,
    order: orderParam,
    artist: artistParam,
    q: qParam,
    noGenres: noGenresParam,
  } = await searchParams;
  const q = (qParam ?? "").trim();
  const noGenres = parseNoGenresFilter(noGenresParam);
  const sort = parseSort(sortParam);
  const order = parseOrder(orderParam);
  const rawPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const currentUser = await getCurrentUser();
  const canIgnoreArtists = userIsAdmin(currentUser);

  const listWhere = {
    isIgnored: false as const,
    ...(q
      ? {
          name: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(noGenres ? { genres: { equals: [] as string[] } } : {}),
  };

  const total = await prisma.artist.count({ where: listWhere });
  const totalPages = Math.ceil(total / ARTISTS_PER_PAGE);
  const page = Math.min(rawPage, Math.max(1, totalPages));
  const skip = (page - 1) * ARTISTS_PER_PAGE;
  const listInclude = {
    _count: { select: { tracks: true } },
    albums: {
      orderBy: { releaseDate: "desc" as const },
      take: 1,
      select: { releaseDate: true },
    },
  } satisfies Prisma.ArtistInclude;

  let artists: ArtistListRow[];

  if (sort === "latestRelease") {
    const orderSql =
      order === "asc"
        ? Prisma.raw("ASC NULLS FIRST")
        : Prisma.raw("DESC NULLS LAST");
    const searchSql =
      q.length > 0
        ? Prisma.sql`AND a.name ILIKE ${`%${escapeLikePattern(q)}%`} ESCAPE '\\'`
        : Prisma.empty;
    const noGenresSql = noGenres
      ? Prisma.sql`AND cardinality(a.genres) = 0`
      : Prisma.empty;

    const idRows = await prisma.$queryRaw<{ id: bigint }[]>`
      SELECT a.id
      FROM artist a
      LEFT JOIN LATERAL (
        SELECT MAX(al."releaseDate") AS max_rd
        FROM album al
        WHERE al."artistId" = a.id
      ) al ON true
      WHERE a."isIgnored" = false
      ${searchSql}
      ${noGenresSql}
      ORDER BY al.max_rd ${orderSql}, a.id ASC
      LIMIT ${ARTISTS_PER_PAGE}
      OFFSET ${skip}
    `;

    const ids = idRows.map((r) => r.id);
    const fetched =
      ids.length > 0
        ? await prisma.artist.findMany({
            where: { id: { in: ids } },
            include: listInclude,
          })
        : [];
    const rank = new Map(ids.map((id, i) => [id.toString(), i]));
    artists = [...fetched].sort(
      (a, b) => (rank.get(a.id.toString()) ?? 0) - (rank.get(b.id.toString()) ?? 0),
    );
  } else {
    artists = await prisma.artist.findMany({
      where: listWhere,
      orderBy: artistListOrderBy(sort, order),
      take: ARTISTS_PER_PAGE,
      skip,
      include: listInclude,
    });
  }
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function nextOrder(col: SortColumn): SortOrder {
    if (col === sort) return order === "asc" ? "desc" : "asc";
    return col === "name" || col === "spotifyId" ? "asc" : "desc";
  }

  /** Use page 1 when changing sort column, else keep current page */
  function pageForSort(col: SortColumn) {
    return col === sort ? page : 1;
  }

  const sortArrow = (col: SortColumn) =>
    sort === col ? (
      <span className="tabular-nums">{order === "asc" ? "↑" : "↓"}</span>
    ) : null;

  const selectedArtistIdParam =
    artistParam && /^\d+$/.test(artistParam) ? BigInt(artistParam) : null;
  const selectedArtistBase = selectedArtistIdParam
    ? await prisma.artist.findFirst({
        where: { id: selectedArtistIdParam, isIgnored: false },
        include: {
          tracks: {
            include: {
              album: true,
              trackArtists: { include: { artist: true } },
            },
            orderBy: [{ album: { releaseDate: "desc" } }, { trackNumber: "asc" }],
          },
          albums: {
            include: { _count: { select: { tracks: true } } },
            orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
          },
        },
      })
    : null;

  const featTracks = selectedArtistBase
    ? await prisma.track.findMany({
        where: {
          artistId: { not: selectedArtistBase.id },
          trackArtists: { some: { artistId: selectedArtistBase.id } },
        },
        include: {
          album: true,
          artist: true,
          trackArtists: { include: { artist: true } },
        },
        orderBy: [{ album: { releaseDate: "desc" } }, { trackNumber: "asc" }],
      })
    : [];

  const selectedArtistWithTracks = selectedArtistBase
    ? { ...selectedArtistBase, featTracks }
    : null;
  const panelOpen = Boolean(selectedArtistWithTracks);
  const openArtistId = selectedArtistWithTracks?.id.toString();
  const closeArtistHref = buildArtistsUrl({ page, sort, order, q, noGenres });

  async function ignoreArtist(formData: FormData) {
    "use server";

    const user = await getCurrentUser();
    if (!userIsAdmin(user)) {
      throw new Error("Only admins can ignore artists.");
    }

    const artistIdValue = formData.get("artistId");
    const returnToValue = formData.get("returnTo");
    if (typeof artistIdValue !== "string" || typeof returnToValue !== "string") {
      throw new Error("Invalid ignore request payload.");
    }

    await prisma.artist.update({
      where: { id: BigInt(artistIdValue) },
      data: { isIgnored: true },
    });

    redirect(returnToValue);
  }

  async function addArtistGenre(formData: FormData) {
    "use server";

    const user = await getCurrentUser();
    if (!userIsAdmin(user)) {
      throw new Error("Only admins can add genres.");
    }

    const artistIdValue = formData.get("artistId");
    const genreValue = formData.get("genre");
    const returnToValue = formData.get("returnTo");
    if (
      typeof artistIdValue !== "string" ||
      typeof genreValue !== "string" ||
      typeof returnToValue !== "string"
    ) {
      throw new Error("Invalid add genre request payload.");
    }

    const normalized = genreValue.trim().toLowerCase();
    if (!normalized) {
      throw new Error("Genre cannot be empty.");
    }

    const artistRecord = await prisma.artist.findUnique({
      where: { id: BigInt(artistIdValue) },
    });
    if (!artistRecord) {
      throw new Error("Artist not found.");
    }

    if (artistRecord.genres.some((g) => g.toLowerCase() === normalized)) {
      throw new Error("Genre already exists for this artist.");
    }

    await prisma.artist.update({
      where: { id: BigInt(artistIdValue) },
      data: { genres: [...artistRecord.genres, normalized] },
    });

    redirect(returnToValue);
  }

  async function removeArtistGenre(formData: FormData) {
    "use server";

    const user = await getCurrentUser();
    if (!userIsAdmin(user)) {
      throw new Error("Only admins can remove genres.");
    }

    const artistIdValue = formData.get("artistId");
    const genreValue = formData.get("genre");
    const returnToValue = formData.get("returnTo");
    if (
      typeof artistIdValue !== "string" ||
      typeof genreValue !== "string" ||
      typeof returnToValue !== "string"
    ) {
      throw new Error("Invalid remove genre request payload.");
    }

    const artistRecord = await prisma.artist.findUnique({
      where: { id: BigInt(artistIdValue) },
    });
    if (!artistRecord) {
      throw new Error("Artist not found.");
    }

    const normalizedRemove = genreValue.trim().toLowerCase();
    if (!normalizedRemove) {
      throw new Error("Genre cannot be empty.");
    }

    const nextGenres = artistRecord.genres.filter(
      (g) => g.toLowerCase() !== normalizedRemove,
    );
    if (nextGenres.length === artistRecord.genres.length) {
      throw new Error("Genre not found for this artist.");
    }

    await prisma.artist.update({
      where: { id: BigInt(artistIdValue) },
      data: { genres: nextGenres },
    });

    redirect(returnToValue);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-hidden bg-white px-6 py-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
            <ArtistsTable
              artists={artists}
              panelOpen={panelOpen}
              selectedArtistId={openArtistId}
              sort={sort}
              order={order}
              searchQuery={q}
              noGenresFilter={noGenres}
              clearSearchHref={buildArtistsUrl({
                page: 1,
                sort,
                order,
                artistId: openArtistId,
                noGenres,
              })}
              sortArrow={sortArrow}
              nameSortHref={buildArtistsUrl({
                page: pageForSort("name"),
                sort: "name",
                order: nextOrder("name"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              spotifySortHref={buildArtistsUrl({
                page: pageForSort("spotifyId"),
                sort: "spotifyId",
                order: nextOrder("spotifyId"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              popularitySortHref={buildArtistsUrl({
                page: pageForSort("popularity"),
                sort: "popularity",
                order: nextOrder("popularity"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              followersSortHref={buildArtistsUrl({
                page: pageForSort("followers"),
                sort: "followers",
                order: nextOrder("followers"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              tracksSortHref={buildArtistsUrl({
                page: pageForSort("tracks"),
                sort: "tracks",
                order: nextOrder("tracks"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              latestReleaseSortHref={buildArtistsUrl({
                page: pageForSort("latestRelease"),
                sort: "latestRelease",
                order: nextOrder("latestRelease"),
                artistId: openArtistId,
                q,
                noGenres,
              })}
              getRowHref={(artistId) =>
                buildArtistsUrl({
                  page,
                  sort,
                  order,
                  artistId,
                  q,
                  noGenres,
                })
              }
              canAddArtist={canIgnoreArtists}
              addArtistUrlContext={{ page, sort, order, q, noGenres }}
            />

            {totalPages > 1 && (
              <nav className="flex shrink-0 items-center justify-between gap-4 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Page {page} of {totalPages} · {total.toLocaleString()} artists
                </span>
                <div className="flex gap-2">
                  {hasPrev && (
                    <Link
                      href={buildArtistsUrl({
                        page: page - 1,
                        sort,
                        order,
                        artistId: openArtistId,
                        q,
                        noGenres,
                      })}
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Previous
                    </Link>
                  )}
                  {hasNext && (
                    <Link
                      href={buildArtistsUrl({
                        page: page + 1,
                        sort,
                        order,
                        artistId: openArtistId,
                        q,
                        noGenres,
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

          {selectedArtistWithTracks && (
            <ArtistSidebar
              artist={selectedArtistWithTracks}
              closeHref={closeArtistHref}
              canIgnore={canIgnoreArtists}
              ignoreAction={ignoreArtist}
              returnToHref={closeArtistHref}
              canAddGenre={canIgnoreArtists}
              addGenreAction={addArtistGenre}
              removeGenreAction={removeArtistGenre}
              addGenreReturnToHref={buildArtistsUrl({
                page,
                sort,
                order,
                artistId: selectedArtistWithTracks.id.toString(),
                q,
                noGenres,
              })}
              artistsHrefContext={{ page, sort, order, q, noGenres }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
