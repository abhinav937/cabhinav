(function () {
    // ===== CONFIGURATION =====
    // Update this URL to match your Vercel deployment
    const API_URL = 'https://ai-reply-bot.vercel.app'; // ⚠️ CHANGE THIS TO YOUR ACTUAL VERCEL URL
    
    // Alternative API endpoints for testing (uncomment to use)
    // const API_URL = 'https://your-alternative-api.vercel.app';
    // const API_URL = '/api'; // For same-domain API
    
    // Debug mode - set to false to reduce console noise
    const DEBUG_MODE = false;
    
    // Fallback to relative URLs if API is not accessible
    const USE_RELATIVE_URLS = false; // Set to true if your chat is hosted on the same domain as your API
    
    // Enable local fallback mode when API is unavailable
    const ENABLE_LOCAL_FALLBACK = true;
    
    // ===== END CONFIGURATION =====
    
    // ChatAPI class for better API management
    class ChatAPI {
        constructor(apiUrl) {
            this.apiUrl = apiUrl;
            this.sessionId = this.getSessionId();
            this.isAvailable = false;
            this.lastCheck = 0;
            this.checkInterval = 30000; // Check availability every 30 seconds
            
            // Rate limiting properties
            this.rateLimited = false;
            this.rateLimitResetTime = null;
            this.rateLimitRetryAfter = null;
            
            if (DEBUG_MODE) {
                console.log('🔧 ChatAPI initialized with URL:', apiUrl);
                console.log('🔧 Session ID:', this.sessionId);
            }
        }

        getSessionId() {
            let sessionId = localStorage.getItem('chatSessionId');
            if (!sessionId) {
                // Generate a 32-character hexadecimal session ID as per the API docs
                sessionId = crypto.randomUUID().replace(/-/g, '');
                localStorage.setItem('chatSessionId', sessionId);
            }
            return sessionId;
        }

        async checkAvailability() {
            const now = Date.now();
            if (now - this.lastCheck < this.checkInterval) {
                return this.isAvailable;
            }
            
            try {
                // Try a HEAD request to the main API endpoint instead of health
                const response = await fetch(`${this.apiUrl}/api/gemini`, {
                    method: 'HEAD',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Consider 405 (Method Not Allowed) as available since it means the endpoint exists
                this.isAvailable = response.ok || response.status === 405;
                this.lastCheck = now;
                
                if (DEBUG_MODE) {
                    console.log(`🔍 API availability check: ${this.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
                }
                
                return this.isAvailable;
            } catch (error) {
                this.isAvailable = false;
                this.lastCheck = now;
                
                if (DEBUG_MODE) {
                    console.log('❌ API availability check failed:', error.message);
                }
                
                return false;
            }
        }

        async makeRequest(endpoint, options = {}) {
            // Check if API is available first
            const isAvailable = await this.checkAvailability();
            if (!isAvailable) {
                throw new Error('API is not available');
            }
            
            const url = `${this.apiUrl}${endpoint}`;
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'X-Session-ID': this.sessionId
            };

            const requestOptions = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                },
                mode: 'cors',
                credentials: 'omit'
            };

            try {
                const response = await fetch(url, requestOptions);
                return response;
            } catch (error) {
                console.error(`❌ Network error for ${endpoint}:`, error.message);
                
                // Mark API as unavailable
                this.isAvailable = false;
                this.lastCheck = Date.now();
                
                throw error;
            }
        }

        async checkHealth() {
            try {
                // Try a simple HEAD request to check if API is available
                const response = await fetch(`${this.apiUrl}/api/gemini`, {
                    method: 'HEAD',
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Consider 405 (Method Not Allowed) as healthy since it means the endpoint exists
                if (response.ok || response.status === 405) {
                    console.log('✅ API is healthy');
                    return true;
                } else {
                    throw new Error('API is unhealthy');
                }
            } catch (error) {
                console.error('❌ Health check failed:', error);
                // If it's a network error, assume API is down
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.log('Network error during health check - API unavailable');
                }
                return false;
            }
        }

        async checkRateLimit() {
            try {
                // Since we don't have a dedicated rate limit endpoint, 
                // we'll assume not rate limited and let the main API handle rate limiting
                return { rateLimited: false, remainingRequests: 10 };
            } catch (error) {
                console.error('❌ Rate limit check failed:', error);
                // If it's a network error, don't treat it as rate limiting
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    console.log('Network error during rate limit check - assuming not rate limited');
                    return { rateLimited: false, remainingRequests: 10 };
                }
                throw error;
            }
        }

        async sendMessage(prompt) {
            try {
                const response = await this.makeRequest('/api/gemini', {
                    method: 'POST',
                    body: JSON.stringify({ prompt })
                });

                if (response.status === 429) {
                    // Rate limited - extract retry info
                    const retryAfter = response.headers.get('Retry-After');
                    const retrySeconds = retryAfter ? parseInt(retryAfter) : 30;
                    
                    // Set rate limit info
                    this.rateLimited = true;
                    this.rateLimitResetTime = new Date(Date.now() + (retrySeconds * 1000));
                    this.rateLimitRetryAfter = retrySeconds;
                    
                    throw new Error(`Rate limit exceeded. Try again in ${retrySeconds} seconds.`);
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                
                // Convert 'reply' to 'response' for consistency
                if (data.reply && !data.response) {
                    data.response = data.reply;
                }
                
                // Extract rate limit info from headers
                const remainingHeader = response.headers.get('X-RateLimit-Remaining');
                if (remainingHeader) {
                    data.remainingRequests = parseInt(remainingHeader);
                }
                
                return data;
            } catch (error) {
                console.error('❌ Send message failed:', error);
                throw error;
            }
        }

        async clearHistory() {
            try {
                const response = await this.makeRequest('/api/clear', {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`Clear history failed: ${response.status}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('❌ Clear history failed:', error);
                // Return success anyway since it's not critical
                return { success: true };
            }
        }
    }

    // Local fallback responses when API is unavailable
    const LOCAL_FALLBACK_RESPONSES = [
        "I'm currently offline, but I'd be happy to help when I'm back online!",
        "Sorry, I can't connect to my server right now. Please try again later.",
        "I'm experiencing some technical difficulties. Please check back soon!",
        "Unable to process your request at the moment. I'll be back online shortly.",
        "My connection is down right now. Please try again in a few minutes."
    ];

    // ChatBot class with improved error handling
    class ChatBot {
        constructor(apiUrl) {
            this.chatAPI = new ChatAPI(apiUrl);
            this.networkError = false;
            this.rateLimited = false;
            this.remainingRequests = 10;
            this.resetTime = null;
        }

        async checkNetworkConnectivity() {
            try {
                // Quick network check with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                // Try HEAD request to the main API endpoint
                const response = await fetch(`${this.chatAPI.apiUrl}/api/gemini`, {
                    method: 'HEAD',
                    signal: controller.signal,
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                // Consider 405 (Method Not Allowed) as connected since it means the endpoint exists
                if (response.ok || response.status === 405) {
                    this.networkError = false;
                    return true;
                } else {
                    this.networkError = true;
                    return false;
                }
            } catch (error) {
                if (DEBUG_MODE) console.log('Network check failed:', error.message);
                this.networkError = true;
                return false;
            }
        }

        async checkRateLimitStatus() {
            try {
                const data = await this.chatAPI.checkRateLimit();
                this.rateLimited = data.rateLimited;
                this.remainingRequests = data.remainingRequests || 10;
                this.resetTime = data.resetTime;
                
                            // Only log rate limit status if there's an issue
            if (data.rateLimited && DEBUG_MODE) {
                console.log('Rate limit status:', data);
            }
                
                return data;
            } catch (error) {
                console.error('❌ Rate limit check failed:', error);
                // Assume not rate limited on error
                this.rateLimited = false;
                this.remainingRequests = 10;
                return { rateLimited: false, remainingRequests: 10 };
            }
        }

        getRateLimitRemainingTime() {
            if (!this.resetTime) return 0;
            const now = Date.now();
            const resetTime = this.resetTime instanceof Date ? this.resetTime.getTime() : new Date(this.resetTime).getTime();
            return Math.max(0, Math.ceil((resetTime - now) / 1000));
        }

        async sendMessage(message) {
            try {
                // Check if API is available
                const isAvailable = await this.chatAPI.checkAvailability();
                if (!isAvailable) {
                    if (ENABLE_LOCAL_FALLBACK) {
                        // Return a random fallback response
                        const randomResponse = LOCAL_FALLBACK_RESPONSES[
                            Math.floor(Math.random() * LOCAL_FALLBACK_RESPONSES.length)
                        ];
                        return { response: randomResponse, fallback: true };
                    } else {
                        throw new Error('API is not available');
                    }
                }

                const data = await this.chatAPI.sendMessage(message);
                
                // Update remaining requests from response headers if available
                if (data.remainingRequests !== undefined) {
                    this.remainingRequests = data.remainingRequests;
                }
                
                // Reset rate limit on successful request
                this.rateLimited = false;
                this.resetTime = null;
                
                return data;
            } catch (error) {
                console.error('❌ Send message failed:', error);
                
                // Check if it's a rate limit error
                if (error.message.includes('Rate limit exceeded')) {
                    // Update rate limit info from the ChatAPI
                    this.rateLimited = this.chatAPI.rateLimited;
                    this.resetTime = this.chatAPI.rateLimitResetTime;
                    this.rateLimitRetryAfter = this.chatAPI.rateLimitRetryAfter;
                    
                    // Re-throw the rate limit error to trigger proper handling
                    throw error;
                }
                
                if (ENABLE_LOCAL_FALLBACK) {
                    // Return a fallback response for other errors
                    const randomResponse = LOCAL_FALLBACK_RESPONSES[
                        Math.floor(Math.random() * LOCAL_FALLBACK_RESPONSES.length)
                    ];
                    return { response: randomResponse, fallback: true };
                }
                
                throw error;
            }
        }

        async clearHistory() {
            try {
                return await this.chatAPI.clearHistory();
            } catch (error) {
                console.error('Error clearing history:', error);
                return { success: true }; // Fallback
            }
        }
    }

    // Initialize ChatBot instance with fallback
    // You can change this URL to match your Vercel deployment
    const bot = new ChatBot(API_URL);

    // Chat interface elements
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const editBtn = document.querySelector('.edit-btn');
    const networkStatus = document.getElementById('networkStatus');
    const rateLimitTimer = document.getElementById('rateLimitTimer');
    const timerSeconds = document.getElementById('timerSeconds');
    
    // Debug: Check if timer elements exist
    console.log('Timer elements found:', {
        rateLimitTimer: !!rateLimitTimer,
        timerSeconds: !!timerSeconds
    });

    let isLoading = false;
    let lastSentTimestamp = null;
    let userScrolling = false;
    let scrollTimeout = null;
    let networkErrorShown = false;
    let networkCheckInterval = null;
    let rateLimitActive = false;
    let rateLimitShown = false;
    let rateLimitTimeout = null;
    let rateLimitCheckInterval = null;
    let rateLimitCountdownInterval = null; // Add countdown interval

    // Test API connection
    async function testAPIConnection() {
        try {
            if (DEBUG_MODE) console.log('🔍 Testing API connection to:', API_URL);
            const response = await fetch(`${API_URL}/api/gemini`, {
                method: 'HEAD',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Consider 405 (Method Not Allowed) as successful since it means the endpoint exists
            if (response.ok || response.status === 405) {
                if (DEBUG_MODE) console.log('✅ API connection successful');
                return true;
            } else {
                if (DEBUG_MODE) console.log('❌ API connection failed:', response.status);
                return false;
            }
        } catch (error) {
            if (DEBUG_MODE) console.log('❌ API connection error:', error.message);
            return false;
        }
    }

    // Test API accessibility from current domain
    async function testAPIAccessibility() {
        if (!DEBUG_MODE) return; // Skip if debug mode is off
        
        console.log('🔍 Testing API accessibility...');
        console.log('Current domain:', window.location.origin);
        console.log('API URL:', API_URL);
        
        // Test if API is accessible from current domain
        const isSameDomain = window.location.origin === new URL(API_URL).origin;
        console.log('Same domain:', isSameDomain);
        
        if (!isSameDomain) {
            console.log('⚠️ API is on different domain - CORS might be required');
            console.log('💡 Solution: Make sure your Vercel API allows CORS from this domain');
        }
        
        // Test basic connectivity
        try {
            const response = await fetch(`${API_URL}/api/gemini`, {
                method: 'HEAD',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Consider 405 (Method Not Allowed) as accessible since it means the endpoint exists
            if (response.ok || response.status === 405) {
                console.log('✅ API is accessible from this domain');
                return true;
            } else {
                console.log('❌ API returned status:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ API not accessible:', error.message);
            console.log('💡 Possible solutions:');
            console.log('1. Check if your Vercel API is deployed and running');
            console.log('2. Verify the API_URL is correct');
            console.log('3. Check CORS settings in your Vercel API');
            console.log('4. Try using relative URLs if hosting on same domain');
            return false;
        }
    }

    // Help function to diagnose API issues
    function diagnoseAPI() {
        console.log('🔧 API Diagnosis:');
        console.log('Current API URL:', API_URL);
        console.log('Expected endpoints:');
        console.log('  - GET /api/health');
        console.log('  - POST /api/gemini');
        console.log('');
        console.log('To fix this:');
        console.log('1. Check your Vercel deployment URL');
        console.log('2. Update the API_URL constant above');
        console.log('3. Make sure your Vercel app has the required endpoints');
        console.log('');
        console.log('Example:');
        console.log('const API_URL = "https://your-app-name.vercel.app";');
        console.log('');
        console.log('Rate limit endpoint should have these CORS headers:');
        console.log('res.setHeader("Access-Control-Allow-Origin", "*");');
        console.log('res.setHeader("Access-Control-Allow-Methods", "GET");');
        console.log('res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Session-ID");');
    }

    // Manual test function for debugging
    async function testRateLimitEndpoint() {
        console.log('🧪 Testing rate limit endpoint manually...');
        
        try {
            const response = await fetch(`${API_URL}/api/rate-limit-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': 'test-session-123'
                }
            });
            
            console.log('📊 Rate limit response status:', response.status);
            console.log('📊 Rate limit response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Rate limit endpoint working:', data);
                return true;
            } else {
                const errorText = await response.text();
                console.log('❌ Rate limit endpoint error:', errorText);
                return false;
            }
        } catch (error) {
            console.log('❌ Rate limit endpoint network error:', error.message);
            return false;
        }
    }

    // Check which endpoints are available
    async function checkAvailableEndpoints() {
        if (!DEBUG_MODE) return; // Skip if debug mode is off
        
        const endpoints = [
            { path: '/api/gemini', method: 'HEAD', name: 'API Availability' },
            { path: '/api/gemini', method: 'POST', name: 'Gemini API' }
        ];
        
        console.log('🔍 Checking available endpoints...');
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API_URL}${endpoint.path}`, {
                    method: endpoint.method,
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    console.log(`✅ ${endpoint.name} - Available`);
                } else if (response.status === 405) {
                    console.log(`⚠️ ${endpoint.name} - Method not allowed (endpoint exists)`);
                } else if (response.status === 404) {
                    console.log(`❌ ${endpoint.name} - Not Found (404)`);
                } else {
                    console.log(`⚠️ ${endpoint.name} - Status ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint.name} - Network Error: ${error.message}`);
            }
        }
    }



    // Initialize chat
    function initChat() {
        if (!messagesContainer || !messageInput || !sendButton) {
            console.error('Chat elements not found');
            return;
        }

        // Test API connection first
        testAPIConnection().then(isConnected => {
            if (!isConnected) {
                console.warn('⚠️ API is not available. Chat functionality may be limited.');
                diagnoseAPI(); // Run diagnosis to help debug
                addMessage('API is not available. Please check your connection or try again later.', 'error');
            } else {
                console.log('✅ API connection verified successfully');
                // Check which endpoints are available
                checkAvailableEndpoints();
            }
        });
        
        // Also test API accessibility
        testAPIAccessibility();

        // Event listeners
        sendButton.addEventListener('click', handleSend);
        messageInput.addEventListener('keydown', handleKeyDown);
        messageInput.addEventListener('input', autoResizeTextarea);
        
        // Header buttons
        if (editBtn) {
            editBtn.addEventListener('click', handleNewChat);
        }
        
        // Add scroll event listener to detect user scrolling
        const messagesWrapper = messagesContainer.closest('.messages-wrapper');
        if (messagesWrapper) {
            messagesWrapper.addEventListener('scroll', handleUserScroll);
        }
        
        // Start network and rate limit monitoring
        startNetworkMonitoring();
        startRateLimitMonitoring();

        // Focus input on load (desktop only)
        if (window.innerWidth > 768) {
            setTimeout(() => messageInput.focus(), 100);
        }
    }

    // Start continuous network monitoring
    function startNetworkMonitoring() {
        // Check network immediately
        checkNetworkStatus();
        
        // Set up periodic network checks (reduced frequency)
        networkCheckInterval = setInterval(checkNetworkStatus, 30000); // Check every 30 seconds
        
        // Also check when window gains focus
        window.addEventListener('focus', checkNetworkStatus);
        
        // Check when online/offline status changes
        window.addEventListener('online', () => {
            if (DEBUG_MODE) console.log('Browser went online');
            checkNetworkStatus();
        });
        
        window.addEventListener('offline', () => {
            if (DEBUG_MODE) console.log('Browser went offline');
            handleNetworkError();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanupNetworkMonitoring);
    }

    // Start continuous rate limit monitoring
    function startRateLimitMonitoring() {
        // Check rate limit immediately
        checkRateLimitStatus();
        
        // Set up periodic rate limit checks (reduced frequency)
        rateLimitCheckInterval = setInterval(checkRateLimitStatus, 15000); // Check every 15 seconds
        
        // Also check when window gains focus
        window.addEventListener('focus', checkRateLimitStatus);
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanupRateLimitMonitoring);
    }

    // Cleanup network monitoring
    function cleanupNetworkMonitoring() {
        if (networkCheckInterval) {
            clearInterval(networkCheckInterval);
            networkCheckInterval = null;
        }
        
        if (rateLimitTimeout) {
            clearTimeout(rateLimitTimeout);
            rateLimitTimeout = null;
        }
    }

    // Cleanup rate limit monitoring
    function cleanupRateLimitMonitoring() {
        if (rateLimitCheckInterval) {
            clearInterval(rateLimitCheckInterval);
            rateLimitCheckInterval = null;
        }
        
        if (rateLimitCountdownInterval) {
            clearInterval(rateLimitCountdownInterval);
            rateLimitCountdownInterval = null;
        }
    }

    // Start countdown timer for rate limit
    function startRateLimitCountdown() {
        // Clear any existing countdown
        if (rateLimitCountdownInterval) {
            clearInterval(rateLimitCountdownInterval);
        }
        
        if (DEBUG_MODE) console.log('Starting rate limit countdown timer');
        
        // Show the timer widget
        if (rateLimitTimer) {
            rateLimitTimer.style.display = 'flex';
        }
        
        // Start countdown that updates every second
        rateLimitCountdownInterval = setInterval(() => {
            const remainingTime = bot.getRateLimitRemainingTime();
            const totalTime = bot.rateLimitRetryAfter || 30;
            
            if (remainingTime <= 0) {
                // Rate limit expired, stop countdown
                if (DEBUG_MODE) console.log('Rate limit countdown finished - resetting');
                clearInterval(rateLimitCountdownInterval);
                rateLimitCountdownInterval = null;
                
                // Reset rate limit
                resetRateLimit();
                return;
            }
            
            // Update the timer widget
            if (timerSeconds) {
                timerSeconds.textContent = remainingTime;
            }
            
            // Update the progress circle
            if (rateLimitTimer) {
                const progressElement = rateLimitTimer.querySelector('.timer-progress');
                if (progressElement) {
                    const progress = ((totalTime - remainingTime) / totalTime) * 100;
                    progressElement.style.strokeDashoffset = 100 - progress;
                }
            }
        }, 1000); // Update every second
    }

    // Stop countdown timer
    function stopRateLimitCountdown() {
        if (rateLimitCountdownInterval) {
            if (DEBUG_MODE) console.log('Stopping rate limit countdown timer');
            clearInterval(rateLimitCountdownInterval);
            rateLimitCountdownInterval = null;
        }
        
        // Hide the timer widget
        if (rateLimitTimer) {
            rateLimitTimer.style.display = 'none';
        }
    }

    // Ensure rate limit status is visible and not overridden
    function ensureRateLimitStatusVisible() {
        if (bot.rateLimited && networkStatus) {
            const remainingTime = bot.getRateLimitRemainingTime();
            const timeText = remainingTime > 0 ? `${remainingTime}s` : 'Rate Limited';
            networkStatus.style.display = 'flex';
            networkStatus.innerHTML = `<span class="material-symbols-outlined">timer</span><span class="status-text">${timeText}</span>`;
            networkStatus.className = 'network-status rate-limited';
        }
    }

    // Check network status and update UI accordingly
    async function checkNetworkStatus() {
        try {
            // If rate limit is active, skip network status updates
            if (bot.rateLimited) {
                return;
            }
            
            // Show checking indicator briefly (but not if rate limit is active)
            if (networkStatus && !bot.networkError && !bot.rateLimited) {
                networkStatus.style.display = 'flex';
                networkStatus.innerHTML = '<span class="material-symbols-outlined">sync</span><span class="status-text">Checking...</span>';
                networkStatus.className = 'network-status checking';
            }
            
            const isConnected = await bot.checkNetworkConnectivity();
            
            if (isConnected) {
                // Network is back online
                if (bot.networkError) {
                    bot.networkError = false;
                    enableInput();
                    console.log('Network connection restored');
                    
                    // Show brief success message
                    addMessage('Network connection restored. You can now send messages.', 'bot');
                }
                
                // Hide network status indicator only if rate limit is not active
                if (networkStatus && !bot.rateLimited) {
                    networkStatus.style.display = 'none';
                }
            } else {
                // Network error detected
                handleNetworkError();
                
                // In fallback mode, show a different status
                if (ENABLE_LOCAL_FALLBACK && networkStatus) {
                    networkStatus.innerHTML = '<span class="material-symbols-outlined">wifi_off</span><span class="status-text">Offline Mode</span>';
                }
            }
        } catch (error) {
            console.error('Network check failed:', error);
            handleNetworkError();
        }
    }

    // Check rate limit status and update UI accordingly
    async function checkRateLimitStatus() {
        try {
            // Don't check if we have an active countdown timer running
            if (rateLimitCountdownInterval) {
                console.log('Skipping rate limit check - countdown timer is active');
                return;
            }
            
            const data = await bot.checkRateLimitStatus();
            
            if (data.rateLimited) {
                // Rate limit detected
                handleRateLimit();
            } else {
                // Rate limit is cleared
                if (bot.rateLimited) {
                    bot.rateLimited = false;
                    stopRateLimitCountdown(); // Stop countdown
                    enableInput();
                    if (DEBUG_MODE) console.log('Rate limit cleared');
                    
                    // Show brief success message
                    addMessage('Rate limit cleared. You can now send messages.', 'bot');
                }
            }
        } catch (error) {
            console.error('Rate limit check failed:', error);
            // Don't treat rate limit check failure as rate limiting
        }
    }

    // Handle network errors
    function handleNetworkError() {
        bot.networkError = true;
        
        // Show network status indicator
        if (networkStatus) {
            networkStatus.style.display = 'flex';
            networkStatus.innerHTML = '<span class="material-symbols-outlined">wifi_off</span><span class="status-text">Offline</span>';
            networkStatus.className = 'network-status offline';
        }
        
        // Don't disable input if fallback mode is enabled
        if (!ENABLE_LOCAL_FALLBACK) {
            disableInput();
            
            // Show network error message only once
            if (!networkErrorShown) {
                addMessage('Network connection lost. Please check your internet connection and try again.', 'error');
                networkErrorShown = true;
            }
        }
    }

    // Handle rate limiting
    function handleRateLimit() {
        console.log('handleRateLimit called - current state:', bot.rateLimited, 'countdown:', rateLimitCountdownInterval);
        
        bot.rateLimited = true;
        disableInputForRateLimit();
        
        // Show rate limit timer widget with initial countdown
        if (rateLimitTimer && timerSeconds) {
            const remainingTime = bot.getRateLimitRemainingTime();
            timerSeconds.textContent = remainingTime;
            rateLimitTimer.style.display = 'flex';
            console.log('Set initial rate limit timer:', remainingTime + 's');
        }
        
        // Hide network status widget during rate limiting
        if (networkStatus) {
            networkStatus.style.display = 'none';
        }
        
        // Start countdown timer
        startRateLimitCountdown();
        
        // Show rate limit message only once
        if (!rateLimitShown) {
            const remainingTime = bot.getRateLimitRemainingTime();
            const message = remainingTime > 0 
                ? `Too many requests. Please wait ${remainingTime} seconds and try again.`
                : 'Too many requests. Please wait a moment and try again.';
            addMessage(message, 'error');
            rateLimitShown = true;
            if (DEBUG_MODE) console.log('Showed rate limit message:', message);
        }
        
        // Auto-reset after the retry time (backup in case countdown fails)
        const retryTime = bot.getRateLimitRemainingTime(); // Use remaining time from API
        if (DEBUG_MODE) console.log('Setting backup timeout for rate limit reset in', retryTime, 'seconds');
        rateLimitTimeout = setTimeout(() => {
            if (DEBUG_MODE) console.log('Backup timeout triggered - resetting rate limit');
            resetRateLimit();
        }, retryTime * 1000);
    }

    // Disable input when network is down
    function disableInput() {
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Network unavailable...';
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
        if (editBtn) {
            editBtn.disabled = true;
        }
    }

    // Enable input when network is back
    function enableInput() {
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Message...';
        }
        if (sendButton) {
            sendButton.disabled = false;
        }
        if (editBtn) {
            editBtn.disabled = false;
        }
        
        // Hide network status indicator only if rate limit is not active
        if (networkStatus && !bot.rateLimited && !bot.networkError) {
            networkStatus.style.display = 'none';
        }
        
        // Clear any existing error messages
        const errorMessages = messagesContainer.querySelectorAll('.error-message');
        errorMessages.forEach(errorMsg => {
            const messageDiv = errorMsg.closest('.message');
            if (messageDiv) {
                messageDiv.remove();
            }
        });
        
        // Reset error state
        networkErrorShown = false;
        rateLimitShown = false;
    }

    // Disable input for rate limiting
    function disableInputForRateLimit() {
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Rate limited...';
        }
        if (sendButton) {
            sendButton.disabled = true;
        }
        if (editBtn) {
            editBtn.disabled = true;
        }
    }

    // Reset rate limiting
    function resetRateLimit() {
        if (DEBUG_MODE) console.log('Resetting rate limit - active:', bot.rateLimited, 'countdown:', rateLimitCountdownInterval);
        
        bot.rateLimited = false;
        rateLimitShown = false;
        
        // Stop countdown timer
        stopRateLimitCountdown();
        
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Message...';
        }
        if (sendButton) {
            sendButton.disabled = false;
        }
        if (editBtn) {
            editBtn.disabled = false;
        }
        
        // Hide rate limit timer widget
        if (rateLimitTimer) {
            rateLimitTimer.style.display = 'none';
        }
        
        // Show network status widget again after rate limit is cleared
        if (networkStatus && bot.networkError) {
            networkStatus.style.display = 'flex';
        }
        
        // Clear any existing rate limit error messages
        const errorMessages = messagesContainer.querySelectorAll('.error-message');
        errorMessages.forEach(errorMsg => {
            if (errorMsg.textContent.includes('Too many requests')) {
                const messageDiv = errorMsg.closest('.message');
                if (messageDiv) {
                    messageDiv.remove();
                }
            }
        });
        
        if (DEBUG_MODE) console.log('Rate limit reset - input enabled');
    }

    // Handle send message
    async function handleSend() {
        const message = messageInput.value.trim();
        if (!message || isLoading) return;

        // Check network before sending
        if (bot.networkError) {
            addMessage('Network connection lost. Please check your internet connection and try again.', 'error');
            return;
        }

        // Check rate limiting before sending
        if (bot.rateLimited) {
            const remainingTime = bot.getRateLimitRemainingTime();
            const message = remainingTime > 0 
                ? `Too many requests. Please wait ${remainingTime} seconds and try again.`
                : 'Too many requests. Please wait a moment and try again.';
            addMessage(message, 'error');
            return;
        }

        // Add user message
        addMessage(message, 'user');
        messageInput.value = '';
        autoResizeTextarea();

        // Force scroll to bottom when user sends message
        forceScrollToBottom();

        // Show loading
        showLoading();

        // Mark send time
        lastSentTimestamp = Date.now();

        // Send to API
        try {
            const data = await bot.sendMessage(message);
            hideLoading();

            let responseTime = null;
            if (lastSentTimestamp) {
                responseTime = ((Date.now() - lastSentTimestamp) / 1000).toFixed(2) + 's';
                lastSentTimestamp = null;
            }

            if (data.response) { // Changed from data.reply to data.response
                addMessage(data.response, 'bot', responseTime, data.fallback);
            } else if (data.error) {
                addMessage('I\'m having trouble connecting right now. Please try again in a moment.', 'error');
            } else {
                addMessage('I didn\'t receive a response. Please try again.', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Error:', error);
            
            // Handle network errors specifically
            if (error.message === 'API is not available') {
                handleNetworkError();
                return;
            }
            
            // Handle rate limiting separately from network errors
            if (error.message.includes('Rate limit exceeded')) {
                console.log('Rate limit detected in handleSend, calling handleRateLimit');
                handleRateLimit();
                return;
            }
            
            // Handle different types of errors with specific messages
            let errorMessage = 'I\'m having trouble connecting to the server. Please check your internet connection and try again.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('Authentication failed')) {
                errorMessage = 'Authentication failed. Please refresh the page and try again.';
            } else if (error.message.includes('Access denied')) {
                errorMessage = 'Access denied. Please check your permissions and try again.';
            } else if (error.message.includes('Server error')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Request failed')) {
                errorMessage = error.message;
            } else if (error.name === 'AbortError') {
                errorMessage = 'Request was cancelled. Please try again.';
            } else if (error.name === 'TimeoutError') {
                errorMessage = 'Request timed out. Please try again.';
            }
            
            addMessage(errorMessage, 'error');
        }
    }

    // Handle key down events
    function handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }

    // Auto-resize textarea
    function autoResizeTextarea() {
        if (!messageInput) return;
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }

    // Add message to chat
    function addMessage(text, type, responseTime = null, isFallback = false) {
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        // Add fallback indicator if this is a fallback response
        if (isFallback) {
            messageDiv.classList.add('fallback-message');
        }

        // Create message content
        const content = document.createElement('div');
        content.className = 'message-content';

        if (type === 'loading') {
            content.innerHTML = `
                <div class="loading-message">
                    <span class="loading-icon material-symbols-outlined">sync</span>
                    <span>Thinking...</span>
                </div>
            `;
        } else if (type === 'error') {
            content.innerHTML = `
                <div class="error-message">
                    ${text}
                </div>
            `;
        } else {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.innerHTML = formatText(text);
            content.appendChild(textDiv);

            // Add actions for bot messages
            if (type === 'bot') {
                const actions = document.createElement('div');
                actions.className = 'message-actions';
                
                // Copy button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'action-btn copy-btn';
                copyBtn.title = 'Copy';
                copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span>';
                copyBtn.onclick = () => handleCopy(copyBtn, text);
                actions.appendChild(copyBtn);

                // Thumbs up
                const thumbsUpBtn = document.createElement('button');
                thumbsUpBtn.className = 'action-btn feedback-btn';
                thumbsUpBtn.title = 'Good response';
                thumbsUpBtn.innerHTML = '<span class="material-symbols-rounded">thumb_up</span>';
                thumbsUpBtn.onclick = () => handleFeedback(thumbsUpBtn, 'positive');
                actions.appendChild(thumbsUpBtn);

                // Thumbs down
                const thumbsDownBtn = document.createElement('button');
                thumbsDownBtn.className = 'action-btn feedback-btn';
                thumbsDownBtn.title = 'Bad response';
                thumbsDownBtn.innerHTML = '<span class="material-symbols-rounded">thumb_down</span>';
                thumbsDownBtn.onclick = () => handleFeedback(thumbsDownBtn, 'negative');
                actions.appendChild(thumbsDownBtn);

                // Response time
                if (responseTime) {
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'response-time';
                    timeSpan.textContent = responseTime;
                    actions.appendChild(timeSpan);
                }

                content.appendChild(actions);
            }
        }

        messageDiv.appendChild(content);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom with multiple attempts for reliability
        scrollToBottom();
        
        // Force scroll after DOM update
        requestAnimationFrame(() => {
            scrollToBottom();
        });
        
        // Additional scroll after content is fully rendered
        setTimeout(() => {
            scrollToBottom();
        }, 50);
    }

    // Handle copy with visual feedback - Safari mobile compatible
    function handleCopy(button, text) {
        // Create a temporary textarea for Safari mobile compatibility
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => {
                    showCopySuccess(button);
                }).catch(() => {
                    // Fallback to selection method
                    fallbackCopy(textarea, button);
                });
            } else {
                // Fallback for older browsers and Safari
                fallbackCopy(textarea, button);
            }
        } catch (err) {
            // Final fallback
            fallbackCopy(textarea, button);
        }
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(textarea);
        }, 100);
    }
    
    function fallbackCopy(textarea, button) {
        textarea.select();
        textarea.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showCopySuccess(button);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showCopyError(button);
        }
    }
    
    function showCopySuccess(button) {
        const icon = button.querySelector('.material-symbols-outlined');
        const originalIcon = icon.textContent;
        
        // Change to checkmark
        icon.textContent = 'check';
        button.style.color = 'var(--accent-success)';
        button.style.background = 'rgba(76, 175, 80, 0.1)';
        
        // Reset after 2 seconds
        setTimeout(() => {
            icon.textContent = originalIcon;
            button.style.color = '';
            button.style.background = '';
        }, 2000);
        
        console.log('Text copied to clipboard!');
    }
    
    function showCopyError(button) {
        button.style.color = 'var(--text-error)';
        setTimeout(() => {
            button.style.color = '';
        }, 1000);
    }

    // Handle feedback with visual feedback
    function handleFeedback(button, type) {
        const icon = button.querySelector('.material-symbols-rounded');
        const isPositive = type === 'positive';
        
        // Change icon to filled version
        if (isPositive) {
            icon.textContent = 'thumb_up';
            icon.style.fontVariationSettings = '"FILL" 1';
        } else {
            icon.textContent = 'thumb_down';
            icon.style.fontVariationSettings = '"FILL" 1';
        }
        
        // Add filled class for permanent state
        button.classList.add('feedback-given');
        
        // Disable the other feedback button in the same message
        const messageActions = button.closest('.message-actions');
        const otherFeedbackBtn = messageActions.querySelector('.feedback-btn:not(.feedback-given)');
        if (otherFeedbackBtn) {
            otherFeedbackBtn.disabled = true;
            otherFeedbackBtn.style.opacity = '0.3';
        }
        
        console.log('Feedback:', type);
        const feedbackMsg = isPositive ? 'Thanks for the feedback!' : 'We\'ll work on improving that.';
        console.log(feedbackMsg);
    }

    // Handle new chat
    function handleNewChat() {
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        // Reset scrolling state
        userScrolling = false;
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // Check network status before showing welcome message
        if (!bot.networkError) {
            addMessage('Hey there! What\'s up?', 'bot');
        }
        
        if (messageInput && window.innerWidth > 768) messageInput.focus();
    }

    // Format text with markdown-like syntax
    function formatText(text) {
        if (!text) return '';
        
        // Code blocks
        text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function(match, lang, code) {
            return `<div class="code-block">
                <div class="code-block-header">
                    <span class="language">${lang || 'javascript'}</span>
                    <div class="actions">
                        <button class="action-btn" title="Collapse">X Collapse</button>
                        <button class="action-btn" title="Wrap">Wrap</button>
                        <button class="action-btn" title="Run">▷ Run</button>
                        <button class="action-btn" title="Copy">Copy</button>
                    </div>
                </div>
                <div class="code-block-content">
                    <pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
            </div>`;
        });

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }

    // Show loading state
    function showLoading() {
        isLoading = true;
        if (sendButton) sendButton.disabled = true;
        if (messageInput) messageInput.disabled = true;
        addMessage('', 'loading');
    }

    // Hide loading state
    function hideLoading() {
        isLoading = false;
        if (sendButton) sendButton.disabled = false;
        if (messageInput) messageInput.disabled = false;

        // Remove loading message
        const loadingMessage = messagesContainer.querySelector('.loading-message');
        if (loadingMessage) {
            loadingMessage.closest('.message').remove();
        }

        if (messageInput && window.innerWidth > 768) messageInput.focus();
    }

    // Handle user scrolling
    function handleUserScroll() {
        userScrolling = true;
        
        // Clear existing timeout
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        
        // Reset userScrolling after 1 second of no scrolling
        scrollTimeout = setTimeout(() => {
            userScrolling = false;
        }, 1000);
    }

    // Force scroll to bottom (ignores user scrolling state)
    function forceScrollToBottom() {
        if (!messagesContainer) return;
        
        const messagesWrapper = messagesContainer.closest('.messages-wrapper');
        if (!messagesWrapper) return;
        
        const performScroll = () => {
            messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
        };
        
        // Immediate scroll
        performScroll();
        
        // Additional scroll after a short delay
        setTimeout(performScroll, 50);
    }

    // Scroll to bottom with improved reliability
    function scrollToBottom() {
        if (!messagesContainer) return;
        
        const messagesWrapper = messagesContainer.closest('.messages-wrapper');
        if (!messagesWrapper) return;
        
        // Don't auto-scroll if user is manually scrolling
        if (userScrolling) return;
        
        // Function to perform the scroll
        const performScroll = () => {
            if (!userScrolling) {
                messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
            }
        };
        
        // Immediate scroll
        performScroll();
        
        // Scroll after a short delay to handle dynamic content
        setTimeout(performScroll, 10);
        
        // Scroll after images and other content load
        setTimeout(performScroll, 100);
        
        // Final scroll after all animations complete
        setTimeout(performScroll, 300);
        
        // Additional scroll for mobile devices
        if (window.innerWidth <= 768) {
            setTimeout(performScroll, 500);
        }
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        if (DEBUG_MODE) console.log('Chat interface with visual feedback initializing...');
        initChat();
        
        // Initialize space background
        if (typeof initSpaceBackground === 'function') {
            const spaceContainer = document.querySelector('.space-bg-container');
            if (spaceContainer) {
                initSpaceBackground(spaceContainer);
                if (DEBUG_MODE) console.log('Space background initialized');
            }
        }
        
        // Check network status before showing welcome message
        setTimeout(async () => {
            try {
                const isConnected = await bot.checkNetworkConnectivity();
                if (isConnected && !bot.networkError) {
                    addMessage('Hey there! What\'s up?', 'bot');
                } else if (ENABLE_LOCAL_FALLBACK) {
                    // Show welcome message even if API is down (in fallback mode)
                    addMessage('Hey there! I\'m currently in offline mode, but I\'d be happy to chat when I\'m back online!', 'bot', null, true);
                }
            } catch (error) {
                console.log('Network check failed during initialization:', error);
                if (ENABLE_LOCAL_FALLBACK) {
                    addMessage('Hey there! I\'m currently in offline mode, but I\'d be happy to chat when I\'m back online!', 'bot', null, true);
                }
            }
        }, 500);
    });

})();