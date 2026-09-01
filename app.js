/* ============================================
   MAIN APP LOGIC — Navigation, Init, UI Utilities
   ============================================ */

const App = (() => {
    let currentView = 'dashboard';

    function initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const dashCards = document.querySelectorAll('.dash-card');

        // Bottom nav clicks
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const viewId = e.currentTarget.dataset.view;
                navigateTo(viewId);
            });
        });

        // Dashboard card clicks
        dashCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const viewId = e.currentTarget.dataset.nav;
                navigateTo(viewId);
            });
        });
    }

    function navigateTo(viewId) {
        // Update state
        currentView = viewId;

        // Update nav buttons
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            if (view.id === `${viewId}-view`) {
                view.classList.add('active');
                const scrollContainer = view.querySelector('.view-scroll');
                if (scrollContainer) scrollContainer.scrollTop = 0;
                
                // Trigger view-specific refreshes if needed
                if (viewId === 'dashboard') {
                    refreshDashboard();
                } else if (viewId === 'bus' && typeof BusModule !== 'undefined') {
                    BusModule.renderFullView();
                }
            } else {
                view.classList.remove('active');
            }
        });
        
        // Each view owns its scroll position because the app shell does not scroll.
    }

    function initHeader() {
        const greetingEl = document.getElementById('greeting');
        const dateEl = document.getElementById('current-date');
        
        // Greeting based on time
        const hour = new Date().getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 17) greeting = 'Good Afternoon';
        
        greetingEl.textContent = greeting;
        
        // Current date
        const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    function refreshDashboard() {
        if (typeof MessModule !== 'undefined') MessModule.renderDashboard();
        if (typeof TimetableModule !== 'undefined') TimetableModule.renderDashboard();
        if (typeof BusModule !== 'undefined') BusModule.renderDashboard();
    }

    // ====== UI UTILITIES ======

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px) translateX(-50%)';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    function showModal(title, text, actions = []) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');
        const actionsEl = document.getElementById('modal-actions');
        
        titleEl.textContent = title;
        bodyEl.innerHTML = `<p>${text}</p>`;
        
        actionsEl.innerHTML = '';
        
        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = act.class || 'btn btn-primary';
            btn.textContent = act.text;
            btn.addEventListener('click', () => {
                if (act.action === 'close') {
                    closeModal();
                } else if (typeof act.action === 'function') {
                    act.action();
                    closeModal();
                }
            });
            actionsEl.appendChild(btn);
        });
        
        overlay.classList.remove('hidden');
        
        // Close button in header
        document.getElementById('modal-close').onclick = closeModal;
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
    }
    
    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    // ====== SERVICE WORKER REGISTRATION ======
    
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('SW registered:', registration);
                    })
                    .catch(error => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    }

    // ====== SETTINGS LOGIC ======
    
    function initSettings() {
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal-overlay');
        const settingsClose = document.getElementById('settings-close');
        const settingsSave = document.getElementById('settings-save');
        const themeToggleBtns = document.querySelectorAll('#theme-toggle .toggle-btn');
        // Load existing settings
        const currentTheme = localStorage.getItem('lnmiit_theme') || 'light';
        
        applyTheme(currentTheme);
        
        // Update theme toggle UI
        themeToggleBtns.forEach(btn => {
            if (btn.dataset.theme === currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Theme toggle clicks
        themeToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                themeToggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Open modal
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });

        // Close modal
        settingsClose.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });

        // Save settings
        settingsSave.addEventListener('click', () => {
            const selectedTheme = document.querySelector('#theme-toggle .toggle-btn.active').dataset.theme;
            
            localStorage.setItem('lnmiit_theme', selectedTheme);
            
            applyTheme(selectedTheme);
            settingsModal.classList.add('hidden');
            showToast('Settings saved!', 'success');
        });
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#000000');
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.querySelector('meta[name="theme-color"]').setAttribute('content', '#f2f2f7');
        }
    }

    // ====== INITIALIZATION ======

    function init() {
        // Init settings and theme
        initSettings();
        
        // Init header (greeting & date)
        initHeader();
        
        // Init navigation
        initNavigation();
        
        // Init modules
        if (typeof MessModule !== 'undefined') MessModule.init();
        if (typeof TimetableModule !== 'undefined') TimetableModule.init();
        if (typeof BusModule !== 'undefined') BusModule.init();
        
        // Hide splash screen after initialization
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.classList.add('hidden');
                document.getElementById('app').classList.remove('hidden');
                
                // Update header date periodically (every hour)
                setInterval(initHeader, 3600000);
            }, 500); // Wait for fade transition
        }, 1200); // Initial display time
        
        // Register PWA Service Worker
        registerServiceWorker();
    }

    return { 
        init, 
        showToast, 
        showModal,
        refreshDashboard 
    };
})();

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
