-- CreateTable
CREATE TABLE "playlist" (
    "id" BIGSERIAL NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "genres" TEXT[],
    "maxFollowers" INTEGER NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_spotifyId_key" ON "playlist"("spotifyId");

-- CreateIndex
CREATE INDEX "playlist_name_idx" ON "playlist"("name");
