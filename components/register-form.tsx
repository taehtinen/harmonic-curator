"use client";

import { useActionState } from "react";

import {
  completeRegistration,
  type RegisterState,
} from "@/app/register/actions";

const initialState: RegisterState = { error: null };

type Props = {
  username: string;
  registrationToken: string;
};

export default function RegisterForm({ username, registrationToken }: Props) {
  const [state, formAction, pending] = useActionState(
    completeRegistration,
    initialState,
  );

  return (
    <form className="flex w-full max-w-sm flex-col gap-4" action={formAction}>
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="registrationToken" value={registrationToken} />
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Setting password for{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {username}
        </span>
      </p>
      <label className="flex flex-col gap-1 text-left text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="text"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={pending}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      {state.error ? (
        <p className="text-center text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Saving…" : "Complete registration"}
      </button>
    </form>
  );
}
