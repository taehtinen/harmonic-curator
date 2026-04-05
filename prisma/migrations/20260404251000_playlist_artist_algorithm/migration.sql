-- CreateEnum
CREATE TYPE "PlaylistArtistAlgorithm" AS ENUM ('DEFAULT');

-- AlterTable
ALTER TABLE "playlist" ADD COLUMN "artistAlgorithm" "PlaylistArtistAlgorithm" NOT NULL DEFAULT 'DEFAULT';
