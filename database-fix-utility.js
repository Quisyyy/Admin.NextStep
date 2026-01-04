// Database Fix Utility for Admin Table
// Run this once to fix RLS policies

async function fixAdminTableRLS() {
    if (!window.supabase) {
        console.error('Supabase client not available');
        return false;
    }

    try {
        console.log('🔧 Attempting to fix admin table RLS policies...');

        // This approach uses the Supabase management API
        // Note: This requires service role key, which should NOT be in client code
        // Instead, you should run the SQL script in Supabase dashboard

        console.log('⚠️  Please run the SQL script fix-admin-table.sql in your Supabase SQL editor');
        console.log('📋 Steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of fix-admin-table.sql');
        console.log('4. Run the query');
        console.log('5. Refresh this page and try creating an admin account again');

        return false;
    } catch (error) {
        console.error('Database fix failed:', error);
        return false;
    }
}

// Alternative: Try to test if the issue is fixed
async function testAdminTableAccess() {
    if (!window.supabase) {
        console.error('Supabase client not available');
        return false;
    }

    try {
        // Try to select from admins table to see if we have access
        const { data, error } = await window.supabase
            .from('admins')
            .select('id')
            .limit(1);

        if (error) {
            console.error('Admin table access test failed:', error.message);
            if (error.message.includes('row-level security')) {
                console.log('🔧 RLS policies need to be configured. Run fix-admin-table.sql');
            }
            return false;
        }

        console.log('✅ Admin table access test passed');
        return true;
    } catch (error) {
        console.error('Admin table test error:', error);
        return false;
    }
}

// Auto-test on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(testAdminTableAccess, 1000);
});

// Make functions available globally for debugging
window.fixAdminTableRLS = fixAdminTableRLS;
window.testAdminTableAccess = testAdminTableAccess;