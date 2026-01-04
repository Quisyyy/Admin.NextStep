-- Add sample alumni data for testing
-- Run this in Supabase SQL Editor to populate test data

INSERT INTO public.alumni_profiles (email, full_name, student_number, degree, status) VALUES
('student1@example.com', 'Alice Johnson', 'STU-001', 'Bachelor of Science in Computer Science', 'active'),
('student2@example.com', 'Bob Smith', 'STU-002', 'Bachelor of Arts in Business Administration', 'active'),
('student3@example.com', 'Carol Davis', 'STU-003', 'Master of Science in Data Science', 'completed'),
('student4@example.com', 'David Wilson', 'STU-004', 'Bachelor of Engineering', 'active'),
('student5@example.com', 'Emma Brown', 'STU-005', 'Bachelor of Commerce', 'completed'),
('student6@example.com', 'Frank Miller', 'STU-006', 'Bachelor of Science in Biology', 'active'),
('student7@example.com', 'Grace Lee', 'STU-007', 'Master of Business Administration', 'completed'),
('student8@example.com', 'Henry Martinez', 'STU-008', 'Bachelor of Arts in Psychology', 'active'),
('student9@example.com', 'Isabella Garcia', 'STU-009', 'Bachelor of Education', 'active'),
('student10@example.com', 'Jack Taylor', 'STU-010', 'Bachelor of Science in Physics', 'completed');

SELECT 'Sample data added! ' || COUNT(*) || ' alumni records created.' as status FROM public.alumni_profiles;
