"use client";

import { signOut } from "next-auth/react";

import ConfirmSubmitButton from "@/components/confirm-submit-button";

async function signOutAction() {
  await signOut({ callbackUrl: "/login" });
}

export default function SignOutButton() {
  return (
    <form action={signOutAction} className="inline">
      <ConfirmSubmitButton
        confirmMessage="Sign out?"
        className="rounded-lg px-4 py-2 text-sm font-medium uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
      >
        Sign out
      </ConfirmSubmitButton>
    </form>
  );
}
