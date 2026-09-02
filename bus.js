/* ============================================
   BUS MODULE — LNMIIT Bus Schedule
   Pre-loaded from lnmiit.ac.in/transportation
   ============================================ */

const BusModule = (() => {
    // Bus schedule data from LNMIIT website (effective October 31, 2025)
    const weekdaySchedule = [
        { busNo: '1', from: 'LNMIIT', to: 'Raja Park', time: '06:00 AM', days: 'Monday to Friday' },
        { busNo: '1', from: 'Raja Park', to: 'LNMIIT', time: '07:00 AM', days: 'Monday to Friday' },
        { busNo: '2', from: 'LNMIIT', to: 'Ajmeri Gate', time: '07:00 AM', days: 'Monday to Friday' },
        { busNo: '2', from: 'Ajmeri Gate', to: 'LNMIIT', time: '08:00 AM', days: 'Monday to Friday' },
        { busNo: '3', from: 'LNMIIT', to: 'Ajmeri Gate', time: '07:00 AM', days: 'Monday' },
        { busNo: '3', from: 'Ajmeri Gate', to: 'LNMIIT', time: '08:00 AM', days: 'Monday' },
        { busNo: '4', from: 'LNMIIT', to: 'Raja Park', time: '10:00 AM', days: 'Monday to Friday' },
        { busNo: '4', from: 'Raja Park', to: 'LNMIIT', time: '11:00 AM', days: 'Monday to Friday' },
        { busNo: '2', from: 'LNMIIT', to: 'Raja Park', time: '02:00 PM', days: 'Monday to Friday' },
        { busNo: '2', from: 'Raja Park', to: 'LNMIIT', time: '04:00 PM', days: 'Monday to Friday' },
        { busNo: '3', from: 'LNMIIT', to: 'Raja Park', time: '04:30 PM', days: 'Monday to Friday' },
        { busNo: '1', from: 'LNMIIT', to: 'Ajmeri Gate', time: '06:05 PM', days: 'Monday to Friday' },
        { busNo: '2', from: 'LNMIIT', to: 'Ajmeri Gate', time: '06:45 PM', days: 'Monday to Friday' },
        { busNo: '3', from: 'Raja Park', to: 'LNMIIT', time: '05:30 PM', days: 'Friday' },
        { busNo: '3', from: 'LNMIIT', to: 'Raja Park', time: '07:30 PM', days: 'Friday' },
        { busNo: '1', from: 'Ajmeri Gate', to: 'LNMIIT', time: '08:15 PM', days: 'Monday to Friday' },
        { busNo: '3', from: 'Raja Park', to: 'LNMIIT', time: '09:00 PM', days: 'Monday to Friday' },
        { busNo: '2', from: 'Ajmeri Gate', to: 'LNMIIT', time: '09:00 PM', days: 'Monday to Friday' },
    ];

    const weekendSchedule = [
        { busNo: '1', from: 'LNMIIT', to: 'Ajmeri Gate', time: '07:00 AM' },
        { busNo: '1', from: 'Ajmeri Gate', to: 'LNMIIT', time: '08:00 AM' },
        { busNo: '2', from: 'LNMIIT', to: 'Raja Park', time: '10:00 AM' },
        { busNo: '2', from: 'Raja Park', to: 'LNMIIT', time: '12:00 PM' },
        { busNo: '3', from: 'LNMIIT', to: 'Raja Park', time: '01:00 PM' },
        { busNo: '3', from: 'Raja Park', to: 'LNMIIT', time: '03:00 PM' },
        { busNo: '2', from: 'LNMIIT', to: 'Raja Park', time: '04:00 PM' },
        { busNo: '3', from: 'LNMIIT', to: 'Ajmeri Gate', time: '04:30 PM' },
        { busNo: '1', from: 'LNMIIT', to: 'Raja Park', time: '05:00 PM' },
        { busNo: '2', from: 'Raja Park', to: 'LNMIIT', time: '05:15 PM' },
        { busNo: '2', from: 'LNMIIT', to: 'Ajmeri Gate', time: '06:00 PM' },
        { busNo: '3', from: 'Ajmeri Gate', to: 'LNMIIT', time: '08:15 PM' },
        { busNo: '1', from: 'Raja Park', to: 'LNMIIT', time: '09:00 PM' },
        { busNo: '2', from: 'Ajmeri Gate', to: 'LNMIIT', time: '09:00 PM' },
    ];

    let currentFilter = 'all';
    let currentType = null; // will be auto-detected
    let countdownInterval = null;

    function parseTime(timeStr) {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|Noon)/i);
        if (!match) return 0;
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();

        if (period === 'NOON') return 12 * 60 + minutes;
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }

    function formatCountdown(diffMinutes) {
        if (diffMinutes < 1) return 'Departing now!';
        if (diffMinutes < 60) return `in ${Math.ceil(diffMinutes)} min`;
        const hrs = Math.floor(diffMinutes / 60);
        const mins = Math.ceil(diffMinutes % 60);
        return `in ${hrs}h ${mins}m`;
    }

    function isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    }

    function getTodayDayName() {
        return new Date().toLocaleDateString('en-US', { weekday: 'long' });
    }

    function isApplicableToday(entry) {
        if (!entry.days) return true; // Weekend schedule has no days field
        const today = getTodayDayName();
        const days = entry.days;
        if (days === 'Monday to Friday') return !isWeekend();
        return days.includes(today);
    }

    function getCurrentSchedule() {
        if (currentType === 'weekend') return weekendSchedule;
        if (currentType === 'weekday') return weekdaySchedule;
        return isWeekend() ? weekendSchedule : weekdaySchedule;
    }

    function getFilteredSchedule() {
        let schedule = getCurrentSchedule();
        if (currentFilter === 'from-lnmiit') {
            schedule = schedule.filter(e => e.from === 'LNMIIT');
        } else if (currentFilter === 'to-lnmiit') {
            schedule = schedule.filter(e => e.to === 'LNMIIT');
        }
        // For weekday schedule, also filter by applicable days
        if (currentType !== 'weekend') {
            schedule = schedule.filter(isApplicableToday);
        }
        return schedule;
    }

    function getNowMinutes() {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    }

    function findNextBus(schedule) {
        const nowMin = getNowMinutes();
        let nextBus = null;
        let minDiff = Infinity;

        for (const entry of schedule) {
            const busMin = parseTime(entry.time);
            const diff = busMin - nowMin;
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextBus = { ...entry, diffMinutes: diff };
            }
        }
        return nextBus;
    }

    function renderBusRow(entry, isNext, isPassed) {
        const classes = ['bus-row'];
        if (isNext) classes.push('next-bus');
        if (isPassed) classes.push('passed');

        return `
            <div class="${classes.join(' ')}">
                <div class="bus-row-number" aria-label="Bus ${entry.busNo}">${entry.busNo}</div>
                <div class="bus-row-main">
                    <div class="bus-row-topline">
                        <span class="bus-row-time">${entry.time}</span>
                        ${isNext ? '<span class="bus-status">NEXT</span>' : isPassed ? '<span class="bus-status passed-status">PASSED</span>' : ''}
                    </div>
                    <div class="bus-row-route">
                        <span class="route-from">${entry.from}</span>
                        <svg class="route-arrow-icon line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        <span class="route-to">${entry.to}</span>
                    </div>
                    <div class="bus-row-meta">${entry.days || 'Weekend / Holiday'} · Bus ${entry.busNo}</div>
                </div>
            </div>
        `;
    }

    function renderFullView() {
        const schedule = getFilteredSchedule();
        const container = document.getElementById('bus-schedule-container');
        const nowMin = getNowMinutes();

        const nextBus = findNextBus(schedule);

        let html = '';
        for (const entry of schedule) {
            const busMin = parseTime(entry.time);
            const isNext = nextBus && entry.time === nextBus.time && entry.from === nextBus.from && entry.to === nextBus.to;
            const isPassed = busMin <= nowMin;
            html += renderBusRow(entry, isNext, isPassed);
        }

        if (schedule.length === 0) {
            html = `
                <div class="empty-state">
                    <div class="empty-state-icon"><svg class="line-icon line-icon-xl" viewBox="0 0 24 24"><path d="M5 16V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10M3 16h18v3H3zM7 19v2M17 19v2M6 8h12M7 12h.01M17 12h.01"/></svg></div>
                    <h3>No buses for this filter</h3>
                    <p>Try changing the filter or schedule type</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Update next bus card
        updateNextBusCard(nextBus);
    }

    function updateNextBusCard(nextBus) {
        const infoEl = document.getElementById('next-bus-info');
        const countdownEl = document.getElementById('next-bus-countdown');
        const card = document.getElementById('next-bus-card');

        if (!nextBus) {
            infoEl.innerHTML = `
                <span class="next-bus-time">—</span>
                <span class="next-bus-route">No more buses today</span>
            `;
            countdownEl.textContent = 'See you tomorrow!';
            card.classList.add('no-bus');
            return;
        }

        card.classList.remove('no-bus');
        infoEl.innerHTML = `
            <span class="next-bus-time">${nextBus.time}</span>
            <span class="next-bus-route">${nextBus.from} → ${nextBus.to}</span>
            <span class="next-bus-meta">Bus ${nextBus.busNo} · ${nextBus.days || 'Weekend / Holiday'}</span>
        `;

        // Start countdown
        updateCountdown(nextBus);
    }

    function updateCountdown(nextBus) {
        if (countdownInterval) clearInterval(countdownInterval);

        const countdownEl = document.getElementById('next-bus-countdown');
        const update = () => {
            const nowMin = getNowMinutes();
            const busMin = parseTime(nextBus.time);
            const diff = busMin - nowMin;
            if (diff <= 0) {
                countdownEl.textContent = 'Departing now!';
                clearInterval(countdownInterval);
                // Refresh after 1 minute
                setTimeout(() => renderFullView(), 60000);
            } else {
                countdownEl.textContent = formatCountdown(diff);
            }
        };

        update();
        countdownInterval = setInterval(update, 30000); // Update every 30s
    }

    function renderDashboard() {
        const body = document.getElementById('dash-bus-body');
        const schedule = isWeekend() ? weekendSchedule : weekdaySchedule;
        const todaySchedule = schedule.filter(isApplicableToday);
        const nextBus = findNextBus(todaySchedule);

        if (!nextBus) {
            body.innerHTML = `
                <div class="dash-bus-summary">
                    <span class="dash-bus-none">No more buses today</span>
                </div>
            `;
            return;
        }

        // Show next 3 buses
        const nowMin = getNowMinutes();
        const upcoming = todaySchedule
            .filter(e => parseTime(e.time) > nowMin)
            .slice(0, 3);

        let html = '<div class="dash-bus-list">';
        upcoming.forEach((bus, i) => {
            const diff = parseTime(bus.time) - nowMin;
            html += `
                <div class="dash-bus-item ${i === 0 ? 'next' : ''}">
                    <span class="dash-bus-time">${bus.time}</span>
                    <span class="dash-bus-route">${bus.from} → ${bus.to}</span>
                    <span class="dash-bus-countdown">${formatCountdown(diff)}<small>Bus ${bus.busNo}</small></span>
                </div>
            `;
        });
        html += '</div>';
        body.innerHTML = html;
    }

    function init() {
        // Auto-detect schedule type
        currentType = isWeekend() ? 'weekend' : 'weekday';

        // Toggle buttons
        const toggleBtns = document.querySelectorAll('#bus-type-toggle .toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                toggleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentType = btn.dataset.type;
                renderFullView();
            });
            // Set initial active state
            if (btn.dataset.type === currentType) {
                btn.classList.add('active');
                toggleBtns.forEach(b => {
                    if (b !== btn) b.classList.remove('active');
                });
            }
        });

        // Filter chips
        const filterChips = document.querySelectorAll('#bus-filter .filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilter = chip.dataset.dir;
                renderFullView();
            });
        });

        // Initial render
        renderDashboard();
    }

    return { init, renderFullView, renderDashboard };
})();
