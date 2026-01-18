# 📊 SQL Files Guide - Which Files to Run

## ✅ RECOMMENDED: Run These Files in ORDER

### **Phase 1: CREATE TABLES** (Run FIRST)
**File:** `database-schema.sql`
- ✅ Creates all required tables
- ✅ Creates indexes for performance
- ✅ Sets up automatic timestamps
- ✅ SAFE to run - uses `CREATE TABLE IF NOT EXISTS`
- **Status:** Ready to use

**How to run:**
1. Copy entire contents of `database-schema.sql`
2. Paste into Supabase SQL Editor
3. Click RUN

---

### **Phase 2: SET UP RLS POLICIES** (Run SECOND)
**File:** `database-clean-admins.sql`
- ✅ Fixes RLS policies without errors
- ✅ Allows admin registration to work
- ✅ Clean and simple
- **Status:** Currently working

**How to run:**
1. Copy contents of `database-clean-admins.sql`
2. Paste into Supabase SQL Editor
3. Click RUN

---

## ⚠️ OPTIONAL: Advanced Files (Use if Needed)

### Data Setup
| File | Purpose | When to Use |
|------|---------|------------|
| `add-sample-data.sql` | Add test data | Testing/development only |
| `insert-sample-career-data.sql` | Add career data | Testing |
| `delete-fake-records.sql` | Clean up test data | Before production |

### Cleanup/Fixes (DANGEROUS - Use Carefully)
| File | Purpose | Warning |
|------|---------|---------|
| `cleanup-admins.sql` | Remove admin records | ⚠️ Deletes data |
| `cleanup-compromised-database.sql` | Full database cleanup | 🚨 DELETES EVERYTHING |
| `cleanup-orphaned-auth-users.sql` | Remove orphaned users | ⚠️ May affect users |
| `remove-employee-id-constraint.sql` | Remove constraint | ⚠️ Changes schema |

---

## ❌ DO NOT RUN These Files

These are **old/broken/archived** files:

| File | Why to Skip |
|------|-----------|
| `database-rls-policies.sql` | ❌ Has infinite recursion error |
| `database-rls-policies-FIXED.sql` | ❌ Still has issues |
| `database-rls-policies-SIMPLE.sql` | ❌ References wrong columns |
| `fix-rls-policies.sql` | ❌ Old version |
| `setup-secure-rls-policies.sql` | ❌ Complex, outdated |
| `CRITICAL-security-fix.sql` | ❌ Outdated fix |
| `COMPLETE-security-fix.sql` | ❌ Outdated fix |
| `FINAL-rls-fix.sql` | ❌ Deprecated |
| `aggressive-fix-archive.sql` | ❌ Archive file |
| `comprehensive-archive-fix.sql` | ❌ Archive file |
| `final-fix-archive.sql` | ❌ Archive file |
| `disable-rls-archive.sql` | ❌ Archive - disables security |
| `disable-rls-quick-fix.sql` | ❌ Archive - disables security |

---

## 📋 Your Current Setup Status

✅ **Already Completed:**
- Database tables created (`database-schema.sql` - already run)
- Admin registration page working
- Anon Key configured in `config.js`

⏳ **Next Step:**
- Run `database-clean-admins.sql` to fix RLS policies
- Then test admin registration

---

## 🚀 QUICK START CHECKLIST

- [ ] **Step 1:** Run `database-schema.sql` (if not already done)
- [ ] **Step 2:** Run `database-clean-admins.sql`
- [ ] **Step 3:** Refresh browser
- [ ] **Step 4:** Test admin registration
- [ ] **Step 5:** Check Supabase Table Editor to see new records

---

## 🔍 Other SQL Files Explained

### Testing Files
- `test-rls-disable.sql` - Tests RLS policies (read-only)
- `test-audit-trail.sql` - Tests audit logging
- `test-manual-audit-insert.sql` - Manual audit test

### Archive/Old Files
- `setup-database-simple.sql` - Old version (don't use)
- `setup-database-minimal.sql` - Old minimal setup
- `setup-database-signup.sql` - Old signup setup
- `supabase-setup-rls.sql` - Old RLS setup
- `supabase-setup-clean.sql` - Old cleanup

### Feature-Specific Files
- `setup-audit-trail.sql` - Audit logging setup
- `create-admin-audit-table.sql` - Audit table creation
- `create-alumni-archive-table.sql` - Archive table
- `setup-alumni-archive.sql` - Alumni archive setup
- `setup-alumni-form-tracking.sql` - Form tracking
- `setup-archive-cleanup.sql` - Archive cleanup

---

## Summary Table

| File | Priority | Safe | Use Now |
|------|----------|------|---------|
| `database-schema.sql` | ⭐⭐⭐ High | ✅ Yes | ✅ YES |
| `database-clean-admins.sql` | ⭐⭐⭐ High | ✅ Yes | ✅ YES |
| `add-sample-data.sql` | ⭐ Low | ✅ Yes | ⏳ Later |
| Others | ❌ Avoid | ⚠️ No | ❌ NO |

---

## Need Help?

**If admin registration still doesn't work after running both files:**
1. Check browser console (F12 → Console tab) for errors
2. Go to Supabase Table Editor → admins table → check if policies show
3. Verify all 3 policies are created:
   - `admins_insert_any`
   - `admins_select_own`
   - `admins_update_own`

**Contact support or ask for help!**
