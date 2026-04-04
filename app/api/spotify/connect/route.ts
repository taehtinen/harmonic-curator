import { randomBytes } from "node:crypto";

import { auth } from "@/auth";
import { resolveAppOrigin } from "@/lib/app-origin";
import {
  SPOTIFY_OAUTH_COOKIE_MAX_AGE,
  SPOTIFY_OAUTH_STATE_COOKIE,
  SPOTIFY_OAUTH_UID_COOKIE,
} from "@/lib/spotify-oauth-cookies";
import { buildSpotifyAuthorizeUrl } from "@/lib/spotify-user-oauth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SPOTIFY_OAUTH_COOKIE_MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};

export async function GET() {
  const session = await auth();
  const origin = await resolveAppOrigin();

  if (!session?.user?.id) {
    const login = new URL("/login", origin);
    login.searchParams.set("callbackUrl", `${origin}/api/spotify/connect`);
    return NextResponse.redirect(login);
  }

  const state = randomBytes(32).toString("base64url");
  const jar = await cookies();
  jar.set(SPOTIFY_OAUTH_STATE_COOKIE, state, cookieBase);
  jar.set(SPOTIFY_OAUTH_UID_COOKIE, session.user.id, cookieBase);

  return NextResponse.redirect(buildSpotifyAuthorizeUrl(state));
}
