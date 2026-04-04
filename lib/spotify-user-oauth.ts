const ACCOUNTS_BASE = "https://accounts.spotify.com";
const API_BASE = "https://api.spotify.com/v1";

export const DEFAULT_SPOTIFY_USER_SCOPES = [
  "playlist-modify-public"
].join(" ");

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyMe {
  id: string;
  display_name: string | null;
  email?: string;
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Environment variable ${name} is not set`);
  return v;
}

export function getSpotifyRedirectUri(): string {
  return requireEnv("SPOTIFY_USER_REDIRECT_URI");
}

export function getSpotifyUserScopes(): string {
  return process.env.SPOTIFY_USER_SCOPES?.trim() || DEFAULT_SPOTIFY_USER_SCOPES;
}

export function buildSpotifyAuthorizeUrl(state: string): string {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const redirectUri = getSpotifyRedirectUri();
  const scope = getSpotifyUserScopes();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    state,
  });
  return `${ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

async function postTokenForm(body: Record<string, string>): Promise<SpotifyTokenResponse> {
  const clientId = requireEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = requireEnv("SPOTIFY_CLIENT_SECRET");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token endpoint failed: ${response.status} ${text}`);
  }
  return response.json() as Promise<SpotifyTokenResponse>;
}

export async function exchangeAuthorizationCode(code: string): Promise<SpotifyTokenResponse> {
  return postTokenForm({
    grant_type: "authorization_code",
    code,
    redirect_uri: getSpotifyRedirectUri(),
  });
}

export async function exchangeRefreshToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  return postTokenForm({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

export async function fetchSpotifyMe(accessToken: string): Promise<SpotifyMe> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify /me failed: ${response.status} ${text}`);
  }
  return response.json() as Promise<SpotifyMe>;
}
