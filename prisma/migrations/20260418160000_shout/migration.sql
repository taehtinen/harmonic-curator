-- CreateTable
CREATE TABLE "shout" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT NOT NULL,
    "body" VARCHAR(500) NOT NULL,

    CONSTRAINT "shout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shout_createdAt_idx" ON "shout"("createdAt");

-- AddForeignKey
ALTER TABLE "shout" ADD CONSTRAINT "shout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
