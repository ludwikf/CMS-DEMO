-- CreateEnum
CREATE TYPE "Role" AS ENUM ('client', 'worker', 'host');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'client';
