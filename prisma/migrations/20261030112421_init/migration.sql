-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "VehicleSource" AS ENUM ('INSTAGRAM', 'MANUAL');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'GAS', 'OTHER');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "Drivetrain" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_WD');

-- CreateEnum
CREATE TYPE "InstagramMediaType" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT,
    "year" SMALLINT,
    "mileageKm" INTEGER,
    "engine" TEXT,
    "fuelType" "FuelType",
    "transmission" "Transmission",
    "drivetrain" "Drivetrain",
    "color" TEXT,
    "priceClp" INTEGER,
    "description" TEXT,
    "features" JSONB NOT NULL DEFAULT '[]',
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "source" "VehicleSource" NOT NULL DEFAULT 'MANUAL',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "lockedFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extraction" JSONB,
    "instagramPostId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleImage" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "instagramMediaId" TEXT,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" UUID NOT NULL,
    "instagramMediaId" TEXT NOT NULL,
    "permalink" TEXT,
    "caption" TEXT,
    "contentHash" TEXT,
    "mediaType" "InstagramMediaType" NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" UUID NOT NULL,
    "postId" UUID,
    "eventType" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "businessName" TEXT NOT NULL,
    "address" TEXT,
    "phoneDisplay" TEXT,
    "phoneE164" TEXT,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "instagramHandle" TEXT,
    "instagramUrl" TEXT,
    "hours" JSONB NOT NULL DEFAULT '[]',
    "draftFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_slug_key" ON "Vehicle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_instagramPostId_key" ON "Vehicle"("instagramPostId");

-- CreateIndex
CREATE INDEX "Vehicle_published_status_publishedAt_idx" ON "Vehicle"("published", "status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Vehicle_year_idx" ON "Vehicle"("year");

-- CreateIndex
CREATE INDEX "Vehicle_priceClp_idx" ON "Vehicle"("priceClp");

-- CreateIndex
CREATE INDEX "Vehicle_mileageKm_idx" ON "Vehicle"("mileageKm");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleImage_storageKey_key" ON "VehicleImage"("storageKey");

-- CreateIndex
CREATE INDEX "VehicleImage_vehicleId_position_idx" ON "VehicleImage"("vehicleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleImage_vehicleId_instagramMediaId_key" ON "VehicleImage"("vehicleId", "instagramMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_instagramMediaId_key" ON "InstagramPost"("instagramMediaId");

-- CreateIndex
CREATE INDEX "InstagramPost_syncStatus_idx" ON "InstagramPost"("syncStatus");

-- CreateIndex
CREATE INDEX "InstagramPost_publishedAt_idx" ON "InstagramPost"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "SyncLog_createdAt_idx" ON "SyncLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "SyncLog_postId_idx" ON "SyncLog"("postId");

-- CreateIndex
CREATE INDEX "SyncLog_level_createdAt_idx" ON "SyncLog"("level", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_instagramPostId_fkey" FOREIGN KEY ("instagramPostId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Restricciones de integridad (añadidas a mano) ─────────────────────
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_priceClp_check" CHECK ("priceClp" IS NULL OR "priceClp" > 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_year_check" CHECK ("year" IS NULL OR "year" BETWEEN 1900 AND 2100);
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_mileageKm_check" CHECK ("mileageKm" IS NULL OR "mileageKm" >= 0);
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_features_array_check" CHECK (jsonb_typeof("features") = 'array');
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
-- Una ficha publicada siempre tiene fecha de publicación.
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_publishedAt_check" CHECK (NOT "published" OR "publishedAt" IS NOT NULL);
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_position_check" CHECK ("position" >= 0);
ALTER TABLE "VehicleImage" ADD CONSTRAINT "VehicleImage_bytes_check" CHECK ("bytes" IS NULL OR "bytes" > 0);
ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_attempts_check" CHECK ("attempts" >= 0);
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_singleton_check" CHECK ("id" = 1);
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_hours_array_check" CHECK (jsonb_typeof("hours") = 'array');
