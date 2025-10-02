-- CreateTable
CREATE TABLE "representatives" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cpf" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'RS',
    "zipCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "representativeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "businessId" TEXT,
    "tipo_pessoa" TEXT DEFAULT 'fisica',
    "cpf" TEXT,
    "cnpj" TEXT,
    "razao_social" TEXT,
    "inscricao_estadual" TEXT,
    "notes" TEXT,
    "client_notes" TEXT,
    "client_profile" TEXT,
    "client_segment" TEXT,
    "communication_pref" TEXT,
    "contact_frequency" TEXT,
    "last_contact" DATETIME,
    "next_contact" DATETIME,
    "relationship_stage" TEXT,
    CONSTRAINT "clients_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customer_id" INTEGER NOT NULL,
    "customer_name" TEXT,
    "customer_state" TEXT,
    "product_service" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit_price" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "commission_rate" REAL NOT NULL DEFAULT 0.05,
    "commission_amount" REAL NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'Dinheiro',
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "sale_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "representativeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "representativeId" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "baseAmount" REAL NOT NULL,
    "commissionAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "saleId" INTEGER,
    CONSTRAINT "commissions_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "commissions_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "representativeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "purpose" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "visits_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "visits_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "representatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "contact_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER NOT NULL,
    "contact_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contact_type" TEXT NOT NULL,
    "subject" TEXT,
    "notes" TEXT,
    "outcome" TEXT,
    "next_action" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "contact_history_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "goals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "period_type" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "target_amount" REAL NOT NULL,
    "target_sales" INTEGER,
    "current_amount" REAL NOT NULL DEFAULT 0,
    "current_sales" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "representatives_email_key" ON "representatives"("email");

-- CreateIndex
CREATE UNIQUE INDEX "representatives_cpf_key" ON "representatives"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "representatives_businessId_key" ON "representatives"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_businessId_key" ON "clients"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_saleId_key" ON "commissions"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
