-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "applicableBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "applicableGenders" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
ADD COLUMN     "applicableProductTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "showAsCoupon" BOOLEAN NOT NULL DEFAULT false;
