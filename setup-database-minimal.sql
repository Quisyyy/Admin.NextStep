-- MINIMAL Database Setup - No RLS (for testing)
-- Run this to test if basic database connectivity works

-- ============================================================================
-- STEP 1: Create ADMINS TABLE (if it doesn't exist)
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

-- ============================================================================
-- STEP 2: Create ALUMNI_PROFILES TABLE (if it doesn't exist)
-- ============================================================================
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
-- STEP 3: DISABLE RLS (temporary - for testing)
-- ============================================================================
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Remove ALL existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to insert own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.admins;
DROP POLICY IF EXISTS "Allow admins to view all records" ON public.admins;
DROP POLICY IF EXISTS "Allow public to view all alumni" ON public.alumni_profiles;
DROP POLICY IF EXISTS "Allow admins to manage alumni" ON public.alumni_profiles;
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
DROP POLICY IF EXISTS "admins_select_all" ON public.admins;
DROP POLICY IF EXISTS "admins_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_update_own" ON public.admins;
DROP POLICY IF EXISTS "admins_delete_own" ON public.admins;

-- ============================================================================
-- STEP 5: Create triggers for auto-updating timestamps
-- ============================================================================
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
DROP TRIGGER IF EXISTS update_alumni_profiles_updated_at ON public.alumni_profiles;
DROP FUNCTION IF EXISTS public.update_admins_timestamp();
DROP FUNCTION IF EXISTS public.update_alumni_profiles_timestamp();

CREATE FUNCTION public.update_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_timestamp();

CREATE FUNCTION public.update_alumni_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alumni_profiles_updated_at
    BEFORE UPDATE ON public.alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_alumni_profiles_timestamp();

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT 'Basic database setup complete! RLS disabled for testing.' as status;
