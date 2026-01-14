// Admin Audit Trail Viewer
// Loads and displays recent admin actions from the audit trail table

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#auditTable tbody');
    if (!window.supabase) {
        tableBody.innerHTML = '<tr><td colspan="4">Supabase not loaded</td></tr>';
        return;
    }
    try {
        // Fetch recent audit logs (limit 100, most recent first)
        const { data, error } = await window.supabase
            .from('admin_audit_trail')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No activity found.</td></tr>';
            return;
        }
        tableBody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.employee_id}</td>
                <td>${row.action}</td>
                <td>${row.details || ''}</td>
                <td>${new Date(row.created_at).toLocaleString()}</td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
});
