UPDATE "orders"
SET "status" = 'PACKED'
WHERE "paymentStatus" = 'PAID'
  AND "status" IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY');

UPDATE "orders"
SET "status" = 'PENDING_PAYMENT', "paymentStatus" = 'PENDING'
WHERE "paymentStatus" IN ('UNPAID', 'PENDING')
  AND "status" IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY');