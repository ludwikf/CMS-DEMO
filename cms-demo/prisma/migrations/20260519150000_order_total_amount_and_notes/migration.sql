-- schema.prisma: totalAmount, notes — w migracjach historycznych ich nie było (było orderName)

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'orderName'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Order" RENAME COLUMN "orderName" TO "notes";
    ALTER TABLE "Order" ALTER COLUMN "notes" DROP NOT NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Order' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "Order" ADD COLUMN "notes" TEXT;
  END IF;
END $$;
