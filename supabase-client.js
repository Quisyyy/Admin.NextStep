// Supabase Client Initialization
// This file initializes the Supabase client and makes it available globally

(function initSupabaseClient() {
    // Check if supabaseUrl and supabaseKey are available
    // These should be defined in the environment or loaded from config
    
    // Try to get from window object first (in case they were injected)
    const supabaseUrl = window.SUPABASE_URL || 'https://ziquhxrfxywsmvunuyzi.supabase.co';
    const supabaseKey = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcXVoeHJmeHl3c212dW51eXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjM1NzQsImV4cCI6MjA3NzczOTU3NH0.IXCfC4IwcyJ5jv2jfDP2ZYfPCXUPS88kCupj0DMoVqc';

    // Check if supabase library is available
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase library not loaded. Make sure to include: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
        return;
    }

    try {
        // Initialize Supabase client
        window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
        
        // Mark as ready
        window.supabaseClientReady = true;
        
        console.log('✅ Supabase client initialized successfully');
        
        // Optional: Set up auth state change listener
        window.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            if (window.debugWidget) {
                window.debugWidget.log(`Auth: ${event}`);
            }
        });

    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        window.supabaseClientReady = false;
    }
})();
