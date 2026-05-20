-- CreateTable
CREATE TABLE "warehouse_stock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT DEFAULT 'szt',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouse_intakes" (
    "id" TEXT NOT NULL,
    "intakeId" TEXT NOT NULL,
    "label" TEXT,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_stock_name_key" ON "warehouse_stock"("name");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_intakes_intakeId_key" ON "warehouse_intakes"("intakeId");

-- CreateIndex
CREATE INDEX "warehouse_intakes_createdAt_idx" ON "warehouse_intakes"("createdAt");
