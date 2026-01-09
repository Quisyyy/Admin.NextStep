-- Insert sample career data for testing
-- Run this in Supabase SQL Editor to populate career_info table with test data

-- First check if career_info table exists
-- If it doesn't exist, run create-career-info-table.sql first

-- Sample career data (without alumni_id for now - will be added manually if needed)
INSERT INTO public.career_info (job_status, current_position, industry, mentorship, previous_roles, career_path, certificates)
VALUES 
    ('Employed', 'Software Engineer', 'IT', 'Yes', 'Junior Developer, Intern', 'Technology', 'AWS Certified Solutions Architect'),
    ('Employed', 'Marketing Manager', 'Marketing', 'Yes', 'Marketing Specialist', 'Business', 'Google Ads Certified'),
    ('Self-Employed', 'Freelance Designer', 'Creative', 'Maybe', 'Graphic Designer', 'Design', 'Adobe Certified Expert'),
    ('Employed', 'Data Analyst', 'IT', 'Yes', 'Business Analyst', 'Technology', 'Microsoft Certified: Data Analyst'),
    ('Freelancer', 'Content Writer', 'Media', 'No', 'Junior Writer', 'Communications', 'HubSpot Content Marketing'),
    ('Unemployed', NULL, NULL, 'Yes', 'Sales Associate', 'Retail', NULL),
    ('Student', NULL, 'Education', 'Maybe', 'Teaching Assistant', 'Education', NULL),
    ('Employed', 'Financial Analyst', 'Finance', 'Yes', 'Junior Analyst', 'Finance', 'CFA Level 1'),
    ('Self-Employed', 'Business Consultant', 'Consulting', 'Yes', 'Management Trainee', 'Business', 'PMP Certified'),
    ('Employed', 'Nurse', 'Healthcare', 'Yes', 'Nursing Assistant', 'Healthcare', 'RN License'),
    ('Employed', 'Civil Engineer', 'Engineering', 'Maybe', 'Junior Engineer', 'Engineering', 'PE License'),
    ('Freelancer', 'Web Developer', 'IT', 'Yes', 'Frontend Developer', 'Technology', 'React Certified'),
    ('Employed', 'Teacher', 'Education', 'Yes', NULL, 'Education', 'Teaching License'),
    ('Career Break', NULL, NULL, 'No', 'HR Manager', 'Human Resources', 'SHRM-CP'),
    ('Employed', 'Accountant', 'Finance', 'Yes', 'Junior Accountant', 'Finance', 'CPA'),
    ('Self-Employed', 'Photographer', 'Creative', 'Maybe', 'Photo Assistant', 'Arts', NULL),
    ('Employed', 'Sales Manager', 'Sales', 'Yes', 'Sales Representative', 'Business', 'Salesforce Certified'),
    ('Employed', 'Research Scientist', 'Research', 'Yes', 'Research Assistant', 'Science', 'PhD'),
    ('Unemployed', NULL, NULL, 'Yes', 'Customer Service', 'Service', NULL),
    ('Student', NULL, 'Education', 'Yes', 'Lab Technician', 'Science', NULL);

-- Verify the data was inserted
SELECT 
    job_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM career_info), 2) as percentage
FROM public.career_info
GROUP BY job_status
ORDER BY count DESC;

-- Check total records
SELECT COUNT(*) as total_career_records FROM public.career_info;

-- View sample data
SELECT * FROM public.career_info LIMIT 5;
