// Audit Trail JavaScript - Track and display all admin and dev actions
// Tab switching logic for audit trail UI
function showAuditTab(tab) {
  const adminSection = document.getElementById("adminAuditSection");
  const alumniSection = document.getElementById("alumniAuditSection");
  const adminTab = document.getElementById("adminTab");
  const alumniTab = document.getElementById("alumniTab");
  if (tab === "admin") {
    adminSection.style.display = "";
    alumniSection.style.display = "none";
    adminTab.classList.add("active");
    alumniTab.classList.remove("active");
  } else {
    adminSection.style.display = "none";
    alumniSection.style.display = "";
    adminTab.classList.remove("active");
    alumniTab.classList.add("active");
    loadAlumniAuditTrail();
  }
}

// Fetch and render alumni audit logs
let alumniAuditRecords = [];
async function loadAlumniAuditTrail() {
  const tbody = document.getElementById("alumniAuditTableBody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4">Loading…</td></tr>';
  try {
    const { data, error } = await window.supabase
      .from("alumni_audit_trail")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !data) {
      tbody.innerHTML = `<tr><td colspan="4">Error loading alumni audit trail</td></tr>`;
      return;
    }
    alumniAuditRecords = data;
    renderAlumniAuditTable(alumniAuditRecords);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4">Error loading alumni audit trail</td></tr>`;
  }
}

function renderAlumniAuditTable(records) {
  const tbody = document.getElementById("alumniAuditTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No alumni audit records found</td></tr>`;
    return;
  }
  records.forEach((record) => {
    const tr = document.createElement("tr");
    const timestamp = new Date(record.created_at).toLocaleString();
    tr.innerHTML = `
            <td class="timestamp">${timestamp}</td>
            <td><strong>${record.alumni_id}</strong></td>
            <td>${record.action}</td>
            <td>${record.details || ""}</td>
        `;
    tbody.appendChild(tr);
  });
}

function applyAlumniFilter() {
  const filterValue = document
    .getElementById("alumniFilter")
    .value.trim()
    .toLowerCase();
  if (!filterValue) {
    renderAlumniAuditTable(alumniAuditRecords);
    return;
  }
  const filtered = alumniAuditRecords.filter((record) => {
    return (record.alumni_id || "").toLowerCase().includes(filterValue);
  });
  renderAlumniAuditTable(filtered);
}

function clearAlumniFilter() {
  document.getElementById("alumniFilter").value = "";
  renderAlumniAuditTable(alumniAuditRecords);
}

// Set default tab on page load
document.addEventListener("DOMContentLoaded", () => {
  showAuditTab("admin");
});

let allAuditRecords = [];

async function ensureSupabaseReady(timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.supabase && window.supabase.from) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return !!(window.supabase && window.supabase.from);
}

async function loadAuditTrail() {
  try {
    console.log("📋 Loading audit trail...");

    const ok = await ensureSupabaseReady(3000);
    if (!ok) {
      console.error("❌ Supabase not ready");
      showEmptyState("Database connection not available");
      return;
    }

    console.log("✅ Supabase ready");

    // Fetch audit trail records - try admin_audit_trail first (new table), then audit_trail (legacy)
    let { data, error } = await window.supabase
      .from("admin_audit_trail")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    // If admin_audit_trail doesn't exist or is empty, try audit_trail
    if (error || !data || data.length === 0) {
      console.log("📊 Trying legacy audit_trail table...");
      const result = await window.supabase
        .from("audit_trail")
        .select(
          `
                    *,
                    admin:admins(employee_id)
                `,
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (result.error) {
        console.error("❌ Error fetching audit trail:", result.error);
        showEmptyState("Error loading audit trail: " + result.error.message);
        return;
      }
      data = result.data;
      error = result.error;
    }

    allAuditRecords = data || [];
    console.log(`✅ Loaded ${allAuditRecords.length} audit records`);

    renderAuditTable(allAuditRecords);
    updateAuditStats(allAuditRecords);

    // SET UP REAL-TIME SUBSCRIPTION - Monitoring employee activities
    if (window.auditSubscription) {
      window.auditSubscription.unsubscribe();
    }

    window.auditSubscription = window.supabase
      .channel("admin_audit_trail_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_audit_trail" },
        (payload) => {
          console.log("🔴 REAL-TIME: Employee activity detected:", payload.new);
          // Add new record to the top of the list
          if (payload.eventType === "INSERT") {
            allAuditRecords.unshift(payload.new);
            renderAuditTable(allAuditRecords);
            updateAuditStats(allAuditRecords);
          }
        },
      )
      .subscribe();

    console.log(
      "📡 REAL-TIME MONITORING ACTIVE - Tracking all employee activities in real-time",
    );
  } catch (error) {
    console.error("❌ Error loading audit trail:", error);
    showEmptyState("Error loading audit trail");
  }
}

function renderAuditTable(records) {
  const tbody = document.querySelector("#auditTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!records || records.length === 0) {
    showEmptyState("No audit records found");
    return;
  }

  records.forEach((record) => {
    const tr = document.createElement("tr");
    const timestamp = new Date(record.created_at).toLocaleString();

    // Handle both table formats
    const actionType = record.action_type || record.action || "Unknown";
    const actionBadge = getActionBadge(actionType);

    // Get user display - try multiple field names
    let userDisplay = record.user_email || record.employee_id || "System";
    if (record.admin && record.admin.employee_id) {
      userDisplay = record.admin.employee_id;
    }

    // Get entity info - try multiple field names
    const entityType = record.entity_type || record.table_affected || "N/A";
    const entityName = record.entity_name || record.record_id || "N/A";
    const description = record.description || record.details || "N/A";

    tr.innerHTML = `
            <td class="timestamp">${timestamp}</td>
            <td><strong>${userDisplay}</strong></td>
            <td>${actionBadge}</td>
            <td>${entityType}</td>
            <td>${entityName}</td>
            <td>${description}</td>
        `;

    tbody.appendChild(tr);
  });
}

function getActionBadge(actionType) {
  const badges = {
    ARCHIVE: '<span class="badge badge-archive">Archive</span>',
    RESTORE: '<span class="badge badge-restore">Restore</span>',
    DELETE: '<span class="badge badge-delete">Delete</span>',
    UPDATE: '<span class="badge badge-update">Update</span>',
    CREATE: '<span class="badge badge-create">Create</span>',
    LOGIN: '<span class="badge badge-login">Login</span>',
  };

  return (
    badges[actionType] ||
    `<span class="badge">${actionType || "Unknown"}</span>`
  );
}

function updateAuditStats(records) {
  const totalActions = records.length;
  const archiveCount = records.filter(
    (r) => r.action_type === "ARCHIVE",
  ).length;
  const restoreCount = records.filter(
    (r) => r.action_type === "RESTORE",
  ).length;
  const deleteCount = records.filter((r) => r.action_type === "DELETE").length;

  const totalEl = document.getElementById("totalActions");
  const archiveEl = document.getElementById("archiveCount");
  const restoreEl = document.getElementById("restoreCount");
  const deleteEl = document.getElementById("deleteCount");

  if (totalEl) totalEl.textContent = totalActions;
  if (archiveEl) archiveEl.textContent = archiveCount;
  if (restoreEl) restoreEl.textContent = restoreCount;
  if (deleteEl) deleteEl.textContent = deleteCount;
}

function showEmptyState(message) {
  const tbody = document.querySelector("#auditTableBody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-message">${message}</td></tr>`;
  }
}

function applyFilters() {
  const actionFilter = document.getElementById("filterAction")?.value || "";
  const entityFilter = document.getElementById("filterEntity")?.value || "";
  const userFilter = (
    document.getElementById("filterUser")?.value || ""
  ).toLowerCase();

  let filtered = allAuditRecords.filter((record) => {
    const matchAction = !actionFilter || record.action_type === actionFilter;
    const matchEntity = !entityFilter || record.entity_type === entityFilter;
    const matchUser =
      !userFilter ||
      (record.user_email || "").toLowerCase().includes(userFilter);

    return matchAction && matchEntity && matchUser;
  });

  renderAuditTable(filtered);
  updateAuditStats(filtered);
}

function clearFilters() {
  document.getElementById("filterAction").value = "";
  document.getElementById("filterEntity").value = "";
  document.getElementById("filterUser").value = "";

  renderAuditTable(allAuditRecords);
  updateAuditStats(allAuditRecords);
}

function exportAuditTrail() {
  if (allAuditRecords.length === 0) {
    alert("No records to export");
    return;
  }

  // Create CSV content
  let csv = "Timestamp,User Email,Action,Entity Type,Entity Name,Description\n";

  allAuditRecords.forEach((record) => {
    const timestamp = new Date(record.created_at).toLocaleString();
    const row = [
      `"${timestamp}"`,
      `"${record.user_email || "System"}"`,
      `"${record.action_type}"`,
      `"${record.entity_type}"`,
      `"${record.entity_name || ""}"`,
      `"${(record.description || "").replace(/"/g, '""')}"`, // Escape quotes
    ].join(",");

    csv += row + "\n";
  });

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `audit-trail-${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Filter by employee ID
function applyEmployeeFilter() {
  const employeeId = document
    .getElementById("employeeFilter")
    .value.trim()
    .toUpperCase();

  if (!employeeId) {
    renderAuditTable(allAuditRecords);
    return;
  }

  const filtered = allAuditRecords.filter((record) => {
    const empId = (record.employee_id || "").toUpperCase();
    return empId === employeeId || empId.includes(employeeId);
  });

  console.log(
    `🔍 Filtering by ${employeeId}: ${filtered.length} records found`,
  );
  renderAuditTable(filtered);
}

// Clear filter and show all
function clearEmployeeFilter() {
  document.getElementById("employeeFilter").value = "";
  renderAuditTable(allAuditRecords);
  console.log("✅ Filter cleared - showing all records");
}

// Allow Enter key to apply filter
document.addEventListener("DOMContentLoaded", () => {
  const filterInput = document.getElementById("employeeFilter");
  if (filterInput) {
    filterInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyEmployeeFilter();
      }
    });
  }
});
// Initialize on page load
window.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 Audit trail page loaded");

  // Wait for Supabase to be ready
  await new Promise((r) => setTimeout(r, 500));

  await loadAuditTrail();

  // Set up filter listeners
  document
    .getElementById("filterAction")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("filterEntity")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("filterUser")
    ?.addEventListener("input", applyFilters);
});

// Auto-refresh audit trail every 30 seconds
setInterval(() => {
  loadAuditTrail().catch((err) => console.error("Auto-refresh failed:", err));
}, 30000);
