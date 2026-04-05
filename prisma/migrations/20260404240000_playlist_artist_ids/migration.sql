-- AlterTable
ALTER TABLE "playlist" ADD COLUMN "artistIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
