// ============================================================================
// Admin Registration - Integrates with Supabase RLS Policies
// ============================================================================
// Uses DatabaseHelper (db-helper.js) to handle account creation
// Works with: admins_insert policy (creates auth user + admin record)
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

async function handleCreateAccount(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Creating account…');
    setBusy(btn, true);
    try {
        const fullName = form.fullName.value.trim();
        const employeeId = form.employeeId.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;

        // Use DatabaseHelper to register
        const result = await window.DatabaseHelper.registerAdmin(
            email,
            password,
            fullName,
            employeeId
        );

        if (!result.success) {
            throw new Error(result.error || 'Account creation failed');
        }

        setStatus(statusEl, '✅ Account created! Please check your email and confirm your address before logging in.', 'success');
        form.reset();
    } catch (err) {
        setStatus(statusEl, err.message || 'Account creation failed', 'error');
    } finally {
        setBusy(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('admin-register-form');
    if (form) form.addEventListener('submit', handleCreateAccount);
});