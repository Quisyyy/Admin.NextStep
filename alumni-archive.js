// Alumni Archive Management

let allArchivedRecords = [];
let selectedArchiveId = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadArchivedRecords();
  initializeArchiveFilters();
  setupRestoreModal();
  setupDeleteModal();
  setupCleanupButton();
});

async function ensureSupabaseReady(timeout = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (window.supabase && window.supabase.from) return true;
    if (window.supabaseClientReady === false) return false;
    await new Promise((r) => setTimeout(r, 100));
  }
  return !!(window.supabase && window.supabase.from);
}

async function loadArchivedRecords() {
  try {
    const ready = await ensureSupabaseReady();
    if (!ready) {
      showErrorMessage("Database connection not ready");
      return;
    }

    // Query from alumni_archive table (the correct source)
    const { data, error } = await window.supabase
      .from("alumni_archive")
      .select("*")
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Query error:", error);
      throw error;
    }

    console.log("Raw data from database:", data);

    if (!data || data.length === 0) {
      console.log("No records returned from database");
      allArchivedRecords = [];
      renderArchiveTable([]);
      updateArchiveStats();
      return;
    }

    // Log each record's ID
    data.forEach((record, idx) => {
      console.log(
        `Record ${idx}: id="${record.id}" (type: ${typeof record.id}), name="${record.full_name}"`,
      );
    });

    // Calculate days remaining for each record
    allArchivedRecords = data.map((record) => {
      const archivedDate = new Date(record.archived_at);
      const now = new Date();
      const daysElapsed = Math.floor(
        (now - archivedDate) / (1000 * 60 * 60 * 24),
      );
      const daysRemaining = Math.max(0, 30 - daysElapsed);

      return {
        ...record,
        days_until_deletion: record.is_restored ? null : daysRemaining,
        archive_status: record.is_restored
          ? "Restored"
          : daysRemaining <= 0
            ? "Pending Deletion"
            : "Archived",
      };
    });

    console.log("Processed records:", allArchivedRecords);
    renderArchiveTable(allArchivedRecords);
    updateArchiveStats();
  } catch (error) {
    console.error("Error loading archived records:", error);
    showErrorMessage("Error loading archived records: " + error.message);
  }
}

function renderArchiveTable(records) {
  const tbody = document.querySelector("#archiveTable tbody");
  tbody.innerHTML = "";

  if (!records.length) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<td colspan="8" class="empty">No archived records found</td>';
    tbody.appendChild(tr);
    return;
  }

  records.forEach((record, idx) => {
    // Skip records with no valid ID
    if (!record.id || record.id === "null" || record.id === "undefined") {
      console.warn(`Skipping record ${idx} - invalid ID:`, record.id);
      return;
    }

    console.log(`Record ${idx}: id=${record.id}, name=${record.full_name}`);

    const tr = document.createElement("tr");
    tr.setAttribute("data-archive-id", record.id);
    const archivedDate = new Date(record.archived_at).toLocaleDateString();
    const statusBadge = record.is_restored
      ? '<span class="status-badge complete">Restored</span>'
      : '<span class="status-badge pending">Archived</span>';

    // Show days remaining or deletion pending
    let daysDisplay = "";
    if (record.is_restored) {
      daysDisplay = '<span style="color: #999;">—</span>';
    } else if (record.days_until_deletion === 0) {
      daysDisplay = '<span class="badge-danger">⏰ Today</span>';
    } else if (record.days_until_deletion <= 3) {
      daysDisplay = `<span class="badge-warning">⏰ ${record.days_until_deletion} days</span>`;
    } else {
      daysDisplay = `<span class="badge-info">⏱ ${record.days_until_deletion} days</span>`;
    }

    // Store the ID directly in data attributes instead of inline onclick
    const fullName = (record.full_name || "Unknown").replace(/'/g, "\\'");
    const safeId = String(record.id);

    tr.innerHTML = `
            <td>${record.full_name || "N/A"}</td>
            <td>${record.email || "N/A"}</td>
            <td>${record.student_number || "N/A"}</td>
            <td>${record.degree || "N/A"}</td>
            <td>${archivedDate}</td>
            <td>${record.archive_reason || "No reason"}</td>
            <td>${statusBadge}</td>
            <td>
                <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                    ${daysDisplay}
                    ${!record.is_restored ? `<button class="btn-small btn-restore" data-id="${safeId}" data-name="${fullName}">Restore</button>` : '<span style="color: #999;">—</span>'}
                    ${!record.is_restored ? `<button class="btn-small btn-delete" data-id="${safeId}" data-name="${fullName}">Delete</button>` : ""}
                </div>
            </td>
        `;

    // Add event listeners after creating the row
    const restoreBtn = tr.querySelector(".btn-restore");
    const deleteBtn = tr.querySelector(".btn-delete");

    if (restoreBtn) {
      restoreBtn.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const name = this.getAttribute("data-name");
        console.log("Restore clicked - ID:", id, "Name:", name);
        if (!id || id === "null" || id === "undefined") {
          alert(
            "Error: This record has an invalid ID. Please contact support.",
          );
          return;
        }
        openRestoreModal(id, name);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        const name = this.getAttribute("data-name");
        console.log("Delete clicked - ID:", id, "Name:", name);
        if (!id || id === "null" || id === "undefined") {
          alert(
            "Error: This record has an invalid ID. Please contact support.",
          );
          return;
        }
        openDeleteModal(id, name);
      });
    }

    tbody.appendChild(tr);
  });
}

function updateArchiveStats() {
  const totalArchived = allArchivedRecords.filter((r) => !r.is_restored).length;
  const totalRestored = allArchivedRecords.filter((r) => r.is_restored).length;

  document.getElementById("totalArchived").textContent = totalArchived;
  document.getElementById("totalRestored").textContent = totalRestored;
}

function initializeArchiveFilters() {
  const searchInput = document.getElementById("searchArchive");
  const statusFilter = document.getElementById("filterArchiveStatus");
  const resetBtn = document.getElementById("resetArchiveFilters");

  if (searchInput) {
    searchInput.addEventListener("input", applyArchiveFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", applyArchiveFilters);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "";
      applyArchiveFilters();
    });
  }
}

function applyArchiveFilters() {
  const search =
    document.getElementById("searchArchive")?.value?.toLowerCase() || "";
  const status = document.getElementById("filterArchiveStatus")?.value || "";

  let filtered = allArchivedRecords;

  if (search) {
    filtered = filtered.filter(
      (r) =>
        (r.full_name || "").toLowerCase().includes(search) ||
        (r.email || "").toLowerCase().includes(search),
    );
  }

  if (status) {
    if (status === "archived") {
      filtered = filtered.filter((r) => !r.is_restored);
    } else if (status === "restored") {
      filtered = filtered.filter((r) => r.is_restored);
    }
  }

  renderArchiveTable(filtered);
}

function setupRestoreModal() {
  const modal = document.getElementById("restoreModal");
  const confirmBtn = document.getElementById("confirmRestoreBtn");
  const cancelBtn = document.getElementById("cancelRestoreBtn");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", restoreSelectedRecord);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeRestoreModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeRestoreModal();
    });
  }
}

function setupCleanupButton() {
  const cleanupBtn = document.getElementById("cleanupBtn");
  if (cleanupBtn) {
    cleanupBtn.addEventListener("click", triggerCleanup);
  }
}

async function triggerCleanup() {
  if (
    !confirm(
      "Permanently delete archived records older than 30 days?\n\nThis action cannot be undone!",
    )
  ) {
    return;
  }

  try {
    const { data, error } = await window.supabase.rpc("cleanup_old_archives");

    if (error) throw error;

    const result = data;
    if (result.success) {
      showSuccessMessage(result.message);
      setTimeout(() => {
        loadArchivedRecords();
      }, 1500);
    } else {
      showErrorMessage(result.message);
    }
  } catch (error) {
    console.error("Error during cleanup:", error);
    showErrorMessage("Error during cleanup: " + error.message);
  }
}

function openRestoreModal(archiveId, fullName) {
  selectedArchiveId = archiveId;
  console.log("Opening restore modal for:", archiveId, fullName);
  document.getElementById("restoreMessage").textContent =
    `Are you sure you want to restore "${fullName}" to the active alumni list?`;
  document.getElementById("restoreModal").style.display = "flex";
}

function closeRestoreModal() {
  document.getElementById("restoreModal").style.display = "none";
  selectedArchiveId = null;
}

async function restoreSelectedRecord() {
  if (!selectedArchiveId) {
    console.error("No archive ID selected");
    showErrorMessage("Error: No archive ID selected");
    return;
  }

  console.log(
    "Restoring archive ID:",
    selectedArchiveId,
    "Type:",
    typeof selectedArchiveId,
  );

  try {
    closeRestoreModal();

    // Call RPC function to restore
    const { data, error } = await window.supabase.rpc(
      "restore_archived_alumni",
      {
        p_archive_id: selectedArchiveId,
      },
    );

    if (error) {
      console.error("Error restoring record:", error);
      showErrorMessage("Error restoring record: " + error.message);
      return;
    }

    if (data && data.success) {
      console.log("Record restored successfully");
      showSuccessMessage("✓ Successfully restored");

      // Remove from table immediately (real-time)
      const rowToRemove = document.querySelector(
        `tr[data-archive-id="${selectedArchiveId}"]`,
      );
      if (rowToRemove) {
        rowToRemove.style.opacity = "0.5";
        rowToRemove.style.textDecoration = "line-through";
        setTimeout(() => rowToRemove.remove(), 500);
      }

      // Update the record in memory
      allArchivedRecords = allArchivedRecords.filter(
        (r) => r.id !== selectedArchiveId,
      );

      // Update UI counts immediately
      updateArchiveStats();

      // Refresh in background (optional - for consistency)
      setTimeout(() => loadArchivedRecords(), 2000);
    } else {
      showErrorMessage(data?.message || "Failed to restore record");
    }
  } catch (error) {
    console.error("Unexpected error during restore:", error);
    showErrorMessage("Unexpected error: " + error.message);
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function setupDeleteModal() {
  const modal = document.getElementById("deleteModal");
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  const cancelBtn = document.getElementById("cancelDeleteBtn");

  if (confirmBtn) {
    confirmBtn.addEventListener("click", deleteSelectedRecord);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeDeleteModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeDeleteModal();
    });
  }
}

function openDeleteModal(archiveId, fullName) {
  selectedArchiveId = archiveId;
  console.log("Opening delete modal for:", archiveId, fullName);
  document.getElementById("deleteMessage").textContent =
    `Are you sure you want to permanently delete "${fullName}"? This action cannot be undone!`;
  document.getElementById("deleteModal").style.display = "flex";
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
  selectedArchiveId = null;
}

async function deleteSelectedRecord() {
  if (!selectedArchiveId) {
    console.error("No archive ID selected");
    showErrorMessage("Error: No archive ID selected");
    return;
  }

  console.log(
    "Deleting archive ID:",
    selectedArchiveId,
    "Type:",
    typeof selectedArchiveId,
  );

  try {
    closeDeleteModal();

    // Call RPC function to delete
    const { data, error } = await window.supabase.rpc(
      "delete_archived_alumni",
      {
        p_archive_id: selectedArchiveId,
      },
    );

    if (error) {
      console.error("Error deleting record:", error);
      showErrorMessage("Error deleting record: " + error.message);
      return;
    }

    if (data && data.success) {
      console.log("Record permanently deleted");
      showSuccessMessage("✓ Archive record permanently deleted");

      // Remove from table immediately (real-time)
      const rowToRemove = document.querySelector(
        `tr[data-archive-id="${selectedArchiveId}"]`,
      );
      if (rowToRemove) {
        rowToRemove.style.opacity = "0.5";
        rowToRemove.style.textDecoration = "line-through";
        setTimeout(() => rowToRemove.remove(), 500);
      }

      // Update the record in memory
      allArchivedRecords = allArchivedRecords.filter(
        (r) => r.id !== selectedArchiveId,
      );

      // Update UI counts immediately
      updateArchiveStats();

      // Refresh in background (optional - for consistency)
      setTimeout(() => loadArchivedRecords(), 2000);
    } else {
      showErrorMessage(data?.message || "Failed to delete record");
    }
  } catch (error) {
    console.error("Unexpected error during delete:", error);
    showErrorMessage("Unexpected error: " + error.message);
  }
}

function showErrorMessage(message) {
  console.error(message);
  alert("Error: " + message);
}

function showSuccessMessage(message) {
  console.log("Success:", message);
  const toast = document.createElement("div");
  toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
  toast.textContent = "✓ " + message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Export for use
if (typeof window !== "undefined") {
  window.alumniArchive = {
    loadArchivedRecords,
    openRestoreModal,
    closeRestoreModal,
  };
}
