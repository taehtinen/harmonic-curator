import { headers } from "next/headers";

import type { LoginAttemptResult } from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function requestAuditFields(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
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
  const { ipAddress, userAgent } = await requestAuditFields();
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
