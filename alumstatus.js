// Alumni Status (Degree Distribution) JavaScript

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

// Load real data from Supabase
async function loadAlumniStatus() {
    try {
        const ready = await ensureSupabaseReady();
        if (!ready) {
            console.warn('Supabase not ready, using empty data');
            renderChart({
                labels: Object.values(degreeLabels),
                values: new Array(8).fill(0)
            });
            return;
        }

        const {
            data: profiles,
            error
        } = await window.supabase
            .from('alumni_profiles')
            .select('degree');

        if (error) {
            console.error('Error fetching alumni status:', error);
            renderChart({
                labels: Object.values(degreeLabels),
                values: new Array(8).fill(0)
            });
            return;
        }

        // Count degrees
        const degreeCounts = {};
        Object.keys(degreeLabels).forEach(code => {
            degreeCounts[code] = 0;
        });

        profiles.forEach(profile => {
            if (profile.degree && degreeCounts.hasOwnProperty(profile.degree)) {
                degreeCounts[profile.degree]++;
            }
        });

        const labels = Object.keys(degreeCounts).map(code => degreeLabels[code]);
        const values = Object.values(degreeCounts);

        console.log('Alumni status data:', {
            labels,
            values
        });
        renderChart({
            labels,
            values
        });

    } catch (error) {
        console.error('Error loading alumni status:', error);
        renderChart({
            labels: Object.values(degreeLabels),
            values: new Array(8).fill(0)
        });
    }
}

function renderChart(data) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Alumni Count',
                data: data.values,
                backgroundColor: ['#2e43a8', '#ff8a42', '#ff3b3b', '#6f5ac8', '#8b2b7a', '#000', '#28a745', '#ffc107'],
                borderRadius: 6,
                barThickness: 18
            }]
        },
        options: {
            indexAxis: 'x',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: '#e9eef8'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadAlumniStatus();

    // Listen for updates
    window.addEventListener('alumni:saved', () => {
        setTimeout(loadAlumniStatus, 500);
    });
});