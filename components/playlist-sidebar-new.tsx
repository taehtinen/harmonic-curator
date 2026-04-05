import Link from "next/link";
import PlaylistDetailsForm from "@/components/playlist-details-form";

export default function PlaylistSidebarNew({
  closeHref,
  savePlaylistDetailsAction,
  saveReturnTo,
}: {
  closeHref: string;
  savePlaylistDetailsAction: (formData: FormData) => Promise<void>;
  saveReturnTo: string;
}) {
  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <section className="shrink-0 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="min-w-0 text-xl font-semibold tracking-tight">New playlist</h2>
          <Link
            href={closeHref}
            className="shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </Link>
        </div>

        <div className="mt-6">
          <PlaylistDetailsForm
            action={savePlaylistDetailsAction}
            returnTo={saveReturnTo}
            submitLabel="Create playlist"
            idPrefix="new"
            aria-label="New playlist details"
          />
        </div>
      </section>
    </aside>
  );
}
