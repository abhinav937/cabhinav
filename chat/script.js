(function () {
    // ChatBot class for session management
    class ChatBot {
        constructor(apiUrl) {
            this.apiUrl = apiUrl;
            this.sessionId = null;
            this.isConnected = false;
        }

        async sendMessage(message) {
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
                return data;
            } catch (error) {
                console.error('API Error:', error);
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

    let isLoading = false;
    let lastSentTimestamp = null;
    let userScrolling = false;
    let scrollTimeout = null;

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
        


        // Focus input on load (desktop only)
        if (window.innerWidth > 768) {
            setTimeout(() => messageInput.focus(), 100);
        }
    }

    // Handle send message
    async function handleSend() {
        const message = messageInput.value.trim();
        if (!message || isLoading) return;

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
            
            // Handle different types of errors with specific messages
            let errorMessage = 'I\'m having trouble connecting to the server. Please check your internet connection and try again.';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message.includes('Authentication failed')) {
                errorMessage = 'Authentication failed. Please refresh the page and try again.';
            } else if (error.message.includes('Access denied')) {
                errorMessage = 'Access denied. Please check your permissions and try again.';
            } else if (error.message.includes('Too many requests')) {
                errorMessage = 'Too many requests. Please wait a moment and try again.';
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
        
        addMessage('Hey there! What\'s up?', 'bot');
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
        
        // Add welcome message
        setTimeout(() => {
            addMessage('Hey there! What\'s up?', 'bot');
        }, 500);
    });

})(); 