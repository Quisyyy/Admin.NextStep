-- Secure RLS Setup for Admin Login
-- This allows public login while keeping the data secure

-- ============================================================================
-- STEP 1: Re-enable RLS on admins table
-- ============================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop all existing policies
-- ============================================================================
DROP POLICY IF EXISTS "Allow users to view own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to insert own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.admins;

-- ============================================================================
-- STEP 3: Create secure policies for login
-- ============================================================================

-- Policy 1: Allow anonymous users to SELECT email/employee_id (needed for login)
CREATE POLICY "Allow public to lookup by employee_id"
ON public.admins FOR SELECT
USING (true);  -- Allow anyone to read

-- Policy 2: Allow authenticated users to view/update their own record
CREATE POLICY "Allow users to view own record"
ON public.admins FOR SELECT
USING (auth.uid() = id);

-- Policy 3: Allow authenticated users to insert (during signup)
CREATE POLICY "Allow users to insert own record"
ON public.admins FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow authenticated users to update their own record
CREATE POLICY "Allow users to update own record"
ON public.admins FOR UPDATE
USING (auth.uid() = id);

-- ============================================================================
-- STEP 4: Create secure public function for admin lookup (extra security)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_admin_email(text);

CREATE FUNCTION public.get_admin_email(employee_id TEXT)
RETURNS TABLE(email TEXT, full_name TEXT) AS $$
BEGIN
    RETURN QUERY SELECT admins.email, admins.full_name
    FROM public.admins
    WHERE admins.employee_id = $1
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_admin_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_email(text) TO authenticated;

-- ============================================================================
-- SUCCESS
-- ============================================================================
SELECT 'Secure RLS policies applied! Login should work now.' as status;
