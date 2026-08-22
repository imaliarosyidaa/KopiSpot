ALTER TABLE "orders" ADD COLUMN "paymentTransactionId" TEXT;
CREATE UNIQUE INDEX "orders_paymentTransactionId_key" ON "orders"("paymentTransactionId");