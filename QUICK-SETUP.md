# NextStep Admin - Quick Setup Checklist

## Your Supabase Database
- **URL**: https://axekvziluiiessaawvol.supabase.co
- **Status**: ✅ Ready to configure

---

## ✅ CHECKLIST - Complete in Order

### Phase 1: Database Setup (Supabase)
- [ ] **Step 1**: Go to Supabase Dashboard (https://app.supabase.com)
- [ ] **Step 2**: Open your project for database `axekvziluiiessaawvol`
- [ ] **Step 3**: Go to **SQL Editor**
- [ ] **Step 4**: Create new query and paste contents of `database-schema.sql`
- [ ] **Step 5**: Click **RUN** button
- [ ] **Step 6**: Wait for completion (should create 6 tables)
- [ ] **Step 7**: Create another new query and paste `database-rls-policies.sql`
- [ ] **Step 8**: Click **RUN** button
- [ ] **Step 9**: Verify tables exist in **Table Editor** (left menu)

### Phase 2: Get Your Credentials
- [ ] **Step 1**: In Supabase, click **Settings** (gear icon)
- [ ] **Step 2**: Click **API** in left menu
- [ ] **Step 3**: Copy the **Anon Key** (long string starting with `eyJ...`)
- [ ] **Step 4**: Keep it safe - you'll use it next

### Phase 3: Update Configuration
- [ ] **Step 1**: Open `config.js` in this folder
- [ ] **Step 2**: Find the line: `window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';`
- [ ] **Step 3**: Replace `'YOUR_ANON_KEY_HERE'` with your actual anon key
- [ ] **Step 4**: Save the file

**Example after replacement:**
```javascript
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Phase 4: Update Your HTML Files
For **EVERY** HTML page that needs login/data access:

1. Add these script tags in this exact order (before closing `</body>` tag):
```html
<!-- 1. Configuration -->
<script src="config.js"></script>

<!-- 2. Supabase Library -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 3. Supabase Client -->
<script src="supabase-client.js"></script>

<!-- 4. Database Helper -->
<script src="db-helper.js"></script>

<!-- 5. Your Page Script -->
<script src="your-page-script.js"></script>
```

2. Files that need this:
   - [ ] admin-login.html
   - [ ] admin-register.html
   - [ ] alumni-login.html (or create one)
   - [ ] alumni-register.html (or create one)
   - [ ] homepage.html (if you have user-only content)
   - [ ] Any other admin/alumni pages

### Phase 5: Update JavaScript Files
- [ ] Update `admin-login.js` to use `DatabaseHelper.loginAdmin()`
- [ ] Update `admin-register.js` to use `DatabaseHelper.registerAdmin()`
- [ ] Create `alumni-login.js` using `DatabaseHelper.loginAlumni()`
- [ ] Create `alumni-register.js` using `DatabaseHelper.registerAlumni()`

**See examples in `SETUP-INSTRUCTIONS.md`**

### Phase 6: Test Everything
- [ ] **Test Admin Registration**: Create a test admin account
- [ ] **Test Admin Login**: Login with that account
- [ ] **Check Database**: See admin record in Supabase `admins` table
- [ ] **Test Alumni Registration**: Create a test alumni account
- [ ] **Test Alumni Login**: Login with that account
- [ ] **Check Audit Logs**: Run query in Supabase to see logged actions

**Test Query (paste in SQL Editor):**
```sql
SELECT * FROM public.audit_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🔑 Important Files

| File | Purpose | Status |
|------|---------|--------|
| `database-schema.sql` | Create tables | ✅ Ready to run |
| `database-rls-policies.sql` | Security policies | ✅ Ready to run |
| `config.js` | Credentials | 📝 Needs your Anon Key |
| `supabase-client.js` | Supabase init | ✅ Ready to use |
| `db-helper.js` or `new-db-helper.js` | Database operations | ✅ Ready to use |
| `admin-login-new.html` | Example login page | ✅ Reference template |
| `SETUP-INSTRUCTIONS.md` | Detailed guide | ✅ Full documentation |

---

## 🚀 Quick Start

1. **Get Anon Key** from Supabase
2. **Update config.js** with your key
3. **Run database SQL files** in Supabase
4. **Add script tags** to your HTML files
5. **Update login/register JS** using examples
6. **Test everything**
7. **Deploy!**

---

## 🆘 Troubleshooting

### "Cannot find Supabase"
- **Fix**: Make sure `config.js` loads FIRST before other scripts

### "Anon Key is invalid"
- **Fix**: Copy key again from Supabase Settings → API
- **Note**: Use the **Anon Key**, not the Service Role Key

### "Table not found"
- **Fix**: Make sure you ran `database-schema.sql` in Supabase SQL Editor

### "Permission denied" errors
- **Fix**: Make sure you ran `database-rls-policies.sql` in Supabase

### "Password does not meet requirements"
- **Fix**: Password must have: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
- **Example**: `Secure123!`

---

## 📞 Support

If issues persist:
1. Check browser console: **F12** → **Console tab**
2. Look for red error messages
3. Check Supabase dashboard for table data
4. Verify all scripts loaded (F12 → Network tab)

**Estimated Setup Time: 20-30 minutes**

---

**Created**: January 17, 2026  
**Database URL**: https://axekvziluiiessaawvol.supabase.co
