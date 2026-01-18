# Supabase Database Setup Instructions

## The Error
The error "insert or update on table 'admins' violates foreign key constraint 'admins_id_fkey'" means the `admins` table has an improper foreign key relationship with the `auth.users` table.

## Solution

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project: "ziquhxrfxywsmvunuyzi"
3. Navigate to **SQL Editor**

### Step 2: Run the Setup SQL
1. Click **New Query**
2. Copy all the SQL from `supabase-setup.sql` file
3. Paste it into the SQL editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify the Setup
After running the SQL, you should see:
- ✅ Tables created successfully
- ✅ Row Level Security (RLS) enabled
- ✅ Indexes created for performance
- ✅ Triggers configured

### Step 4: Test the Admin Registration
1. Go to your admin registration page
2. Try creating a new admin account
3. You should now be able to create accounts without the foreign key error

## What This SQL Does

1. **Creates the `admins` table** with:
   - `id` - UUID linked to auth.users (the foreign key)
   - `employee_id` - Unique identifier (e.g., EMP-001)
   - `email` - Admin email address
   - `full_name` - Admin's full name
   - `role` - Admin role (default: 'admin')
   - `created_at` - Account creation timestamp
   - `updated_at` - Last update timestamp

2. **Enables Row Level Security (RLS)** for data protection

3. **Creates security policies** so:
   - Users can only see their own record
   - Admins can see all records
   - Users can only insert/update their own data

4. **Creates indexes** for fast queries on employee_id, email, and role

5. **Creates an auto-update trigger** to keep `updated_at` current

## If You Get Errors

If the table already exists with constraints, you may need to:

1. **Drop the existing table** (WARNING: This deletes data!):
```sql
DROP TABLE IF EXISTS public.admins CASCADE;
```

2. Then run the setup SQL above

3. Or manually check the table structure in the Supabase dashboard and adjust as needed

## Need Help?

Check your table structure:
1. Go to Supabase Dashboard
2. **Table Editor** → Look for "admins" table
3. Verify the foreign key relationship with auth.users
