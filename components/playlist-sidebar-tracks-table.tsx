import type { PlaylistSidebarTrackRow } from "@/components/playlist-sidebar-types";

export default function PlaylistSidebarTracksTable({
  rows,
  emptyMessage = "No tracks in this playlist yet.",
}: {
  rows: PlaylistSidebarTrackRow[];
  emptyMessage?: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <thead className="sticky top-0 z-[1] bg-zinc-100/90 text-left text-xs uppercase tracking-wide text-zinc-500 backdrop-blur-sm dark:bg-zinc-900/90 dark:text-zinc-400">
          <tr>
            <th scope="col" className="w-10 px-3 py-2 text-right tabular-nums">
              #
            </th>
            <th scope="col" className="px-3 py-2">
              Track
            </th>
            <th scope="col" className="px-3 py-2">
              Artist
            </th>
            <th scope="col" className="px-3 py-2">
              Album
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Pop.
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {rows.length > 0 ? (
            rows.map((row) => {
              const t = row.track;
              return (
                <tr key={row.id.toString()}>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                    {row.position}
                  </td>
                  <td className="max-w-[12rem] px-3 py-2">
                    <a
                      href={`https://open.spotify.com/track/${t.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-50 dark:hover:text-blue-400"
                    >
                      {t.name}
                    </a>
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {t.artist.name}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {t.album.name}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {t.popularity}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
