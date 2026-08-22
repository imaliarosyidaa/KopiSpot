ALTER TABLE "orders" ADD COLUMN "checkoutSessionId" TEXT;
ALTER TABLE "orders" ADD COLUMN "midtransOrderId" TEXT;
ALTER TABLE "orders" ADD COLUMN "midtransSnapToken" TEXT;
ALTER TABLE "orders" ADD COLUMN "midtransRedirectUrl" TEXT;
ALTER TABLE "orders" ADD COLUMN "midtransTransactionStatus" TEXT;
CREATE UNIQUE INDEX "orders_checkoutSessionId_key" ON "orders"("checkoutSessionId");
CREATE UNIQUE INDEX "orders_midtransOrderId_key" ON "orders"("midtransOrderId");