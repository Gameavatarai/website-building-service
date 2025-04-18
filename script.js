document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel-3d');
    const scene = document.querySelector('.scene');
    // Exit if carousel elements aren't found on the current page
    if (!carousel || !scene) {
        // console.log("Carousel elements not found on this page."); // Optional debug log
        return;
    }

    const cards = carousel.querySelectorAll('.carousel-card-3d');
    const numCards = cards.length;
    if (numCards === 0) return;

    const radius = calculateRadius(cards[0].offsetWidth, numCards); // Calculate radius based on card width and number
    const angleIncrement = 360 / numCards;
    let currentAngle = 0;
    let rotationInterval;
    let isDragging = false;
    let startX, startAngle;
    let currentFrontIndex = 0; // Track the index of the front card

    // Get preview panel elements
    const previewPanel = document.getElementById('card-preview');
    const previewTitle = document.getElementById('preview-title');
    const previewContent = document.getElementById('preview-content');

    // Position cards initially
    positionCards();

    // Function to calculate the translation distance (radius)
    function calculateRadius(cardWidth, n) {
        // Approximation: distance needed so cards don't overlap too much
        // Formula derived from polygon apothem: R = width / (2 * tan(pi / n))
        // Add some padding factor
        const angleRad = Math.PI / n;
        return (cardWidth / (2 * Math.tan(angleRad))) * 1.2; // 1.2 is padding factor
    }

    // Function to position cards in a circle
    function positionCards() {
        cards.forEach((card, index) => {
            const angle = angleIncrement * index;
            const rotateY = angle;
            // Position card in 3D space
            card.style.transform = `rotateY(${rotateY}deg) translateZ(${radius}px)`;
        });
    }

    // Function to rotate the carousel
    function rotateCarousel(angle) {
        const transformValue = `translateZ(${-radius}px) rotateY(${angle}deg)`;
        carousel.style.transform = transformValue;
        // Update CSS variable for reflection
        carousel.style.setProperty('--carousel-transform', `rotateY(${angle}deg)`);

        // Determine and update preview based on the front card
        updatePreviewPanel(angle);
    }

    // Function to find the index of the card closest to the front
    function getFrontCardIndex(angle) {
        // Normalize angle to be between 0 and 360
        const normalizedAngle = ((-angle % 360) + 360) % 360;
        // Calculate the index based on the angle
        const index = Math.round(normalizedAngle / angleIncrement) % numCards;
        return index;
    }

    // Function to update the preview panel
    function updatePreviewPanel(angle) {
        const frontIndex = getFrontCardIndex(angle);

        if (frontIndex !== currentFrontIndex || !previewPanel.classList.contains('visible')) {
             // Only update if the front card changed or panel is hidden
            currentFrontIndex = frontIndex;
            const frontCard = cards[currentFrontIndex];

            if (frontCard && previewTitle && previewContent) {
                // Get title from data-attribute or h2
                const title = frontCard.dataset.title || frontCard.querySelector('h2')?.textContent || 'Details';
                // Clone content, excluding the h2 tag
                const contentClone = frontCard.cloneNode(true);
                const h2 = contentClone.querySelector('h2');
                if (h2) h2.remove();

                previewTitle.textContent = title;
                previewContent.innerHTML = contentClone.innerHTML; // Use innerHTML of the clone
                previewPanel.classList.add('visible'); // Show panel
            }
        }
        // Optional: Add a small tolerance check if needed to prevent flickering
        // const angleToFront = Math.abs(((-angle % 360) + 360) % 360 - (currentFrontIndex * angleIncrement));
        // if (angleToFront < angleIncrement / 4 || angleToFront > 360 - angleIncrement / 4) {
        //     previewPanel.classList.add('visible');
        // } else {
        //     previewPanel.classList.remove('visible');
        // }
    }


    // Automatic rotation
    function startAutoRotation() {
        stopAutoRotation(); // Clear existing interval first
        rotationInterval = setInterval(() => {
            // Slower rotation: Increased divisor from 20 to 60
            currentAngle -= angleIncrement / 60; 
            rotateCarousel(currentAngle);
        }, 50); // Interval time in ms (can also increase this for slower updates)
    }

    function stopAutoRotation() {
        clearInterval(rotationInterval);
    }

    // --- Interaction ---

    // Pause on hover
    scene.addEventListener('mouseenter', stopAutoRotation);
    scene.addEventListener('mouseleave', () => {
        if (!isDragging) {
            startAutoRotation();
        }
    });

    // Basic Drag/Swipe Interaction (Optional - more complex for smooth 3D)
    scene.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startAngle = currentAngle;
        stopAutoRotation();
        scene.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const deltaX = currentX - startX;
        // Adjust sensitivity: how much drag corresponds to rotation
        const angleChange = deltaX * -0.2; // Negative to match drag direction
        currentAngle = startAngle + angleChange;
        rotateCarousel(currentAngle);
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        scene.style.cursor = 'grab';
        // Optionally add inertia/snap-to-nearest-card logic here
        // Update preview panel one last time after drag ends
        updatePreviewPanel(currentAngle);
        startAutoRotation(); // Resume auto-rotation after drag
    });

    // Prevent text selection during drag
     scene.addEventListener('dragstart', (e) => e.preventDefault());


    // Initial rotation, update preview, and start auto-rotation
    rotateCarousel(currentAngle);
    updatePreviewPanel(currentAngle); // Initial preview update
    startAutoRotation();

    // Adjust layout on resize
    window.addEventListener('resize', () => {
        // Recalculate radius and reposition (might need debouncing for performance)
        const newRadius = calculateRadius(cards[0].offsetWidth, numCards);
        radius = newRadius; // Update global radius
        positionCards();
        rotateCarousel(currentAngle); // Re-apply current rotation with new radius
    });
});

// --- Quick Access Navigation Circle ---
document.addEventListener('DOMContentLoaded', () => {
    const quickAccess = document.querySelector('.quick-access');
    
    // Exit if quick access element isn't found on the current page
    if (!quickAccess) {
        // console.log("Quick Access element not found on this page."); // Optional debug log
        return;
    }
    
    let isPressed = false;
    let pressTimer = null;
    let isMenuVisible = false;
    
    // Show the menu on mousedown after a short delay
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left mouse button
            // Clear any existing timer
            clearTimeout(pressTimer);
            
            // Set a timer to show the menu after 150ms
            pressTimer = setTimeout(() => {
                isPressed = true;
                isMenuVisible = true;
                
                // Position the menu at the cursor
                const x = e.clientX;
                const y = e.clientY;
                quickAccess.style.left = `${x}px`;
                quickAccess.style.top = `${y}px`;
                
                // Show the menu
                quickAccess.style.opacity = '1';
                
                // Prevent default to avoid text selection
                e.preventDefault();
            }, 150); // 150ms delay
        }
    });
    
    // Add tooltips for navigation items
    const quickItems = document.querySelectorAll('.quick-item');
    quickItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (isMenuVisible) {
                const action = item.getAttribute('data-action');
                let tooltipText = '';
                
                // Set tooltip text based on action
                switch(action) {
                    case 'home':
                        tooltipText = 'Home';
                        break;
                    case 'portfolio':
                        tooltipText = 'AI Elements';
                        break;
                    case 'contact':
                        tooltipText = 'Contact Us';
                        break;
                    case 'ai-details':
                        tooltipText = 'AI Details';
                        break;
                    case 'about':
                        tooltipText = 'About Us';
                        break;
                    case 'models':
                        tooltipText = 'Pricing Models';
                        break;
                    case 'thank-you':
                        tooltipText = 'Thank You';
                        break;
                    default:
                        tooltipText = action.charAt(0).toUpperCase() + action.slice(1);
                }
                
                // Set tooltip text and show it
                quickAccess.setAttribute('data-tooltip', tooltipText);
                quickAccess.classList.add('show-tooltip');
            }
        });
        
        item.addEventListener('mouseleave', () => {
            // Hide tooltip when mouse leaves the item
            quickAccess.classList.remove('show-tooltip');
        });
    });
    
    // We're removing the mousemove handler so the menu stays in place
    // This allows the user to hover over menu items
    
    // Hide the menu on mouseup and check if an item was clicked
    document.addEventListener('mouseup', (e) => {
        // Clear the timer in case the user releases before the menu appears
        clearTimeout(pressTimer);
        
        if (isPressed && isMenuVisible) {
            // Check if we're over a menu item
            const elements = document.elementsFromPoint(e.clientX, e.clientY);
            const menuItem = elements.find(el => el.classList.contains('quick-item'));
            
            if (menuItem) {
                const action = menuItem.dataset.action;
                console.log("Action selected:", action);
                
                // Navigate based on the action
                if (action === 'home') {
                    window.location.href = 'index.html';
                } else if (action === 'portfolio') {
                    window.location.href = 'portfolio.html';
                } else if (action === 'contact') {
                    window.location.href = 'contact.html';
                } else if (action === 'ai-details') {
                    window.location.href = 'ai-details.html';
                } else if (action === 'about') {
                    window.location.href = 'about.html';
                } else if (action === 'models') {
                    window.location.href = 'models.html';
                } else if (action === 'thank-you') {
                    window.location.href = 'thank-you.html';
                }
            }
            
            // Hide the menu
            quickAccess.style.opacity = '0';
            isMenuVisible = false;
            isPressed = false;
        } else {
            // If the menu wasn't shown yet, cancel it
            isPressed = false;
        }
    });
    
    // Prevent context menu
    document.addEventListener('contextmenu', (e) => {
        if (isPressed) {
            e.preventDefault();
        }
    });
});


// --- Booking & Chatbot Shared Elements & Functions ---

// Popup Elements (Define globally or in a shared scope accessible by both listeners)
const calendarPopupOverlay = document.getElementById('calendar-popup-overlay');
const calendarPopup = document.getElementById('calendar-popup');
const closeCalendarPopupButton = calendarPopup?.querySelector('.close-popup');
const calendarSlotsContainer = document.getElementById('calendar-slots');
const callTypeSelect = document.getElementById('call-type');
const packageSelector = document.getElementById('package-selector'); // Get package selector div
const packageTypeSelect = document.getElementById('package-type'); // Get package select element
const stepNumberSpan = document.getElementById('step-number'); // Get step number span

const bookingPopupOverlay = document.getElementById('booking-popup-overlay');
const bookingPopup = document.getElementById('booking-popup');
const closeBookingPopupButton = bookingPopup?.querySelector('.close-popup');
const bookingForm = document.getElementById('booking-form');
const selectedSlotDisplay = document.getElementById('selected-slot-display');
const selectedCallTypeDisplay = document.getElementById('selected-call-type-display');

// Hidden form fields
const hiddenDateField = document.getElementById('selected-date');
const hiddenTimeField = document.getElementById('selected-time');
const hiddenCallTypeField = document.getElementById('selected-call-type');

// Constants
const SLOTS_STORAGE_KEY = 'booking_available_slots';
const BOOKINGS_STORAGE_KEY = 'bookingSubmissions';


// --- Calendar Popup Functions --- (Now globally accessible)
function openCalendarPopup() {
    if (!calendarPopup || !calendarPopupOverlay) return;
    loadAndDisplayAvailableSlots(); // Load/refresh slots when opening
    calendarPopupOverlay.style.display = 'block';
    calendarPopup.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCalendarPopup() {
    if (!calendarPopup || !calendarPopupOverlay) return;
    calendarPopupOverlay.style.display = 'none';
    calendarPopup.style.display = 'none';
    // Only restore scroll if the other popup isn't also open
    if (bookingPopup && bookingPopup.style.display === 'none') { // Check bookingPopup exists
        document.body.style.overflow = '';
    }
}

// --- Booking Details Popup Functions --- (Now globally accessible)
function openBookingPopup(dateTimeISO) {
    // Ensure all required elements exist
    if (!bookingPopup || !bookingPopupOverlay || !callTypeSelect || !selectedSlotDisplay || !selectedCallTypeDisplay || !hiddenDateField || !hiddenTimeField || !hiddenCallTypeField) {
        console.error("Booking details popup elements not found!");
        return;
    }

    const selectedDate = new Date(dateTimeISO);
    const selectedCallTypeValue = callTypeSelect.value; // Get value from select inside calendar popup
    const selectedCallTypeText = callTypeSelect.options[callTypeSelect.selectedIndex].text;

    // --- Payment Check for Inspiring Call ---
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success') === 'true';
    const stripePaymentUrl = 'https://buy.stripe.com/dR68xrcHv6qNh0I28j'; // Your Stripe Link

    if (selectedCallTypeValue === 'inspiring' && !paymentSuccess) {
        // Inspiring Call selected, but payment not yet confirmed via URL param
        console.log("Inspiring Call selected. Redirecting to payment...");
        try {
            // Store details needed after redirect
            sessionStorage.setItem('pendingBookingSlot', dateTimeISO);
            sessionStorage.setItem('pendingBookingCallType', selectedCallTypeValue);
            // Redirect to Stripe
            window.location.href = stripePaymentUrl;
        } catch (error) {
            console.error("Error using sessionStorage:", error);
            alert("Could not initiate payment process. Please try again or contact support.");
        }
        return; // Stop further execution in this case
    }
    // --- End Payment Check ---

    // Close the calendar popup first (if open)
    closeCalendarPopup();

    // Populate display elements
    selectedSlotDisplay.textContent = selectedDate.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short', hour12: false });
    selectedCallTypeDisplay.textContent = selectedCallTypeText;

    // Populate hidden form fields
    hiddenDateField.value = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
    hiddenTimeField.value = selectedDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    hiddenCallTypeField.value = selectedCallTypeValue;

    // Show popup
    bookingPopupOverlay.style.display = 'block';
    bookingPopup.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Ensure background scrolling is prevented
}

function closeBookingPopup() {
    if (!bookingPopup || !bookingPopupOverlay) return;
    bookingPopupOverlay.style.display = 'none';
    bookingPopup.style.display = 'none';
    if (bookingForm) bookingForm.reset(); // Reset form fields
    // Only restore scroll if the other popup isn't also open (though calendar should be closed already)
    if (calendarPopup && calendarPopup.style.display === 'none') { // Check calendarPopup exists
         document.body.style.overflow = '';
    }
}

// --- Slot Loading & Display (inside Calendar Popup) --- (Now globally accessible)
function loadAndDisplayAvailableSlots() {
    // Ensure elements inside the calendar popup exist
    if (!calendarSlotsContainer || !calendarPopup) return;

    const storedSlots = localStorage.getItem(SLOTS_STORAGE_KEY);
    let availableSlots = [];

    if (storedSlots) {
        try {
            availableSlots = JSON.parse(storedSlots);
            if (!Array.isArray(availableSlots)) {
                availableSlots = [];
            }
            availableSlots.sort(); // Sort chronologically
        } catch (error) {
            console.error("Error parsing available slots:", error);
            availableSlots = [];
        }
    }

    calendarSlotsContainer.innerHTML = ''; // Clear previous slots

    if (availableSlots.length === 0) {
        calendarSlotsContainer.innerHTML = '<p>No available time slots at the moment.</p>';
        return;
    }

    // Filter out past slots (optional but good practice)
    const now = new Date();
    const futureSlots = availableSlots.filter(slotISO => new Date(slotISO) > now);

    if (futureSlots.length === 0) {
        calendarSlotsContainer.innerHTML = '<p>No available future time slots.</p>';
        return;
    }


    futureSlots.forEach(slotISO => {
        const slotButton = document.createElement('button');
        slotButton.className = 'time-slot';
        slotButton.dataset.datetime = slotISO;

        const date = new Date(slotISO);
        slotButton.textContent = date.toLocaleString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false // Use 24-hour format
        });

        slotButton.addEventListener('click', () => {
            openBookingPopup(slotISO); // Call the global function
        });

        calendarSlotsContainer.appendChild(slotButton);
    });
}

// --- Helper function to remove slot from availability --- (Now globally accessible)
function removeSlotFromAvailability(slotToRemoveISO) {
    const storedSlots = localStorage.getItem(SLOTS_STORAGE_KEY);
    let availableSlots = [];
    if (storedSlots) {
        try {
            availableSlots = JSON.parse(storedSlots);
            if (!Array.isArray(availableSlots)) availableSlots = [];
        } catch {
            availableSlots = [];
        }
    }

    // Filter out the booked slot
    const updatedSlots = availableSlots.filter(slot => slot !== slotToRemoveISO);

    // Save the updated list back to localStorage
    localStorage.setItem(SLOTS_STORAGE_KEY, JSON.stringify(updatedSlots));
    console.log(`Removed slot ${slotToRemoveISO} from availability.`);
}


// --- Booking System Event Listener Setup ---
document.addEventListener('DOMContentLoaded', () => {

    // --- Check for Payment Success Redirect ---
    const urlParamsOnLoad = new URLSearchParams(window.location.search);
    if (urlParamsOnLoad.get('payment_success') === 'true') {
        console.log("Payment success detected on page load.");
        try {
            const pendingSlot = sessionStorage.getItem('pendingBookingSlot');
            const pendingCallType = sessionStorage.getItem('pendingBookingCallType');

            if (pendingSlot && pendingCallType === 'inspiring') {
                console.log("Found pending booking details in sessionStorage. Opening booking form.");
                // Need to temporarily set the callTypeSelect value if it exists,
                // as openBookingPopup reads it directly.
                if (callTypeSelect) {
                    callTypeSelect.value = pendingCallType; // Ensure 'inspiring' is selected
                }
                openBookingPopup(pendingSlot); // Open the booking form directly

                // Clean up sessionStorage
                sessionStorage.removeItem('pendingBookingSlot');
                sessionStorage.removeItem('pendingBookingCallType');

                // Clean up URL (optional, keeps URL clean)
                if (window.history.replaceState) {
                    const cleanUrl = window.location.pathname + window.location.hash; // Remove query string
                    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                }
            } else {
                console.log("Payment success flag found, but no pending booking details in sessionStorage.");
                // Optionally clear the flag from URL anyway
                 if (window.history.replaceState) {
                    const cleanUrl = window.location.pathname + window.location.hash;
                    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                }
            }
        } catch (error) {
            console.error("Error processing payment success redirect:", error);
        }
    }
    // --- End Payment Success Check ---


    // Get buttons inside this scope
    const openCalendarBtnInspiring = document.getElementById('open-calendar-popup-btn'); // Inspiring Call section
    const openCalendarBtnLetsGo = document.getElementById('open-calendar-popup-btn-letsgo'); // Let's Go Call section
    const openCalendarBtnCarousel = document.getElementById('open-calendar-popup-btn-carousel'); // Carousel card

    // Form Submission Function (remains the same, but defined globally now)
    function handleBookingSubmit(event) { // Keep this function definition
        console.log("handleBookingSubmit triggered!"); // Add console log for debugging
        event.preventDefault();
        if (!bookingForm) { // bookingForm is global now
            console.error("Booking form element not found in handleBookingSubmit.");
            return;
        }

        const formData = new FormData(bookingForm);
        // Get date and time separately first
        const bookedDate = formData.get('selected-date');
        const bookedTime = formData.get('selected-time');

        // Construct the ISO string using the separate variables
    const bookedSlotISO = new Date(bookedDate + 'T' + bookedTime).toISOString(); // Keep this for potential future use or logging

    // Get all booking form data
    const bookingFormData = {
        callType: formData.get('selected-call-type'),
            date: bookedDate,
            time: bookedTime,
            firstName: formData.get('first-name'),
            lastName: formData.get('last-name'),
            email: formData.get('email'),
            company: formData.get('company') || '', // Handle optional fields
            phone: formData.get('phone') || '',   // Handle optional fields
            notes: formData.get('notes') || '',     // Handle optional fields
            submissionTimestamp: new Date().toISOString(),
        bookedSlotISO: bookedSlotISO, // Keep ISO string
        // Add selected package if it's a 'lets-go' call
        ...(formData.get('selected-call-type') === 'lets-go' && packageTypeSelect ? { package: packageTypeSelect.value } : {})
    };


    // --- Handle ALL Call Submissions (Planning form redirect temporarily disabled) ---
    // Send data to Make.com Webhook
    const webhookUrl = 'https://hook.eu2.make.com/jkvuy43075o4cg89hemr9vc1r7m9w1ye'; // Using the same webhook for now
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingFormData), // Send combined data including package if 'lets-go'
    })
    .then(response => {
        if (!response.ok) {
            console.warn(`Webhook response not OK: ${response.status} ${response.statusText}`);
            return response.text();
        }
        console.log('Successfully sent data to webhook.');
        return response.json(); // Or response.text() if Make doesn't return JSON
    })
    .then(data => {
        if (data) console.log('Webhook response data:', data);
    })
    .catch((error) => {
        console.error('Error sending data to webhook:', error);
    })
    .finally(() => {
        // Simulate Email (Adjust log based on actual call type)
        const callTypeTextLog = bookingFormData.callType === 'inspiring' ? 'Inspiring Call (50€)' : `Let's go Call (${bookingFormData.package || 'N/A'} Package)`;
        console.log(`--- Booking Submission (${callTypeTextLog}) ---`);
        console.log("Simulating email sending to: support@gameavatarai.de");
        console.log(`Subject: New Booking Request (${callTypeTextLog})`);
        console.log("Body:");
        console.log(` Call Type: ${callTypeTextLog}`);
        if (bookingFormData.package) console.log(` Package: ${bookingFormData.package}`); // Log package if present
        console.log(` Date: ${bookingFormData.date}`);
        console.log(` Time: ${bookingFormData.time}`);
        console.log(` Name: ${bookingFormData.firstName} ${bookingFormData.lastName}`);
        console.log(` Email: ${bookingFormData.email}`);
        if (bookingFormData.company) console.log(` Company: ${bookingFormData.company}`);
        if (bookingFormData.phone) console.log(` Phone: ${bookingFormData.phone}`);
        if (bookingFormData.notes) console.log(` Notes: ${bookingFormData.notes}`);
        console.log("--------------------------");

        // Save booking to localStorage
        try {
            let bookings = JSON.parse(localStorage.getItem(BOOKINGS_STORAGE_KEY) || '[]');
            bookings.push(bookingFormData); // Save the complete data
            localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
            removeSlotFromAvailability(bookingFormData.bookedSlotISO);
        } catch (error) {
            console.error("Error saving booking to localStorage:", error);
        }

        // Close popup and redirect to thank-you page for ALL call types now
        closeBookingPopup();
        window.location.href = 'thank-you.html?source=booking';
    });
    // --- End Combined Submission Handling ---

    /* Original fetch logic moved inside the 'else' block for Inspiring Call
    fetch(webhookUrl, {
        method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bookingData), // This part is now inside the 'else' block
        })
        .then(response => {
            if (!response.ok) {
                // ... rest of the original fetch logic ...
            }
            // ... rest of the original fetch logic ...
        });
        // --- End Webhook Send --- */
}
    // --- Attach Event Listeners ---

    // Function to handle opening the calendar popup and setting the call type
    function setupCalendarOpen(button, defaultCallType) {
        if (button) {
            button.addEventListener('click', () => {
                if (callTypeSelect) {
                    callTypeSelect.value = defaultCallType;
                    // Manually trigger change event to update UI (package selector visibility)
                    callTypeSelect.dispatchEvent(new Event('change'));
                }
                openCalendarPopup(); // Use global function
            });
        }
    }

    // Setup buttons to open calendar with specific default call type
    setupCalendarOpen(openCalendarBtnInspiring, 'inspiring');
    setupCalendarOpen(openCalendarBtnLetsGo, 'lets-go');
    setupCalendarOpen(openCalendarBtnCarousel, 'inspiring'); // Default carousel button to inspiring

    // Show/Hide Package Selector based on Call Type
    if (callTypeSelect && packageSelector && stepNumberSpan) {
        callTypeSelect.addEventListener('change', () => {
            if (callTypeSelect.value === 'lets-go') {
                packageSelector.style.display = 'block';
                stepNumberSpan.textContent = '3'; // Change step number for time slot selection
            } else {
                packageSelector.style.display = 'none';
                stepNumberSpan.textContent = '2'; // Reset step number
            }
        });
        // Initial check in case the default value is 'lets-go' (though unlikely here)
        if (callTypeSelect.value === 'lets-go') {
             packageSelector.style.display = 'block';
             stepNumberSpan.textContent = '3';
        }
    }

    // Close Calendar Popup
    if (closeCalendarPopupButton) { // closeCalendarPopupButton is global now
        closeCalendarPopupButton.addEventListener('click', closeCalendarPopup); // Use global function
    }
    if (calendarPopupOverlay) { // calendarPopupOverlay is global now
        calendarPopupOverlay.addEventListener('click', closeCalendarPopup); // Close on overlay click
    }
    if (calendarPopup) { // calendarPopup is global now
        calendarPopup.addEventListener('click', (event) => event.stopPropagation()); // Prevent closing when clicking inside
    }

    // Close Booking Details Popup
    if (closeBookingPopupButton) { // closeBookingPopupButton is global now
        closeBookingPopupButton.addEventListener('click', closeBookingPopup); // Use global function
    }
    if (bookingPopupOverlay) { // bookingPopupOverlay is global now
        bookingPopupOverlay.addEventListener('click', closeBookingPopup); // Close on overlay click
    }
    if (bookingPopup) { // bookingPopup is global now
        bookingPopup.addEventListener('click', (event) => event.stopPropagation()); // Prevent closing when clicking inside
    }

    // Booking Form Submission
    if (bookingForm) { // bookingForm is global now
        bookingForm.addEventListener('submit', handleBookingSubmit); // Attach listener to global function
    }

    // Add functions to global scope for inline onclick attributes (if any remain)
    window.closeCalendarPopup = closeCalendarPopup; // Ensure it's global if used inline
    window.closeBookingPopup = closeBookingPopup; // Ensure it's global if used inline

});
