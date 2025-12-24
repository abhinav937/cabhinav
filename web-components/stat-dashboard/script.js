/**
 * Stat Dashboard - Running Stats Component
 * Handles animations, number counting, and interactions
 * Integrates with Strava Personal Bests API
 */

(function() {
    'use strict';

    // API Configuration
    const API_BASE_URL = 'https://ai-reply-bot.vercel.app/api/strava/personal-bests';
    
    // Strava OAuth Configuration
    const STRAVA_CLIENT_ID = '191703'; // Your Strava App Client ID
    const STRAVA_REDIRECT_URI = window.location.origin + window.location.pathname; // Current page URL
    const STRAVA_SCOPE = 'activity:read_all'; // Required scope (matches your setup page)
    
    // Strava OAuth Authorization URL
    function getStravaAuthUrl() {
        const redirectUri = encodeURIComponent(STRAVA_REDIRECT_URI);
        return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${STRAVA_SCOPE}`;
    }
    
    // Distance mapping: API key -> dashboard data-distance attribute
    const DISTANCE_MAP = {
        '400m': '400m',
        'half_mile': 'halfmi',
        '1km': '1k',
        '1_mile': '1mi',
        '2_mile': '2mi',
        '5km': '5k',
        '10km': '10k',
        '15km': '15k',
        '10_mile': '10mi',
        '20km': '20k',
        'half_marathon': '21k',
        'marathon': '42k'
    };
    
    // Distance order matching API structure
    const DISTANCE_ORDER = [
        '400m',
        'half_mile',
        '1km',
        '1_mile',
        '2_mile',
        '5km',
        '10km',
        '15km',
        '10_mile',
        '20km',
        'half_marathon',
        'marathon',
        'fastest_pace'
    ];

    // Handle OAuth2 authorization flow
    function handleOAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        const codeParam = urlParams.get('code');
        const errorParam = urlParams.get('error');

        // If ?auth=1, redirect to Strava OAuth
        if (authParam === '1') {
            const stravaAuthUrl = getStravaAuthUrl();
            // Immediately redirect to Strava OAuth page
            window.location.href = stravaAuthUrl;
            return true; // Return true to indicate OAuth redirect
        }

        // If we have a code, clean URL immediately and exchange it for token
        if (codeParam) {
            // Clean URL immediately to prevent page reload issues
            window.history.replaceState({}, document.title, window.location.pathname);
            // Ensure dashboard is hidden during authorization
            hideDashboard();
            exchangeCodeForToken(codeParam);
            return true; // Return true to indicate OAuth processing
        }

        // If there's an error from OAuth
        if (errorParam) {
            showMessage('Authorization failed: ' + errorParam, 'error');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return true; // Return true to indicate OAuth error
        }
        
        return false; // No OAuth flow active
    }

    // Exchange authorization code for token
    async function exchangeCodeForToken(code) {
        try {
            // Ensure dashboard is hidden during token exchange
            hideDashboard();
            
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: code })
            });

            const data = await response.json();
            
            if (data.success) {
                // Remove overlay first
                removeAuthOverlay();
                // Load personal bests - this will show the dashboard when ready
                await loadPersonalBests();
            } else {
                showMessage(data.message || 'Authorization failed', 'error');
                // Only show overlay if setup is required
                if (data.setup_required) {
                    showAuthOverlay();
                }
            }
        } catch (error) {
            console.error('Error exchanging code:', error);
            showMessage('Failed to authorize. Please try again.', 'error');
        }
    }

    // Fetch personal bests from API
    async function loadPersonalBests() {
        // Hide dashboard initially - no skeleton, just hide it
        hideDashboard();
        
        try {
            const response = await fetch(API_BASE_URL);
            const data = await response.json();

            if (!data.success) {
                // Only show authorization overlay if API specifically says setup is required
                if (data.setup_required) {
                    showAuthOverlay();
                } else {
                    // Other errors - just show message, don't show overlay
                    showMessage(data.message || 'Failed to load personal bests', 'error');
                }
                return;
            }

            // We have data! Ensure dashboard is ready before populating
            // Remove any blur/hidden state first
            const dashboards = document.querySelectorAll('.stat-dashboard');
            dashboards.forEach(dashboard => {
                dashboard.classList.remove('dashboard-hidden');
            });
            
            // Small delay to ensure DOM is ready and blur is removed
            setTimeout(() => {
                populateDashboard(data.data.personal_bests);
            }, 100);

        } catch (error) {
            console.error('Error loading personal bests:', error);
            showMessage('Failed to load personal bests. Please check your connection.', 'error');
            // Don't show auth overlay on network errors
        }
    }

    // Populate dashboard with API data and prepare cards
    function populateDashboard(personalBests) {
        if (!personalBests) return;

        const cardsToShow = [];

        // Find main dashboard (non-sortable) first - it has the cards in HTML
        const mainDashboard = document.querySelector('.stat-dashboard:not(.sortable-dashboard)');
        const sortableDashboard = document.querySelector('.sortable-dashboard');
        
        // Use main dashboard for initial population (it has cards in HTML)
        const dashboard = mainDashboard || document.querySelector('.stat-dashboard');
        if (!dashboard) return;
        
        // Hide all cards initially
        const allCards = dashboard.querySelectorAll('.stat-card');
        allCards.forEach(card => {
            card.style.display = 'none';
            card.style.opacity = '0';
        });

        // Iterate through personal bests in API order
        DISTANCE_ORDER.forEach((apiKey) => {
            const pb = personalBests[apiKey];
            
            // Skip if no data for this distance
            if (!pb) {
                return;
            }
            
            // Skip fastest_pace as it's not a distance
            if (apiKey === 'fastest_pace') {
                return;
            }
            
            // Find the dashboard key from DISTANCE_MAP
            const dashboardKey = DISTANCE_MAP[apiKey];
            
            // If not in DISTANCE_MAP, skip (like half_mile, 1_mile, etc.)
            if (!dashboardKey) {
                return;
            }

            // Find card within the dashboard we're populating
            const card = dashboard.querySelector(`.stat-card[data-distance="${dashboardKey}"]`);
            if (!card) {
                return;
            }
            

            // Update time
            const valueElement = card.querySelector('.stat-value');
            if (valueElement) {
                valueElement.dataset.targetSeconds = pb.time_seconds;
                valueElement.textContent = '0:00'; // Start at 0 for animation
            }

            // Update pace
            const paceElement = card.querySelector('.stat-pace span');
            if (paceElement) {
                // Parse pace (format: "5:36" -> seconds)
                const paceParts = pb.pace_per_km.split(':');
                const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1]);
                paceElement.dataset.paceSeconds = paceSeconds;
                paceElement.dataset.distance = pb.distance;
                
                // Determine unit based on distance
                const unit = dashboardKey.includes('mi') ? 'mi' : 'km';
                paceElement.dataset.unit = unit;
                
                // For mile distances, convert pace from km to miles
                let displayPace = pb.pace_per_km;
                if (unit === 'mi') {
                    // Convert pace from per km to per mile
                    const paceSecondsPerKm = paceSeconds;
                    const paceSecondsPerMile = Math.round(paceSecondsPerKm * 1.60934);
                    const minutes = Math.floor(paceSecondsPerMile / 60);
                    const seconds = paceSecondsPerMile % 60;
                    displayPace = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
                
                // Update pace text
                const paceText = card.querySelector('.stat-pace');
                if (paceText) {
                    paceText.innerHTML = `Pace: <span data-pace-seconds="${paceSeconds}" data-distance="${pb.distance}" data-unit="${unit}">0:00</span>/${unit}`;
                }
            }

            // Update date
            const dateElement = card.querySelector('.stat-date span');
            if (dateElement && pb.start_date_local) {
                const date = new Date(pb.start_date_local);
                dateElement.textContent = formatDate(date);
            }

            // Store card for sequential reveal
            cardsToShow.push(card);
        });


        // Reorder cards in DOM to match API order
        const statsList = dashboard.querySelector('.stats-list');
        if (statsList) {
            // Remove all cards from DOM
            cardsToShow.forEach(card => {
                card.remove();
            });
            // Add them back in the correct order
            cardsToShow.forEach(card => {
                statsList.appendChild(card);
            });
        }
        
        // Now show dashboard (unblur) and reveal cards one by one
        // Ensure dashboard is fully visible before starting animations
        dashboard.classList.remove('dashboard-hidden');
        dashboard.classList.add('dashboard-visible');
        
        // Small delay to ensure blur is removed before starting animations
        setTimeout(() => {
            revealCardsSequentially(cardsToShow);
        }, 50);
        
        // If there's a separate sortable dashboard, populate it with cloned cards
        if (sortableDashboard && mainDashboard && sortableDashboard !== dashboard) {
            populateSortableDashboard(personalBests, cardsToShow);
        } else if (sortableDashboard && sortableDashboard === dashboard) {
            // If we're using sortable dashboard, add sort data and initialize buttons
            cardsToShow.forEach((card) => {
                const apiKey = Object.keys(DISTANCE_MAP).find(key => DISTANCE_MAP[key] === card.dataset.distance);
                const pb = personalBests[apiKey];
                if (pb) {
                    card.dataset.sortDistance = pb.distance;
                    // Parse pace: "5:36" -> seconds
                    const paceParts = pb.pace_per_km.split(':');
                    const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1]);
                    card.dataset.sortPace = paceSeconds;
                }
            });
            
            // Initialize sort buttons
            initSortButtons(cardsToShow);
        }
    }
    
    // Populate sortable dashboard with cloned cards
    function populateSortableDashboard(personalBests, originalCards) {
        const sortableDashboard = document.querySelector('.sortable-dashboard');
        const sortableList = document.getElementById('sortable-stats-list');
        if (!sortableDashboard || !sortableList) return;
        
        // Clear existing cards
        sortableList.innerHTML = '';
        
        // Clone cards from original dashboard
        const clonedCards = [];
        originalCards.forEach((card) => {
            const clonedCard = card.cloneNode(true);
            clonedCard.style.display = 'none';
            clonedCard.style.opacity = '0';
            clonedCard.style.visibility = 'hidden';
            clonedCard.style.transform = 'translateY(5px)';
            
            // Reset animation state
            const valueElement = clonedCard.querySelector('.stat-value');
            const paceElement = clonedCard.querySelector('.stat-pace span');
            if (valueElement) {
                valueElement.textContent = '0:00';
            }
            if (paceElement) {
                paceElement.textContent = '0:00';
            }
            
            // Store original data for sorting
            const apiKey = Object.keys(DISTANCE_MAP).find(key => DISTANCE_MAP[key] === card.dataset.distance);
            const pb = personalBests[apiKey];
            if (pb) {
                clonedCard.dataset.sortDistance = pb.distance;
                // Parse pace: "5:36" -> seconds
                const paceParts = pb.pace_per_km.split(':');
                const paceSeconds = parseInt(paceParts[0]) * 60 + parseInt(paceParts[1]);
                clonedCard.dataset.sortPace = paceSeconds;
            }
            
            clonedCards.push(clonedCard);
            sortableList.appendChild(clonedCard);
        });
        
        // Initialize sort buttons
        initSortButtons(clonedCards);
        
        // Show sortable dashboard
        setTimeout(() => {
            // Ensure dashboard is fully visible before starting animations
            sortableDashboard.classList.remove('dashboard-hidden');
            sortableDashboard.classList.add('dashboard-visible');
            
            // Small delay to ensure blur is removed before starting animations
            setTimeout(() => {
                revealCardsSequentially(clonedCards);
            }, 50);
        }, 500); // Small delay after original dashboard loads
    }
    
    // Initialize sort buttons - SUPER SIMPLE
    function initSortButtons(cards) {
        const sortButtons = document.querySelectorAll('.sort-btn');

        // Simple state tracking
        let currentActiveButton = null;
        let currentSortOrder = 'asc';

        // Initialize buttons
        sortButtons.forEach(btn => {
            btn.dataset.order = 'asc';
            btn.classList.remove('active');
            const icon = btn.querySelector('.sort-icon');
            if (icon) icon.textContent = 'unfold_more';
        });

        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sortType = btn.dataset.sort;

                // If same button clicked, toggle order
                if (currentActiveButton === btn) {
                    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    // Different button - reset to asc
                    if (currentActiveButton) {
                        currentActiveButton.classList.remove('active');
                        const oldIcon = currentActiveButton.querySelector('.sort-icon');
                        if (oldIcon) oldIcon.textContent = 'unfold_more';
                    }
                    currentActiveButton = btn;
                    currentSortOrder = 'asc';
                }

                // Update clicked button
                btn.classList.add('active');
                btn.dataset.order = currentSortOrder;
                const icon = btn.querySelector('.sort-icon');
                if (icon) {
                    // Just set the icon content - CSS will handle rotation
                    icon.textContent = 'arrow_upward'; // Always use the same icon

                }

                sortCards(cards, sortType, currentSortOrder);
            });
        });
    }
    
    // Sort cards
    function sortCards(cards, sortType, order) {
        const sortableList = document.getElementById('sortable-stats-list');
        if (!sortableList) return;
        
        // Sort cards array
        const sortedCards = [...cards].sort((a, b) => {
            let aVal, bVal;
            
            if (sortType === 'distance') {
                aVal = parseFloat(a.dataset.sortDistance) || 0;
                bVal = parseFloat(b.dataset.sortDistance) || 0;
            } else if (sortType === 'pace') {
                aVal = parseFloat(a.dataset.sortPace) || 0;
                bVal = parseFloat(b.dataset.sortPace) || 0;
            }
            
            // asc = ascending = low to high (smallest first) = arrow_upward (↑)
            // desc = descending = high to low (largest first) = arrow_downward (↓)
            let result;
            if (order === 'asc') {
                result = aVal - bVal; // Low to High: 100, 200, 300...
            } else {
                result = bVal - aVal; // High to Low: 300, 200, 100...
            }
            
            return result;
        });
        
        // Hide all cards first
        cards.forEach(card => {
            card.style.opacity = '0';
        });
        
        // Reorder in DOM
        setTimeout(() => {
            sortedCards.forEach(card => {
                sortableList.appendChild(card);
            });
            
            // Re-animate cards
            sortedCards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.display = 'block';
                    card.style.opacity = '1';
                }, index * 50);
            });
        }, 100);
    }

    // Reveal cards one by one with animation
    function revealCardsSequentially(cards) {
        if (!cards || cards.length === 0) {
            return;
        }
        
        const animationDuration = 1500; // Animation duration for each card
        const delayBetweenCards = 150; // Small delay before showing next card (start timer immediately)

        cards.forEach((card, index) => {
            setTimeout(() => {
                // Ensure card is in DOM
                if (!card.parentElement) {
                    console.warn('Card not in DOM:', card);
                    return;
                }
                
                const distance = card.dataset.distance;
                
                // Show the card - force display and reset transforms
                card.style.display = 'block';
                card.style.opacity = '1';
                card.style.visibility = 'visible';
                card.style.transform = 'translateY(0)'; // Reset any transform
                card.classList.remove('dashboard-hidden'); // Remove any hidden class
                card.classList.remove('loading'); // Remove loading class if present
                
                // Immediately start animation for this card (don't wait for previous to finish)
                const valueElement = card.querySelector('.stat-value');
                const paceElement = card.querySelector('.stat-pace span');
                
                if (valueElement && valueElement.dataset.targetSeconds) {
                    // Animate time
                    valueElement.dataset.duration = animationDuration;
                    animateTime(valueElement);
                    
                    // Animate pace simultaneously
                    if (paceElement) {
                        const paceSeconds = parseInt(paceElement.dataset.paceSeconds);
                        if (!isNaN(paceSeconds)) {
                            animatePace(paceElement, paceSeconds, animationDuration);
                        }
                    }
                }
            }, index * delayBetweenCards); // Small delay, timers run simultaneously
        });
    }

    // Format date for display
    function formatDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    // Hide dashboard (blur and hide) - hide all dashboards
    function hideDashboard() {
        const dashboards = document.querySelectorAll('.stat-dashboard');
        dashboards.forEach(dashboard => {
            dashboard.classList.add('dashboard-hidden');
            dashboard.classList.remove('dashboard-visible');
        });
    }

    // Show dashboard (unblur and show) - show specific dashboard or all
    function showDashboard(specificDashboard = null) {
        if (specificDashboard) {
            specificDashboard.classList.remove('dashboard-hidden');
            specificDashboard.classList.add('dashboard-visible');
        } else {
            const dashboards = document.querySelectorAll('.stat-dashboard');
            dashboards.forEach(dashboard => {
                dashboard.classList.remove('dashboard-hidden');
                dashboard.classList.add('dashboard-visible');
            });
        }
    }

    // Show authorization overlay
    function showAuthOverlay() {
        // Remove existing overlay
        const existing = document.querySelector('.auth-overlay');
        if (existing) {
            existing.remove();
        }

        const dashboard = document.querySelector('.stat-dashboard');
        if (!dashboard) return;

        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-overlay-content">
                <span class="material-symbols-outlined" style="font-size: 48px; margin-bottom: 1rem;">lock</span>
                <h3>Strava Authorization Needed</h3>
                <p>Please authorize Strava to view your personal best times.</p>
                <a href="?auth=1" class="auth-button">
                    <span class="material-symbols-outlined">lock_open</span>
                    Authorize with Strava
                </a>
            </div>
        `;

        // Insert overlay before dashboard
        const parent = dashboard.parentElement;
        if (parent) {
            parent.insertBefore(overlay, dashboard);
        }
    }

    // Remove authorization overlay
    function removeAuthOverlay() {
        const overlay = document.querySelector('.auth-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Show message to user
    function showMessage(message, type = 'info') {
        // Remove existing message
        const existing = document.querySelector('.api-message');
        if (existing) {
            existing.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `api-message api-message-${type}`;
        messageDiv.textContent = message;
        
        const demoSection = document.querySelector('.demo-section');
        if (demoSection) {
            demoSection.insertBefore(messageDiv, demoSection.firstChild.nextSibling);
        }

        // Auto-remove after 5 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }


    // Show authorization instructions
    function showAuthInstructions() {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'auth-prompt';
        promptDiv.innerHTML = `
            <h3>Strava OAuth Configuration Required</h3>
            <p>To enable automatic OAuth redirect, you need to configure your Strava Client ID:</p>
            <ol>
                <li>Get your Strava Client ID from <a href="https://www.strava.com/settings/api" target="_blank" style="color: rgba(0, 255, 0, 0.8);">Strava API Settings</a></li>
                <li>Set <code>STRAVA_CLIENT_ID</code> in <code>script.js</code></li>
                <li>Make sure your redirect URI matches: <code>${STRAVA_REDIRECT_URI}</code></li>
            </ol>
            <p><strong>Alternative:</strong> You can manually authorize by:</p>
            <ol>
                <li>Get your Strava authorization code from the Strava OAuth flow</li>
                <li>Visit this page with <code>?code=YOUR_CODE</code> parameter, or</li>
                <li>Use the API POST endpoint directly:
                    <pre style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-top: 0.5rem; overflow-x: auto;"><code>curl -X POST ${API_BASE_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"code": "YOUR_AUTHORIZATION_CODE"}'</code></pre>
                </li>
            </ol>
            <p><a href="${window.location.pathname}" style="color: rgba(0, 255, 0, 0.8); text-decoration: underline;">← Back to dashboard</a></p>
        `;
        
        const demoSection = document.querySelector('.demo-section');
        if (demoSection) {
            const dashboard = demoSection.querySelector('.stat-dashboard');
            if (dashboard) {
                demoSection.insertBefore(promptDiv, dashboard);
            } else {
                demoSection.appendChild(promptDiv);
            }
        }
    }

    // Initialize stat dashboard
    function initStatDashboard() {
        try {
            const dashboard = document.querySelector('.stat-dashboard');
            if (!dashboard) {
                return;
            }

            const cards = dashboard.querySelectorAll('.stat-card');
            const animationDuration = 1500; // Same duration for all animations
            const staggerDelay = 150; // Delay between each card animation
            
            // Animate cards one by one
            cards.forEach((card, index) => {
                try {
                    const valueElement = card.querySelector('.stat-value');
                    if (valueElement) {
                        // Check if it's a time format (PB card)
                        if (valueElement.dataset.format === 'time' && valueElement.dataset.targetSeconds) {
                            // Stagger each card animation
                            setTimeout(() => {
                                // Set duration for this animation
                                valueElement.dataset.duration = animationDuration;
                                // Start from 0
                                valueElement.textContent = formatTime(0);
                                // Animate to final value
                                animateTime(valueElement);
                                // Animate pace simultaneously (starts from 0)
                                updatePace(card, animationDuration);
                            }, index * staggerDelay);
                        } else if (valueElement.dataset.target) {
                            setTimeout(() => {
                                // Set duration for this animation
                                valueElement.dataset.duration = animationDuration;
                                // Start from 0
                                valueElement.textContent = '0' + (valueElement.dataset.unit ? ' ' + valueElement.dataset.unit : '');
                                // Animate to final value
                                animateNumber(valueElement);
                            }, index * staggerDelay);
                        }
                    }
                } catch (error) {
                    console.error('Error initializing card:', error);
                }
            });

            // Add mouse tracking for glow effect on dashboard - throttled
            let mouseThrottle = false;
            dashboard.addEventListener('mousemove', function(e) {
                if (mouseThrottle) return;
                mouseThrottle = true;
                
                try {
                    const rect = this.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    this.style.setProperty('--hover-x', x + '%');
                    this.style.setProperty('--hover-y', y + '%');
                } catch (error) {
                    // Silently fail on mouse tracking errors
                }
                
                setTimeout(() => {
                    mouseThrottle = false;
                }, 16); // ~60fps throttle
            });
        } catch (error) {
            console.error('Error initializing stat dashboard:', error);
        }
    }

    // Animate time counting (for PB times) - always starts from 0
    function animateTime(element) {
        if (!element || !element.dataset.targetSeconds) return;
        
        const targetSeconds = parseInt(element.dataset.targetSeconds);
        if (isNaN(targetSeconds) || targetSeconds < 0) {
            element.textContent = formatTime(0);
            return;
        }
        
        const duration = parseInt(element.dataset.duration) || 1500;
        const start = 0; // Always start from 0
        const startTime = performance.now();
        let animationFrameId = null;

        function update(currentTime) {
            try {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentSeconds = Math.floor(start + (targetSeconds - start) * easeOut);
                
                element.textContent = formatTime(currentSeconds);
                
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(update);
                } else {
                    // Ensure final value is exact
                    element.textContent = formatTime(targetSeconds);
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                }
            } catch (error) {
                console.error('Error in time animation:', error);
                element.textContent = formatTime(targetSeconds);
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        // Start from 0
        element.textContent = formatTime(0);
        animationFrameId = requestAnimationFrame(update);
    }

    // Format time (seconds to HH:MM:SS or MM:SS) - moved before use
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Format pace (seconds per mile/km) - moved before use
    function formatPace(secondsPerUnit) {
        if (isNaN(secondsPerUnit) || secondsPerUnit < 0) return '0:00';
        const minutes = Math.floor(secondsPerUnit / 60);
        const seconds = Math.floor(secondsPerUnit % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Animate pace counting - always starts from 0
    function animatePace(element, targetPaceSeconds, duration) {
        if (!element || isNaN(targetPaceSeconds) || targetPaceSeconds < 0) {
            element.textContent = formatPace(0);
            return;
        }
        
        const start = 0; // Always start from 0
        const startTime = performance.now();
        let animationFrameId = null;

        function update(currentTime) {
            try {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentPaceSeconds = start + (targetPaceSeconds - start) * easeOut;
                
                element.textContent = formatPace(currentPaceSeconds);
                
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(update);
                } else {
                    // Ensure final value is exact
                    element.textContent = formatPace(targetPaceSeconds);
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                }
            } catch (error) {
                console.error('Error in pace animation:', error);
                element.textContent = formatPace(targetPaceSeconds);
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        // Start from 0
        element.textContent = formatPace(0);
        animationFrameId = requestAnimationFrame(update);
    }

    // Update pace display with animation
    function updatePace(card, duration = 1500) {
        const valueElement = card.querySelector('.stat-value');
        const paceElement = card.querySelector('.stat-pace span');
        if (!valueElement || !paceElement) return;

        const totalSeconds = parseInt(valueElement.dataset.targetSeconds);
        if (isNaN(totalSeconds)) return;
        
        const distanceMeters = parseInt(paceElement.dataset.distance) || 1000;
        const unit = paceElement.dataset.unit || 'km';
        const paceSeconds = parseInt(paceElement.dataset.paceSeconds);
        
        let targetPaceSeconds;
        if (paceSeconds && !isNaN(paceSeconds)) {
            targetPaceSeconds = paceSeconds;
        } else {
            // Calculate pace from time and distance
            if (unit === 'mi') {
                // Pace per mile
                const distanceMiles = distanceMeters / 1609.34;
                targetPaceSeconds = totalSeconds / distanceMiles;
            } else {
                // Pace per km
                const distanceKm = distanceMeters / 1000;
                targetPaceSeconds = totalSeconds / distanceKm;
            }
        }
        
        // Animate pace from 0 to target
        animatePace(paceElement, targetPaceSeconds, duration);
    }

    // Animate number counting - always starts from 0
    function animateNumber(element) {
        if (!element || !element.dataset.target) return;
        
        const target = parseFloat(element.dataset.target);
        if (isNaN(target)) return;
        
        const duration = parseInt(element.dataset.duration) || 1500;
        const decimals = element.dataset.decimals ? parseInt(element.dataset.decimals) : 0;
        const unit = element.dataset.unit || '';
        const start = 0; // Always start from 0
        const startTime = performance.now();
        let animationFrameId = null;

        function update(currentTime) {
            try {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = start + (target - start) * easeOut;
                
                // Format number
                let formatted;
                if (decimals > 0) {
                    formatted = current.toFixed(decimals);
                } else {
                    formatted = Math.floor(current).toLocaleString();
                }
                
                element.textContent = formatted + (unit ? ' ' + unit : '');
                
                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(update);
                } else {
                    // Ensure final value is exact
                    let finalFormatted;
                    if (decimals > 0) {
                        finalFormatted = target.toFixed(decimals);
                    } else {
                        finalFormatted = Math.floor(target).toLocaleString();
                    }
                    element.textContent = finalFormatted + (unit ? ' ' + unit : '');
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                }
            } catch (error) {
                console.error('Error in number animation:', error);
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            }
        }

        // Start from 0
        element.textContent = '0' + (unit ? ' ' + unit : '');
        animationFrameId = requestAnimationFrame(update);
    }


    // Format distance
    function formatDistance(meters, unit = 'mi') {
        if (unit === 'mi') {
            const miles = meters / 1609.34;
            return miles.toFixed(2);
        } else {
            const km = meters / 1000;
            return km.toFixed(2);
        }
    }

    // Update stat card programmatically
    window.updateStatCard = function(cardSelector, value, options = {}) {
        const card = document.querySelector(cardSelector);
        if (!card) return;

        const valueElement = card.querySelector('.stat-value');
        if (!valueElement) return;

        const {
            animate = true,
            duration = 2000,
            decimals = 0,
            unit = '',
            change = null,
            progress = null
        } = options;

        if (animate) {
            valueElement.dataset.target = value;
            valueElement.dataset.duration = duration;
            valueElement.dataset.decimals = decimals;
            valueElement.dataset.unit = unit;
            animateNumber(valueElement);
        } else {
            let formatted;
            if (decimals > 0) {
                formatted = parseFloat(value).toFixed(decimals);
            } else {
                formatted = Math.floor(value).toLocaleString();
            }
            valueElement.textContent = formatted + (unit ? ' ' + unit : '');
        }

        // Update change indicator
        if (change !== null) {
            let changeElement = card.querySelector('.stat-change');
            if (!changeElement) {
                changeElement = document.createElement('div');
                changeElement.className = 'stat-change';
                card.querySelector('.stat-value').parentElement.appendChild(changeElement);
            }
            
            const isPositive = change >= 0;
            changeElement.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
            changeElement.innerHTML = `
                <span class="material-symbols-outlined">${isPositive ? 'trending_up' : 'trending_down'}</span>
                <span>${Math.abs(change).toFixed(1)}%</span>
            `;
        }

        // Update progress bar
        if (progress !== null) {
            let progressContainer = card.querySelector('.stat-progress');
            if (!progressContainer) {
                progressContainer = document.createElement('div');
                progressContainer.className = 'stat-progress';
                card.appendChild(progressContainer);
            }

            const progressBar = progressContainer.querySelector('.stat-progress-bar') || 
                               document.createElement('div');
            progressBar.className = 'stat-progress-bar';
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            
            if (!progressContainer.querySelector('.stat-progress-bar')) {
                progressContainer.appendChild(progressBar);
            }

            const progressText = progressContainer.querySelector('.stat-progress-text') ||
                               document.createElement('div');
            progressText.className = 'stat-progress-text';
            progressText.textContent = `${Math.min(progress, 100).toFixed(0)}% of goal`;
            
            if (!progressContainer.querySelector('.stat-progress-text')) {
                progressContainer.appendChild(progressText);
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Hide dashboard initially
            hideDashboard();
            // Handle OAuth first - if it returns true, don't load personal bests yet
            const oauthActive = handleOAuth();
            // Only load personal bests if OAuth is not active (no redirect, no code processing)
            if (!oauthActive) {
                loadPersonalBests();
            }
        });
    } else {
        // Hide dashboard initially
        hideDashboard();
        // Handle OAuth first - if it returns true, don't load personal bests yet
        const oauthActive = handleOAuth();
        // Only load personal bests if OAuth is not active (no redirect, no code processing)
        if (!oauthActive) {
            loadPersonalBests();
        }
    }

    // Re-initialize for dynamically added cards - DISABLED to prevent performance issues
    // If you need dynamic updates, call initStatDashboard() manually
    // const observer = new MutationObserver(function(mutations) {
    //     mutations.forEach(function(mutation) {
    //         if (mutation.addedNodes.length) {
    //             initStatDashboard();
    //         }
    //     });
    // });

    // observer.observe(document.body, {
    //     childList: true,
    //     subtree: true
    // });

})();

