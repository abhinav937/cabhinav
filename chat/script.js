(function () {
    // ChatBot class for session management
    class ChatBot {
        constructor(apiUrl) {
            this.apiUrl = apiUrl;
            this.sessionId = null;
        }

        async sendMessage(message) {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add session ID if we have one
            if (this.sessionId) {
                headers['X-Session-ID'] = this.sessionId;
            }

            const response = await fetch(`${this.apiUrl}/api/gemini`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ prompt: message })
            });

            const data = await response.json();
            
            // Save session ID from first response
            if (!this.sessionId && data.sessionId) {
                this.sessionId = data.sessionId;
                this.updateSessionInfo();
            }

            return data;
        }

        async clearHistory() {
            if (!this.sessionId) return;

            const response = await fetch(`${this.apiUrl}/api/conversation`, {
                method: 'DELETE',
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            return response.json();
        }

        async getHistory() {
            if (!this.sessionId) return [];

            const response = await fetch(`${this.apiUrl}/api/conversation`, {
                method: 'GET',
                headers: {
                    'X-Session-ID': this.sessionId
                }
            });

            const data = await response.json();
            return data.messages;
        }

        // Helper method to validate and fix conversation history roles
        validateConversationHistory(history) {
            if (!Array.isArray(history)) return [];
            
            return history.map(message => {
                // Ensure role is either 'user' or 'model'
                if (message.role === 'bot' || message.role === 'assistant') {
                    return { ...message, role: 'model' };
                }
                if (message.role !== 'user' && message.role !== 'model') {
                    return { ...message, role: 'user' }; // Default to user if invalid
                }
                return message;
            });
        }

        // Method to update session info display
        updateSessionInfo() {
            const sessionInfo = document.getElementById('sessionInfo');
            const mobileSessionInfo = document.getElementById('mobileSessionInfo');
            
            if (this.sessionId) {
                const sessionText = `Session: ${this.sessionId}`;
                
                if (sessionInfo) {
                    sessionInfo.textContent = sessionText;
                }
                
                if (mobileSessionInfo) {
                    mobileSessionInfo.textContent = sessionText;
                }
            }
        }
    }

    // Initialize ChatBot instance
    const bot = new ChatBot('https://ai-reply-bot.vercel.app');

    // Function to create a new session
    async function createNewSession() {
        try {
            // Discard old session
            bot.sessionId = null;
            // Send a simple message to create a new session
            const data = await bot.sendMessage("Hello");
            
            // Only proceed if sessionId is set
            if (bot.sessionId) {
                // Remove 'Loading...' message
                const sessionInfo = document.getElementById('sessionInfo');
                const mobileSessionInfo = document.getElementById('mobileSessionInfo');
                if (sessionInfo) {
                    const loadingElement = document.getElementById('session-loading-message');
                    if (loadingElement) loadingElement.remove();
                }
                if (mobileSessionInfo) {
                    const loadingElement = document.getElementById('session-loading-message');
                    if (loadingElement) loadingElement.remove();
                }
                // Remove 'Loading...' message from session info and show session ID
                bot.updateSessionInfo();
                // Add welcome message
                const desktopMessages = document.getElementById('desktopMessages');
                const mobileMessages = document.getElementById('mobileMessages');
                if (desktopMessages) {
                    const welcomeElement = document.createElement('div');
                    welcomeElement.classList.add('desktop-message', 'desktop-bot-message');
                    welcomeElement.textContent = "Yo! wassup?";
                    desktopMessages.appendChild(welcomeElement);
                }
                if (mobileMessages) {
                    const welcomeElement = document.createElement('div');
                    welcomeElement.classList.add('mobile-message', 'mobile-bot-message');
                    welcomeElement.textContent = "Yo! wassup?";
                    mobileMessages.appendChild(welcomeElement);
                }
            }
            
            return data;
        } catch (error) {
            console.error('Error creating new session:', error);
        }
    }

    // Create session on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Set session info to 'Loading...' immediately
        const sessionInfo = document.getElementById('sessionInfo');
        const mobileSessionInfo = document.getElementById('mobileSessionInfo');
        if (sessionInfo) sessionInfo.textContent = 'Session: Loading...';
        if (mobileSessionInfo) mobileSessionInfo.textContent = 'Session: Loading...';
        setTimeout(createNewSession, 1000); // Small delay to ensure everything is loaded
    });

    const MOBILE_BREAKPOINT = 768;
    let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    let currentTab = 'chat';
    let mobileChatInitialized = false;
    let desktopChatInitialized = false;

    function initApp() {
        
        updateLayout();
        if (isMobile && !mobileChatInitialized) {
            initMobileChat();
            mobileChatInitialized = true;
        } else if (!isMobile && !desktopChatInitialized) {
            initDesktopChat();
            desktopChatInitialized = true;
        }
        window.addEventListener('resize', () => {
            const wasMobile = isMobile;
            isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
            if (wasMobile !== isMobile) {
                updateLayout();
                // Only initialize the new layout if not already done
                if (isMobile && !mobileChatInitialized) {
                    initMobileChat();
                    mobileChatInitialized = true;
                } else if (!isMobile && !desktopChatInitialized) {
                    initDesktopChat();
                    desktopChatInitialized = true;
                }
            }
        });
    }

    function updateLayout() {
        const mobileContainer = document.querySelector('.mobile-container');
        const desktopContainer = document.querySelector('.desktop-container');
        if (isMobile) {
            if (mobileContainer) mobileContainer.style.display = 'flex';
            if (desktopContainer) desktopContainer.style.display = 'none';
        } else {
            if (mobileContainer) mobileContainer.style.display = 'none';
            if (desktopContainer) desktopContainer.style.display = 'flex';
        }
    }

    function initMobileChat() {
        const messagesContainer = document.getElementById('mobileMessages');
        const input = document.getElementById('mobileInput');
        const sendButton = document.getElementById('mobileSendButton');
        
        if (!messagesContainer || !input || !sendButton) {
            console.error('Mobile chat elements not found');
            return;
        }
        
        let isLoading = false;
        
        // Function to parse and format text
        function formatText(text) {
            // Triple backtick code blocks (with optional language)
            text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function(match, lang, code) {
                // Add a wrapper for code block with a copy button
                return '<div class="code-block-wrapper"><button class="copy-btn" title="Copy"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button><pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
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
        
        // Send button click handler
        sendButton.addEventListener('click', handleSend);
        
        // Enter key handler
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });

        // New chat button event listener for mobile
        const mobileNewChatButton = document.getElementById('mobileNewChatButton');
        if (mobileNewChatButton) {
            mobileNewChatButton.addEventListener('click', async () => {
                // Clear conversation history
                await bot.clearHistory();
                
                // Clear messages
                messagesContainer.innerHTML = '';
                
                // Create new session
                await createNewSession();
                
                // Focus input
                input.focus();
            });
        }
        
        // Focus input on load
        setTimeout(() => input.focus(), 100);
        
        // In mobile: handleSend and sendToAPI
        let lastSentTimestamp = null;
        function handleSend() {
            const message = input.value.trim();
            if (!message || isLoading) return;
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            // Show loading
            showLoading();
            // Mark send time
            lastSentTimestamp = Date.now();
            // Send to API
            sendToAPI(message);
        }
        
        function addMessage(text, type, responseTime = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `mobile-message mobile-${type}-message`;
            // Message content
            let contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            if (type === 'loading') {
                const emoji = document.createElement('span');
                emoji.className = 'mobile-loading-emoji';
                emoji.textContent = '😵‍💫';
                contentDiv.appendChild(emoji);
                contentDiv.appendChild(document.createTextNode(' my brain go brrr... hold on!'));
            } else if (type === 'error') {
                messageDiv.className = 'mobile-message mobile-error-message';
                contentDiv.textContent = text;
            } else if (type === 'bot') {
                contentDiv.innerHTML = formatText(text);
                setTimeout(() => attachCopyListeners(contentDiv), 0);
            } else {
                contentDiv.textContent = text;
            }
            messageDiv.appendChild(contentDiv);
            // Action bar
            if (type !== 'loading' && type !== 'error') {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                // Copy button only for bot messages
                if (type === 'bot') {
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'copy-btn message-copy-btn';
                    copyBtn.title = 'Copy';
                    copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                    copyBtn.onclick = function(e) {
                        e.preventDefault();
                        let copyText = text;
                        navigator.clipboard.writeText(copyText).then(() => {
                            copyBtn.classList.add('copied');
                            copyBtn.title = 'Copied!';
                            copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                            setTimeout(() => {
                                copyBtn.classList.remove('copied');
                                copyBtn.title = 'Copy';
                                copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                            }, 1200);
                        });
                    };
                    actionsDiv.appendChild(copyBtn);
                    // Response time
                    if (responseTime) {
                        const timeSpan = document.createElement('span');
                        timeSpan.className = 'response-time';
                        timeSpan.textContent = responseTime;
                        actionsDiv.appendChild(timeSpan);
                    }
                }
                // Add more actions here later
                messageDiv.appendChild(actionsDiv);
            }
            messagesContainer.appendChild(messageDiv);
            scrollToBottom();
        }
        
        function showLoading() {
            isLoading = true;
            sendButton.disabled = true;
            input.disabled = true;
            addMessage('', 'loading');
        }
        
        function hideLoading() {
            isLoading = false;
            sendButton.disabled = false;
            input.disabled = false;
            
            // Remove loading message
            const loadingMessage = messagesContainer.querySelector('.mobile-loading-message');
            if (loadingMessage) {
                loadingMessage.remove();
            }
            
            input.focus();
        }
        
        function scrollToBottom() {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
        
        async function sendToAPI(prompt) {
            try {
                const data = await bot.sendMessage(prompt);
                
                hideLoading();
                
                if (data.reply) {
                    // Calculate response time
                    let responseTime = null;
                    if (lastSentTimestamp) {
                        responseTime = ((Date.now() - lastSentTimestamp) / 1000).toFixed(2) + 's';
                        lastSentTimestamp = null;
                    }
                    console.log('Raw AI response:', data.reply);
                    addMessage(data.reply, 'bot', responseTime);
                } else if (data.error) {
                    addMessage('Something went wrong. Please try again.', 'error');
                } else {
                    addMessage('No response received. Please try again.', 'error');
                }
                
            } catch (error) {
                hideLoading();
                console.error('Error:', error);
                addMessage('Network error. Please check your connection.', 'error');
            }
        }

        // Attach copy listeners for code blocks (mobile)
        function attachCopyListeners(container) {
            const copyBtns = container.querySelectorAll('.copy-btn');
            copyBtns.forEach(btn => {
                btn.onclick = function(e) {
                    e.preventDefault();
                    const code = btn.parentElement.querySelector('code');
                    if (code) {
                        navigator.clipboard.writeText(code.innerText).then(() => {
                            btn.classList.add('copied');
                            btn.title = 'Copied!';
                            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                            setTimeout(() => {
                                btn.classList.remove('copied');
                                btn.title = 'Copy';
                                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                            }, 1200);
                        });
                    }
                };
            });
        }
    }

    function initDesktopChat() {
        const desktopMessages = document.getElementById('desktopMessages');
        const desktopInput = document.getElementById('desktopInput');
        const desktopSendButton = document.getElementById('desktopSendButton');
        if (!desktopMessages || !desktopInput || !desktopSendButton) return;
        let isLoading = false;

        // Function to parse and format text
        function formatMessageText(text) {
            // Triple backtick code blocks (with optional language)
            text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function(match, lang, code) {
                return '<div class="code-block-wrapper"><button class="copy-btn" title="Copy"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button><pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre></div>';
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

        function addMessageToChat(text, sender, isError = false, isLoadingMsg = false, responseTime = null) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('desktop-message');
            // Message content
            let contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            if (isError) {
                messageElement.classList.add('desktop-error-message');
                contentDiv.textContent = text;
            } else if (isLoadingMsg) {
                messageElement.classList.add('desktop-loading-message');
                messageElement.setAttribute('id', 'desktop-loading-indicator');
                const emoji = document.createElement('span');
                emoji.classList.add('desktop-spinning-emoji');
                emoji.textContent = '😵‍💫';
                contentDiv.appendChild(emoji);
                contentDiv.appendChild(document.createTextNode(' my brain go brrr... hold on!'));
            } else {
                messageElement.classList.add(sender === 'user' ? 'desktop-user-message' : 'desktop-bot-message');
                if (sender === 'bot') {
                    contentDiv.innerHTML = formatMessageText(text);
                    setTimeout(() => attachCopyListeners(contentDiv), 0);
                } else {
                    contentDiv.textContent = text;
                }
            }
            messageElement.appendChild(contentDiv);
            // Action bar
            if (!isError && !isLoadingMsg) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                // Copy button only for bot messages
                if (sender === 'bot') {
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'copy-btn message-copy-btn';
                    copyBtn.title = 'Copy';
                    copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                    copyBtn.onclick = function(e) {
                        e.preventDefault();
                        let copyText = text;
                        navigator.clipboard.writeText(copyText).then(() => {
                            copyBtn.classList.add('copied');
                            copyBtn.title = 'Copied!';
                            copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                            setTimeout(() => {
                                copyBtn.classList.remove('copied');
                                copyBtn.title = 'Copy';
                                copyBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
                            }, 1200);
                        });
                    };
                    actionsDiv.appendChild(copyBtn);
                    // Response time
                    if (responseTime) {
                        const timeSpan = document.createElement('span');
                        timeSpan.className = 'response-time';
                        timeSpan.textContent = responseTime;
                        actionsDiv.appendChild(timeSpan);
                    }
                }
                // Add more actions here later
                messageElement.appendChild(actionsDiv);
            }
            desktopMessages.appendChild(messageElement);
            scrollToBottom(desktopMessages);
        }

        function scrollToBottom(container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }

        function showLoadingIndicator() {
            if (isLoading) return;
            isLoading = true;
            desktopSendButton.disabled = true;
            desktopInput.disabled = true;
            addMessageToChat('', 'bot', false, true);
            scrollToBottom(desktopMessages);
        }

        function hideLoadingIndicator() {
            const loadingIndicator = document.getElementById('desktop-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            isLoading = false;
            desktopSendButton.disabled = false;
            desktopInput.disabled = false;
            desktopInput.focus();
            scrollToBottom(desktopMessages);
        }

        // Desktop: track response time
        let lastDesktopSentTimestamp = null;
        async function sendMessage() {
            const prompt = desktopInput.value.trim();
            if (!prompt || isLoading) return;
            addMessageToChat(prompt, 'user');
            desktopInput.value = '';
            showLoadingIndicator();
            lastDesktopSentTimestamp = Date.now();
            (async () => {
                try {
                    const data = await bot.sendMessage(prompt);
                    hideLoadingIndicator();
                    let responseTime = null;
                    if (lastDesktopSentTimestamp) {
                        responseTime = ((Date.now() - lastDesktopSentTimestamp) / 1000).toFixed(2) + 's';
                        lastDesktopSentTimestamp = null;
                    }
                    if (data.reply) {
                        addMessageToChat(data.reply, 'bot', false, false, responseTime);
                    } else if (data.error) {
                        const simpleError = getSimpleErrorMessage(data.error);
                        addMessageToChat(simpleError, 'system', true);
                    } else {
                        addMessageToChat('No response received', 'system', true);
                    }
                } catch (error) {
                    hideLoadingIndicator();
                    console.error('Error sending message:', error);
                    const simpleError = getSimpleErrorMessage(error.message);
                    addMessageToChat(simpleError, 'system', true);
                }
            })();
        }

        // Function to convert complex errors to simple messages
        function getSimpleErrorMessage(error) {
            const errorStr = error.toString().toLowerCase();
            
            if (errorStr.includes('network') || errorStr.includes('fetch')) {
                return 'Network connection failed';
            } else if (errorStr.includes('timeout')) {
                return 'Request timed out';
            } else if (errorStr.includes('rate limit') || errorStr.includes('too many')) {
                return 'Too many requests';
            } else if (errorStr.includes('unauthorized') || errorStr.includes('401')) {
                return 'Authentication failed';
            } else if (errorStr.includes('forbidden') || errorStr.includes('403')) {
                return 'Access denied';
            } else if (errorStr.includes('not found') || errorStr.includes('404')) {
                return 'Service not found';
            } else if (errorStr.includes('server error') || errorStr.includes('500')) {
                return 'Server error occurred';
            } else if (errorStr.includes('quota') || errorStr.includes('limit')) {
                return 'Service limit reached';
            } else if (errorStr.includes('invalid_argument') || errorStr.includes('valid role')) {
                return 'Conversation context error - please try again';
            } else {
                return 'Something went wrong';
            }
        }

        // Event listeners
        desktopSendButton.addEventListener('click', sendMessage);
        desktopInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        // New chat button event listener
        const newChatButton = document.getElementById('newChatButton');
        if (newChatButton) {
            newChatButton.addEventListener('click', async () => {
                // Clear conversation history
                await bot.clearHistory();
                
                // Clear messages
                desktopMessages.innerHTML = '';
                
                // Create new session
                await createNewSession();
                
                // Focus input
                desktopInput.focus();
            });
        }

        // Auto-resize textarea
        desktopInput.addEventListener('input', () => {
            desktopInput.style.height = 'auto';
            desktopInput.style.height = Math.min(desktopInput.scrollHeight, 200) + 'px';
        });

        // Only add welcome message if chat is empty
        // if (!desktopMessages.hasChildNodes()) {
        //     addMessageToChat("Yo! wassup?", 'bot');
        // }

        // Focus input on load
        setTimeout(() => {
            desktopInput.focus();
        }, 500);
    }

    // Initialize immediately and also wait for Material Web Components
    function initializeApp() {
        try {
            initApp();
        } catch (error) {
            // Fallback: try to initialize basic functionality
            setTimeout(() => {
                try {
                    initApp();
                } catch (fallbackError) {
                    // Silent fallback
                }
            }, 1000);
        }
    }

    // Start initialization immediately
    initializeApp();

    // Also try to load Material Web Components
    if (!customElements.get('md-icon')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@material/web@1.0.0/all.js';
        script.onload = () => {
            console.log('Material Web Components loaded successfully');
            // Re-initialize with Material components
            setTimeout(initApp, 100);
        };
        script.onerror = () => {
            console.error("Failed to load Material Web Components, proceeding without them.");
            // App is already initialized, just continue
        };
        document.head.appendChild(script);
    } else {
        console.log('Material Web Components already available');
    }
})(); 