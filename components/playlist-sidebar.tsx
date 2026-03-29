import PlaylistSidebarDetails from "@/components/playlist-sidebar-details";
import PlaylistSidebarTracksTable from "@/components/playlist-sidebar-tracks-table";
import type { PlaylistWithSidebarTracks } from "@/components/playlist-sidebar-types";

export default function PlaylistSidebar({
  playlist,
  closeHref,
}: {
  playlist: PlaylistWithSidebarTracks;
  closeHref: string;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <PlaylistSidebarDetails playlist={playlist} closeHref={closeHref} />
      <section className="flex min-h-0 flex-1 flex-col border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="shrink-0 px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tracks
        </h3>
        <div className="flex min-h-0 flex-1 flex-col px-2 pb-4 pt-2">
          <PlaylistSidebarTracksTable rows={playlist.playlistTracks} />
        </div>
      </section>
    </aside>
  );
}
