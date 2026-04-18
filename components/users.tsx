import { UserStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatWhen(d: Date) {
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function Users() {
  const currentUser = await requireAdmin();

  const rows = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { username: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl flex-1 overflow-auto px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Users
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        All accounts that can sign in to this app.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          No users found.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60">
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Username</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Created</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rows.map((u) => {
                const isSelf = currentUser.id === u.id.toString();
                return (
                  <tr
                    key={u.id.toString()}
                    className={
                      isSelf
                        ? "bg-emerald-50/60 dark:bg-emerald-950/25"
                        : "bg-white dark:bg-zinc-950"
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {u.username}
                      </span>
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          (you)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.status === UserStatus.ADMIN
                            ? "rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 dark:bg-violet-950/80 dark:text-violet-100"
                            : "rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }
                      >
                        {u.status === UserStatus.ADMIN ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatWhen(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatWhen(u.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
