# Bulk Upload Troubleshooting Guide

## Issue: Upload Data Not Working

### Quick Diagnosis Steps

1. **Open Developer Console (F12)**
   - Press `F12` to open browser developer tools
   - Go to **Console** tab
   - Look for any error messages

2. **Check Browser Console Messages**
   - Green checkmark ✅: Supabase is connected
   - Red X ❌: Supabase connection failed

---

## Common Issues & Solutions

### Issue 1: "Database connection not ready"

**Cause:** Supabase client not loading or taking too long to initialize

**Solution:**
1. Refresh the page (Ctrl+F5)
2. Wait 3-5 seconds after page loads before attempting upload
3. Check console for Supabase loading errors
4. Clear browser cache and try again

---

### Issue 2: "Duplicate email already exists"

**Cause:** The email address is already in the database

**Solution:**
1. Use a unique email address in your CSV
2. Check [Alumni Employment Status](alumni-employment-status.html) to verify if the email exists
3. Update the email in your CSV and try again

---

### Issue 3: "Missing full name or email"

**Cause:** CSV file missing required fields

**Solution:**
1. Ensure your CSV has these columns:
   - `full_name` - Required
   - `email` - Required
2. Check for empty cells in these columns
3. Save CSV as UTF-8 format from Excel/Sheets

---

### Issue 4: "Upload failed" with no specific error

**Cause:** Database or network error

**Solution:**
1. Check internet connection
2. Verify Supabase project is active
3. Try uploading just 1-2 records first
4. Check console for detailed error message

---

## CSV Format Troubleshooting

### Correct Format:
```csv
full_name,email,phone,student_number,degree,graduation_year
John Smith,john@email.com,555-1234,STU001,Bachelor of Science,2024
Sarah Jones,sarah@email.com,555-5678,STU002,Bachelor of Arts,2025
```

### Common CSV Issues:

❌ **Missing headers:**
```csv
John Smith,john@email.com
```
✅ **Solution:** Add header row with column names

❌ **Extra spaces:**
```csv
full_name, email, phone
John Smith, john@email.com, 555-1234
```
✅ **Solution:** Remove spaces after commas

❌ **Special characters in emails:**
```csv
full_name,email
John Smith,john@email..com
```
✅ **Solution:** Validate email format (should have single @)

❌ **Missing required fields:**
```csv
full_name,email,phone
John Smith,,555-1234
```
✅ **Solution:** Ensure full_name and email are present

---

## Debug Checklist

- [ ] Page loads without JavaScript errors
- [ ] Supabase appears ready in console
- [ ] CSV file is valid format (check in Excel/Sheets)
- [ ] Email addresses don't have duplicates in CSV
- [ ] Email addresses are unique in database
- [ ] Phone number format is correct
- [ ] Graduation year is 4-digit number
- [ ] Internet connection is stable

---

## Browser Console Check

### How to Check:

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Look for messages like:
   - `✅ Supabase ready` = Good connection
   - `❌ Supabase not ready` = Connection issue
   - Any red error = Problem to fix

### Screenshot What to Look For:

```
✅ Supabase ready after 2 attempts
alumni_profiles table ready
Ready to upload!
```

---

## Sample Test CSV

Create this file `test-alumni.csv` to verify:

```csv
full_name,email,phone,student_number,degree,graduation_year
Test User One,testuser1@example.com,555-0001,TEST001,Bachelor of Science,2024
Test User Two,testuser2@example.com,555-0002,TEST002,Bachelor of Arts,2024
```

Then upload with just these 2 records to test.

---

## If Still Not Working

### Provide These Details:
1. **Browser & Version:** (Chrome 90, Firefox 88, etc.)
2. **Error Message:** (Copy exact message from console)
3. **CSV Sample:** (First few rows)
4. **Console Output:** (F12 → Console → Copy text)

### Contact Support With:
- Screenshot of console (F12)
- Error message text
- Sample CSV that's failing
- Browser information

---

## Performance Tips

- Upload in batches of **50-100 records** at a time
- Wait between uploads (1 minute)
- Ensure good internet connection
- Close other browser tabs for better performance

---

## Verification After Upload

After successful upload:

1. **Check Audit Trail:** [Audit Trail Log](audit-trail.html)
   - Should show "BULK_UPLOAD_ALUMNI" entries

2. **View Alumni List:** [Alumni Employment Status](alumni-employment-status.html)
   - Search for uploaded names
   - Verify all fields saved correctly

3. **Database Check:**
   - Records should appear in alumni_profiles table
   - Can be viewed in Supabase dashboard

---

## Testing Steps

1. **Test with Sample Data First**
   - Use sample-alumni.csv provided
   - Upload 2-3 records to verify system works

2. **Test with Your Data**
   - Start with 10 records
   - Check results before uploading full batch

3. **Verify Success**
   - Check employment status page
   - Verify in audit trail
   - Look in database directly

---

## Quick Fixes (Most Common Solutions)

```javascript
// Open F12 Console and paste these to debug:

// Check Supabase connection
console.log('Supabase:', window.supabase ? 'Connected' : 'Not connected');

// Check if table is accessible
window.supabase?.from('alumni_profiles').select('count', {count: 'exact'})
  .then(res => console.log('Table accessible:', res));

// Check auth status  
window.supabase?.auth.getUser()
  .then(res => console.log('Auth user:', res));
```

---

## Need More Help?

1. **Check GitHub:** Review code issues or ask questions
2. **Review Logs:** Check browser console for error details
3. **Test Sample CSV:** Use provided test file to verify
4. **Verify Credentials:** Ensure Supabase keys are correct

---

**Last Updated:** January 2026  
**Version:** 1.0
