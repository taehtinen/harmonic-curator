"use client";

import { useFormStatus } from "react-dom";

import { unlinkSpotifyAccount } from "@/app/(main)/settings/actions";

function SubmitButton({ ariaLabel }: { ariaLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export default function UnlinkSpotifyAccountForm({
  accountId,
  accountLabel,
}: {
  accountId: string;
  accountLabel: string;
}) {
  const removeAria = `Remove linked Spotify account ${accountLabel}`;

  return (
    <form
      action={unlinkSpotifyAccount}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            `Remove Spotify account?`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="accountId" value={accountId} />
      <SubmitButton ariaLabel={removeAria} />
    </form>
  );
}
