-- Stara kolumna deliveryMethod (NOT NULL); koszyk/składanie używa pola shipping (JSON).
ALTER TABLE "Order" ALTER COLUMN "deliveryMethod" DROP NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "deliveryMethod" SET DEFAULT 'delivery';
UPDATE "Order" SET "deliveryMethod" = 'delivery' WHERE "deliveryMethod" IS NULL;
