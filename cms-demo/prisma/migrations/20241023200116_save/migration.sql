-- DropForeignKey
ALTER TABLE "OrderData" DROP CONSTRAINT "OrderData_orderId_fkey";

-- AddForeignKey
ALTER TABLE "OrderData" ADD CONSTRAINT "OrderData_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
