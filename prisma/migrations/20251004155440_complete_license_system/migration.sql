/*
  Warnings:

  - You are about to drop the column `key` on the `licenses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[licenseKey]` on the table `licenses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `licenseKey` to the `licenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."licenses_key_key";

-- AlterTable
ALTER TABLE "licenses" DROP COLUMN "key",
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "licenseKey" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "license_devices" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceInfo" TEXT NOT NULL,
    "fingerprintHistory" TEXT NOT NULL DEFAULT '[]',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastValidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_backups" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT,
    "deviceId" TEXT,
    "snapshot" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "license_devices_deviceId_key" ON "license_devices"("deviceId");

-- CreateIndex
CREATE INDEX "license_devices_licenseId_status_idx" ON "license_devices"("licenseId", "status");

-- CreateIndex
CREATE INDEX "license_backups_licenseId_idx" ON "license_backups"("licenseId");

-- CreateIndex
CREATE INDEX "license_backups_deviceId_idx" ON "license_backups"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- AddForeignKey
ALTER TABLE "license_devices" ADD CONSTRAINT "license_devices_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
