// Archive Management JavaScript

let allArchivedRecords = [];

async function ensureSupabaseReady(timeout = 3000) {
  const start = Date.now();
  console.log("⏳ Waiting for Supabase to initialize...");

  while (Date.now() - start < timeout) {
    console.log("Checking Supabase:", {
      hasSupabase: !!window.supabase,
      hasFrom: !!window.supabase?.from,
      ready: window.supabaseClientReady,
    });

    if (
      window.supabase &&
      window.supabase.from &&
      window.supabaseClientReady !== false
    ) {
      console.log("✅ Supabase is ready!");
      return true;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.error("❌ Supabase not ready after", timeout, "ms");
  return false;
}

async function loadArchivedAlumni() {
  try {
    console.log("🔄 Loading archived alumni...");

    // Check Supabase multiple times with longer timeout
    let retries = 0;
    while (retries < 10 && (!window.supabase || !window.supabase.from)) {
      console.log(`⏳ Waiting for Supabase... (attempt ${retries + 1})`);
      await new Promise((r) => setTimeout(r, 200));
      retries++;
    }

    if (!window.supabase || !window.supabase.from) {
      console.error("❌ Supabase failed to initialize after retries");
      allArchivedRecords = [];
      renderArchiveTable([]);
      updateArchiveStats();
      return;
    }

    console.log("✅ Supabase ready, querying...");

    // Fetch all fields directly from alumni_archive
    const { data, error } = await window.supabase
      .from("alumni_profiles")
      .select("*")
      .eq("is_archived", true);

    if (error) {
      console.error("❌ Query error:", error);
      allArchivedRecords = [];
      renderArchiveTable([]);
      updateArchiveStats();
      return;
    }

    const archiveRecords = Array.isArray(data) ? data : [];
    console.log(`✅ Got ${archiveRecords.length} archived records`);

    allArchivedRecords = archiveRecords.map((record) => {
      const archivedDate = record.archived_at
        ? new Date(record.archived_at)
        : new Date();
      const daysArchived = Math.floor(
        (Date.now() - archivedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysLeft = Math.max(0, 30 - daysArchived);
      return {
        ...record,
        daysLeft,
      };
    });

    console.log(`✅ Complete: ${allArchivedRecords.length} records ready`);
    renderArchiveTable(allArchivedRecords);
    updateArchiveStats();
  } catch (error) {
    console.error("❌ Outer error:", error);
    allArchivedRecords = [];
    renderArchiveTable([]);
    updateArchiveStats();
  }
}

function renderArchiveTable(records) {
  const tbody = document.querySelector("#archiveTable tbody");
  if (!tbody) {
    console.warn("⚠️ Archive table not found in DOM");
    return;
  }

  tbody.innerHTML = "";

  if (!records || records.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td colspan="8" class="empty" style="text-align: center; padding: 20px;">No archived records</td>';
    tbody.appendChild(tr);
    return;
  }

  records.forEach((record) => {
    const archivedDate = record.archived_at
      ? new Date(record.archived_at)
      : new Date();
    const daysArchived = Math.floor(
      (Date.now() - archivedDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysLeft = Math.max(0, 30 - daysArchived);
    const daysText = daysLeft > 0 ? `⏰ ${daysLeft} days` : "❌ Expired";

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${record.full_name || "N/A"}</td>
        <td>${record.email || "N/A"}</td>
        <td>${record.student_number || "N/A"}</td>
        <td>${record.degree || "N/A"}</td>
        <td>${archivedDate.toLocaleDateString()}</td>
        <td>${record.archive_reason || "Archived"}</td>
        <td><span class="badge" style="background: #f44336; color: white; padding: 4px 8px; border-radius: 3px;">ARCHIVED</span></td>
        <td style="white-space: nowrap;">
          <span style="font-size: 12px; ${daysLeft > 5 ? "color: #2196F3" : "color: #ff9800"}">${daysText}</span><br>
          <button class="btn-small" onclick="restoreRecord('${record.id || record.alumni_id}', '${(record.full_name || "Alumni").replace(/'/g, "\\'")}')">Restore</button>
          <button class="btn-small" onclick="deleteRecord('${record.id || record.alumni_id}', '${(record.full_name || "Alumni").replace(/'/g, "\\'")}')">Delete</button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

function updateArchiveStats() {
  const totalArchived = allArchivedRecords.length;

  const totalArchivedEl = document.getElementById("totalArchived");
  if (totalArchivedEl) totalArchivedEl.textContent = totalArchived;

  // Update status in header
  const header = document.querySelector(".archive-description");
  if (header) {
    header.textContent =
      totalArchived === 0
        ? "✅ No archived records"
        : `📦 ${totalArchived} record(s) in archive`;
  }
}

async function restoreRecord(archiveId, fullName) {
  if (!confirm(`Restore "${fullName}" back to active alumni?`)) return;

  try {
    console.log("🔄 Restoring record:", archiveId);
    const { error } = await window.supabase
      .from("alumni_profiles")
      .update({ is_archived: false })
      .eq("id", archiveId);
    if (error) throw error;
    alert("✓ Record restored successfully.");
    window.location.href = "alumlist.html";
  } catch (error) {
    console.error("❌ Error restoring:", error);
    showError("Error restoring record: " + error.message);
  }
}

async function deleteRecord(archiveId, fullName) {
  if (!confirm(`⚠️ PERMANENTLY DELETE "${fullName}"? This cannot be undone!`))
    return;

  try {
    console.log("🗑️ Deleting record:", archiveId);

    const { data, error } = await window.supabase.rpc("delete_alumni_record", {
      p_archive_id: archiveId,
    });

    if (error) throw error;

    if (data && data.success) {
      console.log("✅ Deleted successfully");
      alert("✓ " + data.message);
      await loadArchivedAlumni();
    } else {
      throw new Error(data?.message || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Error deleting:", error);
    showError("Error deleting record: " + error.message);
  }
}

async function cleanupOldRecords() {
  try {
    console.log("🧹 Cleaning up old archived records...");

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get records older than 30 days
    const { data: oldRecords, error: fetchError } = await window.supabase
      .from("alumni_archive")
      .select("id")
      .lt("archived_at", thirtyDaysAgo.toISOString())
      .eq("is_restored", false);

    if (fetchError) throw fetchError;

    if (!oldRecords || oldRecords.length === 0) {
      alert("✅ No old records to delete");
      return;
    }

    if (!confirm(`Delete ${oldRecords.length} record(s) older than 30 days?`))
      return;

    // Delete each old record
    let deleted = 0;
    for (const record of oldRecords) {
      const { error: deleteError } = await window.supabase
        .from("alumni_archive")
        .delete()
        .eq("id", record.id);

      if (!deleteError) {
        deleted++;
      }
    }

    alert(`✓ Cleaned up ${deleted} old record(s)`);
    await loadArchivedAlumni();
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    showError("Error during cleanup: " + error.message);
  }
}

function applyArchiveFilters() {
  const searchTerm = (
    document.getElementById("searchArchive")?.value || ""
  ).toLowerCase();
  const statusFilter =
    document.getElementById("filterArchiveStatus")?.value || "";

  let filtered = allArchivedRecords;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (record) =>
        (record.full_name || "").toLowerCase().includes(searchTerm) ||
        (record.email || "").toLowerCase().includes(searchTerm) ||
        (record.student_number || "").toLowerCase().includes(searchTerm),
    );
  }

  // Status filter
  if (statusFilter === "restored") {
    filtered = filtered.filter((record) => record.is_restored === true);
  } else if (statusFilter === "archived") {
    filtered = filtered.filter((record) => record.is_restored === false);
  }

  renderArchiveTable(filtered);
}

function initializeArchiveFilters() {
  const searchInput = document.getElementById("searchArchive");
  const statusFilter = document.getElementById("filterArchiveStatus");
  const resetBtn = document.getElementById("resetArchiveFilters");
  const cleanupBtn = document.getElementById("cleanupBtn");

  if (searchInput) searchInput.addEventListener("input", applyArchiveFilters);
  if (statusFilter)
    statusFilter.addEventListener("change", applyArchiveFilters);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "";
      applyArchiveFilters();
    });
  }

  if (cleanupBtn) {
    cleanupBtn.addEventListener("click", cleanupOldRecords);
  }
}

function showError(message) {
  console.error("❌ Error:", message);
  // Silently log errors instead of showing UI error
  // since the page is already showing "No archived records" which is fine
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 Archive page loaded");
  initializeArchiveFilters();

  // Small delay to ensure Supabase is fully loaded
  await new Promise((r) => setTimeout(r, 500));

  await loadArchivedAlumni();
});

// Listen for restore events from other pages
window.addEventListener("alumni:restored", async function () {
  console.log("📢 Alumni restored event received");
  await loadArchivedAlumni();
});
