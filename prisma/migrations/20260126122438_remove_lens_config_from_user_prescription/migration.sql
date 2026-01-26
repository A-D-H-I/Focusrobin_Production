-- Remove lens configuration and price breakdown fields from UserPrescription
-- These fields are product-specific and should not be stored in the database
-- They are stored in localStorage/sessionStorage per product instead

ALTER TABLE "UserPrescription" 
DROP COLUMN IF EXISTS "lensType",
DROP COLUMN IF EXISTS "lensIndex",
DROP COLUMN IF EXISTS "coating",
DROP COLUMN IF EXISTS "tintType",
DROP COLUMN IF EXISTS "tintColor",
DROP COLUMN IF EXISTS "tintShadePercent",
DROP COLUMN IF EXISTS "tintRecipe",
DROP COLUMN IF EXISTS "photochromicColor",
DROP COLUMN IF EXISTS "polarizedColor",
DROP COLUMN IF EXISTS "frameType",
DROP COLUMN IF EXISTS "lensesPair",
DROP COLUMN IF EXISTS "edgingFee",
DROP COLUMN IF EXISTS "profit",
DROP COLUMN IF EXISTS "rxRetailNet",
DROP COLUMN IF EXISTS "totalNet";

