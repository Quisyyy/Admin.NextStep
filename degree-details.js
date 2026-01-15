// Degree Details Page JavaScript

// Supabase connection helper
async function ensureSupabaseReady(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabaseClientReady) return true;
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

// Degree label mapping
const degreeLabels = {
    'BSA': 'Bachelor of Science in Accountancy',
    'BSCpE': 'Bachelor of Science in Computer Engineering',
    'BSENTREP': 'Bachelor of Science in Entrepreneurship',
    'BSHM': 'Bachelor of Science in Hospitality Management',
    'BSIT': 'Bachelor of Science in Information Technology',
    'BSEDEN': 'Bachelor of Secondary Education (English)',
    'BSEDMT': 'Bachelor of Secondary Education (Mathematics)',
    'DOMTLOM': 'Diploma in Office Management Technology'
};

// Get degree from URL query parameter
function getDegreeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('degree') || '';
}

// Load and display alumni for specific degree
async function loadDegreeDetails() {
    try {
        const degree = getDegreeFromURL();
        
        if (!degree) {
            alert('No degree specified. Redirecting to dashboard.');
            window.location.href = 'homepage.html';
            return;
        }

        // Update page title
        const degreeLabel = degreeLabels[degree] || degree;
        document.getElementById('degreeTitle').textContent = degreeLabel;
        document.title = `${degreeLabel} - Admin`;

        const ready = await ensureSupabaseReady();
        if (!ready) {
            console.warn('Supabase not ready');
            showEmptyTable();
            return;
        }

        // Fetch alumni with specific degree
        const { data: profiles, error } = await window.supabase
            .from('alumni_profiles')
            .select('*')
            .eq('degree', degree)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching alumni:', error);
            showEmptyTable();
            return;
        }

        // Fetch career info for all alumni
        const { data: careerData, error: careerError } = await window.supabase
            .from('career_info')
            .select('*');

        if (careerError) {
            console.warn('Could not fetch career data:', careerError);
        }

        // Create a career info map by alumni_id
        const careerMap = {};
        if (careerData) {
            careerData.forEach(career => {
                careerMap[career.alumni_id] = career;
            });
        }

        // Calculate statistics
        const total = profiles.length;
        const completed = profiles.filter(p =>
            p.full_name && p.email && p.student_number
        ).length;

        // Update statistics
        document.getElementById('totalCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;

        // Populate table
        const tbody = document.querySelector('#degreeAlumniTable tbody');
        tbody.innerHTML = '';

        if (profiles.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" class="empty">No alumni found for this degree</td>';
            tbody.appendChild(tr);
            return;
        }

        profiles.forEach(profile => {
            const career = careerMap[profile.id] || {};
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${profile.full_name || 'N/A'}</td>
                <td>${profile.student_number || 'N/A'}</td>
                <td>${profile.email || 'N/A'}</td>
                <td>${career.current_position || 'Not specified'}</td>
                <td>${career.job_status || 'Not specified'}</td>
                <td>${career.industry || 'Not specified'}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading degree details:', error);
        showEmptyTable();
    }
}

// Show empty table
function showEmptyTable() {
    const tbody = document.querySelector('#degreeAlumniTable tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Unable to load data</td></tr>';
    document.getElementById('totalCount').textContent = '0';
    document.getElementById('completedCount').textContent = '0';
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    loadDegreeDetails();
});
