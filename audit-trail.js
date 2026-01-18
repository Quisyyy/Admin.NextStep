// Audit Trail JavaScript - Track and display all admin and dev actions

let allAuditRecords = [];

async function ensureSupabaseReady(timeout = 3000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabase.from) return true;
        await new Promise(r => setTimeout(r, 100));
    }
    return !!(window.supabase && window.supabase.from);
}

async function loadAuditTrail() {
    try {
        console.log('📋 Loading audit trail...');
        
        const ok = await ensureSupabaseReady(3000);
        if (!ok) {
            console.error('❌ Supabase not ready');
            showEmptyState('Database connection not available');
            return;
        }

        console.log('✅ Supabase ready');

        // Fetch audit trail records
        const { data, error } = await window.supabase
            .from('audit_trail')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error) {
            console.error('❌ Error fetching audit trail:', error);
            showEmptyState('Error loading audit trail: ' + error.message);
            return;
        }

        allAuditRecords = data || [];
        console.log(`✅ Loaded ${allAuditRecords.length} audit records`);

        renderAuditTable(allAuditRecords);
        updateAuditStats(allAuditRecords);

    } catch (error) {
        console.error('❌ Error loading audit trail:', error);
        showEmptyState('Error loading audit trail');
    }
}

function renderAuditTable(records) {
    const tbody = document.querySelector('#auditTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!records || records.length === 0) {
        showEmptyState('No audit records found');
        return;
    }

    records.forEach(record => {
        const tr = document.createElement('tr');
        const timestamp = new Date(record.created_at).toLocaleString();
        const actionBadge = getActionBadge(record.action_type);

        tr.innerHTML = `
            <td class="timestamp">${timestamp}</td>
            <td>${record.user_email || 'System'}</td>
            <td>${actionBadge}</td>
            <td>${record.entity_type || 'N/A'}</td>
            <td>${record.entity_name || 'N/A'}</td>
            <td>${record.description || 'N/A'}</td>
        `;

        tbody.appendChild(tr);
    });
}

function getActionBadge(actionType) {
    const badges = {
        'ARCHIVE': '<span class="badge badge-archive">Archive</span>',
        'RESTORE': '<span class="badge badge-restore">Restore</span>',
        'DELETE': '<span class="badge badge-delete">Delete</span>',
        'UPDATE': '<span class="badge badge-update">Update</span>',
        'CREATE': '<span class="badge badge-create">Create</span>',
        'LOGIN': '<span class="badge badge-login">Login</span>'
    };

    return badges[actionType] || `<span class="badge">${actionType || 'Unknown'}</span>`;
}

function updateAuditStats(records) {
    const totalActions = records.length;
    const archiveCount = records.filter(r => r.action_type === 'ARCHIVE').length;
    const restoreCount = records.filter(r => r.action_type === 'RESTORE').length;
    const deleteCount = records.filter(r => r.action_type === 'DELETE').length;

    const totalEl = document.getElementById('totalActions');
    const archiveEl = document.getElementById('archiveCount');
    const restoreEl = document.getElementById('restoreCount');
    const deleteEl = document.getElementById('deleteCount');

    if (totalEl) totalEl.textContent = totalActions;
    if (archiveEl) archiveEl.textContent = archiveCount;
    if (restoreEl) restoreEl.textContent = restoreCount;
    if (deleteEl) deleteEl.textContent = deleteCount;
}

function showEmptyState(message) {
    const tbody = document.querySelector('#auditTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-message">${message}</td></tr>`;
    }
}

function applyFilters() {
    const actionFilter = document.getElementById('filterAction')?.value || '';
    const entityFilter = document.getElementById('filterEntity')?.value || '';
    const userFilter = (document.getElementById('filterUser')?.value || '').toLowerCase();

    let filtered = allAuditRecords.filter(record => {
        const matchAction = !actionFilter || record.action_type === actionFilter;
        const matchEntity = !entityFilter || record.entity_type === entityFilter;
        const matchUser = !userFilter || (record.user_email || '').toLowerCase().includes(userFilter);

        return matchAction && matchEntity && matchUser;
    });

    renderAuditTable(filtered);
    updateAuditStats(filtered);
}

function clearFilters() {
    document.getElementById('filterAction').value = '';
    document.getElementById('filterEntity').value = '';
    document.getElementById('filterUser').value = '';

    renderAuditTable(allAuditRecords);
    updateAuditStats(allAuditRecords);
}

function exportAuditTrail() {
    if (allAuditRecords.length === 0) {
        alert('No records to export');
        return;
    }

    // Create CSV content
    let csv = 'Timestamp,User Email,Action,Entity Type,Entity Name,Description\n';

    allAuditRecords.forEach(record => {
        const timestamp = new Date(record.created_at).toLocaleString();
        const row = [
            `"${timestamp}"`,
            `"${record.user_email || 'System'}"`,
            `"${record.action_type}"`,
            `"${record.entity_type}"`,
            `"${record.entity_name || ''}"`,
            `"${(record.description || '').replace(/"/g, '""')}"` // Escape quotes
        ].join(',');

        csv += row + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `audit-trail-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 Audit trail page loaded');
    
    // Wait for Supabase to be ready
    await new Promise(r => setTimeout(r, 500));
    
    await loadAuditTrail();

    // Set up filter listeners
    document.getElementById('filterAction')?.addEventListener('change', applyFilters);
    document.getElementById('filterEntity')?.addEventListener('change', applyFilters);
    document.getElementById('filterUser')?.addEventListener('input', applyFilters);
});

// Auto-refresh audit trail every 30 seconds
setInterval(() => {
    loadAuditTrail().catch(err => console.error('Auto-refresh failed:', err));
}, 30000);
