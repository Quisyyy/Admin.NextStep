// Alumni List JavaScript

// Map of degree codes to full labels (match the options used in alumni/Information.html)
const degreeLabels = {
  BSA: "Bachelor of Science in Accountancy (BSA)",
  BSCpE: "Bachelor of Science in Computer Engineering (BSCpE)",
  BSENTREP: "Bachelor of Science in Entrepreneurship (BSENTREP)",
  BSHM: "Bachelor of Science in Hospitality Management (BSHM)",
  BSIT: "Bachelor of Science in Information Technology (BSIT)",
  BSEDEN: "Bachelor of Secondary Education major in English (BSEDEN)",
  BSEDMT: "Bachelor of Secondary Education major in Mathematics (BSEDMT)",
  DOMTLOM:
    "Diploma in Office Management Technology- Legal Office Management (DOMTLOM)",
};

function labelForDegree(codeOrLabel) {
  if (!codeOrLabel) return "";
  // If the stored value is a code that exists in the map, return the mapped label.
  if (degreeLabels[codeOrLabel]) return degreeLabels[codeOrLabel];
  // Otherwise assume it's already a human-friendly label and return as-is.
  return codeOrLabel;
}

// fetch alumni list (prefer Supabase if configured, fallback to data/alumni.json)
async function ensureSupabaseReady(timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.supabase && window.supabase.from) return true;
    if (window.supabaseClientReady === false) return false;
    await new Promise((r) => setTimeout(r, 100));
  }
  return !!(window.supabase && window.supabase.from);
}

async function loadAlumni() {
  // Try Supabase first
  try {
    console.log("🔍 Attempting to load alumni from Supabase...");
    const ok = await ensureSupabaseReady(2000);
    console.log("✅ Supabase ready:", ok);
    if (ok) {
      const { data, error } = await window.supabase
        .from("alumni_profiles")
        .select(
          "id, full_name, student_number, degree, graduated_year, created_at",
        )
        .order("created_at", {
          ascending: false,
        });

      console.log("📊 Supabase response:", { data, error });

      if (!error && Array.isArray(data)) {
        console.log(`✅ Found ${data.length} alumni records`);
        // Fetch completion status for each alumni
        const alumniWithStatus = await Promise.all(
          data.map(async (r) => {
            const status = await getAlumniCompletionStatus(r.id);
            return {
              id: r.id,
              fullName: r.full_name,
              studentNumber: r.student_number,
              degree: r.degree,
              graduationYear: r.graduated_year || r.graduatedYear || "",
              completionStatus: status,
            };
          }),
        );
        return alumniWithStatus;
      }

      if (error) {
        console.error("❌ Supabase error:", error);
      }
    }
  } catch (e) {
    console.warn("Supabase alumni fetch failed", e);
  }

  // Fallback to local JSON file
  console.log("⚠️ Falling back to local JSON...");
  try {
    const res = await fetch("data/alumni.json", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("no file");
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("❌ Local JSON fallback failed:", e);
    return [];
  }
}

async function getAlumniCompletionStatus(alumniId) {
  if (!window.alumniFormTracker) {
    return { isAllComplete: false, completedForms: 0, totalForms: 0 };
  }
  return await window.alumniFormTracker.getAlumniCompletionStatus(alumniId);
}

async function renderTable(alumni) {
  const tbody = document.querySelector("#alumTable tbody");
  tbody.innerHTML = "";
  if (!alumni.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="7" class="empty">No alumni records</td>';
    tbody.appendChild(tr);
    return;
  }
  alumni.forEach((a) => {
    const tr = document.createElement("tr");
    const degreeLabel = labelForDegree(a.degree);
    const completionStatus = a.completionStatus || {
      isAllComplete: false,
      completedForms: 0,
      totalForms: 0,
    };
    const statusClass = completionStatus.isAllComplete
      ? "complete"
      : "incomplete";
    const statusText = completionStatus.isAllComplete
      ? `✅ Complete (${completionStatus.completedForms}/${completionStatus.totalForms})`
      : `⏳ Incomplete (${completionStatus.completedForms}/${completionStatus.totalForms})`;

    const isChecked = selectedAlumni.has(a.id) ? "checked" : "";

    tr.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" data-id="${a.id}" ${isChecked}></td>
            <td>${a.fullName || ""}</td>
            <td>${a.studentNumber || ""}</td>
            <td>${degreeLabel || ""}</td>
            <td>${a.graduationYear || ""}</td>
            <td><span class="checklist-badge ${statusClass}">${statusText}</span></td>
            <td><button class="btn-small btn-archive" onclick="archiveAlumni('${a.id}', '${a.fullName}')">Archive</button></td>
        `;

    const checkbox = tr.querySelector(".row-checkbox");
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        selectedAlumni.add(a.id);
      } else {
        selectedAlumni.delete(a.id);
      }
      updateBulkActionsBar();
    });

    tbody.appendChild(tr);
  });
}

// Store original data for filtering
let allAlumni = [];
let selectedAlumni = new Set();

// Apply filters
async function applyFilters() {
  const degree = document.getElementById("filterDegree")?.value || "";
  const year = document.getElementById("filterYear")?.value || "";
  const completion = document.getElementById("filterCompletion")?.value || "";
  const search =
    document.getElementById("searchName")?.value?.toLowerCase() || "";

  let filtered = allAlumni;

  if (degree) {
    filtered = filtered.filter((a) => a.degree === degree);
  }

  if (year) {
    filtered = filtered.filter((a) => String(a.graduationYear) === year);
  }

  if (completion) {
    filtered = filtered.filter((a) => {
      const isComplete = a.completionStatus?.isAllComplete || false;
      return completion === "complete" ? isComplete : !isComplete;
    });
  }

  if (search) {
    filtered = filtered.filter(
      (a) =>
        (a.fullName || "").toLowerCase().includes(search) ||
        (a.studentNumber || "").toLowerCase().includes(search),
    );
  }

  await renderTable(filtered);

  // Update counts
  const showingCount = document.getElementById("showingCount");
  const totalCount = document.getElementById("totalCount");
  if (showingCount) showingCount.textContent = filtered.length;
  if (totalCount) totalCount.textContent = allAlumni.length;
}

// Populate year filter
function populateYearFilter(alumni) {
  const years = [
    ...new Set(alumni.map((a) => a.graduationYear).filter((y) => y)),
  ].sort((a, b) => b - a);
  const yearSelect = document.getElementById("filterYear");
  if (yearSelect) {
    const current = yearSelect.value;
    yearSelect.innerHTML = '<option value="">All Years</option>';
    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
    if (current) yearSelect.value = current;
  }
}

// Initialize filters
function initFilters() {
  const degreeFilter = document.getElementById("filterDegree");
  const yearFilter = document.getElementById("filterYear");
  const searchInput = document.getElementById("searchName");
  const resetBtn = document.getElementById("resetFilters");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const archiveSelectedBtn = document.getElementById("archiveSelectedBtn");
  const cancelSelectBtn = document.getElementById("cancelSelectBtn");

  if (degreeFilter) degreeFilter.addEventListener("change", applyFilters);
  if (yearFilter) yearFilter.addEventListener("change", applyFilters);
  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (degreeFilter) degreeFilter.value = "";
      if (yearFilter) yearFilter.value = "";
      if (searchInput) searchInput.value = "";
      applyFilters();
    });
  }

  // Select all checkbox
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".row-checkbox");
      if (e.target.checked) {
        checkboxes.forEach((cb) => {
          cb.checked = true;
          selectedAlumni.add(cb.dataset.id);
        });
      } else {
        checkboxes.forEach((cb) => {
          cb.checked = false;
          selectedAlumni.delete(cb.dataset.id);
        });
      }
      updateBulkActionsBar();
    });
  }

  // Bulk archive button
  if (archiveSelectedBtn) {
    archiveSelectedBtn.addEventListener("click", bulkArchiveSelected);
  }

  if (cancelSelectBtn) {
    cancelSelectBtn.addEventListener("click", () => {
      selectedAlumni.clear();
      document
        .querySelectorAll(".row-checkbox")
        .forEach((cb) => (cb.checked = false));
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
      updateBulkActionsBar();
    });
  }
}

function updateBulkActionsBar() {
  const bar = document.getElementById("bulkActionsBar");
  const count = document.getElementById("selectedCount");

  if (selectedAlumni.size > 0) {
    count.textContent = selectedAlumni.size;
    bar.style.display = "flex";
  } else {
    bar.style.display = "none";
  }
}

async function bulkArchiveSelected() {
  if (selectedAlumni.size === 0) {
    alert("No records selected");
    return;
  }

  const count = selectedAlumni.size;
  if (!confirm(`Archive ${count} selected alumni record(s)?`)) {
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const alumniId of selectedAlumni) {
    try {
      // 1. Get the alumni record
      const { data: alumni, error: fetchError } = await window.supabase
        .from("alumni_profiles")
        .select("*")
        .eq("id", alumniId)
        .maybeSingle();
      if (fetchError || !alumni)
        throw fetchError || new Error("Alumni record not found");

      // Debug: Log the alumni record being archived
      console.log("Archiving alumni (bulk):", alumni);
      // 2. Insert into alumni_archive
      const { error: insertError } = await window.supabase
        .from("alumni_archive")
        .insert([
          {
            original_alumni_id: alumni.id,
            full_name: alumni.full_name,
            email: alumni.email,
            student_number: alumni.student_number,
            degree: alumni.degree,
            archive_reason: "Bulk archived by admin",
            archived_at: new Date().toISOString(),
            original_created_at: alumni.created_at || null,
          },
        ]);
      if (insertError) throw insertError;

      // 3. Delete from alumni_profiles
      const { error: deleteError } = await window.supabase
        .from("alumni_profiles")
        .delete()
        .eq("id", alumniId);
      if (deleteError) throw deleteError;

      successCount++;
    } catch (error) {
      failureCount++;
      console.error("Error archiving:", error);
    }
  }

  alert(
    `✓ ${successCount} record(s) archived\n${failureCount > 0 ? `✗ ${failureCount} failed` : ""}`,
  );

  // Reload list
  selectedAlumni.clear();
  const updatedData = await loadAlumni();
  allAlumni = updatedData;
  applyFilters();
  populateYearFilter(updatedData);
}

// Initialize on load
(async () => {
  const data = await loadAlumni();
  allAlumni = data;
  renderTable(data);
  populateYearFilter(data);
  initFilters();

  // Set initial counts
  const showingCount = document.getElementById("showingCount");
  const totalCount = document.getElementById("totalCount");
  if (showingCount) showingCount.textContent = data.length;
  if (totalCount) totalCount.textContent = data.length;
})();

// Listen for saves from other pages/tabs and reload
window.addEventListener("alumni:saved", async function (e) {
  console.info("alumni:saved event received, reloading list", e && e.detail);
  const data = await loadAlumni();
  allAlumni = data;
  applyFilters();
  populateYearFilter(data);
});

// Archive functionality with improved error handling
async function archiveAlumni(alumniId, fullName) {
  const reason = prompt(
    `Enter reason for archiving "${fullName}":`,
    "Requested by admin",
  );
  if (reason === null) return; // User cancelled

  try {
    // 1. Get the alumni record
    const { data: alumni, error: fetchError } = await window.supabase
      .from("alumni_profiles")
      .select("*")
      .eq("id", alumniId)
      .maybeSingle();
    if (fetchError || !alumni)
      throw fetchError || new Error("Alumni record not found");

    // Debug: Log the alumni record being archived
    console.log("Archiving alumni (single):", alumni);
    // 2. Insert into alumni_archive
    const { error: insertError } = await window.supabase
      .from("alumni_archive")
      .insert([
        {
          original_alumni_id: alumni.id,
          full_name: alumni.full_name,
          email: alumni.email,
          student_number: alumni.student_number,
          degree: alumni.degree,
          archive_reason: reason || "No reason specified",
          archived_at: new Date().toISOString(),
          original_created_at: alumni.created_at || null,
        },
      ]);
    if (insertError) throw insertError;

    // 3. Delete from alumni_profiles
    const { error: deleteError } = await window.supabase
      .from("alumni_profiles")
      .delete()
      .eq("id", alumniId);
    if (deleteError) throw deleteError;

    alert("✓ Alumni archived successfully.");
    // Reload the list
    const updatedData = await loadAlumni();
    allAlumni = updatedData;
    applyFilters();
    populateYearFilter(updatedData);
  } catch (error) {
    console.error("Error archiving alumni:", error);
    alert("Error archiving record: " + (error.message || error));
  }
}
