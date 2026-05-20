-- Draft orders: remove Cart/CartItem, add DRAFT status, optional shipping/customer
-- Run this migration manually if prisma migrate fails (e.g. due to missing previous migration).

-- 1. Add DRAFT to OrderStatus enum (run once; if already exists, skip or comment out)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

-- 2. Add shipping/customer/company columns if they don't exist (required for shadow DB / fresh apply)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shipping" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customer" JSONB;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "company" JSONB;
-- Make shipping/customer nullable (only when they have NOT NULL, e.g. from prior manual schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Order' AND column_name='shipping' AND is_nullable='NO') THEN
    ALTER TABLE "Order" ALTER COLUMN "shipping" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Order' AND column_name='customer' AND is_nullable='NO') THEN
    ALTER TABLE "Order" ALTER COLUMN "customer" DROP NOT NULL;
  END IF;
END $$;

-- 3. Set default status to DRAFT for new rows (optional; Prisma handles this)
-- ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- 4. Drop Cart and CartItem (order matters: items first due to FK)
DROP TABLE IF EXISTS "CartItem";
DROP TABLE IF EXISTS "Cart";

-- 5. Remove User.cart relation (Cart table is dropped, so no schema change needed for User)
