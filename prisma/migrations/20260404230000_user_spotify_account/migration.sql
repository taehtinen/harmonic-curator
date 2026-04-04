-- CreateTable
CREATE TABLE "user_spotify_account" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "accessTokenEnc" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_spotify_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_spotify_account_userId_spotifyUserId_key" ON "user_spotify_account"("userId", "spotifyUserId");

-- CreateIndex
CREATE INDEX "user_spotify_account_userId_idx" ON "user_spotify_account"("userId");

-- AddForeignKey
ALTER TABLE "user_spotify_account" ADD CONSTRAINT "user_spotify_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
