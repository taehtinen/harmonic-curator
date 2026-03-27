import Link from "next/link";
import type { Artist } from "@prisma/client";

export default function ArtistSidebar({
  artist,
  closeHref,
}: {
  artist: Artist;
  closeHref: string;
}) {
  return (
    <aside className="min-h-0 flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{artist.name}</h2>
        <Link
          href={closeHref}
          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Close
        </Link>
      </div>

      <dl className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-sm">
        <dt className="text-zinc-500 dark:text-zinc-400">Spotify ID</dt>
        <dd className="font-mono text-xs">{artist.spotifyId}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Popularity</dt>
        <dd>{artist.popularity}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Followers</dt>
        <dd>{artist.followers.toLocaleString()}</dd>

        <dt className="text-zinc-500 dark:text-zinc-400">Genres</dt>
        <dd>{artist.genres.length > 0 ? artist.genres.join(", ") : "No genres listed"}</dd>
      </dl>
    </aside>
  );
}
