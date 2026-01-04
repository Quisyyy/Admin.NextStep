// Alumni List JavaScript

// Map of degree codes to full labels (match the options used in alumni/Information.html)
const degreeLabels = {
    'BSA': 'Bachelor of Science in Accountancy (BSA)',
    'BSCpE': 'Bachelor of Science in Computer Engineering (BSCpE)',
    'BSENTREP': 'Bachelor of Science in Entrepreneurship (BSENTREP)',
    'BSHM': 'Bachelor of Science in Hospitality Management (BSHM)',
    'BSIT': 'Bachelor of Science in Information Technology (BSIT)',
    'BSEDEN': 'Bachelor of Secondary Education major in English (BSEDEN)',
    'BSEDMT': 'Bachelor of Secondary Education major in Mathematics (BSEDMT)',
    'DOMTLOM': 'Diploma in Office Management Technology- Legal Office Management (DOMTLOM)'
};

function labelForDegree(codeOrLabel) {
    if (!codeOrLabel) return '';
    // If the stored value is a code that exists in the map, return the mapped label.
    if (degreeLabels[codeOrLabel]) return degreeLabels[codeOrLabel];
    // Otherwise assume it's already a human-friendly label and return as-is.
    return codeOrLabel;
}

// fetch alumni list (prefer Supabase if configured, fallback to data/alumni.json)
async function ensureSupabaseReady(timeout = 2000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabase.from) return true;
        if (window.supabaseClientReady === false) return false;
        await new Promise(r => setTimeout(r, 100));
    }
    return !!(window.supabase && window.supabase.from);
}

async function loadAlumni() {
    // Try Supabase first
    try {
        console.log('🔍 Attempting to load alumni from Supabase...');
        const ok = await ensureSupabaseReady(2000);
        console.log('✅ Supabase ready:', ok);
        if (ok) {
            const {
                data,
                error
            } = await window.supabase.from('alumni_profiles').select('*').order('created_at', {
                ascending: false
            });
            
            console.log('📊 Supabase response:', { data, error });
            
            if (!error && Array.isArray(data)) {
                console.log(`✅ Found ${data.length} alumni records`);
                // Map to expected client fields
                return data.map(r => ({
                    fullName: r.full_name,
                    studentNumber: r.student_number,
                    // store the raw value but we'll render as label later
                    degree: r.degree,
                    graduationYear: r.graduated_year || r.graduatedYear || ''
                }));
            }
            
            if (error) {
                console.error('❌ Supabase error:', error);
            }
        }
    } catch (e) {
        console.warn('Supabase alumni fetch failed', e);
    }

    // Fallback to local JSON file
    console.log('⚠️ Falling back to local JSON...');
    try {
        const res = await fetch('data/alumni.json', {
            cache: 'no-store'
        });
        if (!res.ok) throw new Error('no file');
        const arr = await res.json();
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        console.error('❌ Local JSON fallback failed:', e);
        return [];
    }
}

function renderTable(alumni) {
    const tbody = document.querySelector('#alumTable tbody');
    tbody.innerHTML = '';
    if (!alumni.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" class="empty">No alumni records</td>';
        tbody.appendChild(tr);
        return;
    }
    alumni.forEach(a => {
        const tr = document.createElement('tr');
        const degreeLabel = labelForDegree(a.degree);
        tr.innerHTML = `<td>${a.fullName||''}</td><td>${a.studentNumber||''}</td><td>${degreeLabel||''}</td><td>${a.graduationYear||''}</td>`;
        tbody.appendChild(tr);
    });
}

// Initialize on load
(async() => {
    const data = await loadAlumni();
    renderTable(data);
})();

// Listen for saves from other pages/tabs and reload
window.addEventListener('alumni:saved', async function(e) {
    console.info('alumni:saved event received, reloading list', e && e.detail);
    const data = await loadAlumni();
    renderTable(data);
});