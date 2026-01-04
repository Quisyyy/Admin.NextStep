// Logout functionality with custom confirmation modal

// Create logout modal HTML
function createLogoutModal() {
    const modal = document.createElement('div');
    modal.id = 'logout-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        justify-content: center;
        align-items: center;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 90%;
        ">
            <h2 style="
                margin: 0 0 30px 0;
                color: #333;
                font-size: 24px;
                font-weight: 600;
            ">Do you want to Log Out?</h2>
            
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="logout-confirm" style="
                    padding: 12px 30px;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.3s;
                ">Log Out</button>
                
                <button id="logout-cancel" style="
                    padding: 12px 30px;
                    background: white;
                    color: #0066cc;
                    border: 2px solid #0066cc;
                    border-radius: 5px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                ">No</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Show logout modal
function showLogoutModal() {
    let modal = document.getElementById('logout-modal');
    
    if (!modal) {
        modal = createLogoutModal();
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
    
    // Add event listeners
    const confirmBtn = document.getElementById('logout-confirm');
    const cancelBtn = document.getElementById('logout-cancel');
    
    confirmBtn.onclick = performLogout;
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };
}

// Perform actual logout
async function performLogout() {
    try {
        console.log('🔓 Logging out...');
        
        // Wait for Supabase to be ready
        let attempts = 0;
        while (!window.supabase && attempts < 10) {
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }

        if (window.supabase) {
            // Sign out from Supabase
            await window.supabase.auth.signOut();
            console.log('✅ Logged out successfully');
        }

        // Redirect to login page
        window.location.href = '../index.html';
        
    } catch (err) {
        console.error('Logout error:', err);
        // Still redirect on error
        window.location.href = '../index.html';
    }
}

// Attach logout handler when page loads
document.addEventListener('DOMContentLoaded', () => {
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        userIcon.addEventListener('click', showLogoutModal);
        userIcon.style.cursor = 'pointer';
        userIcon.title = 'Click to logout';
    }
});

