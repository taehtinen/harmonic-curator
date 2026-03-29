-- AlterTable: allow null for "no follower cap"
ALTER TABLE "playlist" ALTER COLUMN "maxFollowers" DROP NOT NULL;

-- Normalize sentinel INT_MAX to NULL
UPDATE "playlist" SET "maxFollowers" = NULL WHERE "maxFollowers" = 2147483647;
