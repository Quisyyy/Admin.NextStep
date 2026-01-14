    // ========================================================================
    // AUDIT TRAIL - Log admin actions
    // ========================================================================

    /**
     * Log an admin action to the audit trail table
     * @param {string} employeeId - Employee number of the admin
     * @param {string} action - Action performed (e.g., 'download')
     * @param {string} details - Optional details (e.g., file type, filter)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async logAdminAction(employeeId, action, details = '') {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');
            if (!employeeId || !action) throw new Error('Missing employeeId or action');
            const { error } = await window.supabase
                .from('admin_audit_trail')
                .insert([{ employee_id: employeeId, action, details }]);
            if (error) throw error;
            return { success: true };
        } catch (err) {
            console.error('logAdminAction error:', err);
            return { success: false, error: err.message };
        }
    },
// ============================================================================
// DATABASE HELPER - Integrates with Supabase RLS Policies
// ============================================================================
// This module handles all database operations for the admins table.
// It works seamlessly with the RLS policies defined in supabase-setup-rls.sql
//
// SETUP REQUIRED:
// 1. Run the SQL from supabase-setup-rls.sql in your Supabase SQL Editor
// 2. Include this file in your HTML: <script src="db-helper.js"></script>
// ============================================================================

const DatabaseHelper = {
    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Ensures Supabase client is ready before proceeding
     * @param {number} timeout - Maximum wait time in ms
     * @returns {Promise<boolean>}
     */
    async ensureReady(timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (window.supabase && window.supabaseClientReady) return true;
            await new Promise(r => setTimeout(r, 100));
        }
        return false;
    },

    /**
     * Get the current logged-in user
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');
            const { data: { user } } = await window.supabase.auth.getUser();
            return user;
        } catch (err) {
            console.error('getCurrentUser error:', err);
            return null;
        }
    },

    /**
     * Get current user's admin record
     * @returns {Promise<Object|null>}
     */
    async getMyAdminRecord() {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');
            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await window.supabase
                .from('admins')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('getMyAdminRecord error:', err);
            return null;
        }
    },

    // ========================================================================
    // ADMIN REGISTRATION - Works with admins_insert policy
    // ========================================================================

    /**
     * Register a new admin account
     * @param {string} email
     * @param {string} password
     * @param {string} fullName
     * @param {string} employeeId
     * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
     */
    async registerAdmin(email, password, fullName, employeeId) {
        try {
            if (!await this.ensureReady()) {
                throw new Error('Database not ready. Try again in a moment.');
            }

            // Validate inputs
            if (!email || !password || !fullName || !employeeId) {
                throw new Error('All fields are required.');
            }

            // Check if employee ID already exists
            const { data: existing, error: findErr } = await window.supabase
                .from('admins')
                .select('employee_id')
                .eq('employee_id', employeeId)
                .maybeSingle();

            if (findErr) throw findErr;
            if (existing) throw new Error('Employee ID already registered.');

            // Create Auth user with Supabase Auth
            const { data: signUp, error: signUpErr } = await window.supabase.auth.signUp({
                email,
                password
            });

            if (signUpErr) throw signUpErr;

            const user = signUp.user;
            if (!user) throw new Error('Account creation failed. Check your email.');

            // Insert admin record (linked to auth user)
            // The admins_insert policy requires auth.uid() = id
            const { error: insertErr } = await window.supabase
                .from('admins')
                .insert([{
                    id: user.id,
                    employee_id: employeeId,
                    email,
                    full_name: fullName,
                    role: 'admin'
                }]);

            if (insertErr) throw insertErr;

            return { success: true, user };
        } catch (err) {
            console.error('registerAdmin error:', err);
            return { success: false, error: err.message };
        }
    },

    // ========================================================================
    // ADMIN LOGIN - Works with admins_select_own policy
    // ========================================================================

    /**
     * Resolve email address from employee ID
     * @param {string} employeeId
     * @returns {Promise<string|null>}
     */
    async getEmailByEmployeeId(employeeId) {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');

            // Direct query - works with admins_public_select policy
            const { data: result, error: err } = await window.supabase
                .from('admins')
                .select('email')
                .eq('employee_id', employeeId)
                .maybeSingle();

            if (err) {
                console.error('getEmailByEmployeeId error:', err);
                return null;
            }
            
            return result?.email || null;
        } catch (err) {
            console.error('getEmailByEmployeeId error:', err);
            return null;
        }
    },

    /**
     * Sign in admin with employee ID and password
     * @param {string} employeeId
     * @param {string} password
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async loginAdmin(employeeId, password) {
        try {
            console.log('🔐 Login attempt for Employee ID:', employeeId);
            
            if (!await this.ensureReady()) {
                throw new Error('Database not ready. Try again in a moment.');
            }

            if (!employeeId || !password) {
                throw new Error('Employee ID and Password are required.');
            }

            // Resolve employee ID to email
            console.log('📧 Looking up email for Employee ID:', employeeId);
            const email = await this.getEmailByEmployeeId(employeeId);
            console.log('📧 Found email:', email);
            
            if (!email) {
                console.error('❌ No admin record found for Employee ID:', employeeId);
                throw new Error('No admin found for that Employee ID.');
            }

            // Sign in with Supabase Auth
            console.log('🔑 Attempting authentication with email:', email);
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                console.error('❌ Authentication failed:', error);
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid password or email not confirmed. Check your email for confirmation link.');
                }
                throw error;
            }

            console.log('✅ Login successful:', data);
            return { success: true };
        } catch (err) {
            console.error('❌ loginAdmin error:', err);
            return { success: false, error: err.message };
        }
    },

    // ========================================================================
    // ADMIN QUERIES - Works with admins_select_all policy
    // ========================================================================

    /**
     * Get all admin records (admins can read all records)
     * @returns {Promise<Array|null>}
     */
    async getAllAdmins() {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');

            const { data, error } = await window.supabase
                .from('admins')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('getAllAdmins error:', err);
            return null;
        }
    },

    /**
     * Get admin by ID
     * @param {string} adminId
     * @returns {Promise<Object|null>}
     */
    async getAdminById(adminId) {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');

            const { data, error } = await window.supabase
                .from('admins')
                .select('*')
                .eq('id', adminId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('getAdminById error:', err);
            return null;
        }
    },

    // ========================================================================
    // ADMIN UPDATES - Works with admins_update_own policy
    // ========================================================================

    /**
     * Update current user's admin record
     * @param {Object} updates - Fields to update (e.g., {full_name: 'New Name'})
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async updateMyRecord(updates) {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');

            const user = await this.getCurrentUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await window.supabase
                .from('admins')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (err) {
            console.error('updateMyRecord error:', err);
            return { success: false, error: err.message };
        }
    },

    // ========================================================================
    // AUTHENTICATION STATE
    // ========================================================================

    /**
     * Set up a listener for authentication state changes
     * @param {Function} callback - Called with (user) when auth state changes
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChange(callback) {
        if (!window.supabase) {
            console.error('Supabase not initialized');
            return () => {};
        }

        return window.supabase.auth.onAuthStateChange((event, session) => {
            const user = session?.user || null;
            callback(user);
        });
    },

    /**
     * Sign out current user
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async logout() {
        try {
            if (!await this.ensureReady()) throw new Error('Database not ready');

            const { error } = await window.supabase.auth.signOut();
            if (error) throw error;

            return { success: true };
        } catch (err) {
            console.error('logout error:', err);
            return { success: false, error: err.message };
        }
    }
};

// Make DatabaseHelper available globally
window.DatabaseHelper = DatabaseHelper;
