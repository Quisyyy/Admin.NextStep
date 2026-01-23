// Degree Details Page JavaScript

// Supabase connection helper
async function ensureSupabaseReady(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.supabase && window.supabaseClientReady) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

// Degree label mapping
const degreeLabels = {
  BSA: "Bachelor of Science in Accountancy",
  BSCpE: "Bachelor of Science in Computer Engineering",
  BSENTREP: "Bachelor of Science in Entrepreneurship",
  BSHM: "Bachelor of Science in Hospitality Management",
  BSIT: "Bachelor of Science in Information Technology",
  BSEDEN: "Bachelor of Secondary Education (English)",
  BSEDMT: "Bachelor of Secondary Education (Mathematics)",
  DOMTLOM: "Diploma in Office Management Technology",
  BSE: "Bachelor of Science in Entrepreneurship",
  BSCE: "Bachelor of Science in Computer Engineering",
  "BSE(ENGLISH)": "Bachelor of Secondary Education (English)",
  "BSE(MATH)": "Bachelor of Secondary Education (Mathematics)",
  DOMT: "Diploma in Office Management Technology"
};

// Get degree from URL query parameter
function getDegreeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("degree") || "";
}

// Load and display alumni for specific degree
let loadedProfiles = [];
let loadedCareerMap = {};

function getCareerForProfile(profile) {
  return loadedCareerMap[profile.id] || {};
}

function applyFiltersAndRender() {
  let filtered = [...loadedProfiles];

  // Student Number filter
  const studentNumberVal = document
    .getElementById("filterStudentNumber")
    .value.trim()
    .toLowerCase();
  if (studentNumberVal) {
    filtered = filtered.filter((p) =>
      (p.student_number || "").toLowerCase().includes(studentNumberVal),
    );
  }

  const employmentVal = document.getElementById("filterEmployment").value;
  if (employmentVal !== "all") {
    filtered = filtered.filter((p) => {
      const jobStatus = (p.job_status || "").toLowerCase();
      const filterValue = employmentVal.toLowerCase();

      // Handle different job status variations
      if (filterValue === "employed") {
        return jobStatus === "employed";
      } else if (filterValue === "self-employed") {
        return jobStatus === "self-employed" || jobStatus === "self employed";
      } else if (filterValue === "freelancer") {
        return jobStatus === "freelancer";
      } else if (filterValue === "unemployed") {
        return jobStatus === "unemployed";
      }

      return jobStatus === filterValue;
    });
  }

  // Related filter
  const relatedVal = document.getElementById("filterRelated").value;
  if (relatedVal !== "all") {
    filtered = filtered.filter((p) => {
      if (relatedVal === "related") return p.is_related === true;
      if (relatedVal === "not-related") return p.is_related === false;
      return true;
    });
  }

  // Sort Alpha
  const sortVal = document.getElementById("sortAlpha").value;
  if (sortVal === "asc") {
    filtered.sort((a, b) =>
      (a.full_name || "").localeCompare(b.full_name || ""),
    );
  } else if (sortVal === "desc") {
    filtered.sort((a, b) =>
      (b.full_name || "").localeCompare(a.full_name || ""),
    );
  }

  // Update statistics
  document.getElementById("totalCount").textContent = loadedProfiles.length;
  document.getElementById("completedCount").textContent = loadedProfiles.filter(
    (p) => p.full_name && p.email && p.student_number,
  ).length;

  // Render table
  const tbody = document.querySelector("#degreeAlumniTable tbody");
  tbody.innerHTML = "";
  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td colspan="7" class="empty">No alumni match the filters</td>';
    tbody.appendChild(tr);
    return;
  }
  filtered.forEach((profile) => {
    const career = getCareerForProfile(profile);
    // Debug log for mapping
    console.log(
      "Profile:",
      profile.full_name,
      profile.email,
      "career:",
      career,
    );
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${profile.full_name || "N/A"}</td>
      <td>${profile.student_number || "N/A"}</td>
      <td>${profile.email || "N/A"}</td>
      <td>${profile.current_job || profile.job_title || "Not specified"}</td>
      <td>${profile.career_path || "Not specified"}</td>
      <td>${profile.job_status ? capitalizeJobStatus(profile.job_status) : "N/A"}</td>
      <td>${profile.is_related === true ? "Related" : "Not Related"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Helper to capitalize job status for display
function capitalizeJobStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
}

async function loadDegreeDetails() {
  try {
    const degree = getDegreeFromURL();
    if (!degree) {
      alert("No degree specified. Redirecting to dashboard.");
      window.location.href = "homepage.html";
      return;
    }
    // Update page title
    const degreeLabel = degreeLabels[degree] || degree;
    document.getElementById("degreeTitle").textContent = degreeLabel;
    document.title = `${degreeLabel} - Admin`;
    const ready = await ensureSupabaseReady();
    if (!ready) {
      console.warn("Supabase not ready");
      showEmptyTable();
      return;
    }
    // Fetch alumni with specific degree
    // Handle degree code mapping - map URL parameter to database values
    const degreeMapping = {
      'BSA': ['BSA'],
      'BSCpE': ['BSCE', 'BSCpE'], // BSCpE from URL maps to BSCE in database
      'BSE': ['BSE', 'BSEntrep', 'BSENTREP'],
      'BSHM': ['BSHM'],
      'BSIT': ['BSIT'],
      'BSE(ENGLISH)': ['BSE(ENGLISH)', 'BSEDEN'],
      'BSE(MATH)': ['BSE(MATH)', 'BSEDMT'],
      'DOMT': ['DOMT', 'DOMTLOM']
    };
    
    const validDegreeCodes = degreeMapping[degree] || [degree];
    console.log('🎯 Looking for degree codes:', validDegreeCodes);
    
    // Fetch all profiles first, then filter by degree codes and active status
    let { data: allProfiles, error } = await window.supabase
      .from("alumni_profiles")
      .select("*")
      .eq("is_archived", false)
      .eq("is_deleted", false);
      
    // If is_archived or is_deleted columns don't exist, get all profiles and filter manually
    if (
      error &&
      (error.message.includes("is_archived") ||
        error.message.includes("is_deleted"))
    ) {
      console.warn(
        "is_archived or is_deleted column not found, loading all profiles and filtering manually",
      );
      const result = await window.supabase
        .from("alumni_profiles")
        .select("*");
      allProfiles = result.data;
      error = result.error;
      
      // Filter out archived and deleted manually if columns exist
      if (allProfiles) {
        allProfiles = allProfiles.filter((p) => 
          p.is_archived !== true && p.is_deleted !== true
        );
      }
    }
      
    if (error) {
      console.error("Error fetching alumni:", error);
      showEmptyTable();
      return;
    }
    
    // Filter profiles by matching degree codes
    const profiles = allProfiles.filter(p => {
      console.log('🔍 Checking profile degree:', p.degree, 'against valid codes:', validDegreeCodes);
      return validDegreeCodes.includes(p.degree);
    });
    
    console.log('📊 Found matching profiles:', profiles.length);
    // Fetch career info for all alumni - get ALL career data
    const { data: careerData, error: careerError } = await window.supabase
      .from("career_info")
      .select("*");
    if (careerError) {
      console.warn("Could not fetch career data:", careerError);
    }
    // Create a career info map - try multiple possible key names
    loadedCareerMap = {};
    if (careerData) {
      careerData.forEach((career, index) => {
        if (career.alumni_id) {
          loadedCareerMap[career.alumni_id] = career;
        } else if (career.profile_id) {
          loadedCareerMap[career.profile_id] = career;
        } else if (career.uid) {
          loadedCareerMap[career.uid] = career;
        }
        // Also map by index as fallback
        if (profiles[index]) {
          loadedCareerMap[profiles[index].id] = career;
        }
      });
    }
    loadedProfiles = profiles || [];
    applyFiltersAndRender();
  } catch (error) {
    console.error("Error loading degree details:", error);
    showEmptyTable();
  }
}

// Show empty table
function showEmptyTable() {
  const tbody = document.querySelector("#degreeAlumniTable tbody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="empty">Unable to load data</td></tr>';
  document.getElementById("totalCount").textContent = "0";
  document.getElementById("completedCount").textContent = "0";
}

// Initialize page on load
document.addEventListener("DOMContentLoaded", () => {
  loadDegreeDetails();
  // Add filter listeners
  [
    "filterStudentNumber",
    "sortAlpha",
    "filterEmployment",
    "filterRelated",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", applyFiltersAndRender);
      el.addEventListener("change", applyFiltersAndRender);
    }
  });
});
