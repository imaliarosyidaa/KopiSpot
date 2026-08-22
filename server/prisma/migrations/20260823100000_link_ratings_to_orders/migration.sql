ALTER TABLE "ratings" ADD COLUMN "orderId" TEXT;
ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_userId_placeId_key";
CREATE UNIQUE INDEX "ratings_orderId_key" ON "ratings"("orderId");
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;