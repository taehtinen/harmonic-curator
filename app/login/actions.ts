"use server";

import { redirect } from "next/navigation";

import { signIn } from "@/auth";

export type LoginState = { error: string | null };

/** Auth.js throws this with `type: "CredentialsSignin"`; avoid `instanceof` (duplicate @auth/core copies break it). */
function isCredentialsSignin(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { type?: string }).type === "CredentialsSignin"
  );
}

/**
 * With `redirect: false`, server `signIn` returns the redirect target URL string.
 * When `Auth()` turns a failed login into a redirect Response (e.g. `instanceof AuthError` is false
 * across duplicated `@auth/core` bundles), that URL includes `?error=...` instead of throwing.
 */
function signInRedirectIndicatesFailure(redirectUrl: string): boolean {
  try {
    const u = redirectUrl.startsWith("http")
      ? new URL(redirectUrl)
      : new URL(redirectUrl, "http://localhost");
    return u.searchParams.has("error");
  } catch {
    return false;
  }
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) {
    return { error: "Invalid username or password." };
  }

  let nextUrl: string;
  try {
    nextUrl = await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
      redirect: false,
    });
  } catch (e) {
    if (isCredentialsSignin(e)) {
      return { error: "Invalid username or password." };
    }
    throw e;
  }

  if (signInRedirectIndicatesFailure(nextUrl)) {
    return { error: "Invalid username or password." };
  }

  redirect("/");
}
