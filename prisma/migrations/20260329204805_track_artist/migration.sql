-- CreateTable
CREATE TABLE "track_artist" (
    "trackId" BIGINT NOT NULL,
    "artistId" BIGINT NOT NULL,

    CONSTRAINT "track_artist_pkey" PRIMARY KEY ("trackId","artistId")
);

-- CreateIndex
CREATE INDEX "track_artist_artistId_idx" ON "track_artist"("artistId");

-- AddForeignKey
ALTER TABLE "track_artist" ADD CONSTRAINT "track_artist_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_artist" ADD CONSTRAINT "track_artist_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill main artist for existing tracks
INSERT INTO "track_artist" ("trackId", "artistId")
SELECT "id", "artistId" FROM "track"
ON CONFLICT DO NOTHING;
