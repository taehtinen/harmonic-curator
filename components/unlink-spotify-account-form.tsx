"use client";

import { useFormStatus } from "react-dom";

import { unlinkSpotifyAccount } from "@/app/(main)/settings/actions";
import ConfirmSubmitButton from "@/components/confirm-submit-button";

function RemoveLabel() {
  const { pending } = useFormStatus();
  return <>{pending ? "Removing…" : "Remove"}</>;
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
    <form action={unlinkSpotifyAccount} className="inline">
      <input type="hidden" name="accountId" value={accountId} />
      <ConfirmSubmitButton
        confirmMessage={`Remove linked Spotify account “${accountLabel}”? You can link again later from Settings.`}
        aria-label={removeAria}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
      >
        <RemoveLabel />
      </ConfirmSubmitButton>
    </form>
  );
}
