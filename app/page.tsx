
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const artists = await prisma.artist.findMany({
    orderBy: { popularity: "desc" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-5xl flex-col gap-8 py-16 px-6 bg-white text-zinc-900 dark:bg-black dark:text-zinc-50">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Artists</h1>
        </header>

        <section className="w-full overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100/70 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Spotify ID</th>
                <th className="px-4 py-3">Genres</th>
                <th className="px-4 py-3 text-right">Popularity</th>
                <th className="px-4 py-3 text-right">Followers</th>
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
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {artist.id.toString()}
                    </td>
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
      </main>
    </div>
  );
}
