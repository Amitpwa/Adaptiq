-- CreateEnum
CREATE TYPE "LlmProvider" AS ENUM ('ANTHROPIC', 'OPENAI');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'INVALID');

-- CreateTable
CREATE TABLE "llm_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "LlmProvider" NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "keyHint" TEXT NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "model" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "llm_credentials_userId_idx" ON "llm_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "llm_credentials_userId_provider_key" ON "llm_credentials"("userId", "provider");

-- AddForeignKey
ALTER TABLE "llm_credentials" ADD CONSTRAINT "llm_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
