import { headers } from "next/headers";

/**
 * Public origin for redirects (e.g. `https://app.example.com`).
 * Prefer `AUTH_URL` or `NEXTAUTH_URL` in production; otherwise derive from request headers.
 */
export async function resolveAppOrigin(): Promise<string> {
  const fromEnv =
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) {
    throw new Error("Cannot resolve app origin: set AUTH_URL or NEXTAUTH_URL");
  }
  return `${proto}://${host}`;
}
