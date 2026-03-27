import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ArtistsTable from "@/components/artists-table";
import ArtistSidebar from "@/components/artist-sidebar";

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

function buildArtistsUrl(params: {
  page: number;
  sort: SortColumn;
  order: SortOrder;
  artistId?: string;
}) {
  const { page, sort, order, artistId } = params;
  const sp = new URLSearchParams();
  sp.set("sort", sort);
  sp.set("order", order);
  if (page > 1) sp.set("page", String(page));
  if (artistId) sp.set("artist", artistId);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export default async function Artists({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    artist?: string;
  }>;
}) {
  const { page: pageParam, sort: sortParam, order: orderParam, artist: artistParam } =
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

  const selectedArtist = artistParam
    ? artists.find((artist) => artist.id.toString() === artistParam)
    : null;
  const panelOpen = Boolean(selectedArtist);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-hidden bg-white px-6 py-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="flex shrink-0 flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Artists</h1>
        </header>

        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <ArtistsTable
            artists={artists}
            panelOpen={panelOpen}
            selectedArtistId={selectedArtist?.id.toString()}
            sortArrow={sortArrow}
            nameSortHref={buildArtistsUrl({
              page: pageForSort("name"),
              sort: "name",
              order: nextOrder("name"),
              artistId: selectedArtist?.id.toString(),
            })}
            spotifySortHref={buildArtistsUrl({
              page: pageForSort("spotifyId"),
              sort: "spotifyId",
              order: nextOrder("spotifyId"),
              artistId: selectedArtist?.id.toString(),
            })}
            popularitySortHref={buildArtistsUrl({
              page: pageForSort("popularity"),
              sort: "popularity",
              order: nextOrder("popularity"),
              artistId: selectedArtist?.id.toString(),
            })}
            followersSortHref={buildArtistsUrl({
              page: pageForSort("followers"),
              sort: "followers",
              order: nextOrder("followers"),
              artistId: selectedArtist?.id.toString(),
            })}
            getRowHref={(artistId) =>
              buildArtistsUrl({
                page,
                sort,
                order,
                artistId,
              })
            }
          />

          {selectedArtist && (
            <ArtistSidebar
              artist={selectedArtist}
              closeHref={buildArtistsUrl({ page, sort, order })}
            />
          )}
        </div>

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
                    artistId: selectedArtist?.id.toString(),
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
                    artistId: selectedArtist?.id.toString(),
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
