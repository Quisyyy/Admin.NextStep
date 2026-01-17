// ============================================================================
// Reset Password - Admin
// ============================================================================
// Uses Supabase to update the user's password after clicking the reset link
// Requires: supabase-client.js
// ============================================================================

let isSessionValid = false;

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

// Wait for Supabase client to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase && window.supabaseClientReady) {
            resolve(window.supabase);
        } else {
            const checkInterval = setInterval(() => {
                if (window.supabase && window.supabaseClientReady) {
                    clearInterval(checkInterval);
                    resolve(window.supabase);
                }
            }, 100);
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(window.supabase || null);
            }, 5000);
        }
    });
}

// Handle the recovery token from URL (Supabase sends this in the reset link)
async function handleRecoverySession() {
    const statusEl = document.querySelector('.status');
    
    try {
        await waitForSupabase();
        
        if (!window.supabase) {
            setStatus(statusEl, '❌ Supabase not initialized. Please refresh the page.', 'error');
            return false;
        }

        // Check URL hash for recovery tokens (Supabase format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (alternative format)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromQuery = urlParams.get('token');
        const typeFromQuery = urlParams.get('type');

        console.log('Reset password - checking tokens:', { 
            hashType: type, 
            hasAccessToken: !!accessToken,
            queryType: typeFromQuery,
            hasQueryToken: !!tokenFromQuery
        });

        // If we have hash tokens (recovery type), set the session
        if (accessToken && type === 'recovery') {
            console.log('Setting session from recovery tokens...');
            const { data, error } = await window.supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });

            if (error) {
                console.error('Session error:', error);
                setStatus(statusEl, '❌ Invalid or expired reset link. Please request a new one.', 'error');
                return false;
            }

            console.log('Session set successfully:', data.user?.email);
            // Clear the hash from URL for cleaner look (optional)
            window.history.replaceState(null, '', window.location.pathname);
            return true;
        }

        // Check if user already has a valid session
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            console.log('Existing session found:', session.user?.email);
            return true;
        }

        // No valid session found
        console.log('No valid session or recovery token found');
        setStatus(statusEl, '❌ Auth session missing! Please use the link from your email, or request a new reset link.', 'error');
        return false;

    } catch (err) {
        console.error('Recovery session error:', err);
        setStatus(statusEl, '❌ Error processing reset link: ' + err.message, 'error');
        return false;
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const statusEl = form.querySelector('.status');
    const btn = form.querySelector('button[type="submit"]');

    // Check if session is valid before attempting reset
    if (!isSessionValid) {
        setStatus(statusEl, '❌ Auth session missing! Please use the link from your email.', 'error');
        return;
    }

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
        
        // Sign out after password reset so user logs in fresh
        await window.supabase.auth.signOut();
        
        setStatus(statusEl, '✅ Password reset successfully! Redirecting to login...', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    } catch (err) {
        setStatus(statusEl, '❌ ' + (err.message || 'Failed to reset password.'), 'error');
    } finally {
        setBusy(btn, false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) resetForm.addEventListener('submit', handleResetPassword);

    // Process the recovery session from the reset link
    isSessionValid = await handleRecoverySession();
    
    // Disable form if no valid session
    if (!isSessionValid && resetForm) {
        const btn = resetForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
    }

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
