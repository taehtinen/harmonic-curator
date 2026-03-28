import ArtistSidebarDetails from "@/components/artist-sidebar-details";
import ArtistSidebarPanel from "@/components/artist-sidebar-panel";
import type { ArtistWithSidebarData } from "@/components/artist-sidebar-types";

export default function ArtistSidebar({
  artist,
  closeHref,
  canIgnore,
  ignoreAction,
  returnToHref,
  canAddGenre,
  addGenreAction,
  addGenreReturnToHref,
}: {
  artist: ArtistWithSidebarData;
  closeHref: string;
  canIgnore: boolean;
  ignoreAction: (formData: FormData) => Promise<void>;
  returnToHref: string;
  canAddGenre: boolean;
  addGenreAction: (formData: FormData) => Promise<void>;
  addGenreReturnToHref: string;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <ArtistSidebarDetails
        artist={artist}
        closeHref={closeHref}
        canIgnore={canIgnore}
        ignoreAction={ignoreAction}
        returnToHref={returnToHref}
        canAddGenre={canAddGenre}
        addGenreAction={addGenreAction}
        addGenreReturnToHref={addGenreReturnToHref}
      />
      <ArtistSidebarPanel artist={artist} />
    </aside>
  );
}
