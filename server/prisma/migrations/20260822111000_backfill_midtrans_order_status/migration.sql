UPDATE "orders"
SET "status" = 'PENDING_PAYMENT'
WHERE "status" = 'PENDING' AND "paymentStatus" <> 'PAID';

UPDATE "orders"
SET "status" = 'PACKED'
WHERE "paymentStatus" = 'PAID'
  AND "status" IN ('PENDING', 'CONFIRMED', 'PREPARING');

UPDATE "orders"
SET "paymentStatus" = 'PENDING'
WHERE "paymentStatus" = 'UNPAID'
  AND "status" = 'PENDING_PAYMENT';

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';
ALTER TABLE "orders" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';