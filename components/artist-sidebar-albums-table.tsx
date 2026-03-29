import SpotifyIcon from "@/components/spotify-icon";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

export default function ArtistSidebarAlbumsTable({
  albums,
}: {
  albums: ArtistWithSidebarData["albums"];
}) {
  return (
    <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
      <thead className="bg-zinc-100/80 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th scope="col" className="px-3 py-2">
            Album
          </th>
          <th scope="col" className="px-3 py-2">
            Release
          </th>
          <th scope="col" className="px-3 py-2 text-right">
            Tracks
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {albums.length > 0 ? (
          albums.map((album) => (
            <tr key={album.id.toString()}>
              <td className="max-w-[16rem] px-3 py-2">
                <a
                  href={`https://open.spotify.com/album/${album.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open “${album.name}” on Spotify`}
                  className="inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-zinc-900 underline-offset-2 hover:text-blue-600 hover:underline dark:text-zinc-50 dark:hover:text-blue-400"
                >
                  <span className="truncate">{album.name}</span>
                  <SpotifyIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                </a>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {album.releaseDate}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{album._count.tracks}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400">
              No albums available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
