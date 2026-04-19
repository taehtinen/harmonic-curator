"use server";

import { redirect } from "next/navigation";

import { signIn } from "@/auth";
import { applyLoginThrottleForUsername } from "@/lib/login-throttle";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type RegisterState = { error: string | null };

const MIN_PASSWORD_LENGTH = 8;

/** Auth.js throws this with `type: "CredentialsSignin"`; avoid `instanceof` (duplicate @auth/core copies break it). */
function isCredentialsSignin(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { type?: string }).type === "CredentialsSignin"
  );
}

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

export async function completeRegistration(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const username = String(formData.get("username") ?? "").trim();
  const registrationToken = String(formData.get("registrationToken") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !registrationToken) {
    return { error: "Invalid or expired registration link." };
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }

  await applyLoginThrottleForUsername(username);

  const passwordHash = await hashPassword(password);

  const updated = await prisma.user.updateMany({
    where: {
      username,
      registrationToken,
      passwordHash: null,
    },
    data: {
      passwordHash,
      registrationToken: null,
    },
  });

  if (updated.count !== 1) {
    return { error: "Invalid or expired registration link." };
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
      return {
        error: "Could not sign you in. Try signing in from the login page.",
      };
    }
    throw e;
  }

  if (signInRedirectIndicatesFailure(nextUrl)) {
    return {
      error: "Could not sign you in. Try signing in from the login page.",
    };
  }

  redirect("/");
}
