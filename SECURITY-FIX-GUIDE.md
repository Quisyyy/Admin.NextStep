# 🔐 SECURITY FIX - Complete Steps

## CRITICAL: Your API Key Was Exposed!

Your Supabase API key was visible in the code and your database has been compromised.

### Step 1: Regenerate API Key (DO THIS IMMEDIATELY)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Settings → API**
3. Find the **Anon** key
4. Click the **refresh icon** to generate a new key
5. Copy the new key and save it somewhere secure

**OLD KEY IS NOW INVALID - Do not use it anymore!**

---

### Step 2: Clean Up Compromised Database
Run this in Supabase SQL Editor:
```sql
-- Copy the contents of cleanup-compromised-database.sql file and run it
```

---

### Step 3: Set Up Secure RLS Policies
Run this in Supabase SQL Editor:
```sql
-- Copy the contents of setup-secure-rls-policies.sql file and run it
```

---

### Step 4: Configure Environment Variables (Properly)

**Option A: Using Environment Variables (RECOMMENDED)**

If you're hosting on Netlify or Vercel, add these to your environment:
```
SUPABASE_URL=https://ziquhxrfxywsmvunuyzi.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_KEY_FROM_STEP_1
```

**Option B: Local Development Only (Temporary)**

Create a `.env` file (NOT committed to git):
```
SUPABASE_URL=https://ziquhxrfxywsmvunuyzi.supabase.co
SUPABASE_ANON_KEY=YOUR_NEW_KEY_FROM_STEP_1
```

---

### Step 5: Update Your HTML

Add this **at the very top** of your HTML file (before other scripts):

```html
<script>
    // Load from environment - do NOT hardcode!
    window.SUPABASE_URL = process.env.SUPABASE_URL || '';
    window.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
</script>
```

Or for static hosting, use a config file that gets injected:

```html
<script src="config.js"></script>
```

Where `config.js` contains:
```javascript
window.SUPABASE_URL = 'https://ziquhxrfxywsmvunuyzi.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR_NEW_KEY';
```

---

### Step 6: Verify supabase-client.js Is Secure

✅ Already fixed - it now reads from environment variables instead of hardcoding

---

### Step 7: Test Everything

1. Hard refresh your browser (Ctrl+Shift+R)
2. Check browser console - should NOT show API keys
3. Try logging in - should work
4. Try accessing alumni list - should work
5. Try archiving/restoring records - should work

---

## Security Checklist

- [ ] Regenerated API key in Supabase
- [ ] Ran cleanup-compromised-database.sql
- [ ] Ran setup-secure-rls-policies.sql
- [ ] Updated environment variables
- [ ] Updated supabase-client.js initialization
- [ ] Verified no hardcoded keys in code
- [ ] Tested all functionality
- [ ] Never commit API keys to version control

---

## Prevention Going Forward

1. **Use .gitignore** to exclude sensitive files:
   ```
   .env
   .env.local
   config.js
   ```

2. **Use environment variables** for all secrets

3. **Never log credentials** to console in production

4. **Rotate keys regularly** if exposed

5. **Use Supabase Row Level Security** to restrict data access

---

## Need Help?

If something doesn't work after these steps, check:
1. Browser console for errors
2. Network tab to verify API calls
3. Supabase dashboard for any error logs
