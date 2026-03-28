"use client";

import { useState } from "react";

export default function ArtistSidebarAddGenre({
  artistId,
  addGenreAction,
  addGenreReturnToHref,
}: {
  artistId: string;
  addGenreAction: (formData: FormData) => Promise<void>;
  addGenreReturnToHref: string;
}) {
  const [open, setOpen] = useState(false);

  const secondaryTriggerClass =
    "shrink-0 self-center rounded-md border border-zinc-200 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  const secondaryButtonClass =
    "shrink-0 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  const submitButtonClass =
    "shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={secondaryTriggerClass}
          aria-expanded={false}
          aria-controls="artist-sidebar-add-genre-form"
        >
          Add genre
        </button>
      )}
      {open && (
        <div className="w-full basis-full">
          <form
            id="artist-sidebar-add-genre-form"
            action={addGenreAction}
            className="flex flex-wrap items-center gap-2"
          >
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="returnTo" value={addGenreReturnToHref} />
            <input
              type="text"
              name="genre"
              placeholder="Genre"
              autoComplete="off"
              autoFocus
              className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            />
            <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>
              Cancel
            </button>
            <button type="submit" className={submitButtonClass}>
              Add genre
            </button>
          </form>
        </div>
      )}
    </>
  );
}
