/* ============================================
   MESS MODULE — JSON Import & Daily Menu
   ============================================ */

const MessModule = (() => {
    const STORAGE_KEY = 'lnmiit_mess_menu';
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

    let menuData = null; // { Monday: { Breakfast: [...], Lunch: [...], ... }, ... }
    let viewingDayOffset = 0; // 0 = today

    function loadData() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                menuData = JSON.parse(stored);
                return true;
            }
        } catch (e) {
            console.error('Failed to load mess data:', e);
        }
        return false;
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(menuData));
        } catch (e) {
            console.error('Failed to save mess data:', e);
        }
    }

    function getViewingDay() {
        const d = new Date();
        d.setDate(d.getDate() + viewingDayOffset);
        return DAYS[d.getDay()];
    }

    function getViewingDayLabel() {
        if (viewingDayOffset === 0) return `Today — ${getViewingDay()}`;
        if (viewingDayOffset === 1) return `Tomorrow — ${getViewingDay()}`;
        if (viewingDayOffset === -1) return `Yesterday — ${getViewingDay()}`;
        return getViewingDay();
    }

    function getCurrentMeal() {
        const hour = new Date().getHours();
        if (hour >= 7 && hour < 10) return 'Breakfast';
        if (hour >= 12 && hour < 15) return 'Lunch';
        if (hour >= 16 && hour < 18) return 'Snacks';
        if (hour >= 19 && hour < 22) return 'Dinner';
        return null;
    }

    // ====== UI RENDERING ======

    function updateProgress(percent) {
        const bar = document.getElementById('mess-progress-bar');
        if (bar) bar.style.width = percent + '%';
    }

    function renderMealCard(mealName, items, isCurrent) {
        const mealIcons = {
            Breakfast: '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
            Lunch: '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
            Snacks: '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14l-1 11H6L5 9ZM8 9V7a4 4 0 0 1 8 0v2"/></svg>',
            Dinner: '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 16 0H4ZM12 4v2M4.9 6.9l1.4 1.4M19.1 6.9l-1.4 1.4"/></svg>'
        };

        const icon = mealIcons[mealName] || mealIcons.Lunch;
        const itemsHtml = items.length > 0
            ? `<ul class="meal-card-items">${items.map(item => `<li>${item}</li>`).join('')}</ul>`
            : '<p class="meal-card-empty">No items listed</p>';

        return `
            <div class="meal-card glass-card ${isCurrent ? 'current-meal' : ''}">
                <div class="meal-card-header">
                    <span class="meal-card-icon">${icon}</span>
                    <span class="meal-card-label">${mealName}</span>
                    ${isCurrent ? '<span class="meal-card-now">NOW</span>' : ''}
                </div>
                ${itemsHtml}
            </div>
        `;
    }

    function renderTodayMenu() {
        const container = document.getElementById('mess-today-container');
        const grid = document.getElementById('mess-meals-grid');
        const uploadArea = document.getElementById('mess-upload-area');
        const actions = document.getElementById('mess-actions');
        const dayLabel = document.getElementById('mess-current-day');

        if (!menuData) {
            container.classList.add('hidden');
            uploadArea.classList.remove('hidden');
            actions.classList.add('hidden');
            return;
        }

        const day = getViewingDay();
        const dayMenu = menuData[day];
        dayLabel.textContent = getViewingDayLabel();

        container.classList.remove('hidden');
        uploadArea.classList.add('hidden');
        actions.classList.remove('hidden');

        if (!dayMenu) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">📋</div>
                    <h3>No menu for ${day}</h3>
                    <p>The imported JSON may not contain data for this day</p>
                </div>
            `;
            return;
        }

        const currentMeal = viewingDayOffset === 0 ? getCurrentMeal() : null;
        let html = '';
        for (const meal of MEALS) {
            const items = dayMenu[meal] || [];
            html += renderMealCard(meal, items, meal === currentMeal);
        }
        grid.innerHTML = html;
    }

    function renderDashboard() {
        const body = document.getElementById('dash-mess-body');

        if (!menuData) {
            body.innerHTML = `
                <div class="empty-state-mini">
                    <p>No menu uploaded yet</p>
                    <span class="empty-hint">Tap to import menu JSON</span>
                </div>
            `;
            return;
        }

        const today = DAYS[new Date().getDay()];
        const dayMenu = menuData[today];
        const currentMeal = getCurrentMeal();

        if (!dayMenu) {
            body.innerHTML = `<div class="empty-state-mini"><p>No menu data for ${today}</p></div>`;
            return;
        }

        // Show current/next meal
        let targetMeal = currentMeal;
        if (!targetMeal) {
            const hour = new Date().getHours();
            if (hour < 7) targetMeal = 'Breakfast';
            else if (hour < 12) targetMeal = 'Lunch';
            else if (hour < 16) targetMeal = 'Snacks';
            else if (hour < 19) targetMeal = 'Dinner';
            else targetMeal = 'Breakfast'; // Tomorrow's breakfast (loosely)
        }

        const mealIcons = { Breakfast: '<svg class="line-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>', Lunch: '<svg class="line-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>', Snacks: '<svg class="line-icon" viewBox="0 0 24 24"><path d="M5 9h14l-1 11H6L5 9Z"/></svg>', Dinner: '<svg class="line-icon" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 16 0H4Z"/></svg>' };
        const items = dayMenu[targetMeal] || [];
        const label = currentMeal === targetMeal ? `${targetMeal} (Now)` : `Next: ${targetMeal}`;

        body.innerHTML = `
            <div class="dash-mess-preview">
                <div class="dash-mess-label">
                    <span class="meal-card-icon">${mealIcons[targetMeal] || mealIcons.Lunch}</span>
                    <span>${label}</span>
                </div>
                <div class="dash-mess-items">
                    ${items.length > 0
                        ? items.slice(0, 4).map(i => `<span class="dash-mess-item">${i}</span>`).join('')
                          + (items.length > 4 ? `<span class="dash-mess-more">+${items.length - 4} more</span>` : '')
                        : '<span class="dash-mess-item muted">No items</span>'
                    }
                </div>
            </div>
        `;
    }

    // ====== MANUAL EDIT ======

    function showManualEdit() {
        const editSection = document.getElementById('mess-edit-section');
        const container = document.getElementById('mess-edit-form-container');
        editSection.classList.remove('hidden');

        const data = menuData || {};
        let html = '';

        for (const day of DAYS.slice(1).concat(DAYS.slice(0, 1))) { // Monday first
            html += `<div class="edit-day-section glass-card">
                <h4 class="edit-day-title">${day}</h4>`;
            for (const meal of MEALS) {
                const items = (data[day] && data[day][meal]) ? data[day][meal].join(', ') : '';
                html += `
                    <div class="form-group">
                        <label for="edit-${day}-${meal}">${meal}</label>
                        <textarea id="edit-${day}-${meal}" class="form-input edit-textarea"
                            placeholder="Enter items separated by commas"
                            rows="2">${items}</textarea>
                    </div>
                `;
            }
            html += `</div>`;
        }

        html += `
            <div class="form-actions" style="margin-top:16px;">
                <button class="btn btn-ghost" id="edit-cancel-btn">Cancel</button>
                <button class="btn btn-primary" id="edit-save-btn">Save Menu</button>
            </div>
        `;

        container.innerHTML = html;

        document.getElementById('edit-save-btn').addEventListener('click', saveManualEdit);
        document.getElementById('edit-cancel-btn').addEventListener('click', () => {
            editSection.classList.add('hidden');
        });
    }

    function saveManualEdit() {
        const newData = {};

        for (const day of DAYS) {
            newData[day] = {};
            for (const meal of MEALS) {
                const textarea = document.getElementById(`edit-${day}-${meal}`);
                if (textarea) {
                    const items = textarea.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s.length > 0);
                    newData[day][meal] = items;
                }
            }
        }

        menuData = newData;
        saveData();

        document.getElementById('mess-edit-section').classList.add('hidden');
        renderTodayMenu();
        renderDashboard();

        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Menu saved successfully!', 'success');
        }
    }

    // ====== JSON IMPORT ======

    function normalizeMenuData(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('The JSON root must be an object of days.');
        }

        const normalized = {};
        for (const day of DAYS) {
            const dayMenu = value[day];
            if (!dayMenu || typeof dayMenu !== 'object' || Array.isArray(dayMenu)) {
                throw new Error(`Missing menu data for ${day}.`);
            }
            normalized[day] = {};
            for (const meal of MEALS) {
                if (!Array.isArray(dayMenu[meal]) || !dayMenu[meal].every(item => typeof item === 'string')) {
                    throw new Error(`${day} ${meal} must be an array of text items.`);
                }
                normalized[day][meal] = dayMenu[meal].map(item => item.trim()).filter(Boolean);
            }
        }
        return normalized;
    }

    async function handleFileUpload(file) {
        if (!file || (file.type !== 'application/json' && !file.name.toLowerCase().endsWith('.json'))) {
            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast('Please choose a JSON menu file.', 'error');
            }
            return;
        }

        const uploadZone = document.querySelector('.upload-zone');
        const uploadStatus = document.getElementById('mess-upload-status');
        const statusText = document.getElementById('mess-status-text');

        uploadZone.classList.add('hidden');
        uploadStatus.classList.remove('hidden');
        statusText.textContent = 'Reading menu JSON...';
        updateProgress(40);

        try {
            const parsedData = normalizeMenuData(JSON.parse(await file.text()));
            updateProgress(100);
            menuData = parsedData;
            saveData();

            statusText.textContent = 'Menu imported successfully!';

            setTimeout(() => {
                renderTodayMenu();
                renderDashboard();
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast(`Menu loaded successfully!`, 'success');
                }
            }, 1000);

        } catch (err) {
            console.error('Menu JSON import failed:', err);
            statusText.textContent = 'Import failed. Check the JSON format.';
            setTimeout(() => {
                uploadZone.classList.remove('hidden');
                uploadStatus.classList.add('hidden');
                updateProgress(0);
                showManualEdit();
            }, 2000);

            if (typeof App !== 'undefined' && App.showToast) {
                App.showToast(err instanceof Error ? err.message : 'Invalid menu JSON.', 'error');
            }
        }
    }

    function init() {
        const hasData = loadData();

        // File input
        const fileInput = document.getElementById('mess-file-input');
        const browseBtn = document.getElementById('mess-browse-btn');
        const uploadBtn = document.getElementById('mess-upload-btn');
        const dropZone = document.getElementById('mess-drop-zone');
        const copyPromptBtn = document.getElementById('copy-gemini-prompt');

        browseBtn.addEventListener('click', () => fileInput.click());
        uploadBtn.addEventListener('click', () => {
            if (menuData) {
                // Show upload area
                document.getElementById('mess-upload-area').classList.remove('hidden');
                document.getElementById('mess-today-container').classList.add('hidden');
                document.getElementById('mess-actions').classList.add('hidden');
                // Reset upload UI
                document.querySelector('.upload-zone').classList.remove('hidden');
                document.getElementById('mess-upload-status').classList.add('hidden');
                updateProgress(0);
            }
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
        dropZone.addEventListener('click', () => fileInput.click());

        copyPromptBtn.addEventListener('click', async () => {
            const prompt = document.getElementById('gemini-prompt-text').textContent;
            try {
                await navigator.clipboard.writeText(prompt);
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast('Gemini prompt copied!', 'success');
                }
            } catch (error) {
                console.error('Failed to copy Gemini prompt:', error);
                if (typeof App !== 'undefined' && App.showToast) {
                    App.showToast('Could not copy prompt. Select and copy it manually.', 'error');
                }
            }
        });

        // Day navigation
        document.getElementById('mess-prev-day').addEventListener('click', () => {
            viewingDayOffset--;
            renderTodayMenu();
        });
        document.getElementById('mess-next-day').addEventListener('click', () => {
            viewingDayOffset++;
            renderTodayMenu();
        });

        // Edit & Clear buttons
        document.getElementById('mess-edit-btn').addEventListener('click', showManualEdit);
        document.getElementById('mess-cancel-edit').addEventListener('click', () => {
            document.getElementById('mess-edit-section').classList.add('hidden');
        });
        document.getElementById('mess-clear-btn').addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.showModal) {
                App.showModal(
                    'Clear Menu Data?',
                    'This will delete all stored menu data. You can import a new JSON menu afterwards.',
                    [
                        { text: 'Cancel', class: 'btn btn-ghost', action: 'close' },
                        {
                            text: 'Clear', class: 'btn btn-primary', action: () => {
                                menuData = null;
                                localStorage.removeItem(STORAGE_KEY);
                                viewingDayOffset = 0;
                                renderTodayMenu();
                                renderDashboard();
                                App.showToast('Menu data cleared', 'info');
                            }
                        }
                    ]
                );
            }
        });

        // Initial render
        if (hasData) {
            renderTodayMenu();
        }
        renderDashboard();
    }

    return { init, renderFullView: renderTodayMenu, renderDashboard };
})();
