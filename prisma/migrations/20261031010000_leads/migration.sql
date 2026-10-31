-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('FINANCING', 'INSURANCE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateTable
CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "type" "LeadType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "details" JSONB NOT NULL,
    "page" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_type_createdAt_idx" ON "Lead"("type", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Lead_ipHash_createdAt_idx" ON "Lead"("ipHash", "createdAt");

