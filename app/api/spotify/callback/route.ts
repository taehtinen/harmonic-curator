import { auth } from "@/auth";
import { resolveAppOrigin } from "@/lib/app-origin";
import {
  SPOTIFY_OAUTH_STATE_COOKIE,
  SPOTIFY_OAUTH_UID_COOKIE,
} from "@/lib/spotify-oauth-cookies";
import { exchangeAuthorizationCode, fetchSpotifyMe } from "@/lib/spotify-user-oauth";
import { upsertUserSpotifyAccount } from "@/lib/user-spotify-account";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function clearOAuthCookies(jar: Awaited<ReturnType<typeof cookies>>) {
  jar.delete(SPOTIFY_OAUTH_STATE_COOKIE);
  jar.delete(SPOTIFY_OAUTH_UID_COOKIE);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = await resolveAppOrigin();
  const jar = await cookies();

  const fail = (message: string) => {
    clearOAuthCookies(jar);
    const target = new URL("/settings", origin);
    target.searchParams.set("spotify_error", message);
    return NextResponse.redirect(target);
  };

  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return fail(oauthError);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return fail("missing_code_or_state");
  }

  const expectedState = jar.get(SPOTIFY_OAUTH_STATE_COOKIE)?.value;
  const expectedUid = jar.get(SPOTIFY_OAUTH_UID_COOKIE)?.value;
  if (!expectedState || state !== expectedState) {
    return fail("state_mismatch");
  }

  const session = await auth();
  if (!session?.user?.id || session.user.id !== expectedUid) {
    return fail("session_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeAuthorizationCode(code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "token_exchange_failed";
    return fail(msg);
  }

  if (!tokens.refresh_token) {
    return fail("no_refresh_token");
  }

  let me;
  try {
    me = await fetchSpotifyMe(tokens.access_token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "profile_fetch_failed";
    return fail(msg);
  }

  try {
    await upsertUserSpotifyAccount({
      userId: BigInt(session.user.id),
      spotifyUserId: me.id,
      displayName: me.display_name,
      scope: tokens.scope,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresInSeconds: tokens.expires_in,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save_failed";
    return fail(msg);
  }

  clearOAuthCookies(jar);
  const ok = new URL("/settings", origin);
  ok.searchParams.set("spotify_linked", "1");
  return NextResponse.redirect(ok);
}
