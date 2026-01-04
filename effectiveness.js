// Program Effectiveness JavaScript

// Supabase connection helper
async function ensureSupabaseReady(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabaseClientReady) return true;
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

// Load real data from Supabase and calculate program effectiveness
async function loadEffectivenessData() {
    try {
        const ready = await ensureSupabaseReady();
        if (!ready) {
            console.warn('Supabase not ready, using fallback data');
            renderFallbackData();
            return;
        }

        const {
            data: profiles,
            error
        } = await window.supabase
            .from('alumni_profiles')
            .select('*');

        if (error) {
            console.error('Error fetching effectiveness data:', error);
            renderFallbackData();
            return;
        }

        // Calculate effectiveness based on profile completeness and recent graduation
        const total = profiles.length;

        if (total === 0) {
            renderNoData();
            return;
        }

        // Simulate effectiveness based on data quality and graduation years
        const currentYear = new Date().getFullYear();
        const bins = [{
            label: 'Extremely Well',
            count: 0,
            color: '#1f9f17'
        }, {
            label: 'Well',
            count: 0,
            color: '#74c043'
        }, {
            label: 'Moderate',
            count: 0,
            color: '#f2da4a'
        }, {
            label: 'Slightly',
            count: 0,
            color: '#ffb84d'
        }, {
            label: 'Not at all',
            count: 0,
            color: '#ff4b4b'
        }];

        // Distribute alumni based on profile quality
        profiles.forEach(profile => {
            const completeness = calculateProfileCompleteness(profile);
            const gradYear = parseInt(profile.graduated_year) || currentYear;
            const recency = Math.max(0, 5 - (currentYear - gradYear)); // more recent = better

            const score = (completeness * 0.7) + (recency * 0.3);

            if (score >= 0.8) bins[0].count++;
            else if (score >= 0.6) bins[1].count++;
            else if (score >= 0.4) bins[2].count++;
            else if (score >= 0.2) bins[3].count++;
            else bins[4].count++;
        });

        const data = {
            summary: {
                max: total,
                bins: bins
            }
        };

        render(data, '');
        console.log('Effectiveness data loaded:', data);

    } catch (error) {
        console.error('Error loading effectiveness data:', error);
        renderFallbackData();
    }
}

function calculateProfileCompleteness(profile) {
    const fields = ['full_name', 'email', 'degree', 'student_number', 'contact', 'address', 'major', 'graduated_year'];
    const completed = fields.filter(field => profile[field] && profile[field].toString().trim().length > 0).length;
    return completed / fields.length;
}

function renderNoData() {
    const data = {
        summary: {
            max: 1,
            bins: [{
                label: 'Extremely Well',
                count: 0,
                color: '#1f9f17'
            }, {
                label: 'Well',
                count: 0,
                color: '#74c043'
            }, {
                label: 'Moderate',
                count: 0,
                color: '#f2da4a'
            }, {
                label: 'Slightly',
                count: 0,
                color: '#ffb84d'
            }, {
                label: 'Not at all',
                count: 0,
                color: '#ff4b4b'
            }]
        }
    };
    render(data, 'No alumni data available yet');
}

function renderFallbackData() {
    const fallback = {
        summary: {
            max: 1000,
            bins: [{
                label: 'Extremely Well',
                count: 700,
                color: '#1f9f17'
            }, {
                label: 'Well',
                count: 400,
                color: '#74c043'
            }, {
                label: 'Moderate',
                count: 250,
                color: '#f2da4a'
            }, {
                label: 'Slightly',
                count: 100,
                color: '#ffb84d'
            }, {
                label: 'Not at all',
                count: 35,
                color: '#ff4b4b'
            }]
        }
    };
    render(fallback, 'Using demo data (database connection unavailable)');
}

function render(data, note) {
    if (!data || !data.summary || !Array.isArray(data.summary.bins)) {
        const noteEl = document.querySelector('.data-note');
        if (noteEl && note) {
            noteEl.style.display = 'block';
            noteEl.textContent = note;
        }
        return;
    }

    const noteEl = document.querySelector('.data-note');
    if (noteEl) {
        noteEl.style.display = note ? 'block' : 'none';
        noteEl.textContent = note || '';
    }

    const bins = data.summary.bins;
    const max = data.summary.max || Math.max(...bins.map(b => b.count), 1);
    const barsEl = document.querySelector('.bars');
    barsEl.innerHTML = '';

    bins.forEach((bin, idx) => {
        const pct = Math.round((bin.count / max) * 100);
        const bar = document.createElement('div');
        bar.className = 'v-bar';
        bar.innerHTML = `<div class="v-fill" style="--h:${pct}%;--d:${idx * 140}ms;background:${bin.color || '#6b8e23'}" role="img" aria-label="${bin.label}: ${bin.count}"></div><div class="v-label">${bin.label}</div>`;
        barsEl.appendChild(bar);
    });

    // legend
    const legend = document.querySelector('.effectiveness-legend');
    legend.innerHTML = '';
    bins.forEach(bin => {
        const r = document.createElement('div');
        r.className = 'legend-item';
        r.innerHTML = `<span class="legend-swatch" style="background:${bin.color||'#6b8e23'}"></span><span>${bin.label}</span>`;
        legend.appendChild(r);
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadEffectivenessData();

    // Listen for updates
    window.addEventListener('alumni:saved', () => {
        setTimeout(loadEffectivenessData, 500);
    });
});