-- Fix login by creating a public function to lookup admin email
-- Run this in Supabase SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_admin_email(text);

-- Create a secure public function to get email by employee_id
-- This bypasses RLS and allows unauthenticated users to look up emails
CREATE FUNCTION public.get_admin_email(employee_id TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_email TEXT;
BEGIN
    SELECT email INTO admin_email
    FROM public.admins
    WHERE admins.employee_id = get_admin_email.employee_id
    LIMIT 1;
    
    RETURN admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon (unauthenticated users)
GRANT EXECUTE ON FUNCTION public.get_admin_email(text) TO anon;

SELECT 'Login fix applied! Function created.' as status;
