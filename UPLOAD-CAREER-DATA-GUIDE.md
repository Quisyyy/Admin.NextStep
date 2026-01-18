# 🚀 How to Upload Career Data - Step by Step

## Current Status
Your dashboard shows **0 career profiles** because no data has been uploaded to the database yet.

## Solution: Upload Sample Career Data

### ✅ Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Log in to your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"** or **"+ New"**

### ✅ Step 2: Copy the SQL Script
1. Open the file: `SETUP-career-sample-data.sql` in your project
2. Select **ALL** the text (Ctrl+A)
3. Copy it (Ctrl+C)

### ✅ Step 3: Run in Supabase
1. Paste the SQL into the Supabase SQL Editor (Ctrl+V)
2. Look for the green **"RUN"** button at the bottom right
3. Click the green **"RUN"** button
4. Wait for the query to complete (should see checkmark)

### ✅ Step 4: Verify Success
You should see output showing:
```
total_records: 20
unique_ids: 20
most_recent_record: [current timestamp]
```

### ✅ Step 5: Refresh Dashboard
1. Go back to your admin dashboard
2. Press **F5** to refresh the page
3. Scroll down to "Alumni Career Overview"
4. You should now see:
   - **Total Career Profiles: 20**
   - Chart with career status breakdown
   - Industry statistics
   - Mentorship data

## 🆘 If It Doesn't Work

### Error: "Table career_info does not exist"
**Solution:**
1. First run: `create-career-info-table.sql`
2. Then run: `SETUP-career-sample-data.sql`

### Error: "Syntax error" or "Column does not exist"
**Solution:**
- Copy the ENTIRE script from `SETUP-career-sample-data.sql`
- Make sure you copy from the first line to the last line
- Paste all of it into Supabase

### Still showing 0 records after refresh
**Check:**
1. Did you click the green "RUN" button? (not just paste)
2. Did you wait for the query to complete?
3. Did you refresh the dashboard (F5)?
4. Try hard refresh: **Ctrl+Shift+R** or **Cmd+Shift+R**

## 📋 What Gets Added

When you run the script, it creates:
- **20 sample career records** in the `career_info` table
- Each with a unique ID and timestamp
- Dashboard automatically calculates statistics from these records

## 🎯 Result After Upload

Once complete, you'll see on the dashboard:
- ✅ **Total Career Profiles: 20**
- ✅ **Currently Employed: —** (displays stats)
- ✅ **Open for Mentorship: —** (displays stats)
- ✅ **Top Industry: —** (displays data)
- ✅ **Career Status Breakdown** chart with bars

---

**Questions?** Open your browser's Developer Console (F12) and check for any error messages to help diagnose the issue.
