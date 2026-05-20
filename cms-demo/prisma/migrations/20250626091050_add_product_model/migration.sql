-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('ZALUZJE_POZIOME', 'ZALUZJE_PIONOWE', 'ROLETY_TEKSTYLNE', 'ZALUZJE_PLISOWANE', 'MOSKITIERY');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProductInputType" AS ENUM ('WIDTH', 'HEIGHT', 'COLOR', 'MATERIAL', 'QUANTITY');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ProductCategory" NOT NULL,
    "variant" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "inputs" "ProductInputType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
