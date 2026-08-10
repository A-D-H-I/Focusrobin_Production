-- CreateEnum
CREATE TYPE "Supplier" AS ENUM ('BIGBUY', 'BLUEBERRY', 'MANUAL');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "supplier" "Supplier" NOT NULL DEFAULT 'BIGBUY';

-- AlterTable
ALTER TABLE "PrescriptionGlasses" ADD COLUMN     "supplier" "Supplier" NOT NULL DEFAULT 'BIGBUY';

-- CreateIndex
CREATE INDEX "Product_supplier_idx" ON "Product"("supplier");

-- CreateIndex
CREATE INDEX "PrescriptionGlasses_supplier_idx" ON "PrescriptionGlasses"("supplier");
