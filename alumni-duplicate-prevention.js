// Alumni Data Validation and Duplication Prevention Utility

/**
 * Check if an alumni record already exists
 * @param {string} email - Alumni email
 * @param {string} studentNumber - Student number
 * @param {string} excludeId - Optional: ID to exclude from check (for updates)
 * @returns {Promise<{exists: boolean, existingRecord: object|null}>}
 */
async function checkAlumniExists(email, studentNumber, excludeId = null) {
    try {
        if (!window.supabase) {
            throw new Error('Database connection not available');
        }

        let query = window.supabase
            .from('alumni_profiles')
            .select('*');

        // Check by email or student number
        if (email && studentNumber) {
            query = query.or(`email.eq.${email},student_number.eq.${studentNumber}`);
        } else if (email) {
            query = query.eq('email', email);
        } else if (studentNumber) {
            query = query.eq('student_number', studentNumber);
        } else {
            return { exists: false, existingRecord: null };
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error checking for duplicates:', error);
            throw error;
        }

        // Filter out the record being updated (if excludeId provided)
        const matches = excludeId 
            ? data.filter(record => record.id !== excludeId)
            : data;

        return {
            exists: matches.length > 0,
            existingRecord: matches[0] || null
        };
    } catch (error) {
        console.error('checkAlumniExists error:', error);
        throw error;
    }
}

/**
 * Save or update alumni record (prevents duplicates)
 * @param {Object} alumniData - Alumni data object
 * @param {string} recordId - Optional: ID of existing record to update
 * @returns {Promise<{success: boolean, data: object, message: string}>}
 */
async function saveAlumniRecord(alumniData, recordId = null) {
    try {
        if (!window.supabase) {
            throw new Error('Database connection not available');
        }

        // Validate required fields
        if (!alumniData.email) {
            throw new Error('Email is required');
        }

        if (!alumniData.student_number) {
            throw new Error('Student number is required');
        }

        // Check for duplicates (excluding current record if updating)
        const { exists, existingRecord } = await checkAlumniExists(
            alumniData.email,
            alumniData.student_number,
            recordId
        );

        if (exists) {
            return {
                success: false,
                data: existingRecord,
                message: `Alumni already exists: ${existingRecord.full_name || existingRecord.email}`,
                isDuplicate: true
            };
        }

        // If recordId provided, UPDATE existing record
        if (recordId) {
            const { data, error } = await window.supabase
                .from('alumni_profiles')
                .update(alumniData)
                .eq('id', recordId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: data,
                message: 'Alumni record updated successfully',
                isUpdate: true
            };
        }

        // Otherwise, INSERT new record
        const { data, error } = await window.supabase
            .from('alumni_profiles')
            .insert([alumniData])
            .select()
            .single();

        if (error) {
            // Handle unique constraint violations
            if (error.code === '23505') { // PostgreSQL unique violation code
                return {
                    success: false,
                    data: null,
                    message: 'This email or student number is already registered',
                    isDuplicate: true
                };
            }
            throw error;
        }

        return {
            success: true,
            data: data,
            message: 'Alumni record created successfully',
            isUpdate: false
        };

    } catch (error) {
        console.error('saveAlumniRecord error:', error);
        return {
            success: false,
            data: null,
            message: error.message || 'Failed to save alumni record'
        };
    }
}

/**
 * Get alumni record by ID
 * @param {string} id - Alumni record ID
 * @returns {Promise<object|null>}
 */
async function getAlumniById(id) {
    try {
        if (!window.supabase || !id) return null;

        const { data, error } = await window.supabase
            .from('alumni_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('getAlumniById error:', error);
        return null;
    }
}

/**
 * Find duplicates in the database
 * @returns {Promise<Array>} Array of duplicate groups
 */
async function findDuplicateAlumni() {
    try {
        if (!window.supabase) {
            throw new Error('Database connection not available');
        }

        const { data, error } = await window.supabase
            .from('alumni_profiles')
            .select('*');

        if (error) throw error;

        // Group by email and student number
        const groups = {};
        
        data.forEach(record => {
            const key = `${record.email || 'no-email'}_${record.student_number || 'no-number'}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(record);
        });

        // Return only groups with more than one record
        const duplicates = Object.values(groups).filter(group => group.length > 1);
        
        return duplicates;
    } catch (error) {
        console.error('findDuplicateAlumni error:', error);
        return [];
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.alumniUtils = {
        checkAlumniExists,
        saveAlumniRecord,
        getAlumniById,
        findDuplicateAlumni
    };
}
