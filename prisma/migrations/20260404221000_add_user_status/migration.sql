-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'USER';
