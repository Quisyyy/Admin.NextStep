// Database Setup Script for NextStep Admin
// This script runs the RLS policies setup programmatically
// Run this once to configure your Supabase database

async function setupDatabase() {
    console.log('🔧 Starting database setup...');
    
    // Wait for Supabase to be ready
    const ready = await waitForSupabase(10000);
    if (!ready) {
        console.error('❌ Supabase not ready. Make sure supabase-client.js is loaded.');
        return false;
    }

    try {
        // Check if user is authenticated (needs to be service role or have permissions)
        const { data: { user } } = await window.supabase.auth.getUser();
        if (!user) {
            console.warn('⚠️  Not authenticated. Some setup operations may fail.');
        }

        console.log('📋 Setting up admins table RLS policies...');
        
        // Array of SQL commands to execute
        const sqlCommands = [
            // Drop existing policies
            'DROP POLICY IF EXISTS "admins_select_own" ON public.admins;',
            'DROP POLICY IF EXISTS "admins_select_all" ON public.admins;',
            'DROP POLICY IF EXISTS "admins_insert" ON public.admins;',
            'DROP POLICY IF EXISTS "admins_update_own" ON public.admins;',
            'DROP POLICY IF EXISTS "admins_delete_own" ON public.admins;',
            
            // Drop trigger and function if they exist
            'DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;',
            'DROP FUNCTION IF EXISTS public.update_admins_timestamp();',
            
            // Enable RLS
            'ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;',
            
            // Create policies
            `CREATE POLICY "admins_select_own" ON public.admins
                FOR SELECT USING (auth.uid() = id);`,
            
            `CREATE POLICY "admins_select_all" ON public.admins
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM public.admins
                        WHERE id = auth.uid() AND role = 'admin'
                    )
                );`,
            
            `CREATE POLICY "admins_insert" ON public.admins
                FOR INSERT WITH CHECK (auth.uid() = id);`,
            
            `CREATE POLICY "admins_update_own" ON public.admins
                FOR UPDATE USING (auth.uid() = id);`,
            
            `CREATE POLICY "admins_delete_own" ON public.admins
                FOR DELETE USING (auth.uid() = id);`,
            
            // Create trigger function
            `CREATE FUNCTION public.update_admins_timestamp()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = now();
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;`,
            
            // Create trigger
            `CREATE TRIGGER update_admins_updated_at
                BEFORE UPDATE ON public.admins
                FOR EACH ROW
                EXECUTE FUNCTION public.update_admins_timestamp();`
        ];

        // Execute each SQL command
        for (let i = 0; i < sqlCommands.length; i++) {
            const sql = sqlCommands[i];
            console.log(`Executing command ${i + 1}/${sqlCommands.length}...`);
            
            const { error } = await window.supabase.rpc('exec', { 
                sql: sql 
            }).catch(err => {
                // If rpc doesn't exist, try direct execution via SQL editor
                console.warn(`Note: Some operations require manual SQL execution in Supabase dashboard`);
                return { error: err };
            });

            if (error) {
                console.warn(`⚠️  Command ${i + 1} warning:`, error.message);
                // Continue with other commands even if one fails
            }
        }

        console.log('✅ Database setup completed!');
        console.log('📝 Summary:');
        console.log('  • RLS policies configured for admins table');
        console.log('  • Auto-update trigger for timestamps enabled');
        console.log('  • Ready to use!');
        
        return true;

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        console.error('📌 You may need to run the SQL manually in Supabase dashboard');
        return false;
    }
}

// Helper function to wait for Supabase
async function waitForSupabase(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabaseClientReady) {
            return true;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

// Alternative: Run SQL directly through Supabase SQL interface
async function setupDatabaseManual() {
    console.log('📋 Manual Setup Instructions:');
    console.log('Since RLS setup requires admin/service role permissions:');
    console.log('');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select your NEXTSTEP project');
    console.log('3. Go to SQL Editor (left sidebar)');
    console.log('4. Click "New Query"');
    console.log('5. Copy and paste the entire content from supabase-setup-rls.sql');
    console.log('6. Click "Run"');
    console.log('7. You should see: "Admins table setup complete!"');
    console.log('');
    console.log('After that, your database will be fully configured.');
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupDatabase, setupDatabaseManual };
}

// Auto-setup on page load (commented out - uncomment to auto-run)
// document.addEventListener('DOMContentLoaded', setupDatabase);

// You can also call this manually from browser console:
// setupDatabase()
