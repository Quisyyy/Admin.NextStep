-- Simplified Supabase Database Setup for NextStep Admin
-- Run this FIRST if the RLS policies version has issues
-- This creates the basic tables without complex RLS

-- ============================================================================
-- STEP 1: Create/Verify ADMINS TABLE
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
-- STEP 2: Create/Verify ALUMNI_PROFILES TABLE
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
-- STEP 3: Enable RLS on tables
-- ============================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create simple RLS policies for admins table
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow users to view own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to insert own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.admins;
DROP POLICY IF EXISTS "Allow admins to view all records" ON public.admins;

-- Policy 1: Users can view their own record
CREATE POLICY "Allow users to view own record" ON public.admins
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can insert their own record during signup
CREATE POLICY "Allow users to insert own record" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own record
CREATE POLICY "Allow users to update own record" ON public.admins
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STEP 5: Create simple RLS policies for alumni_profiles table
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public to view all alumni" ON public.alumni_profiles;
DROP POLICY IF EXISTS "Allow admins to manage alumni" ON public.alumni_profiles;

-- Policy 1: Anyone can view alumni profiles
CREATE POLICY "Allow public to view all alumni" ON public.alumni_profiles
    FOR SELECT USING (true);

-- Policy 2: Admins can insert, update, and delete alumni records
CREATE POLICY "Allow admins to manage alumni" ON public.alumni_profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.admins WHERE role = 'admin'
        )
    );

-- ============================================================================
-- STEP 6: Create trigger for auto-updating timestamps
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
DROP TRIGGER IF EXISTS update_alumni_profiles_updated_at ON public.alumni_profiles;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_admins_timestamp();
DROP FUNCTION IF EXISTS public.update_alumni_profiles_timestamp();

-- Create function for admins table
CREATE FUNCTION public.update_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admins table
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_timestamp();

-- Create function for alumni_profiles table
CREATE FUNCTION public.update_alumni_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for alumni_profiles table
CREATE TRIGGER update_alumni_profiles_updated_at
    BEFORE UPDATE ON public.alumni_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_alumni_profiles_timestamp();

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT 'Database setup complete!' as status;
