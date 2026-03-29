import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PlaylistsTable from "@/components/playlists-table";

const PLAYLISTS_PER_PAGE = 100;

type SortColumn = "name" | "spotifyId" | "maxFollowers" | "size";
type SortOrder = "asc" | "desc";

const SORT_COLUMNS: SortColumn[] = ["name", "spotifyId", "maxFollowers", "size"];

function parseSort(sortParam: string | undefined): SortColumn {
  if (sortParam && SORT_COLUMNS.includes(sortParam as SortColumn))
    return sortParam as SortColumn;
  return "name";
}

function parseOrder(orderParam: string | undefined): SortOrder {
  if (orderParam === "asc" || orderParam === "desc") return orderParam;
  return "asc";
}

function buildPlaylistsUrl(params: {
  page: number;
  sort: SortColumn;
  order: SortOrder;
  q?: string;
}) {
  const { page, sort, order, q } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  const trimmedQ = q?.trim();
  if (trimmedQ) sp.set("q", trimmedQ);
  const qs = sp.toString();
  return qs ? `/playlists?${qs}` : "/playlists";
}

export default async function Playlists({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    q?: string;
  }>;
}) {
  const {
    page: pageParam,
    sort: sortParam,
    order: orderParam,
    q: qParam,
  } = await searchParams;
  const q = (qParam ?? "").trim();
  const sort = parseSort(sortParam);
  const order = parseOrder(orderParam);
  const rawPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const listWhere = q
    ? {
        name: {
          contains: q,
          mode: "insensitive" as const,
        },
      }
    : {};

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

  function nextOrder(col: SortColumn): SortOrder {
    if (col === sort) return order === "asc" ? "desc" : "asc";
    return col === "name" || col === "spotifyId" ? "asc" : "desc";
  }

  function pageForSort(col: SortColumn) {
    return col === sort ? page : 1;
  }

  const sortArrow = (col: SortColumn) =>
    sort === col ? (
      <span className="tabular-nums">{order === "asc" ? "↑" : "↓"}</span>
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-hidden bg-white px-6 py-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight">Playlists</h1>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <PlaylistsTable
            playlists={playlists}
            sort={sort}
            order={order}
            searchQuery={q}
            clearSearchHref={buildPlaylistsUrl({
              page: 1,
              sort,
              order,
            })}
            sortArrow={sortArrow}
            nameSortHref={buildPlaylistsUrl({
              page: pageForSort("name"),
              sort: "name",
              order: nextOrder("name"),
              q,
            })}
            spotifySortHref={buildPlaylistsUrl({
              page: pageForSort("spotifyId"),
              sort: "spotifyId",
              order: nextOrder("spotifyId"),
              q,
            })}
            maxFollowersSortHref={buildPlaylistsUrl({
              page: pageForSort("maxFollowers"),
              sort: "maxFollowers",
              order: nextOrder("maxFollowers"),
              q,
            })}
            sizeSortHref={buildPlaylistsUrl({
              page: pageForSort("size"),
              sort: "size",
              order: nextOrder("size"),
              q,
            })}
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
                      q,
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
                      q,
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
      </main>
    </div>
  );
}
