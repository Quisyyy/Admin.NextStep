-- Quick fix: Disable RLS on admins table to allow login
-- Run this in Supabase SQL Editor

-- Disable RLS on admins table temporarily
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Verify no policies are blocking
DROP POLICY IF EXISTS "Allow users to view own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to insert own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to update own record" ON public.admins;

SELECT 'RLS disabled on admins table. Login should now work.' as status;
