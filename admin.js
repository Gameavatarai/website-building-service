document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const CORRECT_PASSWORD = 'LetsCAnalytics135'; // CHANGE THIS! Very insecure.

    // --- Elements ---
    const body = document.body;
    const timeSelector = document.getElementById('time-period');

    // --- Booking Availability Elements ---
    const newSlotInput = document.getElementById('new-slot-datetime');
    const addSlotBtn = document.getElementById('add-slot-btn');
    const slotsList = document.getElementById('slots-list');
    const saveSlotsBtn = document.getElementById('save-slots-btn');
    const saveStatus = document.getElementById('save-status');

    // --- Scheduled Calls Elements ---
    const bookedCallsList = document.getElementById('booked-calls-list');
    const bookingDetailsView = document.getElementById('booking-details-view');
    const bookingDetailsContent = document.getElementById('booking-details-content');
    const closeDetailsViewBtn = document.getElementById('close-details-view-btn');
    // --- Planning Details Modal Elements (will be added to admin.html) ---
    const planningDetailsView = document.getElementById('planning-details-view');
    const planningDetailsContent = document.getElementById('planning-details-content');
    const closePlanningDetailsBtn = document.getElementById('close-planning-details-btn');

    // --- Booking Data ---
    let availableSlots = []; // Holds the current state of available slots
    let bookedCalls = []; // Holds the loaded booked calls
    const SLOTS_STORAGE_KEY = 'booking_available_slots';
    const BOOKINGS_STORAGE_KEY = 'bookingSubmissions'; // Key used in script.js

    // --- Charts ---
    let trafficChart = null;
    let timeSpentChart = null;
    let buttonClicksChart = null;

    // --- Password Protection ---
    let isAuthenticated = false;

    function showPasswordPrompt() {
        // Check if already authenticated (e.g., via session storage)
        if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
            isAuthenticated = true;
            loadAnalyticsData(); // Load analytics data
            initializeBookingAvailability(); // Initialize availability section
            initializeScheduledCalls(); // Initialize scheduled calls section
            return;
        }

        // Create overlay elements
        const overlay = document.createElement('div');
        overlay.className = 'password-overlay';

        const box = document.createElement('div');
        box.className = 'password-box';

        const label = document.createElement('label');
        label.setAttribute('for', 'admin-password');
        label.textContent = 'Enter Admin Password:';

        const input = document.createElement('input');
        input.type = 'password';
        input.id = 'admin-password';

        const button = document.createElement('button');
        button.textContent = 'Login';

        const errorMsg = document.createElement('p');
        errorMsg.className = 'password-error';
        errorMsg.style.display = 'none'; // Hide initially

        // Assemble the prompt
        box.appendChild(label);
        box.appendChild(input);
        box.appendChild(button);
        box.appendChild(errorMsg);
        overlay.appendChild(box);
        body.appendChild(overlay);

        // Add event listener for the button
        button.addEventListener('click', checkPassword);
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                checkPassword();
            }
        });

        input.focus(); // Focus the input field

        function checkPassword() {
            const enteredPassword = input.value;
            if (enteredPassword === CORRECT_PASSWORD) {
                isAuthenticated = true;
                sessionStorage.setItem('isAdminAuthenticated', 'true'); // Remember for session
                body.removeChild(overlay);
                loadAnalyticsData(); // Load analytics data
                initializeBookingAvailability(); // Initialize availability section
                initializeScheduledCalls(); // Initialize scheduled calls section
            } else {
                errorMsg.textContent = 'Incorrect password. Please try again.';
                errorMsg.style.display = 'block';
                input.value = ''; // Clear the input
                input.focus();
            }
        }
    }

    // --- Analytics Data Loading ---
    function loadAnalyticsData() {
        if (!isAuthenticated) return; // Don't load if not authenticated

        const selectedPeriod = timeSelector.value;
        console.log(`Loading data for period: ${selectedPeriod}`);

        // Get analytics data from localStorage
        const analyticsData = localStorage.getItem('website_analytics_data');
        
        if (!analyticsData) {
            showNoDataMessage();
            return;
        }
        
        try {
            const data = JSON.parse(analyticsData);
            
            // Clear previous chart containers
            clearChartContainers();
            
            // Render charts with the data
            renderTrafficChart(data, selectedPeriod);
            renderTimeSpentChart(data, selectedPeriod);
            renderButtonClicksChart(data, selectedPeriod);
            renderOtherMetrics(data, selectedPeriod);
            
        } catch (error) {
            console.error('Error parsing analytics data:', error);
            showErrorMessage('Error loading analytics data. Please check the console for details.');
        }
    }
    
    // --- Helper Functions ---
    
    function clearChartContainers() {
        // Destroy existing charts to prevent memory leaks
        if (trafficChart) trafficChart.destroy();
        if (timeSpentChart) timeSpentChart.destroy();
        if (buttonClicksChart) buttonClicksChart.destroy();
        
        // Clear containers
        const trafficContainer = document.getElementById('traffic-analysis').querySelector('.chart-placeholder');
        const timeSpentContainer = document.getElementById('time-spent').querySelector('.chart-placeholder');
        const buttonClicksContainer = document.getElementById('button-clicks').querySelector('.chart-placeholder');
        const otherMetricsContainer = document.getElementById('other-metrics').querySelector('.placeholder');
        
        trafficContainer.innerHTML = '';
        timeSpentContainer.innerHTML = '';
        buttonClicksContainer.innerHTML = '';
        otherMetricsContainer.innerHTML = '';
        
        // Create canvas elements for charts
        trafficContainer.innerHTML = '<canvas id="traffic-chart"></canvas>';
        timeSpentContainer.innerHTML = '<canvas id="time-spent-chart"></canvas>';
        buttonClicksContainer.innerHTML = '<canvas id="button-clicks-chart"></canvas>';
    }
    
    function showNoDataMessage() {
        const containers = [
            document.getElementById('traffic-analysis').querySelector('.chart-placeholder'),
            document.getElementById('time-spent').querySelector('.chart-placeholder'),
            document.getElementById('button-clicks').querySelector('.chart-placeholder'),
            document.getElementById('other-metrics').querySelector('.placeholder')
        ];
        
        containers.forEach(container => {
            container.innerHTML = '<div class="no-data-message">No analytics data available yet. Add the analytics-tracker.js script to your website pages to start collecting data.</div>';
        });
    }
    
    function showErrorMessage(message) {
        const containers = [
            document.getElementById('traffic-analysis').querySelector('.chart-placeholder'),
            document.getElementById('time-spent').querySelector('.chart-placeholder'),
            document.getElementById('button-clicks').querySelector('.chart-placeholder'),
            document.getElementById('other-metrics').querySelector('.placeholder')
        ];
        
        containers.forEach(container => {
            container.innerHTML = `<div class="error-message">${message}</div>`;
        });
    }
    
    function filterDataByPeriod(data, period) {
        // This is a simplified implementation
        // In a real application, you would filter based on timestamps
        
        // For demo purposes, we'll just return all data
        // In a real implementation, you would:
        // 1. Parse the timestamps in the data
        // 2. Calculate the cutoff date based on the selected period
        // 3. Filter the data to only include entries after the cutoff date
        
        return data; // Return all data for now
    }
    
    // --- Chart Rendering Functions ---
    
    function renderTrafficChart(data, period) {
        const filteredData = filterDataByPeriod(data, period);
        const pageViews = filteredData.pageViews || {};
        
        // Prepare data for chart
        const pages = Object.keys(pageViews);
        const totalViews = pages.map(page => pageViews[page].views || 0);
        const organicViews = pages.map(page => pageViews[page].organic || 0);
        const adViews = pages.map(page => pageViews[page].advertisement || 0);
        
        // Format page names for display
        const formattedPages = pages.map(page => {
            // Extract page name from path
            const pageName = page === '/' ? 'Home' : page.split('/').pop().replace('.html', '') || page;
            return pageName.charAt(0).toUpperCase() + pageName.slice(1); // Capitalize
        });
        
        // Create chart
        const ctx = document.getElementById('traffic-chart').getContext('2d');
        trafficChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedPages,
                datasets: [
                    {
                        label: 'Total Views',
                        data: totalViews,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Organic',
                        data: organicViews,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Advertisement',
                        data: adViews,
                        backgroundColor: 'rgba(255, 159, 64, 0.5)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Views'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Pages'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Page Views by Traffic Source'
                    }
                }
            }
        });
    }
    
    function renderTimeSpentChart(data, period) {
        const filteredData = filterDataByPeriod(data, period);
        const timeSpent = filteredData.timeSpent || {};
        
        // Prepare data for chart
        const pages = Object.keys(timeSpent);
        const avgTimeSpent = pages.map(page => timeSpent[page].averageSeconds || 0);
        
        // Format page names for display
        const formattedPages = pages.map(page => {
            // Extract page name from path
            const pageName = page === '/' ? 'Home' : page.split('/').pop().replace('.html', '') || page;
            return pageName.charAt(0).toUpperCase() + pageName.slice(1); // Capitalize
        });
        
        // Create chart
        const ctx = document.getElementById('time-spent-chart').getContext('2d');
        timeSpentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedPages,
                datasets: [{
                    label: 'Average Time Spent (seconds)',
                    data: avgTimeSpent,
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Seconds'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Pages'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Time Spent on Pages'
                    }
                }
            }
        });
    }
    
    function renderButtonClicksChart(data, period) {
        const filteredData = filterDataByPeriod(data, period);
        const buttonClicks = filteredData.buttonClicks || {};
        
        // Prepare data for chart
        const buttons = Object.keys(buttonClicks);
        const clickCounts = buttons.map(button => buttonClicks[button].count || 0);
        
        // Format button names for display (truncate if too long)
        const formattedButtons = buttons.map(button => {
            if (button.length > 20) {
                return button.substring(0, 17) + '...';
            }
            return button;
        });
        
        // Create chart
        const ctx = document.getElementById('button-clicks-chart').getContext('2d');
        buttonClicksChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedButtons,
                datasets: [{
                    label: 'Click Count',
                    data: clickCounts,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Clicks'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Buttons'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Button Click Analysis'
                    }
                }
            }
        });
    }
    
    function renderOtherMetrics(data, period) {
        const filteredData = filterDataByPeriod(data, period);
        const container = document.getElementById('other-metrics').querySelector('.placeholder');
        
        // Calculate some additional metrics
        const pageViews = filteredData.pageViews || {};
        const totalPageViews = Object.values(pageViews).reduce((sum, page) => sum + (page.views || 0), 0);
        
        const timeSpent = filteredData.timeSpent || {};
        const totalTimeSpent = Object.values(timeSpent).reduce((sum, page) => sum + (page.totalSeconds || 0), 0);
        const totalVisits = Object.values(timeSpent).reduce((sum, page) => sum + (page.visits || 0), 0);
        const overallAvgTimeSpent = totalVisits > 0 ? Math.round(totalTimeSpent / totalVisits) : 0;
        
        const referrers = filteredData.referrers || {};
        const topReferrers = Object.entries(referrers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // Create HTML for other metrics
        let html = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Page Views</h3>
                    <div class="metric-value">${totalPageViews}</div>
                </div>
                <div class="metric-card">
                    <h3>Average Time on Site</h3>
                    <div class="metric-value">${overallAvgTimeSpent} seconds</div>
                </div>
                <div class="metric-card">
                    <h3>Most Viewed Page</h3>
                    <div class="metric-value">
        `;
        
        // Find most viewed page
        let mostViewedPage = { path: 'None', views: 0 };
        for (const [path, data] of Object.entries(pageViews)) {
            if (data.views > mostViewedPage.views) {
                mostViewedPage = { path, views: data.views };
            }
        }
        
        // Format page name
        const pageName = mostViewedPage.path === '/' 
            ? 'Home' 
            : mostViewedPage.path.split('/').pop().replace('.html', '') || mostViewedPage.path;
        const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
        
        html += `${formattedPageName} (${mostViewedPage.views} views)</div>
                </div>
                <div class="metric-card">
                    <h3>Top Referrers</h3>
                    <div class="metric-value">
                        <ul class="referrer-list">
        `;
        
        if (topReferrers.length === 0) {
            html += '<li>No referrer data available</li>';
        } else {
            topReferrers.forEach(([referrer, count]) => {
                html += `<li>${referrer} (${count})</li>`;
            });
        }
        
        html += `
                        </ul>
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Last Updated</h3>
                    <div class="metric-value">${new Date(filteredData.lastUpdated).toLocaleString()}</div>
                </div>
            </div>
            <div class="metrics-note">
                <p><strong>Note:</strong> This is a client-side analytics implementation using localStorage. 
                For production use, consider implementing a server-side solution or using a service like Google Analytics.</p>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Add CSS for the metrics grid
        if (!document.getElementById('metrics-grid-styles')) {
            const style = document.createElement('style');
            style.id = 'metrics-grid-styles';
            style.textContent = `
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .metric-card {
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .metric-card h3 {
                    margin-top: 0;
                    color: #495057;
                    font-size: 1rem;
                    border-bottom: none;
                    padding-bottom: 5px;
                }
                .metric-value {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #212529;
                }
                .referrer-list {
                    margin: 0;
                    padding-left: 20px;
                    font-size: 0.9rem;
                    font-weight: normal;
                }
                .metrics-note {
                    background-color: #e9ecef;
                    padding: 10px 15px;
                    border-radius: 5px;
                    font-size: 0.85rem;
                    color: #6c757d;
                }
                .no-data-message, .error-message {
                    padding: 20px;
                    text-align: center;
                    color: #6c757d;
                }
                .error-message {
                    color: #dc3545;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // --- Event Listeners ---
    timeSelector.addEventListener('change', loadAnalyticsData);

    // --- Booking Availability Functions ---

    function initializeBookingAvailability() {
        if (!isAuthenticated || !addSlotBtn || !saveSlotsBtn) return; // Check elements exist

        loadAvailableSlots(); // Load from localStorage
        renderAvailableSlots(); // Display them
        setupBookingEventListeners(); // Add button listeners
    }

    function loadAvailableSlots() {
        // This function now just loads the data into the availableSlots array
        const storedSlots = localStorage.getItem(SLOTS_STORAGE_KEY);
        if (storedSlots) {
            try {
                availableSlots = JSON.parse(storedSlots);
                if (!Array.isArray(availableSlots)) availableSlots = [];
                availableSlots.sort(); // Sort chronologically
            } catch (error) {
                console.error('Error parsing stored slots:', error);
                availableSlots = [];
            }
        } else {
            availableSlots = [];
        }
    }

    function renderAvailableSlots() {
        // This function now renders the slots currently in the availableSlots array
        if (!slotsList) return;
        slotsList.innerHTML = ''; // Clear current list

        const currentAvailable = availableSlots.filter(slotISO => {
            // Additionally check if this slot is NOT in the booked calls
            return !bookedCalls.some(booking => booking.bookedSlotISO === slotISO);
        });

        if (currentAvailable.length === 0) {
            slotsList.innerHTML = '<li>No available slots defined.</li>';
            return;
        }

        currentAvailable.forEach(slotISO => {
            const li = document.createElement('li');

            // Format date/time for display
            const date = new Date(slotISO);
            const formattedDateTime = date.toLocaleString('en-GB', { 
                dateStyle: 'medium', 
                timeStyle: 'short',
                hour12: false // Use 24-hour format for clarity
            });

            li.textContent = formattedDateTime;

            // Add a remove button *only* for slots that are truly available (not just defined but booked)
            // Note: We modify the main `availableSlots` array, not `currentAvailable`
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove Definition'; // Clarify button action
            removeBtn.className = 'remove-slot-btn';
            removeBtn.dataset.slot = slotISO;

            removeBtn.addEventListener('click', () => {
                removeSlotDefinition(slotISO); // Use a new function to remove from the definition list
            });

            li.appendChild(removeBtn);
            slotsList.appendChild(li);
        });
    }

    function addSlot() {
        if (!newSlotInput) return;
        const newSlotValue = newSlotInput.value;
        if (!newSlotValue) {
            alert('Please select a date and time.');
            return;
        }

        const newSlotDate = new Date(newSlotValue);
        // Optional: Add validation to prevent adding past dates/times
        if (newSlotDate <= new Date()) {
             alert('Cannot add a slot in the past.');
             return;
        }

        const newSlotISO = newSlotDate.toISOString();

        // Prevent duplicates in the definition list
        if (availableSlots.includes(newSlotISO)) {
            alert('This time slot definition already exists.');
            return;
        }

        availableSlots.push(newSlotISO);
        availableSlots.sort(); // Keep the definition array sorted
        renderAvailableSlots(); // Re-render the list of available (unbooked) slots
        newSlotInput.value = ''; // Clear input
        if(saveStatus) {
            saveStatus.textContent = 'Slot definition added. Remember to save changes.';
            saveStatus.className = ''; // Reset status style
        }
    }

    function removeSlotDefinition(slotISO) {
        // Removes the slot definition from the main list, regardless of booking status
        availableSlots = availableSlots.filter(slot => slot !== slotISO);
        renderAvailableSlots(); // Re-render the list
         if(saveStatus) {
            saveStatus.textContent = 'Slot definition removed. Remember to save changes.';
            saveStatus.className = ''; // Reset status style
        }
    }

    function saveSlotsToLocalStorage() {
        // Saves the *entire list* of defined available slots
        if (!saveStatus) return;
        try {
            localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(availableSlots));
            saveStatus.textContent = 'Availability definitions saved successfully!';
            saveStatus.className = 'success';
        } catch (error) {
            console.error('Error saving slot definitions to localStorage:', error);
            saveStatus.textContent = 'Error saving availability definitions. See console.';
            saveStatus.className = 'error';
        }
        setTimeout(() => {
            saveStatus.textContent = '';
            saveStatus.className = '';
        }, 4000);
    }

    function setupBookingEventListeners() {
        if (addSlotBtn) addSlotBtn.addEventListener('click', addSlot);
        if (saveSlotsBtn) saveSlotsBtn.addEventListener('click', saveSlotsToLocalStorage);
        if (closeDetailsViewBtn) closeDetailsViewBtn.addEventListener('click', hideBookingDetails);
        // Add listener for the new planning details modal close button
        if (closePlanningDetailsBtn) closePlanningDetailsBtn.addEventListener('click', hidePlanningDetails);
    }

    // --- Planning Details Modal Functions ---
    function showPlanningDetails(index) {
        if (!planningDetailsView || !planningDetailsContent || index >= bookedCalls.length) return;

        const booking = bookedCalls[index];
        if (booking.callType !== 'lets-go') return; // Only show for 'Let's go' calls

        let detailsHtml = `<h3>Planning Details for ${booking.firstName} ${booking.lastName} (${booking.package} Package)</h3>`;
        detailsHtml += `<p><strong>Form Type:</strong> ${booking['form-type'] || 'N/A'}</p><hr>`;

        // Dynamically display all planning fields present in the booking object
        // Exclude the standard booking fields already shown elsewhere
        const standardBookingKeys = [
            'callType', 'date', 'time', 'firstName', 'lastName', 'email', 'company',
            'phone', 'notes', 'submissionTimestamp', 'bookedSlotISO', 'package', 'form-type',
            'booking-first-name', 'booking-last-name', 'booking-email', 'booking-company',
            'booking-phone', 'booking-notes', 'selected-date', 'selected-time',
            'selected-call-type', 'selected-package' // Include hidden fields from form
        ];

        for (const key in booking) {
            if (booking.hasOwnProperty(key) && !standardBookingKeys.includes(key)) {
                // Format key for display (e.g., 'company-name' -> 'Company Name')
                const formattedKey = key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                let value = booking[key];

                // Handle potential array values (e.g., from checkboxes)
                if (Array.isArray(value)) {
                    value = value.join(', ');
                }
                // Handle empty values
                if (value === null || value === undefined || value === '') {
                    value = '<em>(Not provided)</em>';
                }

                detailsHtml += `<p><strong>${formattedKey}:</strong> ${value}</p>`;
            }
        }

        planningDetailsContent.innerHTML = detailsHtml;
        planningDetailsView.style.display = 'block';
    }

     function hidePlanningDetails() {
         if (planningDetailsView) planningDetailsView.style.display = 'none';
         if (planningDetailsContent) planningDetailsContent.innerHTML = ''; // Clear content
    }

    // --- Scheduled Calls Functions ---

    function initializeScheduledCalls() {
        if (!isAuthenticated || !bookedCallsList) return;

        loadBookedCalls();
        renderBookedCalls();
        // Event listeners for details buttons are added during render
    }

    function loadBookedCalls() {
        const storedBookings = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        if (storedBookings) {
            try {
                bookedCalls = JSON.parse(storedBookings);
                if (!Array.isArray(bookedCalls)) bookedCalls = [];
                // Sort by booking date/time (most recent first)
                bookedCalls.sort((a, b) => new Date(b.submissionTimestamp) - new Date(a.submissionTimestamp));
            } catch (error) {
                console.error('Error parsing booked calls:', error);
                bookedCalls = [];
            }
        } else {
            bookedCalls = [];
        }
         // After loading booked calls, re-render available slots to ensure they are up-to-date
         renderAvailableSlots();
    }

    function renderBookedCalls() {
        if (!bookedCallsList) return;
        bookedCallsList.innerHTML = ''; // Clear list

        if (bookedCalls.length === 0) {
            bookedCallsList.innerHTML = '<li>No calls scheduled yet.</li>';
            return;
        }

        bookedCalls.forEach((booking, index) => {
            const li = document.createElement('li');
            const callDate = new Date(booking.bookedSlotISO);
            const formattedDateTime = callDate.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', hour12: false });
            const callTypeText = booking.callType === 'inspiring' ? 'Inspiring Call' : "Let's go Call";

            li.innerHTML = `
                <span><strong>${formattedDateTime}</strong> - ${callTypeText} (${booking.firstName} ${booking.lastName})</span>
            `;

            const detailsBtn = document.createElement('button');
            detailsBtn.textContent = 'View Details';
            detailsBtn.className = 'view-details-btn';
            detailsBtn.dataset.bookingIndex = index; // Use index to find the booking data

            detailsBtn.addEventListener('click', () => {
                showBookingDetails(index);
            });

            // Container for buttons
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'booking-actions'; // Class for styling button group
            buttonContainer.appendChild(detailsBtn);

            // --- Add Planning Details Button (only for 'Let's go' calls) ---
            if (booking.callType === 'lets-go') {
                const planningBtn = document.createElement('button');
                planningBtn.textContent = 'View Planning';
                planningBtn.className = 'view-planning-btn'; // New class for styling
                planningBtn.dataset.bookingIndex = index;
                planningBtn.addEventListener('click', () => {
                    showPlanningDetails(index);
                });
                buttonContainer.appendChild(planningBtn); // Add to container
            }
            // --- End Planning Details Button ---


            // --- Add Cancel Button ---
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'cancel-booking-btn'; // New class for styling
            cancelBtn.dataset.bookingIndex = index;

            cancelBtn.addEventListener('click', () => {
                // Optional: Add a confirmation dialog
                if (confirm(`Are you sure you want to cancel the booking for ${booking.firstName} ${booking.lastName} on ${formattedDateTime}? This will make the slot available again.`)) {
                    cancelBooking(index);
                }
            });
            buttonContainer.appendChild(cancelBtn); // Add cancel button last
            // --- End Add Cancel Button ---

            li.appendChild(buttonContainer); // Append the container with all buttons
            bookedCallsList.appendChild(li);
        });
    }

    // Removed generateWebhookUrl function as it's no longer needed

    function showBookingDetails(index) {
        if (!bookingDetailsView || !bookingDetailsContent || index >= bookedCalls.length) return;

        const booking = bookedCalls[index];
        let detailsText = `Call Type: ${booking.callType === 'inspiring' ? 'Inspiring Call (50€)' : "Let's go Call"}\n`;
        detailsText += `Date: ${booking.date}\n`;
        detailsText += `Time: ${booking.time}\n`;
        detailsText += `Name: ${booking.firstName} ${booking.lastName}\n`;
        detailsText += `Email: ${booking.email}\n`;
        if (booking.company) detailsText += `Company: ${booking.company}\n`;
        if (booking.phone) detailsText += `Phone: ${booking.phone}\n`;
        if (booking.notes) detailsText += `Notes: ${booking.notes}\n`;
        detailsText += `Booked At: ${new Date(booking.submissionTimestamp).toLocaleString('en-GB')}\n`;

        bookingDetailsContent.textContent = detailsText;
        bookingDetailsView.style.display = 'block';
    }

    function hideBookingDetails() {
         if (bookingDetailsView) bookingDetailsView.style.display = 'none';
         if (bookingDetailsContent) bookingDetailsContent.textContent = '';
    }

    function cancelBooking(index) {
        if (index >= bookedCalls.length) return;

        const bookingToCancel = bookedCalls[index];
        const cancelledSlotISO = bookingToCancel.bookedSlotISO;

        // Remove booking from the array
        bookedCalls.splice(index, 1);

        // Save updated bookings to localStorage
        try {
            localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookedCalls));
            console.log(`Booking at index ${index} cancelled and removed from storage.`);
        } catch (error) {
            console.error("Error saving updated bookings to localStorage:", error);
            // Optionally revert the splice if saving fails? Or just log error.
        }

        // Add the slot back to available slots definition if it's not already there
        if (!availableSlots.includes(cancelledSlotISO)) {
            availableSlots.push(cancelledSlotISO);
            availableSlots.sort(); // Keep sorted
            // Save updated available slots definitions to localStorage
            saveSlotsToLocalStorage(); // Reuse existing save function
            console.log(`Slot ${cancelledSlotISO} added back to available definitions.`);
        } else {
             console.log(`Slot ${cancelledSlotISO} was already in available definitions.`);
        }


        // Re-render lists
        renderBookedCalls();
        renderAvailableSlots(); // This will now show the slot as available again

        // Hide details view if it was showing the cancelled booking
        hideBookingDetails();
    }


    // --- Initialisation ---
    showPasswordPrompt(); // Show prompt when page loads

});
