-- AlterTable
ALTER TABLE "playlist" ALTER COLUMN "spotifyId" DROP NOT NULL;

-- Clear placeholder ids used for local-only playlists (including local-77afb2f9-7354-4c04-96e7-b6567ea31589)
UPDATE "playlist" SET "spotifyId" = NULL WHERE "spotifyId" LIKE 'local-%';
