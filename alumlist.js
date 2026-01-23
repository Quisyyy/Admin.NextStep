// Alumni List JavaScript

// Map of degree codes to full labels (match the options used in alumni/Information.html)
const degreeLabels = {
  BSA: "Bachelor of Science in Accountancy",
  BSCpE: "Bachelor of Science in Computer Engineering",
  BSE: "Bachelor of Science in Entrepreneurship",
  BSHM: "Bachelor of Science in Hospitality Management",
  BSIT: "Bachelor of Science in Information Technology",
  "BSE(ENGLISH)": "Bachelor of Secondary Education (English)",
  "BSE(MATH)": "Bachelor of Secondary Education (Mathematics)",
  DOMT: "Diploma in Office Management Technology",
  // Legacy mappings for backward compatibility
  BSENTREP: "Bachelor of Science in Entrepreneurship",
  BSCE: "Bachelor of Science in Computer Engineering",
  BSEDEN: "Bachelor of Secondary Education (English)",
  BSEDMT: "Bachelor of Secondary Education (Mathematics)",
  DOMTLOM: "Diploma in Office Management Technology"
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
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      console.log("📊 Supabase response:", { data, error });

      if (!error && Array.isArray(data)) {
        console.log(`✅ Found ${data.length} alumni records`);
        // Fetch section completion status for each alumni (based on alumni_profiles fields)
        const alumniWithStatus = await Promise.all(
          data.map(async (r) => {
            const sectionStatus =
              await window.alumniFormTracker.getAlumniProfileSectionCompletion(
                r.id,
              );
            return {
              id: r.id,
              fullName: r.full_name,
              studentNumber: r.student_number,
              degree: r.degree,
              graduationYear: r.graduated_year || r.graduatedYear || "",
              sectionCompletion: sectionStatus,
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
    const sectionCompletion = a.sectionCompletion || {
      completedSections: 0,
      totalSections: 3,
      sectionStatus: { personal: false, academic: false, career: false },
    };
    const isComplete =
      sectionCompletion.completedSections === sectionCompletion.totalSections;
    const statusClass = isComplete ? "complete" : "incomplete";
    const statusText = isComplete
      ? `✅ Complete (${sectionCompletion.completedSections}/3)`
      : `⏳ Incomplete (${sectionCompletion.completedSections}/3)`;

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
  const yearFrom = document.getElementById("filterYearFrom")?.value || "";
  const yearTo = document.getElementById("filterYearTo")?.value || "";
  const completion = document.getElementById("filterCompletion")?.value || "";
  const search =
    document.getElementById("searchName")?.value?.toLowerCase() || "";

  console.log("🔍 Applying filters:", { degree, yearFrom, yearTo, completion, search });
  console.log("📊 Total alumni before filtering:", allAlumni.length);
  
  // Debug: Show first few alumni degrees
  console.log("📋 Sample alumni degrees:", allAlumni.slice(0, 5).map(a => ({ name: a.fullName, degree: a.degree })));

  let filtered = [...allAlumni];

  if (degree) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((a) => {
      const alumniDegree = a.degree || "";
      return alumniDegree === degree;
    });
    console.log(`🎯 Degree filter applied: ${beforeCount} -> ${filtered.length}`);
  }

  if (yearFrom || yearTo) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((a) => {
      const gradYear = parseInt(a.graduationYear, 10);
      const from = yearFrom ? parseInt(yearFrom, 10) : null;
      const to = yearTo ? parseInt(yearTo, 10) : null;
      if (from && to) return gradYear >= from && gradYear <= to;
      if (from) return gradYear >= from;
      if (to) return gradYear <= to;
      return true;
    });
    console.log(`📅 Year filter applied: ${beforeCount} -> ${filtered.length}`);
  }

  if (completion) {
    const beforeCount = filtered.length;
    filtered = filtered.filter((a) => {
      const sectionCompletion = a.sectionCompletion || {
        completedSections: 0,
        totalSections: 3,
      };
      const isComplete =
        sectionCompletion.completedSections === sectionCompletion.totalSections;
      return completion === "complete" ? isComplete : !isComplete;
    });
    console.log(`✅ Completion filter applied: ${beforeCount} -> ${filtered.length}`);
  }

  if (search) {
    const beforeCount = filtered.length;
    filtered = filtered.filter(
      (a) => {
        const fullName = (a.fullName || "").toLowerCase();
        const studentNumber = (a.studentNumber || "").toLowerCase();
        const degree = (a.degree || "").toLowerCase();
        const degreeLabel = labelForDegree(a.degree || "").toLowerCase();
        
        return fullName.includes(search) ||
               studentNumber.includes(search) ||
               degree.includes(search) ||
               degreeLabel.includes(search);
      }
    );
    console.log(`🔍 Search filter applied: ${beforeCount} -> ${filtered.length}`);
  }

  console.log(`📊 Filtered results: ${filtered.length} out of ${allAlumni.length}`);
  await renderTable(filtered);

  // Update counts
  const showingCount = document.getElementById("showingCount");
  const totalCount = document.getElementById("totalCount");
  if (showingCount) showingCount.textContent = filtered.length;
  if (totalCount) totalCount.textContent = allAlumni.length;
}

// Populate year filter
function populateYearFilter(alumni) {
  // Show a full range of years (2000 to current year)
  const startYear = 2000;
  const endYear = new Date().getFullYear();
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y);
  }
  const yearFrom = document.getElementById("filterYearFrom");
  const yearTo = document.getElementById("filterYearTo");
  if (yearFrom && yearTo) {
    const currentFrom = yearFrom.value;
    const currentTo = yearTo.value;
    yearFrom.innerHTML = '<option value="">From</option>';
    yearTo.innerHTML = '<option value="">To</option>';
    let yearsWithSelected = [...years];
    if (currentFrom && !yearsWithSelected.includes(Number(currentFrom))) {
      yearsWithSelected = [Number(currentFrom), ...yearsWithSelected];
    }
    if (currentTo && !yearsWithSelected.includes(Number(currentTo))) {
      yearsWithSelected = [Number(currentTo), ...yearsWithSelected];
    }
    // Remove duplicates and keep descending order
    yearsWithSelected = [...new Set(yearsWithSelected)].sort((a, b) => b - a);
    yearsWithSelected.forEach((year) => {
      const optionFrom = document.createElement("option");
      optionFrom.value = year;
      optionFrom.textContent = year;
      yearFrom.appendChild(optionFrom);
      const optionTo = document.createElement("option");
      optionTo.value = year;
      optionTo.textContent = year;
      yearTo.appendChild(optionTo);
    });
    if (currentFrom) yearFrom.value = currentFrom;
    if (currentTo) yearTo.value = currentTo;
  }
}

// Initialize filters
function initFilters() {
  console.log("🔧 Initializing filters...");
  const degreeFilter = document.getElementById("filterDegree");
  const yearFrom = document.getElementById("filterYearFrom");
  const yearTo = document.getElementById("filterYearTo");
  const completionFilter = document.getElementById("filterCompletion");
  const searchInput = document.getElementById("searchName");
  const resetBtn = document.getElementById("resetFilters");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  const archiveSelectedBtn = document.getElementById("archiveSelectedBtn");
  const cancelSelectBtn = document.getElementById("cancelSelectBtn");

  if (degreeFilter) {
    degreeFilter.addEventListener("change", () => {
      console.log("🎯 Degree filter changed:", degreeFilter.value);
      applyFilters();
    });
  }
  if (yearFrom) {
    yearFrom.addEventListener("change", () => {
      console.log("📅 Year from changed:", yearFrom.value);
      applyFilters();
    });
  }
  if (yearTo) {
    yearTo.addEventListener("change", () => {
      console.log("📅 Year to changed:", yearTo.value);
      applyFilters();
    });
  }
  if (completionFilter) {
    completionFilter.addEventListener("change", () => {
      console.log("✅ Completion filter changed:", completionFilter.value);
      applyFilters();
    });
  }
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      console.log("🔍 Search input changed:", searchInput.value);
      applyFilters();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      console.log("🔄 Resetting all filters...");
      if (degreeFilter) degreeFilter.value = "";
      if (yearFrom) yearFrom.value = "";
      if (yearTo) yearTo.value = "";
      if (completionFilter) completionFilter.value = "";
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
  
  console.log("✅ Filters initialized successfully");
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
      const { error: archiveError } = await window.supabase
        .from("alumni_profiles")
        .update({
          is_archived: true,
        })
        .eq("id", alumniId);
      if (archiveError) throw archiveError;
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
  try {
    console.log("🚀 Initializing alumni list...");
    const data = await loadAlumni();
    allAlumni = data;
    console.log(`📊 Loaded ${data.length} alumni records`);
    
    await renderTable(data);
    populateYearFilter(data);
    initFilters();

    // Set initial counts
    const showingCount = document.getElementById("showingCount");
    const totalCount = document.getElementById("totalCount");
    if (showingCount) showingCount.textContent = data.length;
    if (totalCount) totalCount.textContent = data.length;
    
    console.log("✅ Alumni list initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing alumni list:", error);
  }
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

    console.log("Archiving alumni (single):", alumni);

    const { error: archiveError } = await window.supabase
      .from("alumni_profiles")
      .update({
        is_archived: true,
      })
      .eq("id", alumniId);
    if (archiveError) throw archiveError;

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
