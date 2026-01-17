-- ============================================================================
-- FIX RLS POLICIES TO ALLOW DATA ACCESS
-- ============================================================================
-- Current policies are too restrictive and blocking data retrieval

-- Step 1: Disable RLS on tables temporarily to diagnose
ALTER TABLE public.alumni_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_archive DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify data exists
SELECT COUNT(*) as alumni_count FROM public.alumni_profiles;
SELECT COUNT(*) as archive_count FROM public.alumni_archive;

-- Step 3: Re-enable RLS with PERMISSIVE policies
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_archive ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop all existing policies
DROP POLICY IF EXISTS "alumni_profiles_select" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_profiles_insert" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_profiles_update" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_profiles_delete" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_archive_select" ON public.alumni_archive;
DROP POLICY IF EXISTS "alumni_archive_all" ON public.alumni_archive;

-- Step 5: Create PERMISSIVE policies that allow all authenticated users
CREATE POLICY "allow_all_select_profiles" ON public.alumni_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "allow_all_insert_profiles" ON public.alumni_profiles
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "allow_all_update_profiles" ON public.alumni_profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_delete_profiles" ON public.alumni_profiles
    FOR DELETE
    USING (true);

CREATE POLICY "allow_all_select_archive" ON public.alumni_archive
    FOR SELECT
    USING (true);

CREATE POLICY "allow_all_insert_archive" ON public.alumni_archive
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "allow_all_update_archive" ON public.alumni_archive
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_delete_archive" ON public.alumni_archive
    FOR DELETE
    USING (true);

SELECT 'RLS policies fixed - all data should now be visible!' as status;
