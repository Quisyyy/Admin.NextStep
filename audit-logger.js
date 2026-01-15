// ============================================================================
// AUDIT TRAIL LOGGER - Log all employee activities
// ============================================================================
// Usage: AuditLogger.log('LOGIN', 'User logged in successfully')
// Include this file in your HTML before other scripts

const AuditLogger = {
    /**
     * Log an activity to the audit trail
     * @param {string} action - Type of action (LOGIN, REGISTER, UPDATE, DELETE, etc.)
     * @param {string} details - Additional details about the action
     * @param {string} status - 'success' or 'failed' (default: 'success')
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async log(action, details = '', status = 'success') {
        try {
            // Wait for Supabase to be ready
            if (!window.supabase || !window.supabaseClientReady) {
                console.warn('Supabase not ready, audit log delayed:', action);
                return { success: false, error: 'Supabase not ready' };
            }

            // Get current user
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                console.warn('No user logged in, skipping audit log');
                return { success: false, error: 'No user' };
            }

            // Get admin record to get employee_id
            const { data: admin, error: adminErr } = await window.supabase
                .from('admins')
                .select('employee_id')
                .eq('id', user.id)
                .maybeSingle();

            if (adminErr || !admin) {
                console.warn('Could not get employee_id:', adminErr);
                return { success: false, error: 'Admin record not found' };
            }

            // Get browser info
            const ipAddress = await this.getClientIP();
            const userAgent = navigator.userAgent;

            // Insert audit log
            const { error } = await window.supabase
                .from('admin_audit_trail')
                .insert([{
                    user_id: user.id,
                    employee_id: admin.employee_id,
                    action,
                    details,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    status
                }]);

            if (error) {
                console.error('Audit log insert error:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Audit log recorded:', action);
            return { success: true };
        } catch (err) {
            console.error('AuditLogger error:', err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Get client IP address (best effort)
     * @returns {Promise<string>}
     */
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'unknown';
        } catch (err) {
            return 'unknown';
        }
    },

    /**
     * Log a login attempt
     * @param {string} email
     * @param {boolean} success
     * @param {string} reason - Reason for failure (if any)
     */
    async logLogin(email, success = true, reason = '') {
        const details = success 
            ? `Logged in with email: ${email}` 
            : `Login failed: ${reason}`;
        return this.log('LOGIN', details, success ? 'success' : 'failed');
    },

    /**
     * Log a registration
     * @param {string} employeeId
     * @param {string} email
     * @param {boolean} success
     */
    async logRegistration(employeeId, email, success = true) {
        const details = `Registered admin. Employee ID: ${employeeId}, Email: ${email}`;
        return this.log('REGISTER', details, success ? 'success' : 'failed');
    },

    /**
     * Log a profile update
     * @param {object} changes - Object with changed fields
     */
    async logProfileUpdate(changes) {
        const details = `Updated profile: ${JSON.stringify(changes)}`;
        return this.log('UPDATE_PROFILE', details, 'success');
    },

    /**
     * Log a data deletion
     * @param {string} tableName - Table that was affected
     * @param {string} recordId - ID of deleted record
     */
    async logDeletion(tableName, recordId) {
        const details = `Deleted record from ${tableName}: ${recordId}`;
        return this.log('DELETE_RECORD', details, 'success');
    },

    /**
     * Log a data export/download
     * @param {string} dataType - Type of data exported
     * @param {number} recordCount - Number of records
     */
    async logExport(dataType, recordCount) {
        const details = `Exported ${recordCount} ${dataType} records`;
        return this.log('EXPORT_DATA', details, 'success');
    },

    /**
     * Log a search/query
     * @param {string} query - Search query
     * @param {number} resultCount - Number of results
     */
    async logSearch(query, resultCount) {
        const details = `Searched for "${query}", found ${resultCount} results`;
        return this.log('SEARCH', details, 'success');
    }
};

// Make it globally available
window.AuditLogger = AuditLogger;
