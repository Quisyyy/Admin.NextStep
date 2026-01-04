-- Fix: Corrected get_admin_email function
-- Run this in Supabase SQL Editor

-- Drop the broken function
DROP FUNCTION IF EXISTS public.get_admin_email(text);

-- Create the corrected function that returns TEXT (not TABLE)
CREATE FUNCTION public.get_admin_email(p_employee_id TEXT)
RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM public.admins
    WHERE employee_id = p_employee_id
    LIMIT 1;
    
    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_admin_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_email(text) TO authenticated;

SELECT 'Function fixed!' as status;
