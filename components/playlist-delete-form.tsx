"use client";

import ConfirmSubmitButton from "@/components/confirm-submit-button";

export default function PlaylistDeleteForm({
  action,
  playlistId,
  returnTo,
  playlistName,
}: {
  action: (formData: FormData) => Promise<void>;
  playlistId: string;
  returnTo: string;
  playlistName: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="playlistId" value={playlistId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <ConfirmSubmitButton
        confirmMessage={`Delete playlist "${playlistName}"? This cannot be undone.`}
        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        Delete
      </ConfirmSubmitButton>
    </form>
  );
}
