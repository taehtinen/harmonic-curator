import type { UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Shape returned for admin user listing. Keeps password hashes and other secrets
 * out of this type so they cannot be passed through to rendered UI by mistake.
 */
export type AdminListedUser = {
  id: string;
  username: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
};

export async function listUsersForAdminView(): Promise<AdminListedUser[]> {
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

  return rows.map((r) => ({
    id: r.id.toString(),
    username: r.username,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}
