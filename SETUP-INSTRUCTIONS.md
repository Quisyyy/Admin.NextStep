# NextStep Admin System - Complete Setup Instructions

## Overview
This document provides step-by-step instructions to set up your new database with complete security for both Admin and Alumni login systems.

---

## Phase 1: Database Setup (Supabase)

### Step 1: Execute Database Schema
1. Log into your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create a new query and paste the contents of **`database-schema.sql`**
4. Click **Run** to execute

**What this does:**
- Creates all required tables (admins, alumni_profiles, career history, audit logs, etc.)
- Sets up indexes for performance
- Enables automatic timestamp updates
- Enables Row Level Security (RLS) on all tables

### Step 2: Execute RLS Policies
1. In the **SQL Editor**, create a new query
2. Paste the contents of **`database-rls-policies.sql`**
3. Click **Run** to execute

**What this does:**
- Implements Row Level Security policies for fine-grained access control
- Ensures admins can only view appropriate data
- Ensures alumni can only view/edit their own records
- Protects audit logs from unauthorized access

### Step 3: Verify Tables Were Created
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `admins`
   - `alumni_profiles`
   - `alumni_career_history`
   - `audit_logs`
   - `duplicate_records`
   - `bulk_upload_logs`

---

## Phase 2: Update Configuration Files

### Step 1: Update `supabase-client.js`
The existing file is good, but make sure you have your Supabase URL and Anon Key set:

```javascript
// In your HTML file, before loading scripts, add:
<script>
    window.SUPABASE_URL = 'your_supabase_url';
    window.SUPABASE_ANON_KEY = 'your_supabase_anon_key';
</script>
```

Find these in your **Supabase Dashboard** → **Settings** → **API**.

### Step 2: Replace `db-helper.js` with `new-db-helper.js`
1. Backup your current `db-helper.js`
2. Replace it with `new-db-helper.js` (or rename the new one to `db-helper.js`)

The new version includes:
- ✅ Enhanced security validations
- ✅ Password strength checking
- ✅ Audit logging
- ✅ Both admin and alumni authentication
- ✅ Role-based access control
- ✅ Session management

### Step 3: Update HTML Files to Load New Scripts

Add this to your **admin-login.html**, **admin-register.html**, **alumni-login.html**, etc.:

```html
<!-- Supabase Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Configuration -->
<script>
    window.SUPABASE_URL = 'your_supabase_url';
    window.SUPABASE_ANON_KEY = 'your_supabase_anon_key';
</script>

<!-- Database Client -->
<script src="supabase-client.js"></script>

<!-- Database Helper -->
<script src="db-helper.js"></script>

<!-- Your page-specific script -->
<script src="admin-login.js"></script>
```

---

## Phase 3: Update Login/Registration JavaScript

### Admin Login Example
Update `admin-login.js`:

```javascript
async function handleLogin(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Signing in…');
    setBusy(btn, true);
    
    try {
        const emailOrEmployeeId = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;

        if (!emailOrEmployeeId || !password) {
            throw new Error('Enter your Email/Employee ID and Password.');
        }

        // Use new DatabaseHelper
        const result = await window.DatabaseHelper.loginAdmin(emailOrEmployeeId, password);
        
        if (!result.success) {
            throw new Error(result.error || 'Login failed');
        }

        setStatus(statusEl, '✅ Signed in. Redirecting…', 'success');
        setTimeout(() => { 
            window.location.href = './homepage.html'; 
        }, 600);
    } catch (err) {
        setStatus(statusEl, err.message || 'Login failed', 'error');
    } finally {
        setBusy(btn, false);
    }
}
```

### Admin Registration Example
Update `admin-register.js`:

```javascript
async function handleCreateAccount(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Creating account…');
    setBusy(btn, true);
    
    try {
        const fullName = form.querySelector('[name="fullName"]').value.trim();
        const employeeId = form.querySelector('[name="employeeId"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;
        const confirmPassword = form.querySelector('[name="confirmPassword"]').value;

        if (!fullName || !employeeId || !email || !password) {
            throw new Error('Fill in all required fields.');
        }

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
        }

        // Use new DatabaseHelper
        const result = await window.DatabaseHelper.registerAdmin(
            email,
            password,
            fullName,
            employeeId,
            'HR' // Department (optional)
        );

        if (!result.success) {
            throw new Error(result.error || 'Registration failed');
        }

        setStatus(statusEl, '✅ Account created! You can now login.', 'success');
        setTimeout(() => { 
            window.location.href = './admin-login.html'; 
        }, 1000);
    } catch (err) {
        setStatus(statusEl, err.message || 'Registration failed', 'error');
    } finally {
        setBusy(btn, false);
    }
}
```

### Alumni Login Example
Create `alumni-login.js`:

```javascript
async function handleAlumniLogin(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Signing in…');
    setBusy(btn, true);
    
    try {
        const email = form.querySelector('[name="email"]').value.trim();
        const password = form.querySelector('[name="password"]').value;

        if (!email || !password) {
            throw new Error('Enter your email and password.');
        }

        // Use new DatabaseHelper
        const result = await window.DatabaseHelper.loginAlumni(email, password);
        
        if (!result.success) {
            throw new Error(result.error || 'Login failed');
        }

        setStatus(statusEl, '✅ Signed in. Redirecting…', 'success');
        setTimeout(() => { 
            window.location.href = './alumni-dashboard.html'; 
        }, 600);
    } catch (err) {
        setStatus(statusEl, err.message || 'Login failed', 'error');
    } finally {
        setBusy(btn, false);
    }
}
```

---

## Phase 4: Security Features Enabled

### ✅ Database Security
- **Row Level Security (RLS)**: Each user can only see/modify their own data
- **Audit Logging**: All actions are logged with timestamps and user info
- **Proper Indexing**: Fast queries without performance issues
- **Data Integrity**: Foreign keys prevent orphaned records

### ✅ Authentication Security
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- **Password Reset**: Secure email-based password recovery
- **Session Management**: Proper authentication state handling
- **Account Status**: Disabled accounts cannot login

### ✅ Authorization
- **Role-Based Access**:
  - Admins have elevated privileges
  - Super Admins can manage other admins
  - Alumni can only access their own data
- **Audit Trail**: Every action is logged for compliance

---

## Phase 5: Testing

### Test Admin Registration
1. Go to your admin-register page
2. Create account with:
   - **Full Name**: Test Admin
   - **Employee ID**: EMP001
   - **Email**: testadmin@example.com
   - **Password**: SecurePass123!
3. Should see success message
4. Check Supabase table `admins` for new record

### Test Admin Login
1. Go to admin-login page
2. Login with Employee ID: EMP001, Password: SecurePass123!
3. Should be redirected to homepage

### Test Alumni Registration
1. Create a new HTML file or use existing alumni signup
2. Register with valid email and password meeting requirements
3. Check `alumni_profiles` table for new record

### Test Audit Logging
1. Perform any action (login, register, update profile)
2. Go to Supabase SQL Editor
3. Run: `SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 10;`
4. Should see your actions logged

---

## Database Schema Overview

### admins
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key (references auth user) |
| full_name | TEXT | Admin's full name |
| email | TEXT | Email (unique) |
| employee_id | TEXT | Employee ID (unique) |
| role | TEXT | 'admin' or 'super_admin' |
| is_active | BOOLEAN | Account status |
| last_login | TIMESTAMP | Last login time |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### alumni_profiles
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| auth_user_id | UUID | References auth user |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| email | TEXT | Email (unique) |
| graduation_year | INTEGER | Year of graduation |
| degree_field | TEXT | Field of study |
| current_job_title | TEXT | Current job |
| current_company | TEXT | Current employer |
| is_verified | BOOLEAN | Email verification status |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### audit_logs
| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| admin_id | UUID | Admin who performed action |
| action | TEXT | Type of action |
| resource_type | TEXT | What was modified |
| resource_id | TEXT | ID of resource |
| new_values | JSONB | New data |
| old_values | JSONB | Old data |
| ip_address | TEXT | IP of requestor |
| user_agent | TEXT | Browser info |
| created_at | TIMESTAMP | When action occurred |

---

## Troubleshooting

### Issue: "Supabase client not ready"
- **Solution**: Make sure `supabase-client.js` is loaded before page scripts
- Check browser console for errors

### Issue: "Password does not meet requirements"
- **Solution**: Password must have:
  - 8+ characters
  - 1 uppercase (A-Z)
  - 1 lowercase (a-z)
  - 1 number (0-9)
  - 1 special character (!@#$%^&* etc)

### Issue: "Employee ID already registered"
- **Solution**: Use a unique employee ID, or check with admin to update existing record

### Issue: "Permission denied" on data updates
- **Solution**: RLS policies prevent updating other users' data. Only update your own records or have admin do it.

### Issue: Audit logs not appearing
- **Solution**: 
  1. Make sure you're logged in as an admin
  2. Check Supabase table directly: `SELECT * FROM public.audit_logs;`
  3. Verify admins table has your user with is_active = true

---

## Next Steps

1. ✅ Execute SQL schema and policies
2. ✅ Update configuration with Supabase credentials
3. ✅ Replace db-helper.js with new version
4. ✅ Update HTML files to load scripts correctly
5. ✅ Update login/registration JavaScript
6. ✅ Test all functionality
7. ✅ Deploy to production

---

## Support

If you encounter issues:
1. Check browser console (F12 → Console tab)
2. Check Supabase dashboard for data
3. Run test queries in SQL Editor
4. Verify all scripts are loading correctly

For security issues, follow the guidelines in SECURITY-FIX-GUIDE.md

---

**Setup Date**: January 17, 2026  
**Status**: Complete Setup Package Ready
