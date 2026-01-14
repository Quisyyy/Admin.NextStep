// ============================================================================
// Forgot Password - Admin
// ============================================================================
// Uses Supabase to send a password reset email
// Requires: supabase-client.js
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

async function handleForgotPassword(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    setStatus(statusEl, 'Sending reset link…');
    setBusy(btn, true);
    try {
        const email = form.email.value.trim();
        if (!email) throw new Error('Enter your email address.');

        // Use Supabase to send password reset email
        const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        if (error) throw new Error(error.message || 'Failed to send reset email.');
        setStatus(statusEl, '✅ Reset link sent! Check your email.', 'success');
    } catch (err) {
        setStatus(statusEl, err.message || 'Failed to send reset email.', 'error');
    } finally {
        setBusy(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);
});
