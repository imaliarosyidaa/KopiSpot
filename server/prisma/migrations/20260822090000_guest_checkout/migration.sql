-- Allow checkout and payment before a user signs in.
ALTER TABLE "orders" ADD COLUMN "guestToken" TEXT;
ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_userId_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "orders_guestToken_key" ON "orders"("guestToken");