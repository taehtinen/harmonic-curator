import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ARTISTS_PER_PAGE = 100;

type SortColumn = "name" | "spotifyId" | "popularity" | "followers";
type SortOrder = "asc" | "desc";

const SORT_COLUMNS: SortColumn[] = ["name", "spotifyId", "popularity", "followers"];

function parseSort(sortParam: string | undefined): SortColumn {
  if (sortParam && SORT_COLUMNS.includes(sortParam as SortColumn))
    return sortParam as SortColumn;
  return "popularity";
}

function parseOrder(orderParam: string | undefined): SortOrder {
  if (orderParam === "asc" || orderParam === "desc") return orderParam;
  return "desc";
}

function buildSortUrl(params: { page: number; sort: SortColumn; order: SortOrder }) {
  const { page, sort, order } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Artists({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; order?: string }>;
}) {
  const { page: pageParam, sort: sortParam, order: orderParam } =
    await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const sort = parseSort(sortParam);
  const order = parseOrder(orderParam);
  const skip = (page - 1) * ARTISTS_PER_PAGE;

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      orderBy: { [sort]: order },
      take: ARTISTS_PER_PAGE,
      skip,
    }),
    prisma.artist.count(),
  ]);

  const totalPages = Math.ceil(total / ARTISTS_PER_PAGE);
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 overflow-hidden py-4 px-6 bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="flex shrink-0 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Artists</h1>
        </header>

        <section className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                <th className="px-4 py-3">
                  <Link
                    href={buildSortUrl({
                      page: pageForSort("name"),
                      sort: "name",
                      order: nextOrder("name"),
                    })}
                    className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <span>Name</span>
                    {sortArrow("name")}
                  </Link>
                </th>
                <th className="px-4 py-3">
                  <Link
                    href={buildSortUrl({
                      page: pageForSort("spotifyId"),
                      sort: "spotifyId",
                      order: nextOrder("spotifyId"),
                    })}
                    className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <span>Spotify ID</span>
                    {sortArrow("spotifyId")}
                  </Link>
                </th>
                <th className="px-4 py-3">Genres</th>
                <th className="px-4 py-3 text-right">
                  <Link
                    href={buildSortUrl({
                      page: pageForSort("popularity"),
                      sort: "popularity",
                      order: nextOrder("popularity"),
                    })}
                    className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <span>Popularity</span>
                    {sortArrow("popularity")}
                  </Link>
                </th>
                <th className="px-4 py-3 text-right">
                  <Link
                    href={buildSortUrl({
                      page: pageForSort("followers"),
                      sort: "followers",
                      order: nextOrder("followers"),
                    })}
                    className="flex w-full cursor-pointer select-none items-center justify-between gap-2 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <span>Followers</span>
                    {sortArrow("followers")}
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody>
              {artists.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    No artists found. Seed the database to see data here.
                  </td>
                </tr>
              ) : (
                artists.map((artist: (typeof artists)[number]) => (
                  <tr
                    key={artist.id.toString()}
                    className="border-b border-zinc-100/80 last:border-0 hover:bg-zinc-100/60 dark:border-zinc-800/80 dark:hover:bg-zinc-900"
                  >
                    <td className="max-w-xs truncate px-4 py-3 font-medium">
                      {artist.name}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {artist.spotifyId}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {artist.genres.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {artist.popularity}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {artist.followers.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {totalPages > 1 && (
          <nav className="flex shrink-0 items-center justify-between gap-4 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">
              Page {page} of {totalPages} · {total.toLocaleString()} artists
            </span>
            <div className="flex gap-2">
              {hasPrev && (
                <Link
                  href={buildSortUrl({
                    page: page - 1,
                    sort,
                    order,
                  })}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Previous
                </Link>
              )}
              {hasNext && (
                <Link
                  href={buildSortUrl({
                    page: page + 1,
                    sort,
                    order,
                  })}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Next
                </Link>
              )}
            </div>
          </nav>
        )}
      </main>
    </div>
  );
}
