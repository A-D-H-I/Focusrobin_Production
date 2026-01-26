-- CreateTable
CREATE TABLE "PrescriptionLensPrice" (
    "id" TEXT NOT NULL,
    "lensType" TEXT NOT NULL,
    "lensIndex" TEXT NOT NULL,
    "coating" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionLensPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionTintFee" (
    "id" TEXT NOT NULL,
    "tintType" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionTintFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionEdgingFee" (
    "id" TEXT NOT NULL,
    "frameType" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionEdgingFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionProfit" (
    "id" TEXT NOT NULL,
    "profit" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionProfit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionLensPrice_lensType_lensIndex_coating_key" ON "PrescriptionLensPrice"("lensType", "lensIndex", "coating");

-- CreateIndex
CREATE INDEX "PrescriptionLensPrice_lensType_idx" ON "PrescriptionLensPrice"("lensType");

-- CreateIndex
CREATE INDEX "PrescriptionLensPrice_lensType_lensIndex_idx" ON "PrescriptionLensPrice"("lensType", "lensIndex");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionTintFee_tintType_key" ON "PrescriptionTintFee"("tintType");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionEdgingFee_frameType_key" ON "PrescriptionEdgingFee"("frameType");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionProfit_isActive_key" ON "PrescriptionProfit"("isActive");

