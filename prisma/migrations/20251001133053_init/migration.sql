-- CreateTable
CREATE TABLE "licenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licenseKey" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "licenseType" TEXT NOT NULL DEFAULT 'trial',
    "expirationDate" DATETIME,
    "lastValidation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fingerprint" TEXT,
    "fingerprintHistory" JSONB,
    "suspiciousScore" INTEGER NOT NULL DEFAULT 0,
    "activationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toleranceMode" BOOLEAN NOT NULL DEFAULT false,
    "validationCount" INTEGER NOT NULL DEFAULT 0,
    "lastIpAddress" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");
