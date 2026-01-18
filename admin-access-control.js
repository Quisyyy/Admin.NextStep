// ============================================================================
// ADMIN ACCESS CONTROL - Show/Hide admin-only features
// ============================================================================
// Checks if logged-in user is an admin (DEV- or ADM- employee)
// Shows/hides admin-only UI elements accordingly

async function checkAdminAccess() {
    try {
        // Wait for Supabase to be ready with retries
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max wait
        
        while ((!window.supabase || !window.supabaseClientReady) && attempts < maxAttempts) {
            console.log(`⏳ Waiting for Supabase (attempt ${attempts + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.supabase || !window.supabaseClientReady) {
            console.warn('❌ Supabase not ready after timeout');
            // Schedule retry
            setTimeout(checkAdminAccess, 500);
            return;
        }

        console.log('✅ Supabase ready, checking admin access...');

        // Get current user
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.log('ℹ️ No user logged in');
            return;
        }

        console.log('👤 User found:', user.id);

        // Get admin record to check employee_id
        const { data: admin, error } = await window.supabase
            .from('admins')
            .select('employee_id')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.warn('⚠️ Error fetching admin record:', error.message);
            // Schedule retry
            setTimeout(checkAdminAccess, 500);
            return;
        }

        if (!admin) {
            console.log('ℹ️ Not an admin account');
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
                console.log('✅ Audit Trail link is now visible');
            } else {
                console.warn('⚠️ Audit Trail link element not found in DOM');
            }
        } else {
            console.log('ℹ️ Non-admin account:', employeeId);
            // Hide admin-only features (already hidden by default)
        }
    } catch (err) {
        console.error('❌ Error checking admin access:', err);
        // Schedule retry on error
        setTimeout(checkAdminAccess, 500);
    }
}

// Run check when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded fired, checking admin access...');
    checkAdminAccess();
});

// Also check after a short delay to catch cases where Supabase initializes after DOM ready
window.addEventListener('load', () => {
    console.log('🪟 Window load fired, rechecking admin access...');
    setTimeout(checkAdminAccess, 100);
});
