import Link from "next/link";
import SpotifyIcon from "@/components/spotify-icon";
import type { PlaylistSidebarTrackRow } from "@/components/playlist-sidebar-types";
import { buildArtistsUrl, type ArtistsHrefContext } from "@/lib/artists-url";

function collaboratorArtists(track: PlaylistSidebarTrackRow["track"]): Array<{ id: bigint; name: string }> {
  const byId = new Map<string, { id: bigint; name: string }>();
  for (const ta of track.trackArtists) {
    if (ta.artist.id === track.artistId) continue;
    byId.set(ta.artist.id.toString(), { id: ta.artist.id, name: ta.artist.name });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function PlaylistSidebarTracksTable({
  rows,
  artistsHrefContext,
  emptyMessage = "No tracks in this playlist yet.",
}: {
  rows: PlaylistSidebarTrackRow[];
  artistsHrefContext: ArtistsHrefContext;
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
              Artist
            </th>
            <th scope="col" className="px-3 py-2">
              Track
            </th>
            <th scope="col" className="px-3 py-2">
              Release date
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
              const feats = collaboratorArtists(t);
              return (
                <tr key={row.id.toString()}>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                    {row.position}
                  </td>
                  <td className="max-w-[12rem] px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    <div className="min-w-0">
                      <Link
                        href={buildArtistsUrl({
                          ...artistsHrefContext,
                          artistId: t.artist.id.toString(),
                        })}
                        className="font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-100 dark:hover:text-blue-400"
                      >
                        {t.artist.name}
                      </Link>
                      {feats.length > 0 ? (
                        <div className="mt-0.5 min-w-0 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          <span className="whitespace-nowrap">feat. </span>
                          {feats.map((a, i) => (
                            <span key={a.id.toString()}>
                              {i > 0 ? ", " : null}
                              <Link
                                href={buildArtistsUrl({
                                  ...artistsHrefContext,
                                  artistId: a.id.toString(),
                                })}
                                className="text-zinc-700 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                              >
                                {a.name}
                              </Link>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="max-w-[12rem] px-3 py-2">
                    <a
                      href={`https://open.spotify.com/track/${t.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open “${t.name}” on Spotify`}
                      className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-50 dark:hover:text-blue-400"
                    >
                      <span className="truncate">{t.name}</span>
                      <SpotifyIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                    </a>
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                    {t.album.releaseDate}
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
