-- CreateEnum
CREATE TYPE "LoginAttemptResult" AS ENUM ('SUCCESS', 'UNKNOWN_USER', 'NO_PASSWORD_SET', 'INVALID_PASSWORD');

-- CreateTable
CREATE TABLE "login_attempt" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT NOT NULL,
    "userId" BIGINT,
    "result" "LoginAttemptResult" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "login_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempt_userId_idx" ON "login_attempt"("userId");

-- CreateIndex
CREATE INDEX "login_attempt_createdAt_idx" ON "login_attempt"("createdAt");

-- AddForeignKey
ALTER TABLE "login_attempt" ADD CONSTRAINT "login_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
