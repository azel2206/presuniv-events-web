// frontend/script.js

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/api'; // Adjust if your backend runs on a different host/port

// DOM Elements
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const contentDiv = document.getElementById('content');

// Dashboard Elements
const totalEventsStat = document.getElementById('total-events-stat');
const activeEventsStat = document.getElementById('active-events-stat');
const totalRegistrationsStat = document.getElementById('total-registrations-stat');
const upcomingEventsStat = document.getElementById('upcoming-events-stat');
const recentEventsList = document.getElementById('recent-events-list');

// Events View Elements
const eventSearchInput = document.getElementById('event-search');
const eventCategoryFilter = document.getElementById('event-category-filter');
const applyFilterBtn = document.getElementById('apply-filter-btn');
const eventsList = document.getElementById('events-list');

// Create Event Elements
const createEventForm = document.getElementById('create-event-form');
const createEventMessage = document.getElementById('create-event-message');

// Register Event Modal Elements
const registerEventModal = document.getElementById('register-event-modal');
const closeButton = registerEventModal.querySelector('.close-button');
const modalEventTitle = document.getElementById('modal-event-title');
const modalEventDate = document.getElementById('modal-event-date');
const modalEventTime = document.getElementById('modal-event-time');
const modalEventLocation = document.getElementById('modal-event-location');
const modalEventDescription = document.getElementById('modal-event-description');
const modalEventCapacity = document.getElementById('modal-event-capacity');
const modalEventRegistered = document.getElementById('modal-event-registered');
const registerEventIdInput = document.getElementById('register-event-id');
const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');

// Registrations View Elements
const registrationsList = document.getElementById('registrations-list');

// Calendar View Elements
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const currentMonthYearHeader = document.getElementById('current-month-year');
const calendarGrid = document.getElementById('calendar-grid');
const calendarEventsList = document.getElementById('calendar-events-list');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedCalendarDate = null; // To store the currently selected date in the calendar

// --- Utility Functions ---

/**
 * Shows a specific view and hides others.
 * @param {string} viewId - The ID of the view to show (e.g., 'dashboard-view').
 */
function showView(viewId) {
    views.forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `${viewId.replace('-view', '')}-btn`) {
            btn.classList.add('active');
        }
    });
}

/**
 * Displays a message (success/error) in a designated message div.
 * @param {HTMLElement} messageDiv - The div element to display the message in.
 * @param {string} message - The message text.
 * @param {string} type - 'success' or 'error'.
 */
function displayMessage(messageDiv, message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000); // Hide after 5 seconds
}

// --- API Calls ---

/**
 * Fetches dashboard statistics and recent events.
 */
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard`);
        const data = await response.json();

        if (response.ok) {
            totalEventsStat.textContent = data.stats.total_events;
            activeEventsStat.textContent = data.stats.active_events;
            totalRegistrationsStat.textContent = data.stats.total_registrations;
            upcomingEventsStat.textContent = data.stats.upcoming_events;

            renderRecentEvents(data.recent_events);
        } else {
            displayMessage(document.querySelector('#dashboard-view'), `Error fetching dashboard: ${data.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        displayMessage(document.querySelector('#dashboard-view'), `Network error: ${error.message}`, 'error');
    }
}

/**
 * Fetches events based on filters.
 * @param {string} category - Event category (optional).
 * @param {string} searchTerm - Search term (optional).
 */
async function fetchEvents(category = '', searchTerm = '') {
    try {
        let url = `${API_BASE_URL}/events?`;
        if (category) url += `category=${category}&`;
        if (searchTerm) url += `search=${searchTerm}&`;

        const response = await fetch(url);
        const events = await response.json();

        if (response.ok) {
            renderEvents(events);
        } else {
            displayMessage(document.querySelector('#events-view'), `Error fetching events: ${events.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        displayMessage(document.querySelector('#events-view'), `Network error: ${error.message}`, 'error');
    }
}

/**
 * Submits a new event to the backend.
 * @param {Object} eventData - The event data to be created.
 */
async function createNewEvent(eventData) {
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });
        const result = await response.json();

        if (response.ok) {
            displayMessage(createEventMessage, result.message || 'Event created successfully!', 'success');
            createEventForm.reset(); // Clear form
            fetchEvents(); // Refresh event list
        } else {
            displayMessage(createEventMessage, result.error || 'Failed to create event.', 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        displayMessage(createEventMessage, `Network error: ${error.message}`, 'error');
    }
}

/**
 * Registers a student for an event.
 * @param {number} eventId - The ID of the event to register for.
 * @param {Object} registrationData - The student's registration details.
 */
async function registerStudentForEvent(eventId, registrationData) {
        try {
            // eventId is already in the URL path, no need to send it in the body again
            const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registrationData), // Send only registrationData
            });
            const result = await response.json();

            if (response.ok) {
                displayMessage(registerMessage, result.message, 'success');
                setTimeout(() => {
                    registerEventModal.classList.remove('active');
                    fetchEvents(); // Refresh events list to update registration counts
                }, 2000);
            } else {
                displayMessage(registerMessage, result.message || result.error || 'Registration failed.', 'error');
            }
        } catch (error) {
            console.error('Error registering for event:', error);
            displayMessage(registerMessage, `Network error: ${error.message}`, 'error');
        }
    }
/**
 * Fetches all registrations.
 */
async function fetchRegistrations() {
    try {
        const response = await fetch(`${API_BASE_URL}/registrations`);
        const registrations = await response.json();

        if (response.ok) {
            renderRegistrations(registrations);
        } else {
            displayMessage(document.querySelector('#registrations-view'), `Error fetching registrations: ${registrations.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error fetching registrations:', error);
        displayMessage(document.querySelector('#registrations-view'), `Network error: ${error.message}`, 'error');
    }
}

/**
 * Fetches events for a specific month and year for the calendar.
 * @param {number} year
 * @param {number} month (0-indexed)
 */
async function fetchCalendarEvents(year, month) {
    try {
        const response = await fetch(`${API_BASE_URL}/calendar/${year}/${month + 1}`); // Month is 1-indexed in API
        const events = await response.json();

        if (response.ok) {
            return events;
        } else {
            console.error(`Error fetching calendar events for ${year}-${month + 1}:`, events.error);
            return [];
        }
    } catch (error) {
        console.error('Network error fetching calendar events:', error);
        return [];
    }
}

/**
 * Fetches events for a specific date for the calendar.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 */
async function fetchEventsByDate(dateStr) {
    try {
        const response = await fetch(`${API_BASE_URL}/calendar/date/${dateStr}`);
        const events = await response.json();

        if (response.ok) {
            renderCalendarEventsList(events);
        } else {
            console.error(`Error fetching events for date ${dateStr}:`, events.error);
            renderCalendarEventsList([]); // Clear list on error
        }
    } catch (error) {
        console.error('Network error fetching events by date:', error);
        renderCalendarEventsList([]);
    }
}

// --- Rendering Functions ---

/**
 * Renders recent events on the dashboard.
 * @param {Array} events - List of recent events.
 */
function renderRecentEvents(events) {
    recentEventsList.innerHTML = '';
    if (events.length === 0) {
        recentEventsList.innerHTML = '<p>No recent events to display.</p>';
        return;
    }
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <h3>${event.title}</h3>
            <p class="meta"><i class="fas fa-calendar-alt"></i> ${event.date} at ${event.time}</p>
            <p class="meta"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            <p class="meta"><i class="fas fa-tag"></i> ${event.category}</p>
            <p class="description">${event.description}</p>
        `;
        recentEventsList.appendChild(card);
    });
}

/**
 * Renders all events in the events list.
 * @param {Array} events - List of events.
 */
function renderEvents(events) {
    eventsList.innerHTML = '';
    if (events.length === 0) {
        eventsList.innerHTML = '<p>No events found matching your criteria.</p>';
        return;
    }
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        const registeredCount = event.registrations ? event.registrations.length : 0;
        const isFull = registeredCount >= event.capacity;
        card.innerHTML = `
            <h3>${event.title}</h3>
            <p class="meta"><i class="fas fa-calendar-alt"></i> ${event.date} at ${event.time}</p>
            <p class="meta"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            <p class="meta"><i class="fas fa-tag"></i> ${event.category}</p>
            <p class="description">${event.description}</p>
            <p class="capacity-info">
                <i class="fas fa-users"></i> Registered: ${registeredCount} / ${event.capacity}
                ${isFull ? '<span style="color: red; font-weight: bold;">(FULL)</span>' : ''}
            </p>
            <button class="register-btn" data-event-id="${event.id}" ${isFull ? 'disabled' : ''}>
                ${isFull ? 'Event Full' : 'Register Now'}
            </button>
        `;
        eventsList.appendChild(card);
    });

    // Add event listeners to all new register buttons
    document.querySelectorAll('.register-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const eventId = parseInt(e.target.dataset.eventId);
            openRegisterModal(eventId);
        });
    });
}

/**
 * Opens the registration modal and populates it with event details.
 * @param {number} eventId - The ID of the event to register for.
 */
async function openRegisterModal(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        const event = await response.json();

        if (response.ok) {
            modalEventTitle.textContent = event.title;
            modalEventDate.textContent = event.date;
            modalEventTime.textContent = event.time;
            modalEventLocation.textContent = event.location;
            modalEventDescription.textContent = event.description;
            modalEventCapacity.textContent = event.capacity;
            modalEventRegistered.textContent = event.registrations.length;
            registerEventIdInput.value = event.id; // Set hidden input for form submission

            registerForm.reset(); // Clear previous registration data
            registerMessage.style.display = 'none'; // Hide previous messages
            registerEventModal.classList.add('active');
        } else {
            console.error('Error fetching event details for modal:', event.error);
            alert('Could not load event details for registration.'); // Use alert for simplicity here, but a custom modal would be better
        }
    } catch (error) {
        console.error('Network error fetching event details:', error);
        alert('Network error: Could not load event details.');
    }
}

/**
 * Renders all registrations.
 * @param {Array} registrations - List of registrations.
 */
function renderRegistrations(registrations) {
    registrationsList.innerHTML = '';
    if (registrations.length === 0) {
        registrationsList.innerHTML = '<p>No registrations found.</p>';
        return;
    }
    registrations.forEach(reg => {
        const card = document.createElement('div');
        card.className = 'registration-card';
        card.innerHTML = `
            <h3>${reg.studentName}</h3>
            <p class="meta"><i class="fas fa-id-card"></i> Student ID: ${reg.studentId}</p>
            <p class="meta"><i class="fas fa-envelope"></i> Email: ${reg.studentEmail}</p>
            <p class="meta"><i class="fas fa-phone"></i> Phone: ${reg.studentPhone || 'N/A'}</p>
            <p class="meta"><i class="fas fa-calendar-check"></i> Registered for: ${reg.eventTitle} (${reg.eventDate})</p>
            <p class="meta"><i class="fas fa-info-circle"></i> Status: ${reg.status}</p>
            <p class="meta"><i class="fas fa-clock"></i> Registration Date: ${new Date(reg.registrationDate).toLocaleString()}</p>
        `;
        registrationsList.appendChild(card);
    });
}

/**
 * Renders the calendar grid for the current month.
 * @param {number} year - The year to render.
 * @param {number} month - The month to render (0-indexed).
 * @param {Array} eventsInMonth - Events occurring in this month.
 */
function renderCalendar(year, month, eventsInMonth) {
    calendarGrid.innerHTML = '';
    currentMonthYearHeader.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
        const dayNameDiv = document.createElement('div');
        dayNameDiv.className = 'day-name';
        dayNameDiv.textContent = day;
        calendarGrid.appendChild(dayNameDiv);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of the month

    // Add empty divs for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-day';
        calendarGrid.appendChild(emptyDiv);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        const fullDate = new Date(year, month, day);
        const dateString = fullDate.toISOString().split('T')[0]; // YYYY-MM-DD

        dayDiv.textContent = day;
        dayDiv.dataset.date = dateString;
        dayDiv.classList.add('calendar-day');

        // Check if there are events on this day
        const hasEvents = eventsInMonth.some(event => event.date === dateString);
        if (hasEvents) {
            dayDiv.classList.add('day-with-event');
        }

        // Highlight selected day
        if (selectedCalendarDate === dateString) {
            dayDiv.classList.add('selected-day');
        }

        dayDiv.addEventListener('click', () => {
            // Remove highlight from previously selected day
            const previouslySelected = document.querySelector('.calendar-grid .selected-day');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected-day');
            }
            // Add highlight to new selected day
            dayDiv.classList.add('selected-day');
            selectedCalendarDate = dateString;
            fetchEventsByDate(dateString);
        });

        calendarGrid.appendChild(dayDiv);
    }
}

/**
 * Renders the list of events for the selected calendar date.
 * @param {Array} events - List of events for the selected date.
 */
function renderCalendarEventsList(events) {
    calendarEventsList.innerHTML = '';
    if (events.length === 0) {
        calendarEventsList.innerHTML = `<p>No events for ${selectedCalendarDate || 'the selected date'}.</p>`;
        return;
    }
    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card'; // Reusing event-card style
        card.innerHTML = `
            <h3>${event.title}</h3>
            <p class="meta"><i class="fas fa-clock"></i> ${event.time}</p>
            <p class="meta"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
            <p class="meta"><i class="fas fa-tag"></i> ${event.category}</p>
            <p class="description">${event.description}</p>
            <p class="capacity-info">
                <i class="fas fa-users"></i> Registered: ${event.registrations.length} / ${event.capacity}
            </p>
        `;
        calendarEventsList.appendChild(card);
    });
}

// --- Event Listeners ---

// Navigation buttons
document.getElementById('dashboard-btn').addEventListener('click', () => {
    showView('dashboard-view');
    fetchDashboardData();
});

document.getElementById('events-btn').addEventListener('click', () => {
    showView('events-view');
    fetchEvents(); // Load all events initially
});

document.getElementById('create-event-btn').addEventListener('click', () => {
    showView('create-event-view');
    createEventForm.reset(); // Clear form on view change
    createEventMessage.style.display = 'none'; // Hide message
});

document.getElementById('registrations-btn').addEventListener('click', () => {
    showView('registrations-view');
    fetchRegistrations();
});

document.getElementById('calendar-btn').addEventListener('click', async () => {
    showView('calendar-view');
    const events = await fetchCalendarEvents(currentYear, currentMonth);
    renderCalendar(currentYear, currentMonth, events);
    calendarEventsList.innerHTML = '<p>Select a date to see events.</p>'; // Clear event list when month changes
    selectedCalendarDate = null; // Reset selected date
});

// Event filtering
applyFilterBtn.addEventListener('click', () => {
    const category = eventCategoryFilter.value;
    const searchTerm = eventSearchInput.value;
    fetchEvents(category, searchTerm);
});

// Create Event Form submission
createEventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventData = {
        title: document.getElementById('event-title').value,
        category: document.getElementById('event-category').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        location: document.getElementById('event-location').value,
        description: document.getElementById('event-description').value,
        capacity: parseInt(document.getElementById('event-capacity').value),
    };
    createNewEvent(eventData);
});

// Register Event Modal close button
closeButton.addEventListener('click', () => {
    registerEventModal.classList.remove('active');
});

// Close modal if clicked outside content
window.addEventListener('click', (event) => {
    if (event.target === registerEventModal) {
        registerEventModal.classList.remove('active');
    }
});

// Register Form submission
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const eventId = parseInt(registerEventIdInput.value);
    const registrationData = {
        studentName: document.getElementById('student-name').value,
        studentId: document.getElementById('student-id').value,
        studentEmail: document.getElementById('student-email').value,
        studentPhone: document.getElementById('student-phone').value,
    };
    registerStudentForEvent(eventId, registrationData);
});

// Calendar navigation
prevMonthBtn.addEventListener('click', async () => {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    const events = await fetchCalendarEvents(currentYear, currentMonth);
    renderCalendar(currentYear, currentMonth, events);
    calendarEventsList.innerHTML = '<p>Select a date to see events.</p>'; // Clear event list when month changes
    selectedCalendarDate = null; // Reset selected date
});

nextMonthBtn.addEventListener('click', async () => {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    const events = await fetchCalendarEvents(currentYear, currentMonth);
    renderCalendar(currentYear, currentMonth, events);
    calendarEventsList.innerHTML = '<p>Select a date to see events.</p>'; // Clear event list when month changes
    selectedCalendarDate = null; // Reset selected date
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Show dashboard by default
    showView('dashboard-view');
    fetchDashboardData();
});
