// Bulk Upload Handler for Alumni Records

let selectedRecords = [];
let uploadedRecords = [];

// Initialize upload area
document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("uploadArea");
  const csvFile = document.getElementById("csvFile");
  const uploadBtn = document.getElementById("uploadBtn");
  const uploadPreviewBtn = document.getElementById("uploadPreviewBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const selectAll = document.getElementById("selectAll");

  // Handle drag and drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    handleFileSelect(e.dataTransfer.files[0]);
  });

  uploadArea.addEventListener("click", () => csvFile.click());
  csvFile.addEventListener("change", (e) =>
    handleFileSelect(e.target.files[0]),
  );

  uploadBtn.addEventListener("click", handleUploadFile);
  uploadPreviewBtn.addEventListener("click", uploadSelectedRecords);
  cancelBtn.addEventListener("click", resetForm);
  selectAll.addEventListener("change", (e) => {
    document.querySelectorAll(".row-checkbox").forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
    updateSelectedRecords();
  });
});

function handleFileSelect(file) {
  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    alert("Please select a CSV file");
    return;
  }

  const fileInfo = document.getElementById("fileInfo");
  fileInfo.innerHTML = `<p>Selected: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)</p>`;
  document.getElementById("uploadBtn").disabled = false;
}

async function handleUploadFile() {
  const csvFile = document.getElementById("csvFile");
  if (!csvFile.files[0]) {
    alert("Please select a CSV file first");
    return;
  }

  try {
    const file = csvFile.files[0];
    const text = await file.text();
    const records = parseCSV(text);

    if (records.length === 0) {
      alert(
        "No valid records found in CSV. Make sure your CSV has columns: Full Name, Email, Student Number",
      );
      return;
    }

    uploadedRecords = records; // Store for later
    selectedRecords = records.map((r) => ({ ...r, selected: true }));
    displayPreview(records);
  } catch (error) {
    console.error("Error reading file:", error);
    alert("Error reading file: " + error.message);
  }
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // Parse headers with proper CSV parsing
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const records = [];

  // Find column indices
  let fullNameIdx = -1,
    emailIdx = -1,
    phoneIdx = -1,
    studentNumberIdx = -1,
    birthdayIdx = -1,
    degreeIdx = -1,
    graduationYearIdx = -1;
    
  headers.forEach((header, idx) => {
    if (header.includes("full") || header.includes("name")) fullNameIdx = idx;
    if (header.includes("email")) emailIdx = idx;
    if (header.includes("phone")) phoneIdx = idx;
    if (header.includes("student") || header.includes("student_number"))
      studentNumberIdx = idx;
    if (header.includes("birth")) birthdayIdx = idx;
    if (header.includes("degree")) degreeIdx = idx;
    if (header.includes("graduation") || header.includes("year")) graduationYearIdx = idx;
  });

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values.some((v) => v.trim())) continue; // Skip empty rows

    const fullName = fullNameIdx >= 0 ? cleanValue(values[fullNameIdx]) : "";
    const email = emailIdx >= 0 ? cleanValue(values[emailIdx]) : "";
    const phone = phoneIdx >= 0 ? cleanValue(values[phoneIdx]) : "";
    const studentNumber = studentNumberIdx >= 0 ? cleanValue(values[studentNumberIdx]) : "";
    const birthday = birthdayIdx >= 0 ? cleanValue(values[birthdayIdx]) : "";
    const degree = degreeIdx >= 0 ? cleanValue(values[degreeIdx]) : "";
    const graduationYear = graduationYearIdx >= 0 ? cleanValue(values[graduationYearIdx]) : "";

    // Only require student_number and full_name
    if (studentNumber && fullName) {
      records.push({
        student_number: studentNumber,
        full_name: fullName,
        birthday: birthday,
        email: email,
        phone: phone,
        degree: degree,
        graduation_year: graduationYear,
        is_active: true,
      });
    }
  }

  return records;
}

// Helper function to properly parse CSV line with quoted fields
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  return result;
}

// Helper function to clean and trim values
function cleanValue(value) {
  if (!value) return '';
  return value.toString().trim().replace(/^["']|["']$/g, '');
}

function displayPreview(records) {
  const tbody = document.querySelector("#previewTable tbody");
  tbody.innerHTML = "";

  records.forEach((record, idx) => {
    const tr = document.createElement("tr");
    const displayYear = record.graduation_year || new Date().getFullYear();
    tr.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox" data-idx="${idx}" checked>
            </td>
            <td>${record.full_name || ""}</td>
            <td>${record.email || ""}</td>
            <td>${record.phone || ""}</td>
            <td>${record.student_number || ""}</td>
            <td>${record.degree || ""}</td>
            <td>${displayYear}</td>
            <td><span class="status-badge pending">Pending</span></td>
        `;
    tbody.appendChild(tr);

    document
      .querySelector(`[data-idx="${idx}"]`)
      .addEventListener("change", updateSelectedRecords);
  });

  document.getElementById("previewSection").style.display = "block";
  document.querySelector(".upload-section").style.display = "none";

  // Update count
  document.querySelector("#previewSection h2").textContent =
    `Step 2: Preview Data (${records.length} records)`;
}

function updateSelectedRecords() {
  selectedRecords = [];
  document.querySelectorAll(".row-checkbox:checked").forEach((checkbox) => {
    const idx = parseInt(checkbox.dataset.idx);
    selectedRecords.push(uploadedRecords[idx] || {});
  });
}

async function uploadSelectedRecords() {
  const checkedBoxes = Array.from(
    document.querySelectorAll(".row-checkbox:checked"),
  );
  if (checkedBoxes.length === 0) {
    alert("Please select at least one record");
    return;
  }

  const recordsToUpload = checkedBoxes
    .map((checkbox) => {
      const idx = parseInt(checkbox.dataset.idx);
      return uploadedRecords[idx];
    })
    .filter((r) => r); // Filter out undefined

  if (recordsToUpload.length === 0) {
    alert("No records selected");
    return;
  }

  await processUpload(recordsToUpload);
}

async function processUpload(records) {
  const supabaseReady = await ensureSupabaseReady();
  if (!supabaseReady) {
    alert(
      "Database connection not ready. Please check your internet connection and refresh the page.",
    );
    console.error(
      "Supabase not ready:",
      window.supabase,
      window.supabaseClientReady,
    );
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  const results = [];

  document.getElementById("previewSection").style.display = "none";
  document.getElementById("resultsSection").style.display = "block";

  for (const record of records) {
    try {
      // Validate required fields
      if (!record.student_number || !record.full_name) {
        failureCount++;
        results.push({
          success: false,
          email: record.email || "N/A",
          message: "Missing student number or full name",
        });
        continue;
      }

      // Prepare record for insertion
      // Only include columns present in the record
      const recordToInsert = {
        student_number: record.student_number.trim(),
        full_name: record.full_name.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
      };
      // Parse birthday into birth_year, birth_month, birth_day
      if (record.birthday) {
        const parts = record.birthday.trim().split("-");
        if (parts.length === 3) {
          recordToInsert.birth_year = parts[0];
          recordToInsert.birth_month = parts[1];
          recordToInsert.birth_day = parts[2];
        }
      }
      if (record.email) recordToInsert.email = record.email.trim();
      if (record.phone) recordToInsert.contact = record.phone.trim();

      // Insert record
      const { data, error } = await window.supabase
        .from("alumni_profiles")
        .insert([recordToInsert])
        .select();

      if (error) {
        throw new Error(`Insert failed: ${error.message}`);
      }

      successCount++;
      results.push({
        success: true,
        email: record.email,
        message: "Uploaded successfully",
      });

      // Log to audit trail
      try {
        const {
          data: { user },
        } = await window.supabase.auth.getUser();
        if (user) {
          await window.supabase.from("admin_audit_trail").insert({
            admin_id: user.id,
            action: "BULK_UPLOAD_ALUMNI",
            details: `Added alumni: ${record.full_name} (${record.student_number})`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (auditError) {
        console.warn("Could not log to audit trail:", auditError);
      }
    } catch (error) {
      console.error("Upload error for record:", record, error);
      failureCount++;
      results.push({
        success: false,
        email: record.email || "Unknown",
        message: error.message || "Upload failed",
      });
    }
  }

  displayResults(successCount, failureCount, results, records.length);
}

function displayResults(successCount, failureCount, results, totalProcessed) {
  document.getElementById("totalProcessed").textContent = totalProcessed;
  document.getElementById("successCount").textContent = successCount;
  document.getElementById("failureCount").textContent = failureCount;

  const resultsList = document.getElementById("resultsList");

  // Add success message at the top
  let successMsg = "";
  if (successCount > 0) {
    successMsg = `<div class="success-message" style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #155724;">
            <strong>✅ Upload Successful!</strong> ${successCount} record(s) have been added to the database.
        </div>`;
  }

  resultsList.innerHTML =
    successMsg + '<div class="results-detail"><h3>Details:</h3>';

  results.forEach((result) => {
    const statusClass = result.success ? "success" : "error";
    const icon = result.success ? "✅" : "❌";
    resultsList.innerHTML += `
            <div class="result-item ${statusClass}">
                <span class="result-icon">${icon}</span>
                <span class="result-email">${result.email}</span>
                <span class="result-message">${result.message}</span>
            </div>
        `;
  });

  resultsList.innerHTML += "</div>";
}

function resetForm() {
  document.getElementById("csvFile").value = "";
  document.getElementById("fileInfo").innerHTML = "";
  document.getElementById("uploadBtn").disabled = true;
  document.getElementById("previewSection").style.display = "none";
  document.querySelector(".upload-section").style.display = "block";
  selectedRecords = [];
}

async function ensureSupabaseReady(timeout = 5000) {
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < timeout) {
    attempts++;

    if (window.supabase && window.supabase.from) {
      console.log("✅ Supabase ready after", attempts, "attempts");
      return true;
    }

    if (window.supabaseClientReady === false) {
      console.error("❌ Supabase client initialization failed");
      return false;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.error("❌ Supabase timeout after", attempts, "attempts");
  console.error("window.supabase:", window.supabase);
  console.error("window.supabaseClientReady:", window.supabaseClientReady);

  return !!(window.supabase && window.supabase.from);
}
