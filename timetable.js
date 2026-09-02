/* ============================================
   TIMETABLE MODULE — Classes & Labs
   Manual Entry & localStorage
   ============================================ */

const TimetableModule = (() => {
    const CLASS_STORAGE_KEY = 'lnmiit_classes';
    const LAB_STORAGE_KEY = 'lnmiit_labs';
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const CLASS_DAY_GROUPS = {
        MWF: ['Monday', 'Wednesday', 'Friday'],
        TTH: ['Tuesday', 'Thursday']
    };

    let classData = [];
    let labData = [];

    let currentClassDay = 'today';
    let currentLabDay = 'today';

    function loadData() {
        try {
            const storedClasses = localStorage.getItem(CLASS_STORAGE_KEY);
            if (storedClasses) classData = JSON.parse(storedClasses);

            const storedLabs = localStorage.getItem(LAB_STORAGE_KEY);
            if (storedLabs) labData = JSON.parse(storedLabs);
        } catch (e) {
            console.error('Failed to load timetable data:', e);
        }
    }

    function saveData(type) {
        try {
            if (type === 'class') {
                localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classData));
            } else if (type === 'lab') {
                localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(labData));
            }
        } catch (e) {
            console.error('Failed to save timetable data:', e);
        }
    }

    function generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // ====== UTILS ======

    function formatTimeDisplay(timeStr) {
        // timeStr is like "14:30"
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${m} ${ampm}`;
    }

    function isTimeNow(startStr, endStr) {
        if (!startStr || !endStr) return false;
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [sh, sm] = startStr.split(':').map(Number);
        const startMinutes = sh * 60 + sm;

        const [eh, em] = endStr.split(':').map(Number);
        const endMinutes = eh * 60 + em;

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
    
    function parseToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    function classEntryMatchesDay(entry, day) {
        if (entry.day === day) return true;
        if (CLASS_DAY_GROUPS[day]?.includes(entry.day)) return true;
        return CLASS_DAY_GROUPS[entry.day]?.includes(day) || false;
    }

    // ====== RENDERING ======

    function renderEntry(entry, type) {
        const isNow = isTimeNow(entry.start, entry.end) && (currentClassDay === 'today' || currentLabDay === 'today');
        
        let detailHtml = '';
        if (type === 'class') {
            const parts = [];
            if (entry.room) parts.push(entry.room);
            if (entry.professor) parts.push(entry.professor);
            detailHtml = parts.join(' • ');
        } else {
            const parts = [];
            if (entry.room) parts.push(entry.room);
            if (entry.batch) parts.push(entry.batch);
            detailHtml = parts.join(' • ');
        }

        return `
            <div class="schedule-entry glass-card ${isNow ? 'ongoing' : ''}">
                <div class="schedule-entry-time">
                    <span class="time-start">${formatTimeDisplay(entry.start)}</span>
                    <span class="time-dash">|</span>
                    <span class="time-end">${formatTimeDisplay(entry.end)}</span>
                </div>
                <div class="schedule-entry-info">
                    <div class="schedule-entry-subject">${entry.subject}</div>
                    <div class="schedule-entry-detail">${detailHtml}</div>
                </div>
                <div class="schedule-entry-actions">
                    <button class="entry-action-btn edit" data-id="${entry.id}" data-type="${type}" aria-label="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="entry-action-btn delete" data-id="${entry.id}" data-type="${type}" aria-label="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    }

    function renderList(type) {
        const isClass = type === 'class';
        const data = isClass ? classData : labData;
        const currentTab = isClass ? currentClassDay : currentLabDay;
        const listEl = document.getElementById(isClass ? 'class-list' : 'lab-list');
        
        let targetDay = currentTab;
        if (targetDay === 'today') {
            targetDay = DAYS[new Date().getDay()];
        }

        // Filter and sort
        const filtered = data
            .filter(e => isClass ? classEntryMatchesDay(e, targetDay) : e.day === targetDay)
            .sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));

        if (filtered.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><svg class="line-icon line-icon-xl" viewBox="0 0 24 24"><path d="${isClass ? 'M4 5a3 3 0 0 1 3-3h5v19H7a3 3 0 0 0-3 3V5ZM20 5a3 3 0 0 0-3-3h-5v19h5a3 3 0 0 1 3 3V5Z' : 'M9 3h6M10 3v7l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3' }"/></svg></div>
                    <h3>No ${isClass ? 'classes' : 'lab sessions'}</h3>
                    <p>${targetDay === DAYS[new Date().getDay()] && currentTab === 'today' ? "You're free today!" : `No schedule added for ${targetDay}.`}</p>
                </div>
            `;
        } else {
            listEl.innerHTML = filtered.map(e => renderEntry(e, type)).join('');
            
            // Attach listeners to new buttons
            listEl.querySelectorAll('.edit').forEach(btn => {
                btn.addEventListener('click', (e) => editEntry(e.currentTarget.dataset.id, type));
            });
            listEl.querySelectorAll('.delete').forEach(btn => {
                btn.addEventListener('click', (e) => confirmDelete(e.currentTarget.dataset.id, type));
            });
        }
    }

    function renderDashboard() {
        const today = DAYS[new Date().getDay()];
        
        // Classes
        const classBody = document.getElementById('dash-classes-body');
        const todayClasses = classData
            .filter(e => classEntryMatchesDay(e, today))
            .sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));
            
        if (todayClasses.length === 0) {
            classBody.innerHTML = `
                <div class="empty-state-mini">
                    <p>No classes today</p>
                    <span class="empty-hint">Enjoy your free time!</span>
                </div>
            `;
        } else {
            // Find current or next
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
            let nextClass = todayClasses.find(c => parseToMinutes(c.end) > nowMin); // First class that hasn't ended
            
            if (nextClass) {
                const isNow = isTimeNow(nextClass.start, nextClass.end);
                classBody.innerHTML = `
                    <div class="dash-schedule-preview ${isNow ? 'ongoing' : ''}">
                        <div class="dash-schedule-time">${formatTimeDisplay(nextClass.start)}</div>
                        <div class="dash-schedule-details">
                            <div class="dash-schedule-title">${nextClass.subject}</div>
                            <div class="dash-schedule-meta">${nextClass.room || ''}</div>
                        </div>
                        <div class="dash-schedule-status">${isNow ? 'NOW' : 'NEXT'}</div>
                    </div>
                `;
            } else {
                classBody.innerHTML = `<div class="empty-state-mini"><p>All classes finished for today</p></div>`;
            }
        }

        // Labs
        const labBody = document.getElementById('dash-labs-body');
        const todayLabs = labData
            .filter(e => e.day === today)
            .sort((a, b) => parseToMinutes(a.start) - parseToMinutes(b.start));
            
        if (todayLabs.length === 0) {
            labBody.innerHTML = `
                <div class="empty-state-mini">
                    <p>No labs today</p>
                </div>
            `;
        } else {
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
            let nextLab = todayLabs.find(l => parseToMinutes(l.end) > nowMin);
            
            if (nextLab) {
                const isNow = isTimeNow(nextLab.start, nextLab.end);
                labBody.innerHTML = `
                    <div class="dash-schedule-preview ${isNow ? 'ongoing' : ''}">
                        <div class="dash-schedule-time">${formatTimeDisplay(nextLab.start)}</div>
                        <div class="dash-schedule-details">
                            <div class="dash-schedule-title">${nextLab.subject}</div>
                            <div class="dash-schedule-meta">${nextLab.room || ''}</div>
                        </div>
                        <div class="dash-schedule-status">${isNow ? 'NOW' : 'NEXT'}</div>
                    </div>
                `;
            } else {
                labBody.innerHTML = `<div class="empty-state-mini"><p>All labs finished for today</p></div>`;
            }
        }
    }

    // ====== CRUD ======

    function showForm(type, id = null) {
        const isClass = type === 'class';
        const formCard = document.getElementById(isClass ? 'class-form-card' : 'lab-form-card');
        const title = document.getElementById(isClass ? 'class-form-title' : 'lab-form-title');
        const form = document.getElementById(isClass ? 'class-form' : 'lab-form');
        
        form.reset();
        
        if (id) {
            const data = isClass ? classData : labData;
            const entry = data.find(e => e.id === id);
            if (entry) {
                title.textContent = isClass ? 'Edit Class' : 'Edit Lab';
                document.getElementById(`${type}-edit-id`).value = entry.id;
                document.getElementById(`${type}-day`).value = entry.day;
                document.getElementById(`${type}-start`).value = entry.start;
                document.getElementById(`${type}-end`).value = entry.end;
                document.getElementById(`${type}-subject`).value = entry.subject;
                document.getElementById(`${type}-room`).value = entry.room || '';
                
                if (isClass) {
                    document.getElementById(`class-professor`).value = entry.professor || '';
                } else {
                    document.getElementById(`lab-batch`).value = entry.batch || '';
                }
            }
        } else {
            title.textContent = isClass ? 'Add New Class' : 'Add New Lab';
            document.getElementById(`${type}-edit-id`).value = '';
            // Default to currently viewed day if not 'today'
            const currentTab = isClass ? currentClassDay : currentLabDay;
            if (currentTab !== 'today') {
                document.getElementById(`${type}-day`).value = currentTab;
            } else {
                const today = DAYS[new Date().getDay()];
                document.getElementById(`${type}-day`).value = isClass
                    ? Object.keys(CLASS_DAY_GROUPS).find(group => CLASS_DAY_GROUPS[group].includes(today)) || today
                    : today;
            }
        }
        
        formCard.classList.remove('hidden');
        formCard.scrollIntoView({ behavior: 'smooth' });
    }

    function hideForm(type) {
        document.getElementById(type === 'class' ? 'class-form-card' : 'lab-form-card').classList.add('hidden');
    }

    function saveEntry(type, e) {
        e.preventDefault();
        
        const idInput = document.getElementById(`${type}-edit-id`).value;
        const entry = {
            id: idInput || generateId(),
            day: document.getElementById(`${type}-day`).value,
            start: document.getElementById(`${type}-start`).value,
            end: document.getElementById(`${type}-end`).value,
            subject: document.getElementById(`${type}-subject`).value,
            room: document.getElementById(`${type}-room`).value
        };

        if (type === 'class') {
            entry.professor = document.getElementById(`class-professor`).value;
            
            if (idInput) {
                const idx = classData.findIndex(c => c.id === idInput);
                if (idx !== -1) classData[idx] = entry;
            } else {
                classData.push(entry);
            }
            saveData('class');
            
            // Switch tab to the day we just added/edited
            currentClassDay = entry.day;
            updateTabs('class');
            
        } else {
            entry.batch = document.getElementById(`lab-batch`).value;
            
            if (idInput) {
                const idx = labData.findIndex(l => l.id === idInput);
                if (idx !== -1) labData[idx] = entry;
            } else {
                labData.push(entry);
            }
            saveData('lab');
            
            // Switch tab to the day we just added/edited
            currentLabDay = entry.day;
            updateTabs('lab');
        }

        hideForm(type);
        renderList(type);
        renderDashboard();
        
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast(`${type === 'class' ? 'Class' : 'Lab'} saved successfully`, 'success');
        }
    }

    function editEntry(id, type) {
        showForm(type, id);
    }

    function confirmDelete(id, type) {
        if (typeof App !== 'undefined' && App.showModal) {
            const data = type === 'class' ? classData : labData;
            const entry = data.find(e => e.id === id);
            
            if (!entry) return;
            
            App.showModal(
                'Delete Entry',
                `Are you sure you want to delete "${entry.subject}"?`,
                [
                    { text: 'Cancel', class: 'btn btn-ghost', action: 'close' },
                    { text: 'Delete', class: 'btn btn-danger-outline', action: () => deleteEntry(id, type) }
                ]
            );
        } else {
            if (confirm('Are you sure you want to delete this entry?')) {
                deleteEntry(id, type);
            }
        }
    }

    function deleteEntry(id, type) {
        if (type === 'class') {
            classData = classData.filter(e => e.id !== id);
            saveData('class');
        } else {
            labData = labData.filter(e => e.id !== id);
            saveData('lab');
        }
        
        renderList(type);
        renderDashboard();
        
        if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Entry deleted', 'info');
        }
    }

    function updateTabs(type) {
        const isClass = type === 'class';
        const current = isClass ? currentClassDay : currentLabDay;
        const tabsId = isClass ? 'class-day-tabs' : 'lab-day-tabs';
        
        document.querySelectorAll(`#${tabsId} .day-tab`).forEach(tab => {
            if (tab.dataset.day === current) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    function init() {
        loadData();

        // Classes Events
        document.getElementById('class-add-btn').addEventListener('click', () => showForm('class'));
        document.getElementById('class-form-cancel').addEventListener('click', () => hideForm('class'));
        document.getElementById('class-form').addEventListener('submit', (e) => saveEntry('class', e));

        document.querySelectorAll('#class-day-tabs .day-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                currentClassDay = e.target.dataset.day;
                updateTabs('class');
                renderList('class');
            });
        });

        // Labs Events
        document.getElementById('lab-add-btn').addEventListener('click', () => showForm('lab'));
        document.getElementById('lab-form-cancel').addEventListener('click', () => hideForm('lab'));
        document.getElementById('lab-form').addEventListener('submit', (e) => saveEntry('lab', e));

        document.querySelectorAll('#lab-day-tabs .day-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                currentLabDay = e.target.dataset.day;
                updateTabs('lab');
                renderList('lab');
            });
        });

        // Initial render
        renderList('class');
        renderList('lab');
        renderDashboard();
    }

    return { init, renderDashboard };
})();
