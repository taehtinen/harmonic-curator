"use client";

import { useActionState } from "react";

import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: null };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form className="flex w-full max-w-sm flex-col gap-4" action={formAction}>
      <label className="flex flex-col gap-1 text-left text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium">Username</span>
        <input
          name="username"
          type="text"
          autoComplete="username"
          required
          disabled={pending}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-left text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
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
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
