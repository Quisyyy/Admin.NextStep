<!-- ============================================================================
     SUPABASE DATABASE SETUP AND INTEGRATION GUIDE
     ============================================================================
     This document walks you through setting up RLS policies and connecting them
     to your JavaScript code.
     ============================================================================ -->

# Supabase Database Setup for NextStep Admin

## Overview

This setup implements **Row Level Security (RLS)** on your Supabase `admins` table to ensure secure, policy-based access to admin records.

### What is RLS?
RLS (Row Level Security) controls database access at the row level. With RLS:
- Users can only access data according to defined policies
- Policies are enforced automatically by the database
- No unauthorized data can be accessed even if the API is compromised

---

## Step 1: Run the SQL Setup Script

### Location
- File: `supabase-setup-rls.sql` in your project root

### How to Execute

1. **Log in to Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the Script**
   - Open `supabase-setup-rls.sql`
   - Copy the entire content
   - Paste into the SQL Editor in your Supabase dashboard

4. **Execute**
   - Click "Run" button
   - You should see: `"Admins table setup complete!"`

### What the Script Does

```sql
-- Enables Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Creates 5 policies:
-- 1. admins_select_own       → Users read their own record
-- 2. admins_select_all       → Admins read all admin records
-- 3. admins_insert           → New admins can create accounts
-- 4. admins_update_own       → Users update their own record
-- 5. admins_delete_own       → Users delete their own record

-- Creates timestamp trigger
-- Automatically updates "updated_at" when records change
```

---

## Step 2: Include JavaScript Files in Your HTML

Your HTML pages need to load these files **in the correct order**:

```html
<!-- 1. Load Supabase client -->
<script src="supabase-client.js"></script>

<!-- 2. Load database helper (uses Supabase client) -->
<script src="db-helper.js"></script>

<!-- 3. Load your page-specific script -->
<script src="admin-login.js"></script>
<!-- or -->
<script src="admin-register.js"></script>
```

### Example: adminlogin.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
    <link rel="stylesheet" href="adminstyle.css">
</head>
<body>
    <!-- Your HTML content -->
    <form id="admin-login-form">
        <input name="employeeId" type="text" placeholder="Employee ID" required>
        <input name="password" type="password" placeholder="Password" required>
        <button type="submit">Sign In</button>
        <div class="status"></div>
    </form>

    <!-- Scripts (load in this order!) -->
    <script src="supabase-client.js"></script>
    <script src="db-helper.js"></script>
    <script src="admin-login.js"></script>
</body>
</html>
```

### Example: adminregister.html

```html
<!DOCTYPE html>
<html>
<head>
    <title>Admin Registration</title>
    <link rel="stylesheet" href="adminstyle.css">
</head>
<body>
    <!-- Your HTML content -->
    <form id="admin-register-form">
        <input name="fullName" type="text" placeholder="Full Name" required>
        <input name="employeeId" type="text" placeholder="Employee ID" required>
        <input name="email" type="email" placeholder="Email" required>
        <input name="password" type="password" placeholder="Password" required>
        <button type="submit">Create Account</button>
        <div class="status"></div>
    </form>

    <!-- Scripts (load in this order!) -->
    <script src="supabase-client.js"></script>
    <script src="db-helper.js"></script>
    <script src="admin-register.js"></script>
</body>
</html>
```

---

## Step 3: Using DatabaseHelper in Your Code

### The DatabaseHelper Object

All database operations go through `window.DatabaseHelper` which handles RLS policy integration.

#### Authentication

```javascript
// Sign in admin with Employee ID + Password
const result = await window.DatabaseHelper.loginAdmin(employeeId, password);
if (result.success) {
    // Logged in
} else {
    console.error(result.error);
}
```

#### Registration

```javascript
// Register new admin
const result = await window.DatabaseHelper.registerAdmin(
    email,
    password,
    fullName,
    employeeId
);
if (result.success) {
    // Account created
} else {
    console.error(result.error);
}
```

#### Get Current User

```javascript
// Get logged-in user
const user = await window.DatabaseHelper.getCurrentUser();
if (user) {
    console.log("Logged in as:", user.email);
}
```

#### Get Current Admin Record

```javascript
// Get current admin's full record
const adminRecord = await window.DatabaseHelper.getMyAdminRecord();
if (adminRecord) {
    console.log("Name:", adminRecord.full_name);
    console.log("Role:", adminRecord.role);
}
```

#### Get All Admins (Admin-only)

```javascript
// Get all admin records (only works if logged-in user is admin)
const admins = await window.DatabaseHelper.getAllAdmins();
console.log("All admins:", admins);
```

#### Update Own Record

```javascript
// Update your own admin record
const result = await window.DatabaseHelper.updateMyRecord({
    full_name: "New Name",
    // Add other fields you want to update
});
if (result.success) {
    console.log("Updated:", result.data);
}
```

#### Logout

```javascript
// Sign out
const result = await window.DatabaseHelper.logout();
if (result.success) {
    // Logged out successfully
}
```

#### Listen for Auth Changes

```javascript
// Set up listener for login/logout
const unsubscribe = window.DatabaseHelper.onAuthStateChange((user) => {
    if (user) {
        console.log("User logged in:", user.email);
    } else {
        console.log("User logged out");
    }
});

// To stop listening later:
// unsubscribe();
```

---

## RLS Policies Explained

### Policy 1: `admins_select_own`
- **Who**: Any authenticated user
- **What**: Read their own admin record
- **Condition**: `auth.uid() = id`
- **Use case**: Users viewing their profile

### Policy 2: `admins_select_all`
- **Who**: Authenticated admins only
- **What**: Read all admin records
- **Condition**: Current user has `role = 'admin'`
- **Use case**: Showing admin list (only to admins)

### Policy 3: `admins_insert`
- **Who**: New users during registration
- **What**: Create their own admin record
- **Condition**: `auth.uid() = id`
- **Use case**: Registration flow

### Policy 4: `admins_update_own`
- **Who**: Any authenticated user
- **What**: Update their own record
- **Condition**: `auth.uid() = id`
- **Use case**: Profile updates

### Policy 5: `admins_delete_own`
- **Who**: Any authenticated user
- **What**: Delete their own record
- **Condition**: `auth.uid() = id`
- **Use case**: Account deletion

---

## File Descriptions

### supabase-client.js
- Loads Supabase library from CDN
- Initializes Supabase client with your project credentials
- Makes `window.supabase` available globally
- **Include first** in your HTML

### db-helper.js
- Provides `window.DatabaseHelper` object
- Handles all database operations
- Works with RLS policies automatically
- **Include after supabase-client.js**

### admin-login.js
- Handles admin login form submission
- Uses `DatabaseHelper.loginAdmin()`
- Automatically enforces RLS via policies
- **Include after db-helper.js**

### admin-register.js
- Handles admin registration form submission
- Uses `DatabaseHelper.registerAdmin()`
- Creates both auth user and admin record
- **Include after db-helper.js**

### supabase-setup-rls.sql
- SQL script to set up RLS policies
- Run in Supabase SQL Editor
- Safe to run multiple times (drops/recreates policies)

---

## Database Table Schema

Your `public.admins` table should have these columns:

```sql
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

---

## Troubleshooting

### "Database not ready" Error
- Ensure `supabase-client.js` is loaded first
- Wait for `window.supabaseClientReady === true`
- Check browser console for errors

### "Permission denied" Error
- RLS policy is blocking the request
- Check that the user has the correct `role`
- Verify the user ID matches the record ID

### "Employee ID already exists"
- That Employee ID is already registered
- Try a different Employee ID

### Scripts Not Loading
- Check script order: supabase-client.js → db-helper.js → page script
- Verify file paths are correct
- Check browser Network tab for 404 errors

### Still Having Issues?
1. Check browser Console (F12 → Console tab) for error messages
2. Check Supabase dashboard → Logs for database errors
3. Verify SQL script ran successfully (check table in Supabase)
4. Ensure RLS is enabled: `ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;`

---

## Security Notes

✅ **Good Practices**
- RLS policies are enforced at the database level (cannot be bypassed)
- Only the public anon key is in your client code (service_role key is secret)
- User IDs are automatically matched to prevent unauthorized access
- Passwords are hashed by Supabase Auth

⚠️ **Important**
- Never put your `service_role` key in client code
- Only use the `public anon key` in your JavaScript
- RLS policies protect your data automatically
- Audit logs are available in Supabase dashboard

---

## Quick Start Checklist

- [ ] Run SQL script from `supabase-setup-rls.sql` in Supabase dashboard
- [ ] See "Admins table setup complete!" message
- [ ] Include script files in correct order (supabase-client → db-helper → page script)
- [ ] Update form IDs to match your HTML (e.g., `admin-login-form`, `admin-register-form`)
- [ ] Test registration: Create a new admin account
- [ ] Test login: Sign in with Employee ID + Password
- [ ] Test profile: View and update admin record
- [ ] Test logout: Sign out successfully

---

## Next Steps

Once your database is set up:

1. **Create additional pages** that use `DatabaseHelper`
2. **Add auth checks** to protect pages: Redirect if not logged in
3. **Use getAllAdmins()** to build admin list view
4. **Implement profile page** with updateMyRecord()
5. **Add admin-only sections** that check role

Example auth check:

```javascript
// Run on page load
window.DatabaseHelper.getCurrentUser().then(user => {
    if (!user) {
        // Not logged in, redirect to login
        window.location.href = 'adminlogin.html';
    }
});
```

---

## Support

For more information:
- Supabase Docs: https://supabase.com/docs
- RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- Auth Guide: https://supabase.com/docs/guides/auth
