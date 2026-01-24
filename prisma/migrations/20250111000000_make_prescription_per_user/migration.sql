-- Step 1: Delete duplicate prescriptions, keeping only the most recent one per user
-- (based on updatedAt timestamp)
DELETE FROM "UserPrescription" 
WHERE id NOT IN (
    SELECT DISTINCT ON ("userId") id 
    FROM "UserPrescription" 
    ORDER BY "userId", "updatedAt" DESC
);

-- Step 2: Make productSlug nullable
ALTER TABLE "UserPrescription" 
ALTER COLUMN "productSlug" DROP NOT NULL;

-- Step 3: Drop the old unique constraint on (userId, productSlug)
ALTER TABLE "UserPrescription" 
DROP CONSTRAINT IF EXISTS "UserPrescription_userId_productSlug_key";

-- Step 4: Add new unique constraint on userId only (one prescription per user)
ALTER TABLE "UserPrescription" 
ADD CONSTRAINT "UserPrescription_userId_key" UNIQUE ("userId");

