/**
 * Simple Analytics Tracker
 * 
 * This is a basic client-side analytics tracker that stores data in localStorage.
 * NOTE: This is for demonstration purposes only and has several limitations:
 * - Data is stored only in the user's browser (localStorage)
 * - Data is lost when localStorage is cleared
 * - No server-side aggregation of data from multiple users
 * - Limited storage capacity
 * 
 * For a production site, use a proper analytics service like Google Analytics
 * or implement a server-side solution.
 */

const AnalyticsTracker = (function() {
    // Storage keys
    const STORAGE_KEY = 'website_analytics_data';
    const SESSION_KEY = 'website_analytics_session';
    
    // Initialize analytics data structure if it doesn't exist
    function initializeAnalytics() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            const initialData = {
                pageViews: {},
                buttonClicks: {},
                timeSpent: {},
                referrers: {},
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        }
    }
    
    // Get analytics data from localStorage
    function getAnalyticsData() {
        initializeAnalytics();
        return JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    
    // Save analytics data to localStorage
    function saveAnalyticsData(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // Generate a simple session ID
    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Get or create session
    function getSession() {
        let session = sessionStorage.getItem(SESSION_KEY);
        if (!session) {
            session = {
                id: generateSessionId(),
                startTime: new Date().toISOString(),
                referrer: document.referrer || 'direct',
                pageEnterTimes: {}
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            session = JSON.parse(session);
        }
        return session;
    }
    
    // Save session data
    function saveSession(session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    // Track page view
    function trackPageView() {
        const pagePath = window.location.pathname;
        const pageTitle = document.title;
        const data = getAnalyticsData();
        
        // Initialize page data if it doesn't exist
        if (!data.pageViews[pagePath]) {
            data.pageViews[pagePath] = {
                title: pageTitle,
                views: 0,
                organic: 0,
                advertisement: 0
            };
        }
        
        // Increment page views
        data.pageViews[pagePath].views++;
        
        // Track referrer (very basic implementation)
        const referrer = document.referrer;
        if (referrer) {
            if (!data.referrers[referrer]) {
                data.referrers[referrer] = 0;
            }
            data.referrers[referrer]++;
            
            // Very basic organic vs ad detection (would need improvement)
            if (referrer.includes('google') || referrer.includes('bing')) {
                data.pageViews[pagePath].organic++;
            } else if (referrer.includes('ad') || referrer.includes('campaign')) {
                data.pageViews[pagePath].advertisement++;
            }
        }
        
        // Track time spent - record enter time for current page
        const session = getSession();
        session.pageEnterTimes[pagePath] = new Date().toISOString();
        saveSession(session);
        
        saveAnalyticsData(data);
    }
    
    // Track button click
    function trackButtonClick(buttonId, buttonText) {
        const data = getAnalyticsData();
        const buttonKey = buttonId || buttonText || 'unknown_button';
        
        if (!data.buttonClicks[buttonKey]) {
            data.buttonClicks[buttonKey] = {
                count: 0,
                lastClicked: null
            };
        }
        
        data.buttonClicks[buttonKey].count++;
        data.buttonClicks[buttonKey].lastClicked = new Date().toISOString();
        
        saveAnalyticsData(data);
    }
    
    // Track time spent when leaving a page
    function trackTimeSpent() {
        const pagePath = window.location.pathname;
        const session = getSession();
        
        // If we have an enter time for this page, calculate time spent
        if (session.pageEnterTimes[pagePath]) {
            const enterTime = new Date(session.pageEnterTimes[pagePath]);
            const exitTime = new Date();
            const timeSpentMs = exitTime - enterTime;
            const timeSpentSeconds = Math.round(timeSpentMs / 1000);
            
            // Only record if time spent is reasonable (e.g., not days)
            if (timeSpentSeconds > 0 && timeSpentSeconds < 3600) {
                const data = getAnalyticsData();
                
                if (!data.timeSpent[pagePath]) {
                    data.timeSpent[pagePath] = {
                        totalSeconds: 0,
                        visits: 0,
                        averageSeconds: 0
                    };
                }
                
                data.timeSpent[pagePath].totalSeconds += timeSpentSeconds;
                data.timeSpent[pagePath].visits++;
                data.timeSpent[pagePath].averageSeconds = 
                    Math.round(data.timeSpent[pagePath].totalSeconds / data.timeSpent[pagePath].visits);
                
                saveAnalyticsData(data);
            }
        }
    }
    
    // Setup event listeners for tracking
    function setupTracking() {
        // Track page view on load
        trackPageView();
        
        // Track time spent when leaving page
        window.addEventListener('beforeunload', trackTimeSpent);
        
        // Track button clicks
        document.addEventListener('click', function(event) {
            const target = event.target;
            if (target.tagName === 'BUTTON' || 
                target.tagName === 'A' || 
                target.closest('button') || 
                target.closest('a')) {
                
                const element = target.tagName === 'BUTTON' || target.tagName === 'A' ? 
                    target : (target.closest('button') || target.closest('a'));
                
                trackButtonClick(
                    element.id, 
                    element.textContent.trim()
                );
            }
        });
    }
    
    // Clear all analytics data (for testing)
    function clearAnalyticsData() {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        initializeAnalytics();
    }
    
    // Public API
    return {
        init: setupTracking,
        trackPageView: trackPageView,
        trackButtonClick: trackButtonClick,
        trackTimeSpent: trackTimeSpent,
        getData: getAnalyticsData,
        clear: clearAnalyticsData
    };
})();

// Initialize tracking when the script loads
document.addEventListener('DOMContentLoaded', AnalyticsTracker.init);
