/*
  Warnings:

  - You are about to drop the column `dataId` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `dataId` on the `PersonalData` table. All the data in the column will be lost.
  - You are about to drop the column `dataId` on the `Shipping` table. All the data in the column will be lost.
  - You are about to drop the `Data` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `PersonalData` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Shipping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `PersonalData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Shipping` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Company" DROP CONSTRAINT "Company_dataId_fkey";

-- DropForeignKey
ALTER TABLE "Data" DROP CONSTRAINT "Data_userId_fkey";

-- DropForeignKey
ALTER TABLE "PersonalData" DROP CONSTRAINT "PersonalData_dataId_fkey";

-- DropForeignKey
ALTER TABLE "Shipping" DROP CONSTRAINT "Shipping_dataId_fkey";

-- DropIndex
DROP INDEX "Company_dataId_key";

-- DropIndex
DROP INDEX "PersonalData_dataId_key";

-- DropIndex
DROP INDEX "Shipping_dataId_key";

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "dataId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PersonalData" DROP COLUMN "dataId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Shipping" DROP COLUMN "dataId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Data";

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalData_userId_key" ON "PersonalData"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipping_userId_key" ON "Shipping"("userId");

-- AddForeignKey
ALTER TABLE "PersonalData" ADD CONSTRAINT "PersonalData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipping" ADD CONSTRAINT "Shipping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
