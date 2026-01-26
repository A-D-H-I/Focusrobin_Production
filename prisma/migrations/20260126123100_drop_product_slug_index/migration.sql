-- Drop the index on productSlug if it still exists
-- This is a cleanup migration in case the index wasn't dropped when the column was removed

DROP INDEX IF EXISTS "UserPrescription_productSlug_idx";

