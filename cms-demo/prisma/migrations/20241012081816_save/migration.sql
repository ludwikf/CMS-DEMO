/*
  Warnings:

  - The `isActive` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "IsActivate" AS ENUM ('FALSE', 'PENDING', 'TRUE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isActive",
ADD COLUMN     "isActive" "IsActivate" NOT NULL DEFAULT 'FALSE';
