// ============================================================================
// ADMIN ACCESS CONTROL - Show/Hide admin-only features
// ============================================================================
// Checks if logged-in user is an admin (DEV- or ADM- employee)
// Shows/hides admin-only UI elements accordingly

async function checkAdminAccess() {
    try {
        // Wait for Supabase to be ready
        if (!window.supabase || !window.supabaseClientReady) {
            console.warn('Supabase not ready, skipping admin check');
            return;
        }

        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.log('No user logged in');
            return;
        }

        // Get admin record to check employee_id
        const { data: admin } = await window.supabase
            .from('admins')
            .select('employee_id')
            .eq('id', user.id)
            .maybeSingle();

        if (!admin) {
            console.log('Not an admin account');
            return;
        }

        // Check if employee_id starts with DEV- or ADM-
        const employeeId = admin.employee_id || '';
        const isAdminUser = employeeId.startsWith('DEV-') || employeeId.startsWith('ADM-');

        if (isAdminUser) {
            console.log('✅ Admin account detected:', employeeId);
            // Show admin-only features
            const auditTrailLink = document.getElementById('auditTrailLink');
            if (auditTrailLink) {
                auditTrailLink.style.display = 'block';
            }
        } else {
            console.log('⚠️ Non-admin account:', employeeId);
            // Hide admin-only features (already hidden by default)
        }
    } catch (err) {
        console.error('Error checking admin access:', err);
    }
}

// Run check when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
});
