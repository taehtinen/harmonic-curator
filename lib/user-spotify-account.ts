import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/token-crypto";
import { exchangeRefreshToken } from "@/lib/spotify-user-oauth";

export type UpsertUserSpotifyAccountInput = {
  userId: bigint;
  spotifyUserId: string;
  displayName: string | null;
  scope: string;
  accessToken: string;
  /** If omitted when updating, the existing refresh token is kept. */
  refreshToken?: string;
  expiresInSeconds: number;
};

/**
 * Create or update a linked Spotify account and store tokens encrypted at rest.
 */
export async function upsertUserSpotifyAccount(
  input: UpsertUserSpotifyAccountInput,
): Promise<{ id: bigint }> {
  const accessTokenEnc = encryptSecret(input.accessToken);
  const accessTokenExpiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);

  const existing = await prisma.userSpotifyAccount.findUnique({
    where: {
      userId_spotifyUserId: {
        userId: input.userId,
        spotifyUserId: input.spotifyUserId,
      },
    },
    select: { id: true, refreshTokenEnc: true },
  });

  const refreshTokenEnc =
    input.refreshToken !== undefined
      ? encryptSecret(input.refreshToken)
      : existing?.refreshTokenEnc;

  if (!refreshTokenEnc) {
    throw new Error("refresh_token required for new Spotify link");
  }

  const row = await prisma.userSpotifyAccount.upsert({
    where: {
      userId_spotifyUserId: {
        userId: input.userId,
        spotifyUserId: input.spotifyUserId,
      },
    },
    create: {
      userId: input.userId,
      spotifyUserId: input.spotifyUserId,
      displayName: input.displayName,
      scope: input.scope,
      refreshTokenEnc,
      accessTokenEnc,
      accessTokenExpiresAt,
    },
    update: {
      displayName: input.displayName,
      scope: input.scope,
      refreshTokenEnc,
      accessTokenEnc,
      accessTokenExpiresAt,
    },
  });

  return { id: row.id };
}

const ACCESS_SKEW_MS = 60_000;

/**
 * Return a valid access token for the row, refreshing via Spotify if expired or missing.
 */
export async function getValidAccessTokenForAccount(accountId: bigint): Promise<string> {
  const row = await prisma.userSpotifyAccount.findUnique({
    where: { id: accountId },
    select: {
      refreshTokenEnc: true,
      accessTokenEnc: true,
      accessTokenExpiresAt: true,
    },
  });
  if (!row) throw new Error("Spotify account not found");

  const now = Date.now();
  if (
    row.accessTokenEnc &&
    row.accessTokenExpiresAt &&
    row.accessTokenExpiresAt.getTime() > now + ACCESS_SKEW_MS
  ) {
    return decryptSecret(row.accessTokenEnc);
  }

  const refreshToken = decryptSecret(row.refreshTokenEnc);
  const tokens = await exchangeRefreshToken(refreshToken);
  const newRefresh = tokens.refresh_token ?? refreshToken;

  await prisma.userSpotifyAccount.update({
    where: { id: accountId },
    data: {
      accessTokenEnc: encryptSecret(tokens.access_token),
      accessTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      refreshTokenEnc: encryptSecret(newRefresh),
      scope: tokens.scope,
    },
  });

  return tokens.access_token;
}

export type LinkedSpotifyAccountSummary = {
  id: string;
  spotifyUserId: string;
  displayName: string | null;
  scope: string;
  linkedAt: Date;
  updatedAt: Date;
};

/**
 * Safe fields for UI — no token material.
 */
export async function listLinkedSpotifyAccountsForUser(
  userId: bigint,
): Promise<LinkedSpotifyAccountSummary[]> {
  const rows = await prisma.userSpotifyAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      spotifyUserId: true,
      displayName: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((r) => ({
    id: r.id.toString(),
    spotifyUserId: r.spotifyUserId,
    displayName: r.displayName,
    scope: r.scope,
    linkedAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

/** Remove a linked account only when it belongs to the given app user. */
export async function deleteLinkedSpotifyAccountForUser(
  userId: bigint,
  accountId: bigint,
): Promise<boolean> {
  const { count } = await prisma.userSpotifyAccount.deleteMany({
    where: { id: accountId, userId },
  });
  return count > 0;
}
