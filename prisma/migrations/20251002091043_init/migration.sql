/*
  Warnings:

  - You are about to drop the `commissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `licenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `representatives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sales` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `visits` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `clients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `businessId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `client_notes` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `client_profile` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `client_segment` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `cnpj` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `communication_pref` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `contact_frequency` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `cpf` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `inscricao_estadual` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `last_contact` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `next_contact` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `razao_social` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `relationship_stage` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `representativeId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_pessoa` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `clients` table. All the data in the column will be lost.
  - The primary key for the `goals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `current_amount` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `current_sales` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `period_end` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `period_start` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `period_type` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `target_amount` on the `goals` table. All the data in the column will be lost.
  - You are about to drop the column `target_sales` on the `goals` table. All the data in the column will be lost.
  - Added the required column `periodEnd` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodType` to the `goals` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetAmount` to the `goals` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "commissions_saleId_key";

-- DropIndex
DROP INDEX "licenses_licenseKey_key";

-- DropIndex
DROP INDEX "products_code_key";

-- DropIndex
DROP INDEX "representatives_businessId_key";

-- DropIndex
DROP INDEX "representatives_cpf_key";

-- DropIndex
DROP INDEX "representatives_email_key";

-- DropIndex
DROP INDEX "users_email_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "commissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "contact_history";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "licenses";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "products";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "representatives";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sales";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "users";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "visits";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_clients" ("createdAt", "email", "id", "name", "phone", "updatedAt") SELECT "createdAt", "email", "id", "name", "phone", "updatedAt" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
CREATE TABLE "new_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodType" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "targetAmount" REAL NOT NULL,
    "currentAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_goals" ("createdAt", "id", "status", "updatedAt") SELECT "createdAt", "id", "status", "updatedAt" FROM "goals";
DROP TABLE "goals";
ALTER TABLE "new_goals" RENAME TO "goals";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
