(function () {
    // ChatBot class for session management
    class ChatBot {
        constructor(apiUrl) {
            this.apiUrl = apiUrl;
            this.sessionId = null;
            this.isConnected = false;
            this.networkError = false;
            this.lastNetworkCheck = 0;
            this.networkCheckInterval = 10000; // Check every 10 seconds
        }

        // Check network connectivity
        async checkNetworkConnectivity() {
            const now = Date.now();
            if (now - this.lastNetworkCheck < this.networkCheckInterval) {
                return this.isConnected;
            }
            
            this.lastNetworkCheck = now;
            
            try {
                // Quick network check with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                // Try health endpoint first, fallback to main API
                let response;
                try {
                    response = await fetch(`${this.apiUrl}/api/health`, {
                        method: 'GET',
                        signal: controller.signal
                    });
                } catch (healthError) {
                    // If health endpoint fails, try the main API endpoint
                    response = await fetch(`${this.apiUrl}/api/gemini`, {
                        method: 'HEAD', // Just check if endpoint is reachable
                        signal: controller.signal
                    });
                }
                
                clearTimeout(timeoutId);
                
                if (response.ok || response.status === 405) { // 405 is OK for HEAD requests
                    this.isConnected = true;
                    this.networkError = false;
                    return true;
                } else {
                    this.isConnected = false;
                    this.networkError = true;
                    return false;
                }
            } catch (error) {
                console.log('Network check failed:', error.message);
                this.isConnected = false;
                this.networkError = true;
                return false;
            }
        }

        async sendMessage(message) {
            // Check network before sending
            const isConnected = await this.checkNetworkConnectivity();
            if (!isConnected) {
                throw new Error('NETWORK_ERROR');
            }

            try {
                const headers = {
                    'Content-Type': 'application/json'
                };

                if (this.sessionId) {
                    headers['X-Session-ID'] = this.sessionId;
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(`${this.apiUrl}/api/gemini`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ prompt: message }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    console.error('API Error:', errorMessage);
                    
                    // Handle specific HTTP status codes
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please refresh the page.');
                    } else if (response.status === 403) {
                        throw new Error('Access denied. Please check your permissions.');
                    } else if (response.status === 429) {
                        throw new Error('Too many requests. Please wait a moment and try again.');
                    } else if (response.status >= 500) {
                        throw new Error('Server error. Please try again later.');
                    } else {
                        throw new Error(`Request failed (${response.status}). Please try again.`);
                    }
                }

                const data = await response.json();
                
                if (!this.sessionId && data.sessionId) {
                    this.sessionId = data.sessionId;
                }

                this.isConnected = true;
                this.networkError = false;
                return data;
            } catch (error) {
                console.error('API Error:', error);
                
                // Check if it's a network error
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    this.isConnected = false;
                    this.networkError = true;
                    throw new Error('NETWORK_ERROR');
                } else if (error.name === 'AbortError') {
                    this.isConnected = false;
                    this.networkError = true;
                    throw new Error('NETWORK_ERROR');
                }
                
                // Don't treat rate limiting as network error
                if (error.message.includes('Too many requests')) {
                    // Keep network status as connected for rate limiting
                    this.isConnected = true;
                    this.networkError = false;
                    throw error; // Re-throw the original error
                }
                
                this.isConnected = false;
                throw error;
            }
        }

        async clearHistory() {
            if (!this.sessionId) return;

            try {
                const response = await fetch(`${this.apiUrl}/api/conversation`, {
                    method: 'DELETE',
                    headers: {
                        'X-Session-ID': this.sessionId
                    }
                });

                return response.json();
            } catch (error) {
                console.error('Error clearing history:', error);
                return { success: true }; // Fallback
            }
        }
    }

    // Initialize ChatBot instance with fallback
    const bot = new ChatBot('https://ai-reply-bot.vercel.app');

    // Chat interface elements
    const messagesContainer = document.getElementById('messagesContainer');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const editBtn = document.querySelector('.edit-btn');
    const networkStatus = document.getElementById('networkStatus');

    let isLoading = false;
    let lastSentTimestamp = null;
    let userScrolling = false;
    let scrollTimeout = null;
    let networkErrorShown = false;
    let networkCheckInterval = null;
    let rateLimitActive = false;
    let rateLimitShown = false;
    let rateLimitTimeout = null;

    // Initialize chat
    function initChat() {
        if (!messagesContainer || !messageInput || !sendButton) {
            console.error('Chat elements not found');
            return;
        }

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
        
        // Start network monitoring
        startNetworkMonitoring();

        // Focus input on load (desktop only)
        if (window.innerWidth > 768) {
            setTimeout(() => messageInput.focus(), 100);
        }
    }

    // Start continuous network monitoring
    function startNetworkMonitoring() {
        // Check network immediately
        checkNetworkStatus();
        
        // Set up periodic network checks
        networkCheckInterval = setInterval(checkNetworkStatus, 10000); // Check every 10 seconds
        
        // Also check when window gains focus
        window.addEventListener('focus', checkNetworkStatus);
        
        // Check when online/offline status changes
        window.addEventListener('online', () => {
            console.log('Browser went online');
            checkNetworkStatus();
        });
        
        window.addEventListener('offline', () => {
            console.log('Browser went offline');
            handleNetworkError();
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', cleanupNetworkMonitoring);
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

    // Check network status and update UI accordingly
    async function checkNetworkStatus() {
        try {
            // Show checking indicator briefly
            if (networkStatus && !bot.networkError) {
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
                
                // Hide network status indicator
                if (networkStatus) {
                    networkStatus.style.display = 'none';
                }
            } else {
                // Network error detected
                handleNetworkError();
            }
        } catch (error) {
            console.error('Network check failed:', error);
            handleNetworkError();
        }
    }

    // Handle network errors
    function handleNetworkError() {
        bot.networkError = true;
        disableInput();
        
        // Show network status indicator
        if (networkStatus) {
            networkStatus.style.display = 'flex';
            networkStatus.innerHTML = '<span class="material-symbols-outlined">wifi_off</span><span class="status-text">Offline</span>';
            networkStatus.className = 'network-status offline';
        }
        
        // Show network error message only once
        if (!networkErrorShown) {
            addMessage('Network connection lost. Please check your internet connection and try again.', 'error');
            networkErrorShown = true;
        }
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
        
        // Hide network status indicator
        if (networkStatus) {
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
        if (rateLimitActive) {
            addMessage('Too many requests. Please wait a moment and try again.', 'error');
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

            if (data.reply) {
                addMessage(data.reply, 'bot', responseTime);
            } else if (data.error) {
                addMessage('I\'m having trouble connecting right now. Please try again in a moment.', 'error');
            } else {
                addMessage('I didn\'t receive a response. Please try again.', 'error');
            }
        } catch (error) {
            hideLoading();
            console.error('Error:', error);
            
            // Handle network errors specifically
            if (error.message === 'NETWORK_ERROR') {
                handleNetworkError();
                return;
            }
            
            // Handle rate limiting separately from network errors
            if (error.message.includes('Too many requests')) {
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
    function addMessage(text, type, responseTime = null) {
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

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

    // Handle rate limiting
    function handleRateLimit() {
        rateLimitActive = true;
        disableInputForRateLimit();
        
        // Show rate limit status indicator
        if (networkStatus) {
            networkStatus.style.display = 'flex';
            networkStatus.innerHTML = '<span class="material-symbols-outlined">timer</span><span class="status-text">Rate Limited</span>';
            networkStatus.className = 'network-status rate-limited';
        }
        
        // Show rate limit message only once
        if (!rateLimitShown) {
            addMessage('Too many requests. Please wait a moment and try again.', 'error');
            rateLimitShown = true;
        }
        
        // Auto-reset after 30 seconds
        rateLimitTimeout = setTimeout(() => {
            resetRateLimit();
        }, 30000);
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
        rateLimitActive = false;
        rateLimitShown = false;
        
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
        
        // Hide rate limit status indicator
        if (networkStatus) {
            networkStatus.style.display = 'none';
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
        
        console.log('Rate limit reset - input enabled');
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
        console.log('Chat interface with visual feedback initializing...');
        initChat();
        
        // Initialize space background
        if (typeof initSpaceBackground === 'function') {
            const spaceContainer = document.querySelector('.space-bg-container');
            if (spaceContainer) {
                initSpaceBackground(spaceContainer);
                console.log('Space background initialized');
            }
        }
        
        // Check network status before showing welcome message
        setTimeout(async () => {
            try {
                const isConnected = await bot.checkNetworkConnectivity();
                if (isConnected && !bot.networkError) {
                    addMessage('Hey there! What\'s up?', 'bot');
                }
            } catch (error) {
                console.log('Network check failed during initialization:', error);
                // Don't show welcome message if network is down
            }
        }, 500);
    });

})(); 