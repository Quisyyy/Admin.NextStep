// ============================================================================
// Admin Login - Integrates with Supabase RLS Policies
// ============================================================================
// Uses DatabaseHelper (db-helper.js) to handle authentication
// Works with: admins_select_own policy (to find email by employee ID)
// 
// SETUP: Include db-helper.js and supabase-client.js in your HTML
// ============================================================================

function setStatus(el, msg, type = 'info') {
    if (!el) return;
    el.textContent = msg || '';
    el.className = `status ${type}`;
    el.style.display = msg ? 'block' : 'none';
}

function setBusy(btn, busy) {
    if (!btn) return;
    btn.disabled = !!busy;
    btn.dataset.loading = busy ? '1' : '';
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Signing in…');
    setBusy(btn, true);
    try {
        const employeeId = form.employeeId.value.trim();
        const password = form.password.value;

        if (!employeeId || !password) {
            throw new Error('Enter your Employee ID and Password.');
        }

        // Use DatabaseHelper to login
        const result = await window.DatabaseHelper.loginAdmin(employeeId, password);
        
        if (!result.success) {
            throw new Error(result.error || 'Login failed');
        }

        setStatus(statusEl, '✅ Signed in. Redirecting…', 'success');
        setTimeout(() => { window.location.href = '../homepage.html'; }, 600);
    } catch (err) {
        setStatus(statusEl, err.message || 'Login failed', 'error');
    } finally {
        setBusy(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
});