// chatbot.js
(function () {
    // Define a minimum screen width for the chatbot to be active (e.g., 1024px for desktop only)
    const MIN_DESKTOP_WIDTH = 1024; // This will exclude most tablets and all phones

    // Check if we're on the chat page - if so, don't load the floating chatbot
    if (window.location.pathname.includes('/chat/') || window.location.pathname.endsWith('/chat')) {
        return; // Exit early if on chat page
    }

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
            if (sessionInfo && this.sessionId) {
                sessionInfo.textContent = `Session: ${this.sessionId}`;
            }
        }


    }

    // Function to check if device is mobile/tablet
    function isMobileDevice() {
        // Check screen width
        if (window.innerWidth < MIN_DESKTOP_WIDTH) {
            return true;
        }
        
        // Check for mobile user agent
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        return mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Check for touch capability (most mobile devices have touch)
        // if ('ontouchstart' in window && window.innerWidth < 1024) {
        //     return true;
        // }
    }

    // Function to initialize the chatbot
    function initChatbot() {
        // Only proceed with injecting HTML/CSS and adding listeners if on a desktop screen
        if (isMobileDevice()) {
            console.log('Chatbot not initialized: Mobile device detected or screen width is less than desktop minimum.');
            return; // Exit if mobile device
        }

        // Inject CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Material 3 Design System */
            .chatbot-container {
                --md-sys-color-primary: #6750A4;
                --md-sys-color-on-primary: #FFFFFF;
                --md-sys-color-primary-container: #EADDFF;
                --md-sys-color-on-primary-container: #21005D;
                --md-sys-color-secondary: #625B71;
                --md-sys-color-on-secondary: #FFFFFF;
                --md-sys-color-secondary-container: #E8DEF8;
                --md-sys-color-on-secondary-container: #1D192B;
                --md-sys-color-tertiary: #7D5260;
                --md-sys-color-on-tertiary: #FFFFFF;
                --md-sys-color-tertiary-container: #FFD8E4;
                --md-sys-color-on-tertiary-container: #31111D;
                --md-sys-color-surface: #FFFBFE;
                --md-sys-color-on-surface: #1C1B1F;
                --md-sys-color-surface-variant: #E7E0EC;
                --md-sys-color-on-surface-variant: #49454F;
                --md-sys-color-outline: #79747E;
                --md-sys-color-outline-variant: #CAC4D0;
                --md-sys-color-inverse-surface: #313033;
                --md-sys-color-inverse-on-surface: #F4EFF4;
                --md-sys-color-inverse-primary: #D0BCFF;
                --md-sys-color-shadow: #000000;
                --md-sys-color-scrim: #000000;
                --md-sys-color-error: #BA1A1A;
                --md-sys-color-on-error: #FFFFFF;
                --md-sys-color-error-container: #FFDAD6;
                --md-sys-color-on-error-container: #410002;
            }

            /* Chatbot container (for FAB button) */
            .chatbot-container {
                position: fixed;
                bottom: calc(2rem + env(safe-area-inset-bottom)); /* Desktop specific */
                right: calc(2rem + env(safe-area-inset-right)); /* Desktop specific */
                z-index: 1000;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --primary-color: rgb(64, 66, 70);
                --secondary-color: rgb(97, 100, 107);
                display: flex;
                flex-direction: column;
                align-items: flex-end;
            }

            /* Floating button */
            .chatbot-container md-fab.chatbot-button {
                --md-fab-container-color: var(--primary-color);
                --md-fab-icon-color: #e5e7eb;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 1000000; /* Ensure it's above other content */
            }
            .chatbot-container md-fab.chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }

            /* Chat window */
            .chatbot-container .chatbot-window {
                display: none; /* Controlled by JS */
                width: min(90vw, 380px); /* Desktop width */
                
                /* New Positioning for desktop: */
                position: fixed; /* Anchored to viewport directly */
                right: calc(2rem + env(safe-area-inset-right));
                bottom: calc(4rem + 2rem + env(safe-area-inset-bottom)); /* FAB height + container bottom + safe area */
                
                /* Dynamic Height Adjustment (initial, will be overridden by JS for max height) */
                max-height: calc(100vh - 4rem - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)); /* Max height to fit in viewport, leave space at top and bottom */

                background: rgba(15, 15, 25, 0.98);
                border-radius: 16px;
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.4),
                    0 4px 16px rgba(103, 80, 164, 0.2);
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.15);
                animation: slideIn 0.3s ease-out;
                transform-origin: bottom right;
                z-index: 1000000; /* Ensure it's above other content */
            }
            .chatbot-container .chatbot-window.visible {
                display: flex;
            }
            @keyframes slideIn {
                from { transform: scale(0.8) translateY(20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .chatbot-container .chatbot-header {
                background: linear-gradient(135deg, var(--md-sys-color-primary) 0%, #7C3AED 100%);
                color: var(--md-sys-color-on-primary);
                padding: 1rem 1.5rem;
                font-size: 1.1rem;
                font-weight: 600;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
                box-shadow: 
                    0 2px 8px rgba(103, 80, 164, 0.2),
                    0 1px 3px rgba(0, 0, 0, 0.12);
            }
            .chatbot-container .chatbot-title {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
            }
            .chatbot-container .session-info {
                font-family: 'Roboto Mono', monospace;
                background: rgba(255, 255, 255, 0.1);
                padding: 2px 6px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .chatbot-container .chatbot-close {
                cursor: pointer;
                font-size: 1.2rem;
                transition: transform 0.2s ease;
                color: var(--md-sys-color-on-primary);
            }
            .chatbot-container .chatbot-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .chatbot-container .chatbot-new-chat {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: var(--md-sys-color-on-primary);
                padding: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }
            .chatbot-container .chatbot-new-chat:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            }
            .chatbot-container .chatbot-new-chat md-icon {
                width: 18px;
                height: 18px;
            }
            .chatbot-container .chatbot-close:hover {
                transform: rotate(90deg);
            }
            .chatbot-container .chatbot-messages {
                flex: 1;
                padding: 1rem 1.5rem;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                background: rgba(10, 10, 20, 0.6);
                scrollbar-width: thin;
                scrollbar-color: rgba(103, 80, 164, 0.6) transparent;
                scroll-behavior: smooth;
            }
            .chatbot-container .chatbot-messages::-webkit-scrollbar {
                width: 8px;
            }
            .chatbot-container .chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
                border-radius: 4px;
            }
            .chatbot-container .chatbot-messages::-webkit-scrollbar-thumb {
                background: rgba(103, 80, 164, 0.4);
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
            }
            .chatbot-container .chatbot-messages::-webkit-scrollbar-thumb:hover {
                background: rgba(103, 80, 164, 0.7);
                box-shadow: 0 0 10px rgba(103, 80, 164, 0.3);
            }
            .chatbot-container .message {
                padding: 0.75rem 1rem;
                border-radius: 1.2rem;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.5;
                transition: transform 0.2s ease, background-color 0.2s ease;
                font-size: 0.95rem;
                animation: messageSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            .chatbot-container .message:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            .chatbot-container .user-message {
                background: rgba(103, 80, 164, 0.3);
                color: #FFFFFF;
                align-self: flex-end;
                border-bottom-right-radius: 0.3rem;
                border: 1px solid rgba(103, 80, 164, 0.3);
                box-shadow: 0 8px 24px rgba(103, 80, 164, 0.2);
            }
            .chatbot-container .bot-message {
                background: rgba(255, 255, 255, 0.15);
                color: #FFFFFF;
                align-self: flex-start;
                border-bottom-left-radius: 0.3rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            }
            .chatbot-container .message strong, .chatbot-container .message b {
                font-weight: 600;
                color: #EADDFF;
            }
            .chatbot-container .message em, .chatbot-container .message i {
                font-style: italic;
                color: #D0BCFF;
            }
            .chatbot-container .message code {
                background: rgba(0, 0, 0, 0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Roboto Mono', monospace;
                font-size: 0.85rem;
                color: #FFFFFF;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .chatbot-container .error-message {
                background: rgba(186, 26, 26, 0.3);
                color: #FFFFFF;
                align-self: stretch;
                text-align: center;
                border: 1px solid rgba(186, 26, 26, 0.4);
                border-radius: 0.5rem;
                box-shadow: 0 8px 24px rgba(186, 26, 26, 0.2);
            }
            .chatbot-container .loading-message {
                background: rgba(255, 255, 255, 0.15);
                color: #FFFFFF;
                font-style: italic;
                align-self: flex-start;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 1.2rem;
                padding: 0.75rem 1rem;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                animation: loadingPulse 2s ease-in-out infinite;
            }
            @keyframes loadingPulse {
                0%, 100% {
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }
                50% {
                    box-shadow: 0 12px 32px rgba(103, 80, 164, 0.3);
                }
            }
            .chatbot-container .spinning-emoji {
                animation: spin 1.5s linear infinite;
                font-size: 1rem;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .chatbot-container .chatbot-input {
                display: flex;
                padding: 1rem;
                background: rgba(255, 255, 255, 0.05);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
                z-index: 10;
                flex-shrink: 0;
                gap: 0.75rem;
                align-items: center;
            }
            .chatbot-container .chatbot-input input {
                flex: 1;
                padding: 0.75rem 1rem;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 1.5rem;
                font-size: 0.95rem;
                outline: none;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: rgba(255, 255, 255, 0.1);
                color: #FFFFFF;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                font-family: inherit;
            }
            .chatbot-container .chatbot-input input:focus {
                border-color: rgba(103, 80, 164, 0.8);
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 0 0 4px rgba(103, 80, 164, 0.2);
            }
            .chatbot-container .chatbot-input input::placeholder {
                color: rgba(255, 255, 255, 0.6);
            }
            .chatbot-container .chatbot-input md-filled-tonal-icon-button {
                width: 48px;
                height: 48px;
                border-radius: 24px;
                flex-shrink: 0;
                --md-filled-tonal-icon-button-container-color: rgba(103, 80, 164, 0.8);
                --md-filled-tonal-icon-button-icon-color: #FFFFFF;
            }
            .chatbot-container .chatbot-input md-filled-tonal-icon-button md-icon {
                width: 24px;
                height: 24px;
            }
        `;
        document.head.appendChild(style);

        // Inject HTML
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = `
            <md-fab class="chatbot-button" aria-label="Open chat">
                <md-icon slot="icon">chat</md-icon>
            </md-fab>
            <div class="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <span>Ask Me Anything</span>
                        <div class="session-info" id="sessionInfo" style="font-size: 0.7rem; opacity: 0.8; margin-top: 2px;"></div>
                    </div>
                    <div class="chatbot-controls">
                        <button class="chatbot-new-chat" onclick="newChatbotSession()" title="New chat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                        </button>
                        <div class="chatbot-close" onclick="closeChatbot()">×</div>
                    </div>
                </div>
                <div class="chatbot-messages" id="chatbotMessages" role="log" aria-live="polite"></div>
                <div class="chatbot-input">
                    <input type="text" id="chatbotInput" placeholder="Ask me anything..." aria-label="Message input" autocomplete="off">
                    <md-filled-tonal-icon-button id="sendButton" aria-label="Send message">
                        <md-icon>send</md-icon>
                    </md-filled-tonal-icon-button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Add event listener to FAB button
        const fabButton = container.querySelector('.chatbot-button');
        fabButton.addEventListener('click', () => {
            const chatWindow = document.querySelector('.chatbot-container .chatbot-window');
            if (chatWindow && chatWindow.classList.contains('visible')) {
                closeChatbot();
            } else {
                openChatbot();
            }
        });

        // Initialize chat functionality
        initChatFunctionality();
    }

    function initChatFunctionality() {
        const chatMessages = document.getElementById('chatbotMessages');
        const messageInput = document.getElementById('chatbotInput');
        const sendButton = document.getElementById('sendButton');
        let isLoading = false;

        // Initialize ChatBot instance
        const bot = new ChatBot('https://ai-reply-bot.vercel.app');

        // Function to parse and format text with bold and italic support
        function formatMessageText(text) {
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            text = text.replace(/`(.*?)`/g, '<code>$1</code>');
            text = text.replace(/\n/g, '<br>');
            return text;
        }

        function addMessageToChat(text, sender, isError = false, isLoadingMsg = false) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            
            if (isError) {
                messageElement.classList.add('error-message');
                messageElement.textContent = text;
            } else if (isLoadingMsg) {
                messageElement.classList.add('loading-message');
                messageElement.setAttribute('id', 'loading-indicator');
                const emoji = document.createElement('span');
                emoji.classList.add('spinning-emoji');
                emoji.textContent = '😵‍💫';
                messageElement.appendChild(emoji);
                messageElement.appendChild(document.createTextNode('my brain go brrr... hold on!'));
            } else {
                messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
                
                if (sender === 'bot') {
                    messageElement.innerHTML = formatMessageText(text);
                } else {
                    messageElement.textContent = text;
                }
            }
            
            chatMessages.appendChild(messageElement);
            scrollToBottom(chatMessages);
        }

        function scrollToBottom(container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }

        function showLoadingIndicator() {
            if (isLoading) return;
            isLoading = true;
            sendButton.disabled = true;
            messageInput.disabled = true;
            addMessageToChat('', 'bot', false, true);
            scrollToBottom(chatMessages);
        }

        function hideLoadingIndicator() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            isLoading = false;
            sendButton.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
            scrollToBottom(chatMessages);
        }

        async function sendMessage() {
            const prompt = messageInput.value.trim();
            if (!prompt || isLoading) return;

            addMessageToChat(prompt, 'user');
            messageInput.value = '';
            showLoadingIndicator();

            try {
                const data = await bot.sendMessage(prompt);
                
                hideLoadingIndicator();

                if (data.reply) {
                    addMessageToChat(data.reply, 'bot');
                } else if (data.error) {
                    // Show simple error message based on error type
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
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        // Create session on load
        async function initializeChatbotSession() {
            try {
                await bot.sendMessage("Hello");
            } catch (error) {
                console.error('Error initializing chatbot session:', error);
            }
        }

        // Initialize session after a short delay
        setTimeout(initializeChatbotSession, 1000);

        // Initial message
        addMessageToChat("Yo! wassup?", 'bot');

        // Focus input on load
        setTimeout(() => {
            messageInput.focus();
        }, 500);
    }

    // Function to adjust chat window position based on viewport
    function adjustChatWindowPosition() {
        const chatWindow = document.querySelector('.chatbot-container .chatbot-window');
        if (!chatWindow) return;

        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Calculate maximum height (leave some space at top and bottom)
        const maxHeight = Math.max(300, viewportHeight - 120); // Minimum 300px height, 120px buffer
        chatWindow.style.maxHeight = `${maxHeight}px`;

        // Ensure the chat window doesn't go off-screen horizontally
        const chatWindowWidth = Math.min(380, viewportWidth - 40); // Max 380px or viewport - 40px
        chatWindow.style.width = `${chatWindowWidth}px`;

        // Ensure the chat window doesn't go off-screen vertically
        const chatWindowHeight = chatWindow.offsetHeight;
        const maxBottom = viewportHeight - 20; // 20px buffer from bottom
        const currentBottom = parseInt(getComputedStyle(chatWindow).bottom) || 0;
        
        if (currentBottom + chatWindowHeight > maxBottom) {
            chatWindow.style.bottom = `${maxBottom - chatWindowHeight}px`;
        }
    }

    // Global functions for opening/closing
    window.openChatbot = function() {
        const chatWindow = document.querySelector('.chatbot-container .chatbot-window');
        if (chatWindow) {
            chatWindow.classList.add('visible');
            // Delay adjustment to ensure window is rendered
            setTimeout(adjustChatWindowPosition, 50);
        }
    };

    window.closeChatbot = function() {
        const chatWindow = document.querySelector('.chatbot-container .chatbot-window');
        if (chatWindow) {
            chatWindow.classList.remove('visible');
        }
    };

    // Global function for new chat session
    window.newChatbotSession = async function() {
        try {
            // Discard old session
            bot.sessionId = null;
            // Clear conversation history (optional, for backend cleanup)
            await bot.clearHistory();
            
            // Clear messages
            const chatMessages = document.getElementById('chatbotMessages');
            if (chatMessages) {
                chatMessages.innerHTML = '';
                addMessageToChat("Yo! wassup?", 'bot');
            }
            
            // Create new session
            await bot.sendMessage("Hello");
            
            // Focus input
            const messageInput = document.getElementById('chatbotInput');
            if (messageInput) {
                messageInput.focus();
            }
        } catch (error) {
            console.error('Error creating new chatbot session:', error);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        // Debounce resize events
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(adjustChatWindowPosition, 100);
    });

    // Load Material Web Components with error handling
    function loadMaterialComponents() {
        if (!customElements.get('md-icon')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@material/web@1.0.0/all.js';
            script.onerror = () => {
                console.warn('Failed to load Material Web Components, using fallback styling');
                // Add fallback styles for when Material Web Components fail to load
                const fallbackStyle = document.createElement('style');
                fallbackStyle.textContent = `
                    .chatbot-container md-fab {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        background: var(--primary-color);
                        color: #e5e7eb;
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    }
                    .chatbot-container md-icon {
                        font-size: 24px;
                        font-family: 'Material Icons', sans-serif;
                    }
                    .chatbot-container md-filled-tonal-icon-button {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 48px;
                        height: 48px;
                        border-radius: 24px;
                        background: rgba(103, 80, 164, 0.8);
                        color: #FFFFFF;
                        border: none;
                        cursor: pointer;
                    }
                `;
                document.head.appendChild(fallbackStyle);
            };
            document.head.appendChild(script);
        }
    }

    // Load Material Web Components
    loadMaterialComponents();
})();