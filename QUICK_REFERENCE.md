<!-- ============================================================================
     QUICK REFERENCE - Database & RLS Setup
     ============================================================================ -->

# Quick Reference Guide

## 🚀 Setup in 3 Steps

### Step 1: Run SQL Script
```
1. Go to: https://app.supabase.com
2. Open SQL Editor
3. Copy & paste content from: supabase-setup-rls.sql
4. Click Run
5. You should see: "Admins table setup complete!"
```

### Step 2: Include Scripts in Your HTML
```html
<!-- Load in this exact order -->
<script src="supabase-client.js"></script>      <!-- 1st -->
<script src="db-helper.js"></script>             <!-- 2nd -->
<script src="admin-login.js"></script>           <!-- 3rd (or admin-register.js) -->
```

### Step 3: Use DatabaseHelper
```javascript
// Login
await window.DatabaseHelper.loginAdmin(employeeId, password);

// Register
await window.DatabaseHelper.registerAdmin(email, password, fullName, employeeId);

// Get current user
const user = await window.DatabaseHelper.getCurrentUser();
```

---

## 📋 DatabaseHelper Methods (Complete API)

### Authentication
```javascript
// Login with Employee ID + Password
const result = await window.DatabaseHelper.loginAdmin(employeeId, password);
// Returns: {success: true} or {success: false, error: "message"}

// Register new admin
const result = await window.DatabaseHelper.registerAdmin(email, password, fullName, employeeId);
// Returns: {success: true, user: {...}} or {success: false, error: "message"}

// Sign out
const result = await window.DatabaseHelper.logout();

// Listen for login/logout changes
const unsubscribe = window.DatabaseHelper.onAuthStateChange((user) => {
    if (user) console.log("Logged in:", user.email);
    else console.log("Logged out");
});
```

### User Info
```javascript
// Get logged-in user (Supabase Auth)
const user = await window.DatabaseHelper.getCurrentUser();
// Returns: {id: "...", email: "..."} or null

// Get current user's admin record (with all fields)
const admin = await window.DatabaseHelper.getMyAdminRecord();
// Returns: {id, email, employee_id, full_name, role, created_at, updated_at} or null
```

### Queries
```javascript
// Get all admin records (requires admin role)
const admins = await window.DatabaseHelper.getAllAdmins();
// Returns: [{id, email, employee_id, full_name, role, ...}, ...] or null

// Get admin by ID
const admin = await window.DatabaseHelper.getAdminById(adminId);
// Returns: {id, email, ...} or null

// Get email by Employee ID
const email = await window.DatabaseHelper.getEmailByEmployeeId(employeeId);
// Returns: "admin@example.com" or null
```

### Updates
```javascript
// Update current user's record
const result = await window.DatabaseHelper.updateMyRecord({
    full_name: "New Name",
    // Only update fields belonging to current user
});
// Returns: {success: true, data: {...}} or {success: false, error: "message"}
```

---

## 🔒 RLS Policies Reference

| Policy | Action | Condition | Who Can Use |
|--------|--------|-----------|------------|
| `admins_select_own` | Read | `auth.uid() = id` | Any user (their own record) |
| `admins_select_all` | Read | User has role='admin' | Admins only (all records) |
| `admins_insert` | Create | `auth.uid() = id` | New users (registration) |
| `admins_update_own` | Update | `auth.uid() = id` | Any user (their own record) |
| `admins_delete_own` | Delete | `auth.uid() = id` | Any user (their own record) |

---

## 📁 Files Overview

| File | Purpose | Load Order |
|------|---------|-----------|
| `supabase-client.js` | Initialize Supabase | 1st |
| `db-helper.js` | Database helper methods | 2nd |
| `admin-login.js` | Login form handler | 3rd |
| `admin-register.js` | Registration form handler | 3rd |
| `supabase-setup-rls.sql` | RLS setup script | Run in Supabase |
| `DATABASE_RLS_SETUP_GUIDE.md` | Full documentation | Reference |

---

## ✅ Form Requirements

### Login Form
```html
<form id="admin-login-form">
    <input name="employeeId" type="text" required>
    <input name="password" type="password" required>
    <button type="submit">Sign In</button>
    <div class="status"></div>
</form>
```

### Register Form
```html
<form id="admin-register-form">
    <input name="fullName" type="text" required>
    <input name="employeeId" type="text" required>
    <input name="email" type="email" required>
    <input name="password" type="password" required>
    <button type="submit">Create Account</button>
    <div class="status"></div>
</form>
```

---

## 🛡️ Protect Your Pages

Redirect if not logged in:

```javascript
// Add to any page you want to protect
window.DatabaseHelper.getCurrentUser().then(user => {
    if (!user) {
        window.location.href = 'adminlogin.html';
    }
});
```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Database not ready" | Scripts loading slow | Add try/catch with timeout |
| "Permission denied" | RLS policy blocking | Check user role & ID |
| "Employee ID already exists" | Duplicate registration | Use different ID |
| Scripts not working | Wrong load order | Load: supabase → db-helper → page |
| `window.DatabaseHelper` undefined | db-helper.js not loaded | Verify script tag exists |

---

## 📞 API Error Responses

All methods return errors in this format:

```javascript
{
    success: false,
    error: "Description of what went wrong"
}
```

Handle errors:

```javascript
const result = await window.DatabaseHelper.loginAdmin(empId, pwd);
if (!result.success) {
    console.error("Login failed:", result.error);
    // Show error to user
}
```

---

## 🔑 Your Credentials (Already Configured)

Located in `supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://ziquhxrfxywsmvunuyzi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

✅ These are set up correctly - no action needed!

---

## 📚 Example Usage

### Complete Login Page Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Admin Login</title>
    <link rel="stylesheet" href="adminstyle.css">
</head>
<body>
    <form id="admin-login-form">
        <h1>Admin Login</h1>
        <input name="employeeId" type="text" placeholder="Employee ID" required>
        <input name="password" type="password" placeholder="Password" required>
        <button type="submit">Sign In</button>
        <div class="status"></div>
    </form>

    <script src="supabase-client.js"></script>
    <script src="db-helper.js"></script>
    <script src="admin-login.js"></script>
</body>
</html>
```

The `admin-login.js` will automatically:
1. Handle form submission
2. Call `DatabaseHelper.loginAdmin()`
3. Show success/error messages
4. Redirect to `index.html` on success

---

## 🎯 Next Steps

1. ✅ Run SQL script in Supabase
2. ✅ Verify "Admins table setup complete!" message
3. ✅ Add script includes to your HTML files
4. ✅ Test registration page
5. ✅ Test login page
6. ✅ Test logout functionality
7. ✅ Add auth protection to admin pages

---

## 📖 More Info

- Full Guide: See `DATABASE_RLS_SETUP_GUIDE.md`
- Supabase Docs: https://supabase.com/docs
- RLS Docs: https://supabase.com/docs/guides/auth/row-level-security

