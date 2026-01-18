# NextStep Admin System - User Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Dashboard Guide](#dashboard-guide)
3. [Alumni Management](#alumni-management)
4. [Archive & Restore](#archive--restore)
5. [Career Statistics](#career-statistics)
6. [Database Tables](#database-tables)
7. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## System Overview

The **NextStep Admin System** is a comprehensive platform for managing alumni records, tracking career information, and monitoring program completion status. The system is built on Supabase (PostgreSQL) with a responsive web interface.

### Key Features:
- ✅ Alumni profile management
- ✅ Archive/restore functionality
- ✅ Career statistics and tracking
- ✅ Completion status monitoring
- ✅ Bulk operations
- ✅ Audit trail logging

---

## Dashboard Guide

### Main Dashboard View
The dashboard displays key metrics and statistics about your alumni network.

#### Dashboard Sections:

### 1. **Alumni Current Status**
Displays degree program distribution across all active alumni.
- **Cards show:** Degree name + Count of alumni
- **View button:** Click to see detailed information about each degree program
- **Expected:** Should display 8 degree programs with alumni counts
- **Currently Showing:** Some degrees (e.g., Mathematics: 3, Office Management: 2)

### 2. **Alumni Career Overview**
Shows career-related statistics and metrics.

| Metric | Expected Value | Meaning |
|--------|-----------------|---------|
| Total Career Profiles | 20 | Number of alumni with career info records |
| Currently Employed | 0% | Percentage of alumni currently employed |
| Open for Mentorship | 100% | Percentage willing to mentor others |
| Top Industry | — | Most common industry among alumni |

### 3. **Career Status Breakdown**
Visual chart showing:
- Employed count
- Unemployed count
- Open for mentorship count

**After Fix:** Should show 20 "No Data" records (all unemployed but open for mentorship)

---

## Alumni Management

### Viewing Alumni List
1. Click **"Alumni"** in left sidebar
2. See list of all **active alumni** (20 total)
3. Each row shows:
   - Name
   - Email
   - Student Number
   - Degree Program
   - Completion Status (Shows "Complete 3/3" for all)

### Alumni Status
- **Complete 3/3** = All 3 form sections completed (Profile, Degree, Contact)
- Only **active** alumni (is_active = true) are shown in the main list

### Bulk Operations
- **Select multiple alumni:** Check boxes next to each record
- **Archive Selected:** Click to move multiple alumni to archive at once
- **Visual Feedback:** Selected records fade out when archived

---

## Archive & Restore


### What is Archive?
Archiving "soft deletes" alumni records - they're hidden from the main list but can be restored later.

### How to Archive

#### Single Alumni:
1. Find the alumni in the list
2. Click **"Archive"** button
3. Record instantly disappears from the list
4. Stored in archive table with restore option

#### Multiple Alumni:
1. Check the checkboxes next to alumni names
2. Click **"Archive Selected"** button
3. All selected alumni disappear from list

### How to Restore

#### Viewing Archived Records:
1. Click **"Archive"** in left sidebar
2. See all archived alumni with restore options

#### Restoring a Record:
1. In archive page, find the alumni
2. Click **"Restore"** button
3. Alumni returns to active list
4. Reappears in dashboard statistics

### Permanently Delete
⚠️ **WARNING:** This is permanent and cannot be undone!
1. In archive page, click **"Delete"** button
2. Record is permanently removed from database
3. All associated data is deleted

---

## Career Statistics

### What Data is Tracked?
For each active alumni, the system tracks:

| Field | Type | Current Status |
|-------|------|-----------------|
| alumni_id | UUID | ✅ Linked to alumni_profiles |
| is_employed | Boolean | ✅ All set to false (0%) |
| open_for_mentorship | Boolean | ✅ All set to true (100%) |
| job_status | Text | ⏳ Optional - can be populated |
| industry | Text | ⏳ Optional - can be populated |
| mentorship | Text | ⏳ Optional - can be populated |
| current_position | Text | ⏳ Optional - can be populated |

### How Career Data Populates Dashboard:
1. System counts all career_info records (should be 20)
2. Calculates employed percentage (currently 0/20 = 0%)
3. Calculates mentorship percentage (currently 20/20 = 100%)
4. Identifies top industry from career submissions
5. Displays in Alumni Career Overview section

### Current Issue (Being Fixed):
- ❌ Previous: 44 records with NULL mentorship values
- ✅ After Fix: 20 records with open_for_mentorship = true

---

## Database Tables

### alumni_profiles
Main table for alumni personal information.

```
Columns:
- id (UUID) - Primary key
- full_name (TEXT) - Alumni name
- email (TEXT) - Email address
- student_number (TEXT) - Unique student ID
- degree (TEXT) - Degree program
- is_active (BOOLEAN) - Active/archived status (default: true)
- created_at (TIMESTAMP) - Record creation date

Total Records: 20 (as of latest count)
Filtered View: Shows only is_active = true
```

### alumni_archive
Table for archived alumni records.

```
Columns:
- id (UUID) - Primary key
- original_alumni_id (UUID) - Reference to alumni_profiles.id
- is_restored (BOOLEAN) - Whether record has been restored

Purpose: Tracks archive/restore history
```

### career_info
Career tracking information.

```
Columns:
- alumni_id (UUID) - Foreign key to alumni_profiles.id
- is_employed (BOOLEAN) - Employment status (default: false)
- open_for_mentorship (BOOLEAN) - Mentorship availability (default: true)
- job_status (TEXT) - Optional job details
- industry (TEXT) - Optional industry info
- mentorship (TEXT) - Optional mentorship details
- current_position (TEXT) - Optional position title

Total Records: 20 (should match active alumni count)
```

### alumni_form_completion
Tracks form section completion status.

```
Columns:
- alumni_id (UUID) - Foreign key to alumni_profiles.id
- profile_completed (BOOLEAN) - Profile form done
- degree_completed (BOOLEAN) - Degree form done
- contact_completed (BOOLEAN) - Contact form done

Current Status: All 20 alumni marked as complete (3/3)
```

---

## FAQ & Troubleshooting

### Q: What does "Complete 3/3" mean?
**A:** All three required form sections have been filled:
1. Profile information
2. Degree details
3. Contact information

### Q: Why do I see 44 career profiles instead of 20?
**A:** Duplicate records were created. **Solution:** Run the FIX-career-records.sql script to clean up.

### Q: Can I restore a permanently deleted record?
**A:** No. Permanent deletion is irreversible. Always use "Archive" if you might need the data later.

### Q: How do I bulk archive multiple alumni?
**A:** 
1. Check the checkboxes next to alumni names
2. Click "Archive Selected" button
3. All selected records are moved to archive

### Q: Career Overview shows 0% mentorship - is this a bug?
**A:** If mentorship is showing 0%, it means the `open_for_mentorship` column has NULL values. **Solution:** Run FIX-career-records.sql to fix this.

### Q: The JavaScript error "Cannot access 'setText' before initialization" appears
**A:** This was fixed in the latest version of index.js. Refresh the page (Ctrl+R) to load the updated code.

### Q: How many alumni should be in the system?
**A:** Currently 20 active alumni. All marked as Complete (3/3).

### Q: Can I edit alumni information directly in the dashboard?
**A:** Currently, the dashboard is view-only. Use the database directly or create an edit form.

### Q: Where is the audit trail?
**A:** Audit logs are in the `audit_trail` table. Click "Audit Trail" in the sidebar to view.

### Q: How often should I backup data?
**A:** Supabase handles automatic backups. For safety, export important data weekly.

---

## Common Tasks

### Task 1: Archive an Alumni
1. Find alumni in the list
2. Click **Archive** button
3. Alumni is moved to archive
4. Still visible in Archive page with restore option

### Task 2: View Career Statistics
1. Click **Dashboard** (default view)
2. Scroll to "Alumni Career Overview"
3. See total profiles, employment %, mentorship %
4. Check "Career Status Breakdown" chart

### Task 3: Restore an Archived Alumni
1. Click **Archive** in sidebar
2. Find the alumni
3. Click **Restore** button
4. Alumni returns to main list and dashboard

### Task 4: View Alumni by Degree
1. Click **Dashboard**
2. Look at "Alumni Current Status" cards
3. Each card shows degree program name and count
4. Click **View** to see details

### Task 5: Check Form Completion Status
1. Click **Alumni**
2. Look at "Completion Status" column
3. "Complete 3/3" means all forms done
4. Incomplete entries show fewer checkmarks

---

## Data Entry Standards

### Alumni Names
- Format: First Name Last Name (or Full Name)
- Example: "John Smith"
- Required: Yes

### Email
- Format: user@domain.com
- Must be unique per system design
- Used for contact and authentication

### Student Number
- Format: Varies by institution
- Should be unique identifier
- Required for record tracking

### Degree Programs (Currently in System)
1. Bachelor of Secondary Education (Mathematics)
2. Diploma in Office Management Technology
3. Bachelor of Science (Computer Science)
4. Bachelor of Arts (Education)
5. Diploma in Hospitality Management
6. Bachelor of Science (Engineering)
7. Associate Degree (Business)
8. Diploma in Information Technology

---

## Important Notes

⚠️ **Before Making Changes:**
- Always backup critical data
- Test in Supabase SQL Editor before running
- Archive records instead of deleting permanently
- Verify record count matches expected alumni count

✅ **Best Practices:**
- Use Archive instead of Delete for safety
- Check dashboard statistics regularly
- Monitor career data completeness
- Keep audit trail enabled
- Review form completion status monthly

---

## Support & Contact

For technical issues or questions:
1. Check the FAQ section above
2. Review error messages in browser console (F12)
3. Check Supabase database directly
4. Review SQL files for any pending fixes

---

**Last Updated:** January 18, 2026
**System Version:** Production
**Database:** Supabase PostgreSQL
