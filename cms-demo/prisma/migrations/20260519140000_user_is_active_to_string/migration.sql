-- schema.prisma: isActive String; w DB pozostał enum "IsActivate" (TRUE/FALSE/PENDING)
ALTER TABLE "User" ALTER COLUMN "isActive" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "isActive" TYPE TEXT USING ("isActive"::text);
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT 'PENDING';

DROP TYPE IF EXISTS "IsActivate";
