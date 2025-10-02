/*
  Warnings:

  - Added the required column `title` to the `goals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clients" ADD COLUMN "address" TEXT;
ALTER TABLE "clients" ADD COLUMN "city" TEXT;
ALTER TABLE "clients" ADD COLUMN "company" TEXT;
ALTER TABLE "clients" ADD COLUMN "notes" TEXT;
ALTER TABLE "clients" ADD COLUMN "state" TEXT;
ALTER TABLE "clients" ADD COLUMN "zipCode" TEXT;

-- CreateTable
CREATE TABLE "receivables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "receivables_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "targetAmount" REAL NOT NULL,
    "targetSales" INTEGER,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "currentSales" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "description" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_goals" ("createdAt", "currentAmount", "id", "periodEnd", "periodStart", "periodType", "status", "targetAmount", "updatedAt") SELECT "createdAt", "currentAmount", "id", "periodEnd", "periodStart", "periodType", "status", "targetAmount", "updatedAt" FROM "goals";
DROP TABLE "goals";
ALTER TABLE "new_goals" RENAME TO "goals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
