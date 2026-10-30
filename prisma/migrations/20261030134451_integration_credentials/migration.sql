-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "provider" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "sourceHash" TEXT,
    "storedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRefreshedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastRefreshAttemptAt" TIMESTAMP(3),
    "lastRefreshError" TEXT,
    "refreshFailures" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("provider")
);
