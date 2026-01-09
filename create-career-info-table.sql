-- Create career_info table for storing alumni career data
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.career_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alumni_id UUID REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
    job_status TEXT,
    current_position TEXT,
    previous_roles TEXT,
    career_path TEXT,
    industry TEXT,
    certificates TEXT,
    mentorship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.career_info ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if they exist)
DROP POLICY IF EXISTS "Allow public to view career info" ON public.career_info;
DROP POLICY IF EXISTS "Allow admins to manage career info" ON public.career_info;

CREATE POLICY "Allow public to view career info" ON public.career_info
    FOR SELECT USING (true);

CREATE POLICY "Allow admins to manage career info" ON public.career_info
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid()
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS career_info_alumni_id_idx ON public.career_info(alumni_id);
CREATE INDEX IF NOT EXISTS career_info_job_status_idx ON public.career_info(job_status);
CREATE INDEX IF NOT EXISTS career_info_industry_idx ON public.career_info(industry);

-- Create trigger to update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_career_info_updated_at ON public.career_info;

CREATE OR REPLACE FUNCTION update_career_info_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_career_info_updated_at
    BEFORE UPDATE ON public.career_info
    FOR EACH ROW
    EXECUTE FUNCTION update_career_info_timestamp();

-- Verify table creation
SELECT 
    'career_info table created successfully' as status,
    COUNT(*) as total_records
FROM public.career_info;
