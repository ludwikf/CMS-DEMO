/*
  Warnings:

  - Added the required column `product` to the `OrderData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderData" ADD COLUMN     "product" TEXT NOT NULL;
