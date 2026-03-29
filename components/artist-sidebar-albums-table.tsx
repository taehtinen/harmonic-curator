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
              <td className="max-w-[16rem] truncate px-3 py-2 font-medium">{album.name}</td>
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
