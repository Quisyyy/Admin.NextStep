// User Menu JavaScript
// Handles user menu interactions and dropdown functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 User menu initialized');
    
    const userIcon = document.querySelector('.user-icon');
    
    if (userIcon) {
        // Add click handler for user menu
        userIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle user menu dropdown (if exists)
            const existingMenu = document.querySelector('.user-dropdown');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }
            
            // Create dropdown menu
            const dropdown = document.createElement('div');
            dropdown.className = 'user-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 150px;
                z-index: 1000;
                margin-top: 5px;
            `;
            
            dropdown.innerHTML = `
                <div style="padding: 8px 0;">
                    <a href="homepage.html" style="display: block; padding: 8px 16px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                        🏠 Dashboard
                    </a>
                    <a href="alumlist.html" style="display: block; padding: 8px 16px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                        👥 Alumni List
                    </a>
                    <a href="archive.html" style="display: block; padding: 8px 16px; text-decoration: none; color: #333; border-bottom: 1px solid #eee;">
                        📦 Archive
                    </a>
                    <button onclick="logout()" style="display: block; width: 100%; padding: 8px 16px; text-align: left; background: none; border: none; color: #dc3545; cursor: pointer;">
                        🚪 Logout
                    </button>
                </div>
            `;
            
            // Position relative to user icon
            const headerRight = userIcon.closest('.header-right');
            if (headerRight) {
                headerRight.style.position = 'relative';
                headerRight.appendChild(dropdown);
            }
            
            // Close dropdown when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown() {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                });
            }, 100);
        });
    }
});