import { redirect } from "next/navigation";

export type CurrentUser = {
  id: string;
  roles: string[];
};

/**
 * Resolve the signed-in user, or null when there is no session.
 * Replace this with real session/cookie/JWT lookup when login is implemented.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return null;
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
  return Boolean(user?.roles.includes("admin"));
}
