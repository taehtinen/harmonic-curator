import { headers } from "next/headers";

import type { LoginAttemptResult } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** IP and User-Agent from the current request (for login audit / throttling). */
export async function getLoginRequestAuditFields(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ipAddress =
      forwarded?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    return { ipAddress, userAgent: h.get("user-agent") };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

/** Persists a login outcome; never throws (auth must not fail because audit logging failed). */
export async function recordLoginAttempt(input: {
  username: string;
  userId: bigint | null;
  result: LoginAttemptResult;
}): Promise<void> {
  const { ipAddress, userAgent } = await getLoginRequestAuditFields();
  try {
    await prisma.loginAttempt.create({
      data: {
        username: input.username,
        userId: input.userId,
        result: input.result,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("recordLoginAttempt failed", err);
  }
}

/** Row shape for login activity UI (settings self-view or admin audit). */
export type LoginActivityRow = {
  id: string;
  createdAt: Date;
  result: LoginAttemptResult;
  ipAddress: string | null;
  userAgent: string | null;
  /** Set when listing attempts across users (admin). */
  username?: string;
  /** Matching app user id, if any (null for unknown-user attempts). */
  userId?: string | null;
};

const MAX_LOGIN_ATTEMPTS_LISTED_PER_USER = 100;

export async function listLoginAttemptsForUser(userId: bigint): Promise<LoginActivityRow[]> {
  const rows = await prisma.loginAttempt.findMany({
    where: { userId },
    select: {
      id: true,
      createdAt: true,
      result: true,
      ipAddress: true,
      userAgent: true,
    },
    orderBy: { createdAt: "desc" },
    take: MAX_LOGIN_ATTEMPTS_LISTED_PER_USER,
  });

  return rows.map((r) => ({
    id: r.id.toString(),
    createdAt: r.createdAt,
    result: r.result,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
  }));
}
