import { LoginAttemptResult } from "@prisma/client";

import type { LoginActivityRow } from "@/lib/login-attempt";

function formatWhen(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function LoginAttemptOutcome({ result }: { result: LoginAttemptResult }) {
  const iconClass = "h-4 w-4 shrink-0";
  switch (result) {
    case LoginAttemptResult.SUCCESS:
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
          <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Signed in
        </span>
      );
    case LoginAttemptResult.INVALID_PASSWORD:
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
          <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          Wrong password
        </span>
      );
    case LoginAttemptResult.NO_PASSWORD_SET:
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
          <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          No password set
        </span>
      );
    case LoginAttemptResult.UNKNOWN_USER:
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-yellow-700 dark:text-yellow-400">
          <svg
            className={iconClass}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Unknown user
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
          {String(result)}
        </span>
      );
  }
}

function formatOptionalText(value: string | null, emptyLabel: string) {
  if (!value) return emptyLabel;
  return value;
}

function truncateUserAgent(ua: string | null) {
  if (!ua) return "—";
  const max = 96;
  return ua.length <= max ? ua : `${ua.slice(0, max)}…`;
}

export type LoginActivityTableProps = {
  rows: LoginActivityRow[];
  emptyMessage: string;
  /** Shown above the table when there is at least one row, or above the empty state when provided. */
  description?: string;
  /** When true, show username and user id columns (admin global log). */
  auditColumns?: boolean;
  /** Minimum table width class for horizontal scroll (wider when audit columns). */
  minWidthClass?: string;
};

export default function LoginActivityTable({
  rows,
  emptyMessage,
  description,
  auditColumns = false,
  minWidthClass = "min-w-[36rem]",
}: LoginActivityTableProps) {
  return (
    <>
      {description ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      ) : null}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className={`w-full ${minWidthClass} border-collapse text-left text-sm`}>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">When</th>
                {auditColumns ? (
                  <>
                    <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      Username
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">User ID</th>
                  </>
                ) : null}
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Outcome</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">IP address</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id} className="bg-white dark:bg-zinc-950">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatWhen(row.createdAt)}
                  </td>
                  {auditColumns ? (
                    <>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {row.username ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {formatOptionalText(row.userId ?? null, "—")}
                      </td>
                    </>
                  ) : null}
                  <td className="px-4 py-3">
                    <LoginAttemptOutcome result={row.result} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {formatOptionalText(row.ipAddress, "—")}
                  </td>
                  <td
                    className="max-w-xs px-4 py-3 break-words font-mono text-xs text-zinc-600 dark:text-zinc-400"
                    title={row.userAgent ?? undefined}
                  >
                    {truncateUserAgent(row.userAgent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
