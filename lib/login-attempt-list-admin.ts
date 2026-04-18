import { prisma } from "@/lib/prisma";

import type { LoginActivityRow } from "@/lib/login-attempt";

/** Admin audit list cap (newest first); avoids unbounded reads. */
const MAX_LOGIN_ATTEMPTS_LISTED_ADMIN = 10_000;

export async function listLoginAttemptsForAdminView(): Promise<LoginActivityRow[]> {
  const rows = await prisma.loginAttempt.findMany({
    select: {
      id: true,
      createdAt: true,
      username: true,
      userId: true,
      result: true,
      ipAddress: true,
      userAgent: true,
    },
    orderBy: { createdAt: "desc" },
    take: MAX_LOGIN_ATTEMPTS_LISTED_ADMIN,
  });

  return rows.map((r) => ({
    id: r.id.toString(),
    createdAt: r.createdAt,
    username: r.username,
    userId: r.userId != null ? r.userId.toString() : null,
    result: r.result,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
  }));
}

export function loginAttemptsAdminCap(): number {
  return MAX_LOGIN_ATTEMPTS_LISTED_ADMIN;
}
