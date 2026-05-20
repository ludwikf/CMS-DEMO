/*
  Warnings:

  - The `width` column on the `OrderData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `height` column on the `OrderData` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `quantity` column on the `OrderData` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "OrderData" DROP COLUMN "width",
ADD COLUMN     "width" INTEGER,
DROP COLUMN "height",
ADD COLUMN     "height" INTEGER,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" INTEGER;
