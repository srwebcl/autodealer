-- AlterTable
ALTER TABLE "InstagramPost" ADD COLUMN     "autoWithdrawnAt" TIMESTAMP(3),
ADD COLUMN     "missingCount" INTEGER NOT NULL DEFAULT 0;
