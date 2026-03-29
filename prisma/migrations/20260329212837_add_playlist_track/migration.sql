-- CreateTable
CREATE TABLE "playlist_track" (
    "id" BIGSERIAL NOT NULL,
    "playlistId" BIGINT NOT NULL,
    "trackId" BIGINT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_track_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playlist_track_playlistId_idx" ON "playlist_track"("playlistId");

-- CreateIndex
CREATE INDEX "playlist_track_trackId_idx" ON "playlist_track"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_track_playlistId_position_key" ON "playlist_track"("playlistId", "position");

-- AddForeignKey
ALTER TABLE "playlist_track" ADD CONSTRAINT "playlist_track_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_track" ADD CONSTRAINT "playlist_track_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
