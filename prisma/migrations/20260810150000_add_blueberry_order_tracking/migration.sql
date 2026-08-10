-- CreateEnum
CREATE TYPE "BlueberryOrderStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PLACED', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "blueberryOrderStatus" "BlueberryOrderStatus" NOT NULL DEFAULT 'NOT_APPLICABLE';
ALTER TABLE "Order" ADD COLUMN     "blueberryOrderId" TEXT;
ALTER TABLE "Order" ADD COLUMN     "blueberryOrderedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN     "blueberryOrderError" TEXT;
ALTER TABLE "Order" ADD COLUMN     "blueberryOrderAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Order_blueberryOrderId_key" ON "Order"("blueberryOrderId");

-- CreateIndex
CREATE INDEX "Order_blueberryOrderStatus_idx" ON "Order"("blueberryOrderStatus");
