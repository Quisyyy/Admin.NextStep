# Bulk Upload Alumni Guide

## How to Use Bulk Upload

The bulk upload feature allows you to add multiple alumni records to the system at once by uploading a CSV file.

## CSV File Format

Your CSV file should have the following structure:

### Required Columns:
- **full_name** - Full name of the alumnus
- **email** - Email address (must be unique)

### Optional Columns:
- **phone** - Phone number
- **student_number** - Student ID
- **degree** - Degree earned
- **graduation_year** - Year of graduation (defaults to current year if not provided)

## CSV Example

```
full_name,email,phone,student_number,degree,graduation_year
John Smith,john.smith@email.com,555-0101,STU001,Bachelor of Science,2024
Sarah Johnson,sarah.johnson@email.com,555-0102,STU002,Bachelor of Arts,2024
Michael Chen,michael.chen@email.com,555-0103,STU003,Master of Business Administration,2023
```

## Upload Steps

1. **Prepare Your CSV File**
   - Save your alumni data as a .csv file
   - Use the format shown above
   - Make sure all required fields are filled

2. **Navigate to Bulk Upload**
   - Click "Bulk Upload" in the admin dashboard
   - Or go directly to bulk-upload.html

3. **Select Your File**
   - Click the upload area or drag & drop your CSV file
   - The file size will be displayed

4. **Review Preview**
   - Check the preview table for accuracy
   - Uncheck any records you don't want to upload
   - Click "Upload Selected Records" when ready

5. **Confirm Results**
   - Review the upload results
   - Successful uploads will show ✅
   - Failed uploads will show ❌ with error reason

## Common Issues

### Duplicate Email
If you get a "Duplicate email already exists" error, it means that email is already in the system. Update the email address and try again.

### Missing Required Fields
Make sure your CSV has:
- A column for full names (can be labeled as "full_name", "name", "Full Name", etc.)
- A column for emails (labeled as "email", "Email", etc.)

### Graduation Year Not Recognized
If the graduation_year is not being recognized:
- Make sure it's a 4-digit year
- Check the column is labeled "graduation_year" or "year"

## Tips for Success

✓ Test with a small batch first (2-3 records)
✓ Double-check email addresses for uniqueness
✓ Use a spreadsheet application to create your CSV for better formatting
✓ Review the preview before uploading
✓ Check the audit trail to confirm uploads were logged

## Sample CSV Download

You can download the sample-alumni.csv file from the admin folder to use as a template.

---
**Need Help?** Contact the system administrator or check the audit trail for detailed logs of all uploads.
