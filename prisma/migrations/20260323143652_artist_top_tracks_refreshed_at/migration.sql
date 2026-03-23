-- AlterTable
ALTER TABLE "artist" ADD COLUMN     "topTracksRefreshedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "artist_topTracksRefreshedAt_idx" ON "artist"("topTracksRefreshedAt");
