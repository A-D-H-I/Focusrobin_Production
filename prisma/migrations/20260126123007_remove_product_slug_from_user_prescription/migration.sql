-- Remove productSlug from UserPrescription
-- Prescription is shared across all products, so product name is not needed

-- Drop index first (if it exists)
DROP INDEX IF EXISTS "UserPrescription_productSlug_idx";

-- Then drop the column
ALTER TABLE "UserPrescription" 
DROP COLUMN IF EXISTS "productSlug";

