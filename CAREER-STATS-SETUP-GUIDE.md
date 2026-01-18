# 📊 Career Stats Display - Setup Guide

## Problem
The Alumni Career Overview dashboard shows "0" profiles because the `career_info` table is empty.

## Solution
You need to populate the `career_info` table with sample data.

## Quick Setup (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com/project/_/sql/new
2. You should be in your Supabase dashboard

### Step 2: Run Sample Data Script
1. Open the file: `SETUP-career-sample-data.sql` in your project
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click the **"Run"** button (green play icon)

### Step 3: Verify in Dashboard
1. Go back to the admin dashboard: `homepage.html`
2. Refresh the page (F5 or Cmd+R)
3. Scroll to "Alumni Career Overview" section
4. You should now see:
   - **Total Career Profiles: 20**
   - Career status breakdown chart with bars
   - Employment statistics
   - Top industries

## What Gets Added

The setup script adds 20 sample career records with:
- Various job statuses (Employed, Self-Employed, Freelancer, Unemployed, Student, etc.)
- Different industries (IT, Finance, Healthcare, Education, etc.)
- Mentorship availability (Yes, No, Maybe)
- Professional certifications
- Employment status indicators

## Result Preview

After running the script, you'll see:
- **14 Employed** alumni
- **2 Self-Employed** alumni  
- **1 Unemployed** alumni
- **1 Student** alumni
- **1 on Career Break** alumni
- **1 pursuing further studies** alumni

Chart breakdown by job status with color-coded bars and legend.

## Troubleshooting

### If data doesn't appear:
1. **Check Supabase connection** - Make sure you're logged into the correct project
2. **Verify script ran** - Look for success message or check queries at bottom
3. **Refresh dashboard** - Close and reopen the admin dashboard
4. **Check browser console** - Open DevTools (F12) → Console tab for any errors

### If you get an error:
- Common: "Table career_info does not exist"
  - Solution: Run `create-career-info-table.sql` first, then run the sample data script

## To Delete Sample Data

If you want to remove the sample data later:

```sql
DELETE FROM public.career_info;
```

Then run the setup script again to repopulate.

## Next Steps

Once data appears:
1. Alumni can submit their own career information
2. The dashboard will automatically update with real data
3. Sample data will be replaced by actual submissions

---

**Questions?** Check the dashboard console (F12) for detailed logs.
