// ============================================================================
// Reset Password - Admin
// ============================================================================
// Uses Supabase to update the user's password after clicking the reset link
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

async function handleResetPassword(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Validate passwords match
    if (!password) {
        setStatus(statusEl, 'Enter a new password.', 'error');
        return;
    }
    if (password !== confirmPassword) {
        setStatus(statusEl, 'Passwords do not match.', 'error');
        return;
    }
    if (password.length < 6) {
        setStatus(statusEl, 'Password must be at least 6 characters.', 'error');
        return;
    }

    setStatus(statusEl, 'Resetting password…');
    setBusy(btn, true);
    try {
        // Use Supabase to update password (user must be authenticated via reset link)
        const { error } = await window.supabase.auth.updateUser({ password });
        if (error) throw new Error(error.message || 'Failed to reset password.');
        setStatus(statusEl, '✅ Password reset! You can now log in.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } catch (err) {
        setStatus(statusEl, err.message || 'Failed to reset password.', 'error');
    } finally {
        setBusy(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirm');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');

    if (togglePassword) {
        togglePassword.addEventListener('click', (e) => {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }

    if (toggleConfirm) {
        toggleConfirm.addEventListener('click', (e) => {
            e.preventDefault();
            const type = confirmInput.type === 'password' ? 'text' : 'password';
            confirmInput.type = type;
            toggleConfirm.textContent = type === 'password' ? 'Show' : 'Hide';
        });
    }
});
