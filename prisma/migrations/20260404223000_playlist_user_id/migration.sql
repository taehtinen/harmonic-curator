-- AlterTable
ALTER TABLE "playlist" ADD COLUMN "userId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "playlist_userId_idx" ON "playlist"("userId");
