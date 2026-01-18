## RESTORE NOT SHOWING IN ALUMNI LIST - FIX

### Root Cause:
When you clicked "Restore" on an archived record, the restore function only marked it as restored in the `alumni_archive` table. It never moved the record back to the `alumni_profiles` table where the Alumni List looks for active alumni.

### The Flow That Was Broken:
1. ❌ User archives an alumni → Record copied to alumni_archive, is_active set to false in alumni_profiles
2. ✅ User clicks Restore → Record marked as is_restored=true in alumni_archive (but NOT restored in alumni_profiles)
3. ❌ Alumni List queries alumni_profiles where is_active=true → Record still not found because is_active is still false

### The Fix Required:
The restore function needs to:
1. Get the archived record from `alumni_archive` 
2. Use the `original_alumni_id` to find the record in `alumni_profiles`
3. Set `is_active = true` in `alumni_profiles` (this brings it back to active)
4. Mark as restored in `alumni_archive`

### What To Do Right Now:

**In your Supabase Dashboard:**
1. Go to **SQL Editor**
2. Copy and run ALL commands from: **fix-restore-to-active.sql**
   - This creates the corrected restore_archived_alumni() function
   - The function now properly restores records back to active status
   - Grants permissions to the anon role

3. Then test:
   - Go to Alumni List → View Archive
   - Click Restore on any record
   - Go back to Alumni List
   - The restored record should now appear in the active list ✓

### Summary:
- **Old restore function**: Updated alumni_archive table only
- **New restore function**: Updates BOTH alumni_archive AND alumni_profiles tables
- **Result**: Restored alumni now show in Alumni List automatically