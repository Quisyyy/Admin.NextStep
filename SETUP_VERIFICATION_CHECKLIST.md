# Supabase RLS Integration Checklist

## ✅ Complete Setup Verification

Use this checklist to ensure your database setup is complete and working correctly.

---

## Phase 1: Database Setup

### SQL Script Execution
- [ ] Opened Supabase dashboard (https://app.supabase.com)
- [ ] Selected correct project
- [ ] Opened SQL Editor
- [ ] Copied entire content from `supabase-setup-rls.sql`
- [ ] Pasted script into SQL Editor
- [ ] Clicked "Run" button
- [ ] Saw success message: `"Admins table setup complete!"`

### Verification in Supabase
- [ ] Went to Tables → `admins` table in Supabase dashboard
- [ ] Verified table has columns: `id`, `email`, `employee_id`, `full_name`, `role`, `created_at`, `updated_at`
- [ ] Went to Authentication → Policies
- [ ] Verified 5 policies exist:
  - [ ] `admins_select_own`
  - [ ] `admins_select_all`
  - [ ] `admins_insert`
  - [ ] `admins_update_own`
  - [ ] `admins_delete_own`
- [ ] Verified RLS is enabled: Row Level Security toggle is ON

---

## Phase 2: JavaScript Files

### File Creation
- [ ] Created `db-helper.js` with DatabaseHelper object
- [ ] Created `supabase-setup-rls.sql` with SQL script
- [ ] Created or updated `admin-login.js` to use DatabaseHelper
- [ ] Created or updated `admin-register.js` to use DatabaseHelper

### File Verification
- [ ] `supabase-client.js` exists and contains:
  - [ ] SUPABASE_URL = 'https://ziquhxrfxywsmvunuyzi.supabase.co'
  - [ ] SUPABASE_ANON_KEY = your key (looks like eyJhbGciOi...)
  - [ ] Script loads Supabase library from CDN
- [ ] `db-helper.js` exists and contains:
  - [ ] `window.DatabaseHelper` object
  - [ ] Methods: `loginAdmin()`, `registerAdmin()`, `getCurrentUser()`, etc.
- [ ] `admin-login.js` exists and contains:
  - [ ] Form event listener for `#admin-login-form`
  - [ ] Calls to `DatabaseHelper.loginAdmin()`
- [ ] `admin-register.js` exists and contains:
  - [ ] Form event listener for `#admin-register-form`
  - [ ] Calls to `DatabaseHelper.registerAdmin()`

---

## Phase 3: HTML Integration

### Login Page (adminlogin.html or similar)
- [ ] Has `<form id="admin-login-form">`
- [ ] Form has input fields:
  - [ ] `<input name="employeeId">`
  - [ ] `<input name="password">`
  - [ ] `<button type="submit">`
  - [ ] `<div class="status"></div>`
- [ ] Scripts included in correct order:
  ```html
  <script src="supabase-client.js"></script>
  <script src="db-helper.js"></script>
  <script src="admin-login.js"></script>
  ```

### Register Page (adminregister.html or similar)
- [ ] Has `<form id="admin-register-form">`
- [ ] Form has input fields:
  - [ ] `<input name="fullName">`
  - [ ] `<input name="employeeId">`
  - [ ] `<input name="email">`
  - [ ] `<input name="password">`
  - [ ] `<button type="submit">`
  - [ ] `<div class="status"></div>`
- [ ] Scripts included in correct order:
  ```html
  <script src="supabase-client.js"></script>
  <script src="db-helper.js"></script>
  <script src="admin-register.js"></script>
  ```

### All Protected Pages
- [ ] Includes script for auth check:
  ```javascript
  window.DatabaseHelper.getCurrentUser().then(user => {
      if (!user) window.location.href = 'adminlogin.html';
  });
  ```

---

## Phase 4: Functional Testing

### Test 1: Connection Verification
- [ ] Opened `db-connection-test.html` in browser
- [ ] Page loaded without errors
- [ ] All 4 tests show success:
  - [ ] ✓ Supabase client loaded
  - [ ] ✓ DatabaseHelper available
  - [ ] ✓ Admins table accessible
  - [ ] ✓ Auth status checked

### Test 2: Registration
- [ ] Opened registration page
- [ ] Filled in test account:
  - [ ] Full Name: "Test Admin"
  - [ ] Employee ID: "EMP001"
  - [ ] Email: "test@example.com"
  - [ ] Password: "SecurePassword123"
- [ ] Clicked submit button
- [ ] Saw success message (or email confirmation message)
- [ ] Redirected to login page (or check email page)
- [ ] Verified in Supabase:
  - [ ] New user created in Auth → Users
  - [ ] New record created in admins table

### Test 3: Login
- [ ] Opened login page
- [ ] Entered test account:
  - [ ] Employee ID: "EMP001"
  - [ ] Password: "SecurePassword123"
- [ ] Clicked submit button
- [ ] Saw success message
- [ ] Redirected to `index.html` or dashboard
- [ ] Verified in browser console:
  - [ ] `window.supabase.auth.getSession()` returns valid session

### Test 4: User Info
- [ ] While logged in, open browser console
- [ ] Run: `await window.DatabaseHelper.getCurrentUser()`
- [ ] Should return user object with email
- [ ] Run: `await window.DatabaseHelper.getMyAdminRecord()`
- [ ] Should return admin record with name, role, etc.

### Test 5: Logout
- [ ] Click logout button (if implemented)
- [ ] Or run in console: `await window.DatabaseHelper.logout()`
- [ ] Redirected to login page
- [ ] `getCurrentUser()` returns null

### Test 6: Page Protection
- [ ] Try accessing protected page while logged out
- [ ] Should redirect to login page
- [ ] Log in successfully
- [ ] Should access protected page

---

## Phase 5: Security Verification

### RLS Policy Enforcement
- [ ] [ ] Test reading another user's record while logged in:
  ```javascript
  const { data, error } = await window.supabase
    .from('admins')
    .select('*')
    .neq('id', 'YOUR_ID');  // Get other users
  // Should be allowed for admins, denied for regular users
  ```

### API Key Security
- [ ] [ ] Verified `supabase-client.js` only contains public ANON key
- [ ] [ ] Service role key is NOT in any client-side code
- [ ] [ ] Credentials are configured correctly in Supabase dashboard

### Authentication Security
- [ ] [ ] Passwords are hashed (checked in Supabase Auth)
- [ ] [ ] Session tokens are created on login
- [ ] [ ] RLS policies enforce data access control

---

## Phase 6: Error Handling

### Test Error Cases
- [ ] Try login with wrong password:
  - [ ] Shows error message
  - [ ] Doesn't redirect
- [ ] Try login with non-existent Employee ID:
  - [ ] Shows error: "No admin found"
- [ ] Try register with duplicate Employee ID:
  - [ ] Shows error: "Employee ID already exists"
- [ ] Try register with invalid email:
  - [ ] Shows validation error
- [ ] Try accessing database before Supabase loads:
  - [ ] Handled gracefully with timeout

---

## Phase 7: Browser Console

### Check for Errors
- [ ] Open browser developer tools (F12)
- [ ] Go to Console tab
- [ ] No red errors should appear
- [ ] You should see messages like:
  - [ ] "supabase-client: initialized"
  - [ ] "✓ Test 1 passed: Supabase client ready"

---

## Phase 8: Documentation Review

### Setup Guides
- [ ] Read `DATABASE_RLS_SETUP_GUIDE.md` for complete reference
- [ ] Read `QUICK_REFERENCE.md` for quick API lookup
- [ ] Bookmarked for future reference

### Code Comments
- [ ] All files have comments explaining RLS integration
- [ ] Comments explain which policies are used
- [ ] Comments explain expected behavior

---

## Final Verification Checklist

### Before Going Live
- [ ] [ ] All tests in `db-connection-test.html` pass
- [ ] [ ] Can register new admin account
- [ ] [ ] Can login with Employee ID + Password
- [ ] [ ] Can view own user information
- [ ] [ ] Can logout successfully
- [ ] [ ] Protected pages redirect if not logged in
- [ ] [ ] No console errors
- [ ] [ ] No unhandled promise rejections
- [ ] [ ] RLS policies are active in Supabase
- [ ] [ ] All 5 policies exist and are enabled
- [ ] [ ] Database credentials are secure

---

## Quick Test Commands

Run these in browser console while on your site:

```javascript
// Check Supabase client
window.supabase
window.supabaseClientReady

// Check DatabaseHelper
window.DatabaseHelper

// Get current user
await window.DatabaseHelper.getCurrentUser()

// Get current admin record
await window.DatabaseHelper.getMyAdminRecord()

// Logout
await window.DatabaseHelper.logout()

// Get all admins (if admin)
await window.DatabaseHelper.getAllAdmins()

// Test login
await window.DatabaseHelper.loginAdmin('EMP001', 'password')

// Test register
await window.DatabaseHelper.registerAdmin(
    'newemail@example.com',
    'password123',
    'New Admin',
    'EMP002'
)
```

---

## Troubleshooting

If any checklist item fails:

### Supabase Setup Issues
1. Check Supabase dashboard → SQL Editor → Recent queries
2. Look for error messages in the query results
3. Re-run the SQL script if there were errors
4. Verify table structure matches schema

### JavaScript Issues
1. Open browser Console (F12 → Console)
2. Look for error messages
3. Check that all script files are loading (Network tab)
4. Verify script paths are correct

### RLS Policy Issues
1. Check Supabase dashboard → Authentication → Policies
2. Verify all 5 policies exist
3. Verify RLS is enabled on admins table
4. Check if user has correct role for policy

### Form Issues
1. Verify form IDs match: `admin-login-form`, `admin-register-form`
2. Verify input field names: `employeeId`, `password`, `fullName`, `email`
3. Verify form has `<div class="status"></div>`
4. Check browser console for JavaScript errors

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Auth Guide**: https://supabase.com/docs/guides/auth
- **JavaScript Library**: https://supabase.com/docs/reference/javascript

---

## Sign-Off

When all items are checked:

**Setup Date**: _______________

**Verified By**: _______________

**Status**: ✓ READY FOR PRODUCTION

---

Last Updated: January 2, 2026
