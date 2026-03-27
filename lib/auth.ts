export type CurrentUser = {
  id: string;
  roles: string[];
};

/**
 * Temporary auth seam until real authentication is implemented.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return {
    id: "mock-admin-user",
    roles: ["admin"],
  };
}

export function userIsAdmin(user: CurrentUser | null): boolean {
  return Boolean(user?.roles.includes("admin"));
}
