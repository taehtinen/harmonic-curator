import Link from "next/link";
import PlaylistDetailsForm from "@/components/playlist-details-form";

import type { PlaylistArtistTag } from "@/components/playlist-artist-picker";

export default function PlaylistSidebarEdit({
  playlistId,
  defaultName,
  defaultDescription,
  defaultArtists,
  defaultMaxFollowers,
  defaultSize,
  cancelHref,
  savePlaylistDetailsAction,
  saveReturnTo,
}: {
  playlistId: string;
  defaultName: string;
  defaultDescription: string;
  defaultArtists: PlaylistArtistTag[];
  defaultMaxFollowers: number | null;
  defaultSize: number;
  cancelHref: string;
  savePlaylistDetailsAction: (formData: FormData) => Promise<void>;
  saveReturnTo: string;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <section className="shrink-0 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="min-w-0 text-xl font-semibold tracking-tight">Edit playlist</h2>
          <Link
            href={cancelHref}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>

        <div className="mt-6">
          <PlaylistDetailsForm
            key={playlistId}
            action={savePlaylistDetailsAction}
            returnTo={saveReturnTo}
            playlistId={playlistId}
            defaultName={defaultName}
            defaultDescription={defaultDescription}
            defaultArtists={defaultArtists}
            defaultMaxFollowers={defaultMaxFollowers}
            defaultSize={defaultSize}
            submitLabel="Save changes"
            idPrefix="edit"
            aria-label="Edit playlist details"
          />
        </div>
      </section>
    </aside>
  );
}
