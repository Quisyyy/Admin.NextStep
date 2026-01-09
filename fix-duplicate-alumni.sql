-- Fix Duplicate Alumni Records
-- This script removes duplicate alumni entries and ensures data integrity

-- STEP 1: Find and display duplicates (for review)
SELECT 
    email,
    student_number,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as duplicate_ids
FROM public.alumni_profiles
GROUP BY email, student_number
HAVING COUNT(*) > 1;

-- STEP 2: Keep only the most recent record for each duplicate
-- Delete older duplicate records, keeping the newest one
WITH duplicates AS (
    SELECT 
        id,
        email,
        student_number,
        ROW_NUMBER() OVER (
            PARTITION BY 
                COALESCE(email, ''), 
                COALESCE(student_number, '')
            ORDER BY created_at DESC
        ) as row_num
    FROM public.alumni_profiles
    WHERE email IS NOT NULL OR student_number IS NOT NULL
)
DELETE FROM public.alumni_profiles
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- STEP 3: Ensure email is unique (if not already)
-- First, check if constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'alumni_profiles_email_key'
    ) THEN
        ALTER TABLE public.alumni_profiles 
        ADD CONSTRAINT alumni_profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- STEP 4: Add unique constraint on student_number (if needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'alumni_profiles_student_number_key'
    ) THEN
        ALTER TABLE public.alumni_profiles 
        ADD CONSTRAINT alumni_profiles_student_number_key UNIQUE (student_number);
    END IF;
END $$;

-- STEP 5: Verify the fixes
SELECT 
    'Total Alumni' as metric,
    COUNT(*) as count
FROM public.alumni_profiles

UNION ALL

SELECT 
    'Unique Emails' as metric,
    COUNT(DISTINCT email) as count
FROM public.alumni_profiles

UNION ALL

SELECT 
    'Unique Student Numbers' as metric,
    COUNT(DISTINCT student_number) as count
FROM public.alumni_profiles;
