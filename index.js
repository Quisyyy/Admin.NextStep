// Admin Dashboard JavaScript

// Supabase connection helper
async function ensureSupabaseReady(timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.supabase && window.supabaseClientReady) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

// Function to animate numbers
function animateNumber(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    element.textContent = current.toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Fetch real data from Supabase
async function loadDashboardData() {
  try {
    const ready = await ensureSupabaseReady();
    if (!ready) {
      console.warn("Supabase not ready, using fallback data");
      return;
    }

    // Get only non-archived and non-deleted alumni profiles
    let { data: profiles, error } = await window.supabase
      .from("alumni_profiles")
      .select("*")
      .eq("is_archived", false)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // If is_archived or is_deleted columns don't exist, get all profiles
    if (
      error &&
      (error.message.includes("is_archived") ||
        error.message.includes("is_deleted"))
    ) {
      console.warn(
        "is_archived or is_deleted column not found, loading all profiles",
      );
      const result = await window.supabase
        .from("alumni_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      profiles = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error fetching alumni data:", error);
      return;
    }

    console.log("Loaded active alumni profiles:", (profiles || []).length);

    // Calculate statistics
    const total = profiles.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const newThisMonth = profiles.filter((p) => {
      const created = new Date(p.created_at);
      return (
        created.getMonth() === currentMonth &&
        created.getFullYear() === currentYear
      );
    }).length;

    // Calculate completed profiles using comprehensive field check
    const completedProfiles = profiles.filter((p) => {
      // Personal Info fields (11 required)
      const personalFields = [
        "student_number", "full_name", "email", "birth_month", "birth_day", 
        "birth_year", "contact", "street", "province", "municipality", "barangay"
      ];
      const personalComplete = personalFields.every(
        (f) => !!(p[f] && String(p[f]).trim() !== "")
      );

      // Academic Background fields (5 required)
      const academicFields = [
        "degree", "major", "honors", "graduated_year", "degree_label"
      ];
      const academicComplete = academicFields.every(
        (f) => !!(p[f] && String(p[f]).trim() !== "")
      );

      // Career Info fields (4 required)
      const careerFields = [
        "job_status", "current_job", "career_path", "is_related"
      ];
      const careerComplete = careerFields.every(
        (f) => p[f] !== undefined && p[f] !== null && String(p[f]).trim() !== ""
      );

      // Profile is complete only if ALL sections are complete
      return personalComplete && academicComplete && careerComplete;
    }).length;

    // Update dashboard numbers with animation
    animateNumber(document.getElementById("totalAlumni"), 0, total, 1000);
    animateNumber(
      document.getElementById("newThisMonth"),
      0,
      newThisMonth,
      1000,
    );
    animateNumber(document.getElementById("activeAlumni"), 0, total, 1000); // assuming all are active
    animateNumber(
      document.getElementById("completedProfiles"),
      0,
      completedProfiles,
      1000,
    );

    // Update card numbers (only show total)
    animateNumber(document.getElementById("card-total"), 0, total, 1000);

    // Store profiles data for filtering
    window.allProfiles = profiles;

    // Load alumni status data (current status by degree)
    loadAlumniStatus(profiles);

    // Setup degree filter
    const degreeFilter = document.getElementById("degreeFilter");
    if (degreeFilter) {
      degreeFilter.addEventListener("change", (e) => {
        const selectedDegree = e.target.value;
        if (selectedDegree) {
          const filtered = profiles.filter((p) => p.degree === selectedDegree);
          animateNumber(
            document.getElementById("card-total"),
            total,
            filtered.length,
            500,
          );
        } else {
          animateNumber(
            document.getElementById("card-total"),
            document.getElementById("card-total").textContent,
            total,
            500,
          );
        }
      });
    }

    // Calculate monthly registrations for chart
    const monthlyData = new Array(12).fill(0);
    profiles.forEach((p) => {
      const created = new Date(p.created_at);
      if (created.getFullYear() === currentYear) {
        monthlyData[created.getMonth()]++;
      }
    });

    // Update chart bars
    const chartBars = document.querySelectorAll("#registrationChart .bar");
    chartBars.forEach((bar, index) => {
      if (index < monthlyData.length) {
        const count = monthlyData[index];
        const height =
          count > 0
            ? Math.max(20, (count / Math.max(...monthlyData, 1)) * 100)
            : 0;
        bar.style.setProperty("--height", height + "px");
        bar.style.height = height + "px";
        bar.querySelector(".bar-value").textContent = count;
      }
    });

    // Update last updated timestamp
    document.getElementById("lastUpdated").textContent =
      `Last updated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Load and display alumni current status by degree
async function loadAlumniStatus(profiles) {
  // Map short codes to full degree names based on your dropdown
  const degreeLabels = {
    BSA: "Bachelor of Science in Accountancy",
    BSCE: "Bachelor of Science in Computer Engineering", 
    BSE: "Bachelor of Science in Entrepreneurship",
    BSHM: "Bachelor of Science in Hospitality Management",
    BSIT: "Bachelor of Science in Information Technology",
    "BSE(ENGLISH)": "Bachelor of Secondary Education (English)",
    "BSE(MATH)": "Bachelor of Secondary Education (Mathematics)",
    DOMT: "Diploma in Office Management Technology",
  };

  // Count active alumni by degree (exclude archived and deleted)
  const degreeCounts = {};
  Object.keys(degreeLabels).forEach((code) => {
    degreeCounts[code] = profiles.filter((p) => {
      // Only count active alumni (not archived, not deleted)
      const isActive = (p.is_archived !== true && p.is_deleted !== true);
      return isActive && p.degree === code;
    }).length;
  });

  // Display status grid
  const statusGrid = document.getElementById("statusGrid");
  if (statusGrid) {
    statusGrid.innerHTML = "";
    Object.entries(degreeLabels).forEach(([code, label]) => {
      const count = degreeCounts[code];
      const statusCard = document.createElement("div");
      statusCard.className = "status-card";
      statusCard.innerHTML = `
                <div class="status-degree">${label}</div>
                <div class="status-count">${count}</div>
                <a href="alumlist.html?degree=${code}" class="status-view-btn">View</a>
            `;
      statusGrid.appendChild(statusCard);
    });
  }
}

// Initialize dashboard on load
document.addEventListener("DOMContentLoaded", () => {
  // Load real data
  loadDashboardData();
  loadCareerStats();

  // Animate initial load
  setTimeout(() => {
    const cards = document.querySelectorAll(".stat-card");
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.animation = "fadeInUp 0.6s ease-out forwards";
      }, index * 100);
    });
  }, 500);

  // Listen for alumni updates to refresh dashboard
  window.addEventListener("alumni:saved", () => {
    setTimeout(loadDashboardData, 500);
    setTimeout(loadCareerStats, 500);
  });

  // Download form handler
  const downloadForm = document.getElementById("downloadForm");
  if (downloadForm) {
    downloadForm.addEventListener("submit", handleDownload);
  }
});

// Handle data download
async function handleDownload(event) {
  event.preventDefault();

  const format = document.getElementById("downloadFormat").value;
  const filterSelect = document.getElementById("dataFilter");
  const filter = filterSelect.value;
  const yearFilter = document.getElementById("yearFilter")?.value || "";
  const button = event.target.querySelector(".download-btn");

  // Degree codes for filtering
  const degreeCodes = [
    "BSA",
    "BSCpE",
    "BSENTREP",
    "BSHM",
    "BSIT",
    "BSEDEN",
    "BSEDMT",
    "DOMTLOM",
  ];

  if (!format) {
    alert("Please select a format");
    return;
  }

  try {
    button.disabled = true;
    button.textContent = "Downloading...";

    // Fetch alumni data
    const ready = await ensureSupabaseReady();
    if (!ready) {
      alert("Database connection failed");
      button.textContent = "Download Data";
      button.disabled = false;
      return;
    }

    const { data: profiles, error } = await window.supabase
      .from("alumni_profiles")
      .select("*");

    if (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data: " + error.message);
      button.textContent = "Download Data";
      button.disabled = false;
      return;
    }

    console.log("📊 Fetched alumni profiles:", profiles.length);
    console.log("🔍 Filter:", filter, "Year:", yearFilter);

    // Apply filters
    let filteredData = profiles;
    let appliedFilters = [];

    // Filter by degree - only if a valid degree code is selected
    if (filter && filter !== "all" && degreeCodes.includes(filter)) {
      const countBefore = filteredData.length;
      filteredData = filteredData.filter((p) => {
        // Try multiple possible degree field names
        const degree = p.degree || p.program || p.degree_code || "";
        return degree.toUpperCase() === filter.toUpperCase();
      });
      console.log(
        `✅ Degree filter "${filter}": ${countBefore} → ${filteredData.length}`,
      );
      appliedFilters.push(filter);
    }

    // Filter by graduation year
    if (yearFilter && yearFilter !== "") {
      const countBefore = filteredData.length;
      filteredData = filteredData.filter((p) => {
        // Try multiple possible year field names
        const year = (
          p.graduation_year ||
          p.year_graduated ||
          p.graduated_year ||
          ""
        )
          .toString()
          .trim();
        return year === yearFilter;
      });
      console.log(
        `✅ Year filter "${yearFilter}": ${countBefore} → ${filteredData.length}`,
      );
      appliedFilters.push(`Year: ${yearFilter}`);
    }

    console.log("📋 Final filtered data:", filteredData.length, "records");

    // Check if we have data
    if (!filteredData || filteredData.length === 0) {
      let errorMsg = "No data found";
      if (appliedFilters.length > 0) {
        errorMsg += ` for: ${appliedFilters.join(", ")}`;
      } else {
        errorMsg += " in database";
      }
      console.warn(errorMsg);
      alert(
        `❌ ${errorMsg}.\n\nTry removing filters or selecting "All Alumni".`,
      );
      button.textContent = "Download Data";
      button.disabled = false;
      return;
    }

    // Log download action
    let employeeId = "";
    if (
      window.DatabaseHelper &&
      typeof window.DatabaseHelper.getMyAdminRecord === "function"
    ) {
      const admin = await window.DatabaseHelper.getMyAdminRecord();
      if (admin && admin.employee_id) employeeId = admin.employee_id;
    }
    if (
      employeeId &&
      window.DatabaseHelper &&
      typeof window.DatabaseHelper.logAdminAction === "function"
    ) {
      const details = `format=${format}, degree=${filter || "all"}, year=${yearFilter || "all"}, records=${filteredData.length}`;
      window.DatabaseHelper.logAdminAction(employeeId, "download", details);
    }

    filteredData.sort((a, b) => {
      const nameA = (a.full_name || "").toLowerCase();
      const nameB = (b.full_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    if (format === "csv") {
      downloadAsCSV(filteredData);
    } else if (format === "pdf") {
      downloadAsPDF(filteredData);
    }

    button.textContent = "Download Data";
    button.disabled = false;
  } catch (error) {
    console.error("❌ Download error:", error);
    alert("Error downloading data: " + error.message);
    button.textContent = "Download Data";
    button.disabled = false;
  }
}

// Generate and download CSV file
function downloadAsCSV(data) {
  if (!data || data.length === 0) {
    alert("❌ No data available to download.");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle CSV escaping
          if (value === null || value === undefined) return "";
          const stringValue = String(value);
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(","),
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  // Get selected filter value and label
  const filterSelect = document.getElementById("dataFilter");
  let filterLabel = "";
  if (filterSelect) {
    const selectedOption = filterSelect.options[filterSelect.selectedIndex];
    filterLabel =
      selectedOption && selectedOption.value !== "all"
        ? `_${selectedOption.text.replace(/\s+/g, "_")}`
        : "";
  }
  link.setAttribute(
    "download",
    `alumni_data${filterLabel}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  alert(`✅ Downloaded ${data.length} records as CSV`);
}

// Generate and download PDF file
function downloadAsPDF(data) {
  if (!data || data.length === 0) {
    alert(
      "❌ No data to download. Please add alumni records first.\n\nTo add test data:\n1. Go to Supabase SQL Editor\n2. Run the contents of add-sample-data.sql",
    );
    return;
  }

  // Check if html2pdf library is available
  if (typeof html2pdf === "undefined") {
    alert("PDF library not loaded. Downloading as CSV instead.");
    downloadAsCSV(data);
    return;
  }

  try {
    // Create a proper HTML document
    const htmlContent = document.createElement("div");
    htmlContent.style.padding = "20px";
    htmlContent.style.fontFamily = "Arial, sans-serif";

    // Title
    const title = document.createElement("h1");
    title.textContent = "Alumni Data Report";
    title.style.color = "#004AAD";
    title.style.textAlign = "center";
    htmlContent.appendChild(title);

    // Metadata
    const meta = document.createElement("p");
    meta.style.fontSize = "12px";
    meta.style.color = "#666";
    meta.innerHTML = `
            <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Records:</strong> ${data.length}
        `;
    htmlContent.appendChild(meta);

    // Create table
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.marginTop = "20px";
    table.style.fontSize = "11px";

    // Get headers
    const headers = Object.keys(data[0]);

    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.style.backgroundColor = "#004AAD";
    headerRow.style.color = "white";

    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header;
      th.style.padding = "8px";
      th.style.border = "1px solid #ddd";
      th.style.textAlign = "left";
      th.style.fontWeight = "bold";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create data rows
    const tbody = document.createElement("tbody");
    data.forEach((row, index) => {
      const tr = document.createElement("tr");
      tr.style.backgroundColor = index % 2 === 0 ? "#f9f9f9" : "white";

      headers.forEach((header) => {
        const td = document.createElement("td");
        const value = row[header];
        td.textContent =
          value !== null && value !== undefined
            ? String(value).substring(0, 100)
            : "";
        td.style.padding = "6px";
        td.style.border = "1px solid #ddd";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    htmlContent.appendChild(table);

    // Generate PDF
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `alumni_data_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { orientation: "landscape", unit: "mm", format: "a4" },
    };

    html2pdf().set(opt).from(htmlContent).save();
    alert(`✅ Downloaded ${data.length} records as PDF`);
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("Error generating PDF. Downloading as CSV instead.");
    downloadAsCSV(data);
  }
}

// Simple PDF creation fallback
function createSimplePDF(data) {
  // For now, alert user that they need html2pdf library
  alert(
    "PDF download requires additional library. Please download as CSV instead.",
  );
}

// Load career stats percentages from Supabase career_info table
async function loadCareerStats() {
  // Define setText at the beginning to avoid initialization issues
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  try {
    const ready = await ensureSupabaseReady();
    if (!ready) {
      console.warn("Supabase not ready, skipping career stats");
      showCareerStatsError("Database connection not ready");
      return;
    }

    console.log("🔍 Fetching career stats...");

    let { data: profiles, error: profilesError } = await window.supabase
      .from("alumni_profiles")
      .select("job_status, career_path")
      .eq("is_archived", false)
      .eq("is_deleted", false);

    // If is_archived or is_deleted columns don't exist, get all profiles
    if (
      profilesError &&
      (profilesError.message.includes("is_archived") ||
        profilesError.message.includes("is_deleted"))
    ) {
      console.warn(
        "is_archived or is_deleted column not found in career stats, loading all profiles",
      );
      const result = await window.supabase
        .from("alumni_profiles")
        .select("job_status, career_path");
      profiles = result.data;
      profilesError = result.error;
    }

    if (profilesError) {
      console.error("❌ Alumni profiles error:", profilesError);
      showCareerStatsError(
        `Unable to fetch alumni profile data: ${profilesError.message}`,
      );
      return;
    }

    console.log(`✅ Found ${(profiles || []).length} alumni profile records`);

    const total = (profiles || []).length;

    if (total === 0) {
      console.warn("⚠️ No alumni profile data found in database");
      showCareerStatsEmpty();
      return;
    }

    // No real-time subscription for alumni_profiles for now

    const statusCounts = {};
    let employedCount = 0;

    // Normalization logic for job_status
    const standardStatuses = [
      "employed",
      "self-employed",
      "freelancer",
      "unemployed",
    ];
    const normalizeStatus = (raw) => {
      const s = (raw || "").trim().toLowerCase();
      if (!s) return null; // Do not count blank/null as Others
      if (s === "employed") return "Employed";
      if (s === "unemployed") return "Unemployed";
      if (s === "freelancer") return "Freelancer";
      if (s.replace(/[- ]/g, "") === "selfemployed") return "Self-Employed";
      if (s.includes("self") && s.includes("employ")) return "Self-Employed";
      // If not blank/null and not standard, count as Others
      return "Others";
    };

    const industryCounts = {};
    (profiles || []).forEach((d) => {
      const normStatus = normalizeStatus(d.job_status);
      if (normStatus) {
        statusCounts[normStatus] = (statusCounts[normStatus] || 0) + 1;
        if (["Employed", "Self-Employed", "Freelancer"].includes(normStatus)) {
          employedCount++;
        }
      }
      const key = (d.career_path || "").trim();
      if (key) {
        industryCounts[key] = (industryCounts[key] || 0) + 1;
      }
    });

    const employedPct = total ? Math.round((employedCount / total) * 100) : 0;

    setText("careerTotal", total.toLocaleString());
    setText("careerEmployedPercent", `${employedPct}%`);
    setText("careerEmployedCount", `${employedCount} of ${total}`);
    const topIndustry = Object.entries(industryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0] || ["—", 0];
    setText("careerTopIndustry", topIndustry[0] || "—");
    setText("careerTopIndustryCount", `${topIndustry[1]} submissions`);

    // Render status breakdown
    renderCareerStatusBars(statusCounts, total);
  } catch (err) {
    console.error("loadCareerStats error:", err);
    showCareerStatsError(err.message);
  }
}

// Show error message in career stats
function showCareerStatsError(message) {
  const container = document.getElementById("careerStatusChart");
  if (container) {
    container.innerHTML = `<div class="status-placeholder" style="color: #dc3545; padding: 20px;">⚠️ ${message || "Unable to load career data"}</div>`;
  }

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("careerTotal", "—");
  setText("careerEmployedPercent", "—");
  setText("careerEmployedCount", "— of —");
  setText("careerMentorshipPercent", "—");
  setText("careerMentorshipCount", "— of —");
  setText("careerTopIndustry", "—");
  setText("careerTopIndustryCount", "—");
}

// Show empty state for career stats
function showCareerStatsEmpty() {
  const container = document.getElementById("careerStatusChart");
  if (container) {
    container.innerHTML =
      '<div class="status-placeholder" style="padding: 60px 20px; color: #999; text-align: center;"><strong>📊 No career data available</strong><br><br>Career information submissions will appear here once alumni complete their career profiles.</div>';
  }

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText("careerTotal", "0");
  setText("careerEmployedPercent", "—");
  setText("careerEmployedCount", "No submissions");
  setText("careerMentorshipPercent", "—");
  setText("careerMentorshipCount", "No submissions");
  setText("careerTopIndustry", "—");
  setText("careerTopIndustryCount", "No data");
}

// Render vertical bar chart for career status breakdown
function renderCareerStatusBars(statusCounts, total) {
  const container = document.getElementById("careerStatusChart");
  const legendContainer = document.getElementById("careerChartLegend");
  if (!container) return;

  container.innerHTML = "";
  if (legendContainer) legendContainer.innerHTML = "";

  if (!total || !statusCounts || Object.keys(statusCounts).length === 0) {
    container.innerHTML =
      '<div class="status-placeholder">No career data available yet.</div>';
    return;
  }

  const order = ["Employed", "Unemployed", "Unknown Status"];
  const colorMap = {
    Employed: "linear-gradient(to top, #004AAD, #0066cc)",
    Unemployed: "linear-gradient(to top, #dc3545, #e8576a)",
    "Unknown Status": "linear-gradient(to top, #ccc, #ddd)",
    "Complete Career Profile": "linear-gradient(to top, #00a86b, #28d764)",
    "Incomplete Career Profile": "linear-gradient(to top, #ffc107, #ffd454)",
    "Employed & Open for Mentorship":
      "linear-gradient(to top, #00a86b, #28d764)",
    "Open for Mentorship": "linear-gradient(to top, #17a2b8, #20c997)",
    "Not Currently Employed": "linear-gradient(to top, #dc3545, #e8576a)",
  };

  // Filter and prepare data - start with predefined order
  const chartData = [];

  // First add statuses in order that have data
  order.forEach((label) => {
    const count = statusCounts[label] || 0;
    if (count > 0) {
      chartData.push({
        label,
        count,
        color: colorMap[label] || colorMap["Other"],
      });
    }
  });

  // Add any additional statuses not in order
  Object.entries(statusCounts).forEach(([label, count]) => {
    if (!order.includes(label) && count > 0) {
      chartData.push({
        label,
        count,
        color: colorMap[label] || colorMap["Other"],
      });
    }
  });

  if (chartData.length === 0) {
    container.innerHTML =
      '<div class="status-placeholder">No career data yet.</div>';
    return;
  }

  // Find max for scaling
  const maxCount = Math.max(...chartData.map((d) => d.count));
  const maxHeight = 220; // Max height in pixels

  // Render bars
  chartData.forEach(({ label, count, color }) => {
    const pct = total ? Math.round((count / total) * 100) : 0;
    const height = maxCount > 0 ? (count / maxCount) * maxHeight : 0;

    const barItem = document.createElement("div");
    barItem.className = "career-bar-item";
    barItem.innerHTML = `
            <div class="career-bar" style="--bar-height: ${height}px; height: ${height}px; background: ${color};">
                <div class="career-bar-value">${pct}%</div>
            </div>
            <div class="career-bar-label">${label}<br>(${count})</div>
        `;
    container.appendChild(barItem);
  });

  // Render legend
  if (legendContainer) {
    chartData.forEach(({ label, count, color }) => {
      const legendItem = document.createElement("div");
      legendItem.className = "career-legend-item";
      legendItem.innerHTML = `
                <div class="career-legend-color" style="background: ${color}"></div>
                <span><strong>${label}:</strong> ${count}</span>
            `;
      legendContainer.appendChild(legendItem);
    });
  }
}
