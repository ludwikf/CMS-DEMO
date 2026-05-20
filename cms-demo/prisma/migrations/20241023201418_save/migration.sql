-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('unconfirmed', 'inProgress', 'confirmed', 'delivery', 'pickup', 'finished');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'unconfirmed';
