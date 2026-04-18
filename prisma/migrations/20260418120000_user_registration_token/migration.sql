-- AlterTable
ALTER TABLE "user" ADD COLUMN "registrationToken" TEXT;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_registrationToken_key" ON "user"("registrationToken");

-- AlterTable: at least one of token or password hash must be null (never both set)
ALTER TABLE "user" ADD CONSTRAINT "user_registration_token_or_password_hash_null" CHECK (
    ("registrationToken" IS NULL) OR ("passwordHash" IS NULL)
);
