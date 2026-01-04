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

        // Get all alumni profiles
        const {
            data: profiles,
            error
        } = await window.supabase
            .from('alumni_profiles')
            .select('*');

        if (error) {
            console.error('Error fetching alumni data:', error);
            return;
        }

        console.log('Loaded alumni profiles:', profiles.length);

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

        // Update card numbers
        animateNumber(document.getElementById('card-total'), 0, total, 1000);
        animateNumber(document.getElementById('card-status'), 0, total, 1000);
        animateNumber(document.getElementById('card-education'), 0, total, 1000);
        animateNumber(document.getElementById('card-jobs'), 0, total, 1000);
        document.getElementById('card-effectiveness').textContent = total > 0 ? '85%' : '0%';
        animateNumber(document.getElementById('card-engagement'), 0, total, 1000);

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

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    // Load real data
    loadDashboardData();

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
        if (filter === 'active') {
            filteredData = profiles.filter(p => p.status === 'active' || !p.status);
        } else if (filter === 'incomplete') {
            filteredData = profiles.filter(p => !p.full_name || !p.email || !p.degree);
        }
        
        console.log('Filtered data:', filteredData.length, filteredData);
        
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
        alert('❌ No data to download. Please add alumni records first.\n\nTo add test data:\n1. Go to Supabase SQL Editor\n2. Run the contents of add-sample-data.sql');
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
    link.setAttribute('download', `alumni_data_${new Date().toISOString().split('T')[0]}.csv`);
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