-- CreateTable
CREATE TABLE "LensBundlePrice" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LensBundlePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LensBundlePrice_bundleId_key" ON "LensBundlePrice"("bundleId");
