// Admin Dashboard JavaScript

// Supabase connection helper
async function ensureSupabaseReady(timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (window.supabase && window.supabaseClientReady) return true;
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

// Function to animate numbers
function animateNumber(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Fetch real data from Supabase
async function loadDashboardData() {
    try {
        const ready = await ensureSupabaseReady();
        if (!ready) {
            console.warn('Supabase not ready, using fallback data');
            return;
        }

        // Get only active alumni profiles
        let { data: profiles, error } = await window.supabase
            .from('alumni_profiles')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        // If is_active column doesn't exist, get all profiles
        if (error && error.message.includes('is_active')) {
            console.warn('is_active column not found, loading all profiles');
            const result = await window.supabase
                .from('alumni_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            profiles = result.data;
            error = result.error;
        }

        if (error) {
            console.error('Error fetching alumni data:', error);
            return;
        }

        console.log('Loaded active alumni profiles:', (profiles || []).length);

        // Calculate statistics
        const total = profiles.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newThisMonth = profiles.filter(p => {
            const created = new Date(p.created_at);
            return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
        }).length;

        const completedProfiles = profiles.filter(p =>
            p.full_name && p.email && p.degree && p.student_number
        ).length;

        // Update dashboard numbers with animation
        animateNumber(document.getElementById('totalAlumni'), 0, total, 1000);
        animateNumber(document.getElementById('newThisMonth'), 0, newThisMonth, 1000);
        animateNumber(document.getElementById('activeAlumni'), 0, total, 1000); // assuming all are active
        animateNumber(document.getElementById('completedProfiles'), 0, completedProfiles, 1000);

        // Update card numbers (only show total)
        animateNumber(document.getElementById('card-total'), 0, total, 1000);

        // Store profiles data for filtering
        window.allProfiles = profiles;

        // Load alumni status data (current status by degree)
        loadAlumniStatus(profiles);

        // Setup degree filter
        const degreeFilter = document.getElementById('degreeFilter');
        if (degreeFilter) {
            degreeFilter.addEventListener('change', (e) => {
                const selectedDegree = e.target.value;
                if (selectedDegree) {
                    const filtered = profiles.filter(p => p.degree === selectedDegree);
                    animateNumber(document.getElementById('card-total'), total, filtered.length, 500);
                } else {
                    animateNumber(document.getElementById('card-total'), document.getElementById('card-total').textContent, total, 500);
                }
            });
        }

        // Calculate monthly registrations for chart
        const monthlyData = new Array(12).fill(0);
        profiles.forEach(p => {
            const created = new Date(p.created_at);
            if (created.getFullYear() === currentYear) {
                monthlyData[created.getMonth()]++;
            }
        });

        // Update chart bars
        const chartBars = document.querySelectorAll('#registrationChart .bar');
        chartBars.forEach((bar, index) => {
            if (index < monthlyData.length) {
                const count = monthlyData[index];
                const height = count > 0 ? Math.max(20, (count / Math.max(...monthlyData, 1)) * 100) : 0;
                bar.style.setProperty('--height', height + 'px');
                bar.style.height = height + 'px';
                bar.querySelector('.bar-value').textContent = count;
            }
        });

        // Update last updated timestamp
        document.getElementById('lastUpdated').textContent =
            `Last updated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load and display alumni current status by degree
async function loadAlumniStatus(profiles) {
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

    // Count alumni by degree
    const degreeCounts = {};
    Object.keys(degreeLabels).forEach(code => {
        degreeCounts[code] = profiles.filter(p => p.degree === code).length;
    });

    // Display status grid
    const statusGrid = document.getElementById('statusGrid');
    if (statusGrid) {
        statusGrid.innerHTML = '';
        Object.entries(degreeLabels).forEach(([code, label]) => {
            const count = degreeCounts[code];
            const statusCard = document.createElement('div');
            statusCard.className = 'status-card';
            statusCard.innerHTML = `
                <div class="status-degree">${label}</div>
                <div class="status-count">${count}</div>
                <a href="degree-details.html?degree=${code}" class="status-view-btn">View</a>
            `;
            statusGrid.appendChild(statusCard);
        });
    }
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    // Load real data
    loadDashboardData();
    loadCareerStats();

    // Animate initial load
    setTimeout(() => {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = 'fadeInUp 0.6s ease-out forwards';
            }, index * 100);
        });
    }, 500);

    // Listen for alumni updates to refresh dashboard
    window.addEventListener('alumni:saved', () => {
        setTimeout(loadDashboardData, 500);
        setTimeout(loadCareerStats, 500);
    });

    // Download form handler
    const downloadForm = document.getElementById('downloadForm');
    if (downloadForm) {
        downloadForm.addEventListener('submit', handleDownload);
    }
});

// Handle data download
async function handleDownload(event) {
    event.preventDefault();
    
    const format = document.getElementById('downloadFormat').value;
    const filter = document.getElementById('dataFilter').value;
    const button = event.target.querySelector('.download-btn');
    // Degree codes for filtering
    const degreeCodes = [
        'BSA', 'BSCpE', 'BSENTREP', 'BSHM', 'BSIT', 'BSEDEN', 'BSEDMT', 'DOMTLOM'
    ];
    
    if (!format) {
        alert('Please select a format');
        return;
    }
    
    try {
        button.disabled = true;
        button.textContent = 'Downloading...';

        // Fetch alumni data
        const ready = await ensureSupabaseReady();
        if (!ready) {
            alert('Database connection failed');
            return;
        }

        const { data: profiles, error } = await window.supabase
            .from('alumni_profiles')
            .select('*');

        if (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data: ' + error.message);
            return;
        }

        console.log('Fetched alumni profiles:', profiles.length, profiles);

        // Apply filter
        let filteredData = profiles;
        if (degreeCodes.includes(filter)) {
            filteredData = profiles.filter(p => p.degree === filter);
        }

        console.log('Filtered data:', filteredData.length, filteredData);

        // ...existing code...
        let employeeId = '';
        if (window.DatabaseHelper && typeof window.DatabaseHelper.getMyAdminRecord === 'function') {
            const admin = await window.DatabaseHelper.getMyAdminRecord();
            if (admin && admin.employee_id) employeeId = admin.employee_id;
        }
        // Log download action
        if (employeeId && window.DatabaseHelper && typeof window.DatabaseHelper.logAdminAction === 'function') {
            const details = `format=${format}, filter=${filter || 'all'}`;
            window.DatabaseHelper.logAdminAction(employeeId, 'download', details);
        }

        if (format === 'csv') {
            downloadAsCSV(filteredData);
        } else if (format === 'pdf') {
            downloadAsPDF(filteredData);
        }

        button.textContent = 'Download Data';
        button.disabled = false;

    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading data: ' + error.message);
        button.textContent = 'Download Data';
        button.disabled = false;
    }
}

// Generate and download CSV file
function downloadAsCSV(data) {
    if (!data || data.length === 0) {
        // Check if a degree is selected for filtering
        const filterSelect = document.getElementById('dataFilter');
        let filterLabel = '';
        if (filterSelect) {
            const selectedOption = filterSelect.options[filterSelect.selectedIndex];
            filterLabel = selectedOption && selectedOption.value !== 'all' ? selectedOption.text : '';
        }
        if (filterLabel) {
            alert(`❌ No information found for "${filterLabel}".`);
        } else {
            alert('❌ No data to download.');
        }
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle CSV escaping
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',')
        )
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    // Get selected filter value and label
    const filterSelect = document.getElementById('dataFilter');
    let filterLabel = '';
    if (filterSelect) {
        const selectedOption = filterSelect.options[filterSelect.selectedIndex];
        filterLabel = selectedOption && selectedOption.value !== 'all' ? `_${selectedOption.text.replace(/\s+/g, '_')}` : '';
    }
    link.setAttribute('download', `alumni_data${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ Downloaded ${data.length} records as CSV`);
}

// Generate and download PDF file
function downloadAsPDF(data) {
    if (!data || data.length === 0) {
        alert('❌ No data to download. Please add alumni records first.\n\nTo add test data:\n1. Go to Supabase SQL Editor\n2. Run the contents of add-sample-data.sql');
        return;
    }
    
    // Check if html2pdf library is available
    if (typeof html2pdf === 'undefined') {
        alert('PDF library not loaded. Downloading as CSV instead.');
        downloadAsCSV(data);
        return;
    }
    
    try {
        // Create a proper HTML document
        const htmlContent = document.createElement('div');
        htmlContent.style.padding = '20px';
        htmlContent.style.fontFamily = 'Arial, sans-serif';
        
        // Title
        const title = document.createElement('h1');
        title.textContent = 'Alumni Data Report';
        title.style.color = '#004AAD';
        title.style.textAlign = 'center';
        htmlContent.appendChild(title);
        
        // Metadata
        const meta = document.createElement('p');
        meta.style.fontSize = '12px';
        meta.style.color = '#666';
        meta.innerHTML = `
            <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
            <strong>Total Records:</strong> ${data.length}
        `;
        htmlContent.appendChild(meta);
        
        // Create table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '20px';
        table.style.fontSize = '11px';
        
        // Get headers
        const headers = Object.keys(data[0]);
        
        // Create header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#004AAD';
        headerRow.style.color = 'white';
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.padding = '8px';
            th.style.border = '1px solid #ddd';
            th.style.textAlign = 'left';
            th.style.fontWeight = 'bold';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create data rows
        const tbody = document.createElement('tbody');
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : 'white';
            
            headers.forEach(header => {
                const td = document.createElement('td');
                const value = row[header];
                td.textContent = value !== null && value !== undefined ? String(value).substring(0, 100) : '';
                td.style.padding = '6px';
                td.style.border = '1px solid #ddd';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        htmlContent.appendChild(table);
        
        // Generate PDF
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `alumni_data_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
        };
        
        html2pdf().set(opt).from(htmlContent).save();
        alert(`✅ Downloaded ${data.length} records as PDF`);
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Downloading as CSV instead.');
        downloadAsCSV(data);
    }
}

// Simple PDF creation fallback
function createSimplePDF(data) {
    // For now, alert user that they need html2pdf library
    alert('PDF download requires additional library. Please download as CSV instead.');
}

// Load career stats percentages from Supabase career_info table
async function loadCareerStats() {
    // Define setText at the beginning to avoid initialization issues
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    try {
        const ready = await ensureSupabaseReady();
        if (!ready) {
            console.warn('Supabase not ready, skipping career stats');
            showCareerStatsError('Database connection not ready');
            return;
        }

        console.log('🔍 Fetching career stats...');
        
        // First get active alumni IDs
        const { data: activeAlumni, error: alumniError } = await window.supabase
            .from('alumni_profiles')
            .select('id')
            .eq('is_active', true);

        if (alumniError) {
            console.error('❌ Error fetching active alumni:', alumniError);
            // Try without is_active filter (column might not exist)
            const { data: allAlumni, error: allError } = await window.supabase
                .from('alumni_profiles')
                .select('id');
            
            if (allError) {
                showCareerStatsError(`Database error: ${allError.message}`);
                return;
            }
            activeAlumni = allAlumni;
        }

        const activeAlumniIds = (activeAlumni || []).map(a => a.id);
        const totalAlumni = activeAlumniIds.length;

        // Then get career info for active alumni - try flexible query
        const { data: careerData, error: careerError } = await window.supabase
            .from('career_info')
            .select('alumni_id, job_status, is_employed, open_for_mentorship, mentorship, industry')
            .in('alumni_id', activeAlumniIds);

        if (careerError) {
            console.warn('❌ Career info error:', careerError.message);
            // Show stats based on alumni count only
            setText('careerTotal', totalAlumni.toLocaleString());
            setText('careerEmployedPercent', '0%');
            setText('careerEmployedCount', `0 of ${totalAlumni}`);
            setText('careerMentorshipPercent', '0%');
            setText('careerMentorshipCount', `0 of ${totalAlumni}`);
            setText('careerTopIndustry', '—');
            setText('careerTopIndustryCount', '0 submissions');
            renderCareerStatusBars({ 'No Data': totalAlumni }, totalAlumni);
            return;
        }

        console.log(`✅ Found ${(careerData || []).length} career records`);
        
        const total = (careerData || []).length || totalAlumni;

        if (total === 0) {
            console.warn('⚠️ No career data found in database');
            showCareerStatsEmpty();
            return;
        }

        const industryCounts = {};
        let employedCount = 0;
        let mentorshipCount = 0;

        (careerData || []).forEach(d => {
            // Check is_employed (boolean) or job_status (text)
            const isEmployed = d.is_employed === true || 
                (d.job_status && /employ|self|freelan|working/i.test(d.job_status));
            if (isEmployed) {
                employedCount++;
            }

            // Check open_for_mentorship (boolean) or mentorship (text)
            const openMentorship = d.open_for_mentorship === true ||
                (d.mentorship && /yes|open/i.test(d.mentorship));
            if (openMentorship) {
                mentorshipCount++;
            }

            const key = (d.industry || '').trim();
            if (key) {
                industryCounts[key] = (industryCounts[key] || 0) + 1;
            }
        });

        const topIndustry = Object.entries(industryCounts).sort((a, b) => b[1] - a[1])[0] || ['—', 0];

        const employedPct = total ? Math.round((employedCount / total) * 100) : 0;
        const mentorshipPct = total ? Math.round((mentorshipCount / total) * 100) : 0;

        setText('careerTotal', totalAlumni.toLocaleString());
        setText('careerEmployedPercent', `${employedPct}%`);
        setText('careerEmployedCount', `${employedCount} of ${total}`);
        setText('careerMentorshipPercent', `${mentorshipPct}%`);
        setText('careerMentorshipCount', `${mentorshipCount} of ${total}`);
        setText('careerTopIndustry', topIndustry[0] || '—');
        setText('careerTopIndustryCount', `${topIndustry[1]} submission${topIndustry[1] === 1 ? '' : 's'}`);

        // Render status breakdown
        const statusCounts = {
            'Employed': employedCount,
            'Unemployed': total - employedCount,
            'Open for Mentorship': mentorshipCount
        };
        renderCareerStatusBars(statusCounts, total);

    } catch (err) {
        console.error('loadCareerStats error:', err);
        showCareerStatsError(err.message);
    }
}

// Show error message in career stats
function showCareerStatsError(message) {
    const container = document.getElementById('careerStatusChart');
    if (container) {
        container.innerHTML = `<div class="status-placeholder" style="color: #dc3545;">⚠️ ${message}</div>`;
    }
    
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    
    setText('careerTotal', '0');
    setText('careerEmployedPercent', '0%');
    setText('careerEmployedCount', '0 of 0');
    setText('careerMentorshipPercent', '0%');
    setText('careerMentorshipCount', '0 of 0');
    setText('careerTopIndustry', '—');
    setText('careerTopIndustryCount', '0 submissions');
}

// Show empty state for career stats
function showCareerStatsEmpty() {
    const container = document.getElementById('careerStatusChart');
    if (container) {
        container.innerHTML = '<div class="status-placeholder">No career data available yet.</div>';
    }
    
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    
    setText('careerTotal', '0');
    setText('careerEmployedPercent', '0%');
    setText('careerEmployedCount', '0 of 0');
    setText('careerMentorshipPercent', '0%');
    setText('careerMentorshipCount', '0 of 0');
    setText('careerTopIndustry', '—');
    setText('careerTopIndustryCount', '0 submissions');
}

// Render vertical bar chart for career status breakdown
function renderCareerStatusBars(statusCounts, total) {
    const container = document.getElementById('careerStatusChart');
    const legendContainer = document.getElementById('careerChartLegend');
    if (!container) return;

    container.innerHTML = '';
    if (legendContainer) legendContainer.innerHTML = '';

    if (!total) {
        container.innerHTML = '<div class="status-placeholder">No career data available yet.</div>';
        return;
    }

    const order = ['Employed', 'Self-Employed', 'Freelancer', 'Unemployed', 'Student', 'Career Break', 'Other'];
    const colors = [
        'linear-gradient(to top, #004AAD, #0066cc)',
        'linear-gradient(to top, #2e6edc, #5b8ee0)',
        'linear-gradient(to top, #FF6B35, #ff8c5a)',
        'linear-gradient(to top, #dc3545, #e8576a)',
        'linear-gradient(to top, #ffc107, #ffd454)',
        'linear-gradient(to top, #6f5ac8, #8a7cd8)',
        'linear-gradient(to top, #666, #888)'
    ];

    // Filter and prepare data
    const chartData = [];
    order.forEach((label, index) => {
        const count = statusCounts[label] || 0;
        if (count > 0) {
            chartData.push({ label, count, color: colors[index] });
        }
    });

    // Add any additional statuses not in order
    Object.entries(statusCounts).forEach(([label, count]) => {
        if (!order.includes(label) && count > 0) {
            chartData.push({ label, count, color: colors[6] });
        }
    });

    if (chartData.length === 0) {
        container.innerHTML = '<div class="status-placeholder">No career data yet.</div>';
        return;
    }

    // Find max for scaling
    const maxCount = Math.max(...chartData.map(d => d.count));
    const maxHeight = 220; // Max height in pixels

    // Render bars
    chartData.forEach(({ label, count, color }) => {
        const pct = total ? Math.round((count / total) * 100) : 0;
        const height = maxCount > 0 ? (count / maxCount) * maxHeight : 0;

        const barItem = document.createElement('div');
        barItem.className = 'career-bar-item';
        barItem.innerHTML = `
            <div class="career-bar" style="--bar-height: ${height}px; height: ${height}px; background: ${color};">
                <div class="career-bar-value">${pct}%</div>
            </div>
            <div class="career-bar-label">${label}<br>(${count})</div>
        `;
        container.appendChild(barItem);
    });

    // Render legend
    if (legendContainer) {
        chartData.forEach(({ label, count, color }) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'career-legend-item';
            legendItem.innerHTML = `
                <div class="career-legend-color" style="background: ${color}"></div>
                <span><strong>${label}:</strong> ${count}</span>
            `;
            legendContainer.appendChild(legendItem);
        });
    }
}