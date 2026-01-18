// ============================================================================
// DATABASE HELPER v2.0 - Enhanced Security for Admin & Alumni Login
// ============================================================================
// Complete database operations with RLS support and enhanced security
// Supports both Admin and Alumni authentication with proper role separation
// ============================================================================

const DatabaseHelper = {
    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    /**
     * Timeout for Supabase operations
     */
    TIMEOUT_MS: 5000,

    /**
     * Password requirements
     */
    PASSWORD_REQUIREMENTS: {
        minLength: 8,
        requireNumbers: true,
        requireSpecialChars: true,
        requireUpperCase: true,
        requireLowerCase: true
    },

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================

    /**
     * Ensure Supabase client is ready
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<boolean>}
     */
    async ensureReady(timeout = this.TIMEOUT_MS) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (window.supabase && window.supabaseClientReady) {
                return true;
            }
            await new Promise(r => setTimeout(r, 100));
        }
        console.error('❌ Supabase client not ready after timeout');
        return false;
    },

    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>}
     */
    async getCurrentUser() {
        try {
            if (!await this.ensureReady()) {
                throw new Error('Database not ready');
            }
            const { data: { user }, error } = await window.supabase.auth.getUser();
            if (error) throw error;
            return user;
        } catch (err) {
            console.error('getCurrentUser error:', err);
            return null;
        }
    },

    /**
     * Get current session
     * @returns {Promise<Object|null>}
     */
    async getCurrentSession() {
        try {
            if (!await this.ensureReady()) {
                throw new Error('Database not ready');
            }
            const { data: { session }, error } = await window.supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (err) {
            console.error('getCurrentSession error:', err);
            return null;
        }
    },

    /**
     * Validate password strength
     * @param {string} password
     * @returns {Object} { isValid: boolean, errors: string[] }
     */
    validatePasswordStrength(password) {
        const errors = [];

        if (password.length < this.PASSWORD_REQUIREMENTS.minLength) {
            errors.push(`Minimum ${this.PASSWORD_REQUIREMENTS.minLength} characters required`);
        }

        if (this.PASSWORD_REQUIREMENTS.requireUpperCase && !/[A-Z]/.test(password)) {
            errors.push('Must contain at least one uppercase letter');
        }

        if (this.PASSWORD_REQUIREMENTS.requireLowerCase && !/[a-z]/.test(password)) {
            errors.push('Must contain at least one lowercase letter');
        }

        if (this.PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
            errors.push('Must contain at least one number');
        }

        if (this.PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Must contain at least one special character (!@#$%^&*etc)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Log action to audit table
     * @param {string} action - Action name
     * @param {string} resourceType - Type of resource
     * @param {string} resourceId - ID of resource
     * @param {Object} newValues - New values
     * @param {Object} oldValues - Previous values
     */
    async logAudit(action, resourceType, resourceId, newValues = null, oldValues = null) {
        try {
            if (!await this.ensureReady()) return false;

            const user = await this.getCurrentUser();
            if (!user) return false;

            const { error } = await window.supabase
                .from('audit_logs')
                .insert({
                    admin_id: user.id,
                    action,
                    resource_type: resourceType,
                    resource_id: resourceId,
                    new_values: newValues,
                    old_values: oldValues,
                    ip_address: await this.getClientIp(),
                    user_agent: navigator.userAgent,
                    status: 'success'
                });

            if (error) {
                console.error('Audit log error:', error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('logAudit error:', err);
            return false;
        }
    },

    /**
     * Get client IP address (requires a backend endpoint)
     * @returns {Promise<string>}
     */
    async getClientIp() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'unknown';
        } catch (err) {
            return 'unknown';
        }
    },

    // ========================================================================
    // ADMIN AUTHENTICATION
    // ========================================================================

    /**
     * Register a new admin account
     * @param {string} email
     * @param {string} password
     * @param {string} fullName
     * @param {string} employeeId
     * @param {string} department
     * @returns {Promise<Object>}
     */
    async registerAdmin(email, password, fullName, employeeId, department = null) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            // Validate inputs
            if (!email || !password || !fullName || !employeeId) {
                return { success: false, error: 'Missing required fields' };
            }

            // Validate password strength
            const passwordCheck = this.validatePasswordStrength(password);
            if (!passwordCheck.isValid) {
                return { success: false, error: passwordCheck.errors.join('; ') };
            }

            // Check if employee ID already exists
            const { data: existingAdmin } = await window.supabase
                .from('admins')
                .select('id')
                .eq('employee_id', employeeId)
                .single();

            if (existingAdmin) {
                return { success: false, error: 'Employee ID already registered' };
            }

            // Create auth user
            const { data: authData, error: authError } = await window.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'admin'
                    }
                }
            });

            if (authError) {
                return { success: false, error: authError.message };
            }

            if (!authData.user) {
                return { success: false, error: 'Failed to create auth user' };
            }

            // Create admin record
            const { data: adminData, error: adminError } = await window.supabase
                .from('admins')
                .insert({
                    id: authData.user.id,
                    email,
                    full_name: fullName,
                    employee_id: employeeId,
                    department,
                    role: 'admin',
                    is_active: true
                })
                .select()
                .single();

            if (adminError) {
                // Try to delete the auth user if admin record creation fails
                await window.supabase.auth.admin?.deleteUser(authData.user.id);
                return { success: false, error: 'Failed to create admin record: ' + adminError.message };
            }

            // Log the action
            await this.logAudit('ADMIN_CREATED', 'admin', adminData.id, adminData);

            return { 
                success: true, 
                user: authData.user,
                admin: adminData,
                message: 'Admin account created successfully' 
            };
        } catch (err) {
            console.error('registerAdmin error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Admin login
     * @param {string} emailOrEmployeeId
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async loginAdmin(emailOrEmployeeId, password) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            // Check if input is employee ID or email
            let email = emailOrEmployeeId;
            if (!emailOrEmployeeId.includes('@')) {
                // It's likely an employee ID, find the associated email
                const { data: admin, error: lookupError } = await window.supabase
                    .from('admins')
                    .select('email')
                    .eq('employee_id', emailOrEmployeeId)
                    .maybeSingle();

                if (lookupError || !admin) {
                    return { success: false, error: 'Admin not found. Check your Employee ID.' };
                }

                email = admin.email;
            }

            // Check if admin account is active
            const { data: adminRecord } = await window.supabase
                .from('admins')
                .select('is_active')
                .eq('email', email)
                .maybeSingle();

            if (adminRecord && !adminRecord.is_active) {
                return { success: false, error: 'Your account has been disabled. Contact your administrator.' };
            }

            // Sign in
            const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                // Log failed attempt
                await this.logAudit('LOGIN_FAILED', 'admin', email, null, { reason: authError.message });
                return { success: false, error: 'Invalid credentials' };
            }

            if (!authData.user) {
                return { success: false, error: 'Login failed' };
            }

            // Update last login
            await window.supabase
                .from('admins')
                .update({ last_login: new Date().toISOString() })
                .eq('id', authData.user.id);

            // Log successful login
            await this.logAudit('LOGIN_SUCCESS', 'admin', authData.user.id);

            return { 
                success: true, 
                user: authData.user,
                session: authData.session,
                message: 'Signed in successfully' 
            };
        } catch (err) {
            console.error('loginAdmin error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get admin's profile
     * @returns {Promise<Object|null>}
     */
    async getAdminProfile() {
        try {
            if (!await this.ensureReady()) return null;

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
            console.error('getAdminProfile error:', err);
            return null;
        }
    },

    /**
     * Update admin profile
     * @param {string} adminId
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateAdminProfile(adminId, updates) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            const user = await this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            // Check if user is updating their own profile or is super admin
            const currentAdmin = await this.getAdminProfile();
            if (user.id !== adminId && currentAdmin?.role !== 'super_admin') {
                return { success: false, error: 'Permission denied' };
            }

            // Get old values for audit
            const { data: oldData } = await window.supabase
                .from('admins')
                .select('*')
                .eq('id', adminId)
                .maybeSingle();

            // Update
            const { data, error } = await window.supabase
                .from('admins')
                .update(updates)
                .eq('id', adminId)
                .select()
                .maybeSingle();

            if (error) {
                return { success: false, error: error.message };
            }

            // Log the action
            await this.logAudit('ADMIN_UPDATED', 'admin', adminId, data, oldData);

            return { success: true, data };
        } catch (err) {
            console.error('updateAdminProfile error:', err);
            return { success: false, error: err.message };
        }
    },

    // ========================================================================
    // ALUMNI AUTHENTICATION
    // ========================================================================

    /**
     * Register a new alumni account
     * @param {string} email
     * @param {string} password
     * @param {string} firstName
     * @param {string} lastName
     * @param {Object} profileData - Optional additional profile info
     * @returns {Promise<Object>}
     */
    async registerAlumni(email, password, firstName, lastName, profileData = {}) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            // Validate inputs
            if (!email || !password || !firstName || !lastName) {
                return { success: false, error: 'Missing required fields' };
            }

            // Validate password strength
            const passwordCheck = this.validatePasswordStrength(password);
            if (!passwordCheck.isValid) {
                return { success: false, error: passwordCheck.errors.join('; ') };
            }

            // Check if email already exists
            const { data: existingAlumni } = await window.supabase
                .from('alumni_profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingAlumni) {
                return { success: false, error: 'Email already registered' };
            }

            // Create auth user
            const { data: authData, error: authError } = await window.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`,
                        role: 'alumni'
                    }
                }
            });

            if (authError) {
                return { success: false, error: authError.message };
            }

            if (!authData.user) {
                return { success: false, error: 'Failed to create auth user' };
            }

            // Create alumni profile
            const { data: alumniData, error: alumniError } = await window.supabase
                .from('alumni_profiles')
                .insert({
                    auth_user_id: authData.user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    ...profileData,
                    is_active: true
                })
                .select()
                .single();

            if (alumniError) {
                // Try to delete the auth user if alumni record creation fails
                await window.supabase.auth.admin?.deleteUser(authData.user.id);
                return { success: false, error: 'Failed to create profile: ' + alumniError.message };
            }

            // Log the action
            await this.logAudit('ALUMNI_CREATED', 'alumni', alumniData.id, alumniData);

            return { 
                success: true, 
                user: authData.user,
                profile: alumniData,
                message: 'Alumni account created successfully' 
            };
        } catch (err) {
            console.error('registerAlumni error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Alumni login
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async loginAlumni(email, password) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            // Check if alumni account is active
            const { data: alumniRecord } = await window.supabase
                .from('alumni_profiles')
                .select('is_active')
                .eq('email', email)
                .maybeSingle();

            if (alumniRecord && !alumniRecord.is_active) {
                return { success: false, error: 'Your account has been disabled. Contact administrator.' };
            }

            // Sign in
            const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                // Log failed attempt
                await this.logAudit('LOGIN_FAILED', 'alumni', email, null, { reason: authError.message });
                return { success: false, error: 'Invalid credentials' };
            }

            if (!authData.user) {
                return { success: false, error: 'Login failed' };
            }

            // Log successful login
            await this.logAudit('LOGIN_SUCCESS', 'alumni', authData.user.id);

            return { 
                success: true, 
                user: authData.user,
                session: authData.session,
                message: 'Signed in successfully' 
            };
        } catch (err) {
            console.error('loginAlumni error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get alumni profile
     * @returns {Promise<Object|null>}
     */
    async getAlumniProfile() {
        try {
            if (!await this.ensureReady()) return null;

            const user = await this.getCurrentUser();
            if (!user) return null;

            const { data, error } = await window.supabase
                .from('alumni_profiles')
                .select('*')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('getAlumniProfile error:', err);
            return null;
        }
    },

    /**
     * Update alumni profile
     * @param {string} alumniId
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    async updateAlumniProfile(alumniId, updates) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            const user = await this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            // Get the alumni record to check ownership
            const { data: alumni } = await window.supabase
                .from('alumni_profiles')
                .select('*')
                .eq('id', alumniId)
                .maybeSingle();

            if (!alumni) {
                return { success: false, error: 'Alumni record not found' };
            }

            // Check if user is updating their own profile or is admin
            const isAdmin = await this.isAdmin(user.id);
            if (user.id !== alumni.auth_user_id && !isAdmin) {
                return { success: false, error: 'Permission denied' };
            }

            // Update
            const { data, error } = await window.supabase
                .from('alumni_profiles')
                .update(updates)
                .eq('id', alumniId)
                .select()
                .maybeSingle();

            if (error) {
                return { success: false, error: error.message };
            }

            // Log the action
            await this.logAudit('ALUMNI_UPDATED', 'alumni', alumniId, data, alumni);

            return { success: true, data };
        } catch (err) {
            console.error('updateAlumniProfile error:', err);
            return { success: false, error: err.message };
        }
    },

    // ========================================================================
    // AUTHORIZATION HELPERS
    // ========================================================================

    /**
     * Check if current user is an admin
     * @param {string} userId - Optional, defaults to current user
     * @returns {Promise<boolean>}
     */
    async isAdmin(userId = null) {
        try {
            if (!await this.ensureReady()) return false;

            const user = userId ? { id: userId } : await this.getCurrentUser();
            if (!user) return false;

            const { data } = await window.supabase
                .from('admins')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            return !!data;
        } catch (err) {
            console.error('isAdmin error:', err);
            return false;
        }
    },

    /**
     * Check if current user is a super admin
     * @returns {Promise<boolean>}
     */
    async isSuperAdmin() {
        try {
            if (!await this.ensureReady()) return false;

            const user = await this.getCurrentUser();
            if (!user) return false;

            const { data } = await window.supabase
                .from('admins')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            return data?.role === 'super_admin';
        } catch (err) {
            console.error('isSuperAdmin error:', err);
            return false;
        }
    },

    /**
     * Check if current user is alumni
     * @returns {Promise<boolean>}
     */
    async isAlumni() {
        try {
            if (!await this.ensureReady()) return false;

            const user = await this.getCurrentUser();
            if (!user) return false;

            const { data } = await window.supabase
                .from('alumni_profiles')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            return !!data;
        } catch (err) {
            console.error('isAlumni error:', err);
            return false;
        }
    },

    // ========================================================================
    // LOGOUT & SESSION
    // ========================================================================

    /**
     * Sign out (logout)
     * @returns {Promise<Object>}
     */
    async signOut() {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            const { error } = await window.supabase.auth.signOut();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, message: 'Signed out successfully' };
        } catch (err) {
            console.error('signOut error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Change password
     * @param {string} newPassword
     * @returns {Promise<Object>}
     */
    async changePassword(newPassword) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            // Validate password strength
            const passwordCheck = this.validatePasswordStrength(newPassword);
            if (!passwordCheck.isValid) {
                return { success: false, error: passwordCheck.errors.join('; ') };
            }

            const { error } = await window.supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Log the action
            const user = await this.getCurrentUser();
            if (user) {
                await this.logAudit('PASSWORD_CHANGED', 'auth', user.id);
            }

            return { success: true, message: 'Password changed successfully' };
        } catch (err) {
            console.error('changePassword error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Request password reset
     * @param {string} email
     * @param {string} redirectUrl
     * @returns {Promise<Object>}
     */
    async requestPasswordReset(email, redirectUrl = window.location.origin) {
        try {
            if (!await this.ensureReady()) {
                return { success: false, error: 'Database not ready' };
            }

            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, message: 'Password reset email sent' };
        } catch (err) {
            console.error('requestPasswordReset error:', err);
            return { success: false, error: err.message };
        }
    }
};

// Make DatabaseHelper globally available
window.DatabaseHelper = DatabaseHelper;

console.log('✅ DatabaseHelper loaded successfully');
