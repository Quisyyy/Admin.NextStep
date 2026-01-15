// Admin Audit Trail Viewer - Simplified
// Loads and displays audit trail data

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#auditTable tbody');
    if (!window.supabase) {
        tableBody.innerHTML = '<tr><td colspan="4">Supabase not loaded</td></tr>';
        console.error('❌ Supabase not available');
        return;
    }

    try {
        console.log('📋 Fetching audit trail...');

        // Fetch ALL audit logs
        const { data, error } = await window.supabase
            .from('admin_audit_trail')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        console.log('Fetch result:', { data, error });

        if (error) {
            console.error('❌ Fetch error:', error);
            tableBody.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No data found');
            tableBody.innerHTML = '<tr><td colspan="4">No activity found.</td></tr>';
            return;
        }

        console.log('✅ Found', data.length, 'records');

        // Show all DEV- and ADM- activities (filtering on client side)
        const filteredData = data.filter(row => {
            const empId = row.employee_id || '';
            return empId.startsWith('DEV-') || empId.startsWith('ADM-');
        });

        console.log('✅ Filtered to', filteredData.length, 'DEV/ADM records');

        if (filteredData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No DEV or ADM activity found.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        filteredData.forEach(row => {
            const tr = document.createElement('tr');
            const timeStr = new Date(row.created_at).toLocaleString();
            tr.innerHTML = `
                <td>${row.employee_id || 'N/A'}</td>
                <td>${row.action || 'N/A'}</td>
                <td>${row.details || ''}</td>
                <td>${timeStr}</td>
            `;
            tableBody.appendChild(tr);
        });

        console.log('✅ Table updated with', filteredData.length, 'rows');

    } catch (err) {
        console.error('❌ Error:', err);
        tableBody.innerHTML = `<tr><td colspan="4">Error: ${err.message}</td></tr>`;
    }
});
