/*
  Warnings:

  - You are about to drop the column `pricingTemplate` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "pricingTemplate",
ADD COLUMN     "pricingTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_pricingTemplateId_fkey" FOREIGN KEY ("pricingTemplateId") REFERENCES "pricing_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
