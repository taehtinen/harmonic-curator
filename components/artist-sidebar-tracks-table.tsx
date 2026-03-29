import Link from "next/link";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";
import { buildArtistsUrl, type ArtistsHrefContext } from "@/lib/artists-url";

type TrackRow = ArtistWithSidebarData["tracks"][number];

function collaboratorArtists(track: TrackRow): Array<{ id: bigint; name: string }> {
  const byId = new Map<string, { id: bigint; name: string }>();
  for (const ta of track.trackArtists) {
    if (ta.artist.id === track.artistId) continue;
    byId.set(ta.artist.id.toString(), { id: ta.artist.id, name: ta.artist.name });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export default function ArtistSidebarTracksTable({
  tracks,
  artistsHrefContext,
}: {
  tracks: ArtistWithSidebarData["tracks"];
  artistsHrefContext: ArtistsHrefContext;
}) {
  return (
    <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
      <thead className="bg-zinc-100/80 text-left text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <tr>
          <th scope="col" className="px-3 py-2">
            Track
          </th>
          <th scope="col" className="px-3 py-2">
            Album
          </th>
          <th scope="col" className="px-3 py-2">
            Release
          </th>
          <th scope="col" className="px-3 py-2 text-right">
            Popularity
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {tracks.length > 0 ? (
          tracks.map((track) => {
            const feats = collaboratorArtists(track);
            return (
            <tr key={track.id.toString()}>
              <td className="max-w-[16rem] px-3 py-2">
                <div className="truncate font-medium">{track.name}</div>
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
              </td>
              <td className="max-w-[14rem] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {track.album.name}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-zinc-600 dark:text-zinc-400">
                {track.album.releaseDate}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{track.popularity}</td>
            </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={4} className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400">
              No tracks available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
