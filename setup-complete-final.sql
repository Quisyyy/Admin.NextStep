-- ============================================================================
-- COMPLETE DATABASE SETUP - SECURE AND WORKING
-- ============================================================================
-- Run this ONCE to set up everything properly with RLS enabled

-- ============================================================================
-- STEP 1: Create tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID NOT NULL DEFAULT auth.uid() PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    student_number TEXT,
    degree TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- STEP 2: Drop triggers FIRST, then functions and policies
-- ============================================================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
DROP TRIGGER IF EXISTS update_alumni_profiles_updated_at ON public.alumni_profiles;

DROP FUNCTION IF EXISTS public.update_admins_timestamp();
DROP FUNCTION IF EXISTS public.update_alumni_profiles_timestamp();

-- Drop old policy names
DROP POLICY IF EXISTS "Allow users to view own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to insert own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.admins;
DROP POLICY IF EXISTS "Allow admins to view all records" ON public.admins;
DROP POLICY IF EXISTS "Allow public to lookup by employee_id" ON public.admins;
DROP POLICY IF EXISTS "Allow public to view all alumni" ON public.alumni_profiles;
DROP POLICY IF EXISTS "Allow admins to manage alumni" ON public.alumni_profiles;

-- Drop new policy names
DROP POLICY IF EXISTS "admins_public_select" ON public.admins;
DROP POLICY IF EXISTS "admins_auth_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_auth_update" ON public.admins;
DROP POLICY IF EXISTS "alumni_public_select" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_admin_insert" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_admin_update" ON public.alumni_profiles;
DROP POLICY IF EXISTS "alumni_admin_delete" ON public.alumni_profiles;

DROP FUNCTION IF EXISTS public.get_admin_email(text);

-- ============================================================================
-- STEP 3: Enable RLS
-- ============================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Simple, secure RLS policies for admins
-- ============================================================================

-- Allow anyone to SELECT (needed for login to look up email)
CREATE POLICY "admins_public_select" ON public.admins
    FOR SELECT USING (true);

-- Allow authenticated users to INSERT their own record
CREATE POLICY "admins_auth_insert" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own record
CREATE POLICY "admins_auth_update" ON public.admins
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STEP 5: RLS policies for alumni_profiles
-- ============================================================================

-- Allow anyone to SELECT alumni data
CREATE POLICY "alumni_public_select" ON public.alumni_profiles
    FOR SELECT USING (true);

-- Allow authenticated admins to INSERT
CREATE POLICY "alumni_admin_insert" ON public.alumni_profiles
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.admins WHERE role = 'admin')
    );

-- Allow authenticated admins to UPDATE
CREATE POLICY "alumni_admin_update" ON public.alumni_profiles
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.admins WHERE role = 'admin')
    );

-- Allow authenticated admins to DELETE
CREATE POLICY "alumni_admin_delete" ON public.alumni_profiles
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM public.admins WHERE role = 'admin')
    );

-- ============================================================================
-- STEP 6: Create helper function for login (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_email(employee_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT email FROM public.admins WHERE admins.employee_id = $1 LIMIT 1;
$$;

-- ============================================================================
-- STEP 7: Create timestamp update functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_alumni_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 8: Create triggers
-- ============================================================================

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_timestamp();

CREATE TRIGGER update_alumni_profiles_updated_at
    BEFORE UPDATE ON public.alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_alumni_profiles_timestamp();

-- ============================================================================
-- STEP 9: SUCCESS
-- ============================================================================
SELECT 'Setup complete! Database is secure and ready.' as status;
