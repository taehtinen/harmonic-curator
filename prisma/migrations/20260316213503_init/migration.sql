-- CreateTable
CREATE TABLE "artist" (
    "id" BIGSERIAL NOT NULL,
    "spotifyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genres" TEXT[],
    "popularity" INTEGER NOT NULL,
    "followers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_spotifyId_key" ON "artist"("spotifyId");
