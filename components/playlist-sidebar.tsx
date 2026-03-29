import PlaylistSidebarDetails from "@/components/playlist-sidebar-details";
import type { Playlist } from "@prisma/client";

export default function PlaylistSidebar({
  playlist,
  closeHref,
}: {
  playlist: Playlist;
  closeHref: string;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <PlaylistSidebarDetails playlist={playlist} closeHref={closeHref} />
    </aside>
  );
}
