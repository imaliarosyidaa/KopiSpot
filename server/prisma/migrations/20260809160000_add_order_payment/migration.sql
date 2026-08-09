-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "note" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
