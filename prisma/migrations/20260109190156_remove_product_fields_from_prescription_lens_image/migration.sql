-- Remove productId and productSlug columns from PrescriptionLensImage

-- Drop foreign key constraint first
ALTER TABLE PrescriptionLensImage DROP CONSTRAINT IF EXISTS PrescriptionLensImage_productId_fkey;

-- Drop indexes
DROP INDEX IF EXISTS PrescriptionLensImage_productId_idx;
DROP INDEX IF EXISTS PrescriptionLensImage_productId_lensType_idx;
DROP INDEX IF EXISTS PrescriptionLensImage_productSlug_idx;

-- Drop columns
ALTER TABLE PrescriptionLensImage DROP COLUMN IF EXISTS productId;
ALTER TABLE PrescriptionLensImage DROP COLUMN IF EXISTS productSlug;
