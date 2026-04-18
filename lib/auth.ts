import { UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type CurrentUser = {
  id: string;
  status: UserStatus;
};

/**
 * Resolve the signed-in user from the NextAuth session, or null when anonymous.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    status: session.user.status,
  };
}

/**
 * Use in protected layouts or pages. Sends anonymous users to `/login`.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export function userIsAdmin(user: CurrentUser | null): boolean {
  return user?.status === UserStatus.ADMIN;
}

/**
 * Use on admin-only pages. Sends anonymous users to `/login`, non-admins to `/`.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!userIsAdmin(user)) {
    redirect("/");
  }
  return user;
}
