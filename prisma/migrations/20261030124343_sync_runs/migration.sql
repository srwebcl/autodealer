-- CreateEnum
CREATE TYPE "SyncRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "SyncTrigger" AS ENUM ('CRON', 'MANUAL', 'SCRIPT');

-- AlterTable
ALTER TABLE "SyncLog" ADD COLUMN     "runId" UUID;

-- AlterTable
ALTER TABLE "VehicleImage" ADD COLUMN     "publicUrl" TEXT;

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" UUID NOT NULL,
    "trigger" "SyncTrigger" NOT NULL,
    "status" "SyncRunStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "stats" JSONB,
    "error" TEXT,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLock" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "holder" TEXT,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "SyncLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SyncRun_startedAt_idx" ON "SyncRun"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "SyncLog_runId_idx" ON "SyncLog"("runId");

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SyncRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Candado de fila única.
ALTER TABLE "SyncLock" ADD CONSTRAINT "SyncLock_singleton_check" CHECK ("id" = 1);
INSERT INTO "SyncLock" ("id") VALUES (1) ON CONFLICT DO NOTHING;
