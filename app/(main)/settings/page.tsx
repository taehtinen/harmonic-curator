import Link from "next/link";

import LoginActivityTable from "@/components/login-activity-table";
import SpotifyIcon from "@/components/spotify-icon";
import UnlinkSpotifyAccountForm from "@/components/unlink-spotify-account-form";
import { requireUser } from "@/lib/auth";
import { listLoginAttemptsForUser } from "@/lib/login-attempt";
import { listLinkedSpotifyAccountsForUser } from "@/lib/user-spotify-account";

function formatWhen(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    spotify_linked?: string;
    spotify_unlinked?: string;
    spotify_error?: string;
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const userId = BigInt(user.id);
  const accounts = await listLinkedSpotifyAccountsForUser(userId);
  const loginAttempts = await listLoginAttemptsForUser(userId);

  const linkedOk = params.spotify_linked === "1";
  const unlinkedOk = params.spotify_unlinked === "1";
  const linkError = params.spotify_error?.trim();

  return (
    <div className="mx-auto max-w-3xl flex-1 overflow-auto px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>

      <section className="mt-10" aria-labelledby="spotify-accounts-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="spotify-accounts-heading"
            className="text-lg font-medium text-zinc-900 dark:text-zinc-50"
          >
            Linked Spotify accounts
          </h2>
          <Link
            href="/api/spotify/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1DB954] px-4 py-2 text-sm font-medium text-black hover:bg-[#1ed760]"
          >
            <SpotifyIcon className="h-4 w-4" />
            Link Spotify account
          </Link>
        </div>

        {linkedOk ? (
          <p
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            Spotify account linked successfully.
          </p>
        ) : null}

        {unlinkedOk ? (
          <p
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
          >
            Spotify account removed.
          </p>
        ) : null}

        {linkError ? (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
            role="alert"
          >
            Could not complete Spotify linking: {linkError}
          </p>
        ) : null}

        {accounts.length === 0 ? (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
            No Spotify accounts linked yet. Use the button above to authorize this app with
            Spotify.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {a.displayName ?? "Spotify user"}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-500">
                    {a.spotifyUserId}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Linked {formatWhen(a.linkedAt)}
                    {a.updatedAt.getTime() !== a.linkedAt.getTime()
                      ? ` · Updated ${formatWhen(a.updatedAt)}`
                      : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:max-w-xs sm:items-end sm:text-right">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                      Scopes
                    </p>
                    <p className="mt-1 break-words text-xs text-zinc-600 dark:text-zinc-400">
                      {a.scope.split(/\s+/).filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <UnlinkSpotifyAccountForm
                    accountId={a.id}
                    accountLabel={a.displayName ?? a.spotifyUserId}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="login-activity-heading">
        <h2
          id="login-activity-heading"
          className="text-lg font-medium text-zinc-900 dark:text-zinc-50"
        >
          Login activity
        </h2>
        <LoginActivityTable
          rows={loginAttempts}
          emptyMessage="No login attempts recorded yet."
          description="Recent sign-in attempts for your account, newest first (up to 100 entries)."
        />
      </section>
    </div>
  );
}
