-- Supabase Database Setup for NextStep Admin - RLS POLICIES
-- Run this SQL in your Supabase dashboard (SQL Editor)
-- This script safely updates the existing admins table with proper Row Level Security (RLS)

-- ============================================================================
-- IMPORTANT SETUP INSTRUCTIONS:
-- ============================================================================
-- 1. Log into your Supabase dashboard (https://app.supabase.com)
-- 2. Go to your project
-- 3. Navigate to SQL Editor (left sidebar)
-- 4. Click "New Query" and paste this entire script
-- 5. Click "Run" to execute
-- 6. You should see "Admins table setup complete!" message at the bottom
-- ============================================================================

-- First, drop existing policies if they exist (safe cleanup)
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
DROP POLICY IF EXISTS "admins_select_all" ON public.admins;
DROP POLICY IF EXISTS "admins_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_update_own" ON public.admins;
DROP POLICY IF EXISTS "admins_delete_own" ON public.admins;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.update_admins_timestamp();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- This ensures data access is controlled via policies
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy 1: Users can read their own record
CREATE POLICY "admins_select_own" ON public.admins
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Admins can read all admin records
CREATE POLICY "admins_select_all" ON public.admins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy 3: New users can register (insert their own record)
CREATE POLICY "admins_insert" ON public.admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update their own record
CREATE POLICY "admins_update_own" ON public.admins
    FOR UPDATE USING (auth.uid() = id);

-- Policy 5: Users can delete their own record
CREATE POLICY "admins_delete_own" ON public.admins
    FOR DELETE USING (auth.uid() = id);

-- ============================================================================
-- CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================
-- This function automatically updates the updated_at column when records change

CREATE FUNCTION public.update_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls this function before each UPDATE
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_admins_timestamp();

-- ============================================================================
-- VERIFY THE ADMINS TABLE STRUCTURE
-- ============================================================================
-- You should see columns like:
-- - id (uuid, primary key)
-- - email (text)
-- - employee_id (text)
-- - full_name (text)
-- - role (text)
-- - created_at (timestamp)
-- - updated_at (timestamp)

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Admins table setup complete!' as status;
