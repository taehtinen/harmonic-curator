import PlaylistArtistsFormSection from "@/components/playlist-artists-form-section";
import type { PlaylistArtistTag } from "@/components/playlist-artist-picker";

const fieldClassName =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/30";

const submitClassName =
  "rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

export default function PlaylistDetailsForm({
  action,
  defaultName = "",
  defaultDescription = "",
  defaultArtists = [],
  defaultMaxFollowers = null,
  playlistId,
  returnTo,
  submitLabel,
  idPrefix,
  "aria-label": ariaLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultName?: string;
  defaultDescription?: string;
  defaultArtists?: PlaylistArtistTag[];
  /** Omit or null: no artist follower cap (stored as null). */
  defaultMaxFollowers?: number | null;
  playlistId?: string;
  returnTo: string;
  submitLabel: string;
  idPrefix: string;
  "aria-label": string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4" aria-label={ariaLabel}>
      <input type="hidden" name="returnTo" value={returnTo} />
      {playlistId ? <input type="hidden" name="playlistId" value={playlistId} /> : null}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-playlist-name`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id={`${idPrefix}-playlist-name`}
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="Playlist name"
          defaultValue={defaultName}
          className={fieldClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-playlist-description`}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Description
        </label>
        <textarea
          id={`${idPrefix}-playlist-description`}
          name="description"
          rows={4}
          placeholder="Optional description"
          defaultValue={defaultDescription}
          className={`resize-y ${fieldClassName}`}
        />
      </div>

      <PlaylistArtistsFormSection
        key={playlistId ?? "new"}
        defaultArtists={defaultArtists}
        defaultMaxFollowers={defaultMaxFollowers}
        idPrefix={idPrefix}
        fieldClassName={fieldClassName}
      />

      <div className="pt-1">
        <button type="submit" className={submitClassName}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
