import { LoginAttemptResult } from "@prisma/client";

import { getLoginRequestAuditFields } from "@/lib/login-attempt";
import { prisma } from "@/lib/prisma";

const FAILED_RESULTS: LoginAttemptResult[] = [
  LoginAttemptResult.UNKNOWN_USER,
  LoginAttemptResult.NO_PASSWORD_SET,
  LoginAttemptResult.INVALID_PASSWORD,
];

/** Rolling window for counting failures that affect throttle delay. */
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

const MAX_DELAY_MS = 30_000;
const BASE_DELAY_MS = 400;

function delayMsForFailureCount(failureCount: number): number {
  if (failureCount <= 0) return 0;
  return Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** Math.min(failureCount - 1, 10));
}

/**
 * Waits before continuing credential checks when recent failures exist for this
 * username or client IP (slows brute force; cap avoids unbounded waits).
 */
export async function applyLoginThrottleForUsername(username: string): Promise<void> {
  const { ipAddress } = await getLoginRequestAuditFields();
  const since = new Date(Date.now() - FAILURE_WINDOW_MS);
  const failedWhere = { createdAt: { gte: since }, result: { in: FAILED_RESULTS } };

  const [byUsername, byIp] = await Promise.all([
    prisma.loginAttempt.count({
      where: { ...failedWhere, username },
    }),
    ipAddress
      ? prisma.loginAttempt.count({
          where: { ...failedWhere, ipAddress },
        })
      : Promise.resolve(0),
  ]);

  const ms = delayMsForFailureCount(Math.max(byUsername, byIp));
  if (ms > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
