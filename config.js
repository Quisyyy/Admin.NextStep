// ============================================================================
// Supabase Configuration
// ============================================================================
// Add this to your HTML files BEFORE loading other scripts
// Replace the anon key with your actual key from Supabase dashboard
// ============================================================================

(function configureSupabase() {
    // Your Supabase Credentials
    window.SUPABASE_URL = 'https://axekvziluiiessaawvol.supabase.co';
    window.SUPABASE_ANON_KEY = 'sb_publishable_wmZpNUViFyWz5rpBqGEGhw_O4rs8_wH';
    
    // Optional: Add any other global config here
    window.APP_CONFIG = {
        supabaseUrl: window.SUPABASE_URL,
        supabaseKey: window.SUPABASE_ANON_KEY,
        environment: 'production',
        apiTimeout: 5000
    };
    
    console.log('✅ Configuration loaded');
})();
