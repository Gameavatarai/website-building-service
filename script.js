document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel-3d');
    const scene = document.querySelector('.scene');
    if (!carousel || !scene) return;

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
    
    if (!quickAccess) {
        console.error("Quick Access element not found!");
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
                } else if (action === 'ai-details') { // Added navigation for AI details
                    window.location.href = 'ai-details.html';
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
