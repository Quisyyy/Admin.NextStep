/**
 * Get section completion status for an alumni based on alumni_profiles fields
 * @param {string} alumniId - Alumni profile ID
 * @returns {Promise<Object>} Object with completedSections, totalSections, and sectionStatus
 */
async function getAlumniProfileSectionCompletion(alumniId) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }
    // Fetch alumni profile
    const { data, error } = await window.supabase
      .from("alumni_profiles")
      .select("*")
      .eq("id", alumniId)
      .single();
    if (error || !data) throw error || new Error("Profile not found");

    // Section 1: Personal Info & Address (all must be filled)
    const personalFields = [
      "student_number",
      "full_name",
      "email",
      "birth_month",
      "birth_day",
      "birth_year",
      "contact",
      "street",
      "province",
      "municipality",
      "barangay",
    ];
    const personalComplete = personalFields.every(
      (f) => !!(data[f] && String(data[f]).trim() !== ""),
    );

    // Section 2: Academic Background
    const academicFields = [
      "degree",
      "major",
      "honors",
      "graduated_year",
      "degree_label",
    ];
    const academicComplete = academicFields.every(
      (f) => !!(data[f] && String(data[f]).trim() !== ""),
    );

    // Section 3: Job Status & Career Info
    const careerFields = [
      "job_status",
      "current_job",
      "career_path",
      "is_related",
    ];
    const careerComplete = careerFields.every(
      (f) =>
        data[f] !== undefined &&
        data[f] !== null &&
        String(data[f]).trim() !== "",
    );

    const sectionStatus = {
      personal: personalComplete,
      academic: academicComplete,
      career: careerComplete,
    };
    const completedSections = [
      personalComplete,
      academicComplete,
      careerComplete,
    ].filter(Boolean).length;
    return {
      alumniId,
      completedSections,
      totalSections: 3,
      sectionStatus,
    };
  } catch (error) {
    console.error("Error checking alumni profile section completion:", error);
    return {
      alumniId,
      completedSections: 0,
      totalSections: 3,
      sectionStatus: { personal: false, academic: false, career: false },
    };
  }
}
// Alumni Form Completion Tracker

const FORM_TYPES = {
  BASIC_INFO: "basic_info",
  CAREER_INFO: "career_info",
  EDUCATION_DETAILS: "education_details",
};

/**
 * Initialize form completion tracking for a new alumni
 * @param {string} alumniId - Alumni profile ID
 * @returns {Promise<boolean>}
 */
async function initializeAlumniFormTracking(alumniId) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    const formTypes = Object.values(FORM_TYPES);
    const records = formTypes.map((formType) => ({
      alumni_id: alumniId,
      form_type: formType,
      is_completed: false,
    }));

    const { error } = await window.supabase
      .from("alumni_form_completion")
      .insert(records);

    if (error) {
      if (error.code !== "23505") {
        // Ignore duplicate key errors
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error("Error initializing form tracking:", error);
    return false;
  }
}

/**
 * Mark a form as completed for an alumni
 * @param {string} alumniId - Alumni profile ID
 * @param {string} formType - Type of form (from FORM_TYPES)
 * @returns {Promise<boolean>}
 */
async function markFormAsCompleted(alumniId, formType) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    if (!Object.values(FORM_TYPES).includes(formType)) {
      throw new Error(`Invalid form type: ${formType}`);
    }

    const { error } = await window.supabase
      .from("alumni_form_completion")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("alumni_id", alumniId)
      .eq("form_type", formType);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error marking form as completed:", error);
    return false;
  }
}

/**
 * Check if a form has been completed
 * @param {string} alumniId - Alumni profile ID
 * @param {string} formType - Type of form
 * @returns {Promise<boolean>}
 */
async function isFormCompleted(alumniId, formType) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    const { data, error } = await window.supabase
      .from("alumni_form_completion")
      .select("is_completed")
      .eq("alumni_id", alumniId)
      .eq("form_type", formType)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return false;
      }
      throw error;
    }

    return data?.is_completed || false;
  } catch (error) {
    console.error("Error checking form completion:", error);
    return false;
  }
}

/**
 * Get completion status for an alumni
 * @param {string} alumniId - Alumni profile ID
 * @returns {Promise<Object>} Object with completion details
 */
async function getAlumniCompletionStatus(alumniId) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    const { data, error } = await window.supabase
      .from("alumni_form_completion")
      .select("*")
      .eq("alumni_id", alumniId);

    if (error) throw error;

    const completedForms = data.filter((f) => f.is_completed).length;
    const totalForms = data.length;
    const isAllComplete = completedForms === totalForms && totalForms > 0;

    return {
      alumniId,
      completedForms,
      totalForms,
      isAllComplete,
      forms: data.reduce((acc, form) => {
        acc[form.form_type] = {
          completed: form.is_completed,
          completedAt: form.completed_at,
        };
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error("Error getting completion status:", error);
    return {
      alumniId,
      completedForms: 0,
      totalForms: 0,
      isAllComplete: false,
      forms: {},
    };
  }
}

/**
 * Get all alumni with their completion status
 * @returns {Promise<Array>}
 */
async function getAllAlumniCompletionStatus() {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    const { data, error } = await window.supabase
      .from("alumni_completion_status")
      .select("*")
      .order("last_updated", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting all alumni status:", error);
    return [];
  }
}

/**
 * Prevent form submission if not all required forms are complete
 * @param {string} alumniId - Alumni profile ID
 * @returns {Promise<Object>} Object with validation result
 */
async function validateFormCompletion(alumniId) {
  try {
    const status = await getAlumniCompletionStatus(alumniId);

    return {
      isValid: status.isAllComplete,
      status: status,
      message: status.isAllComplete
        ? "All forms completed!"
        : `Complete all forms (${status.completedForms}/${status.totalForms})`,
    };
  } catch (error) {
    console.error("Error validating form completion:", error);
    return {
      isValid: false,
      status: null,
      message: "Error validating form completion",
    };
  }
}

/**
 * Prevent duplicate form submissions
 * @param {string} alumniId - Alumni profile ID
 * @param {string} formType - Type of form
 * @returns {Promise<{canSubmit: boolean, message: string}>}
 */
async function canSubmitForm(alumniId, formType) {
  try {
    if (!window.supabase) {
      throw new Error("Database connection not available");
    }

    const isCompleted = await isFormCompleted(alumniId, formType);

    return {
      canSubmit: !isCompleted,
      message: isCompleted
        ? "This form has already been completed"
        : "Form can be submitted",
    };
  } catch (error) {
    console.error("Error checking form submission permission:", error);
    return {
      canSubmit: false,
      message: "Error checking form status",
    };
  }
}

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.alumniFormTracker = {
    FORM_TYPES,
    initializeAlumniFormTracking,
    markFormAsCompleted,
    isFormCompleted,
    getAlumniCompletionStatus,
    getAllAlumniCompletionStatus,
    validateFormCompletion,
    canSubmitForm,
    getAlumniProfileSectionCompletion,
  };
}
