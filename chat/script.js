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

    // Google Sheets logging
    const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx4YMBhm3rlBwpACEE1JRmAQT3O2WhYI3W4cMO-2f8yF1tJ9ML21B-jSiPfdcbKrgrgfw/exec';

    function logChatToSheet({ sessionId, sender, message, feedback }) {
      fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          sender,
          message,
          feedback: feedback || ''
        }),
        headers: { 'Content-Type': 'application/json' }
      }).catch(err => console.log('Logging error:', err));
    }

    function createOptionsBar({ messageText, sessionId, container, isMobile }) {
      const bar = document.createElement('div');
      bar.className = isMobile ? 'mobile-message-options' : 'desktop-message-options';
      
      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'options-btn copy-btn';
      copyBtn.title = 'Copy';
      copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(messageText).then(() => {
          copyBtn.classList.add('copied');
          setTimeout(() => copyBtn.classList.remove('copied'), 1000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = messageText;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          copyBtn.classList.add('copied');
          setTimeout(() => copyBtn.classList.remove('copied'), 1000);
        });
      };
      
      // Like button
      const likeBtn = document.createElement('button');
      likeBtn.className = 'options-btn like-btn';
      likeBtn.title = 'Like';
      likeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`;
      
      // Dislike button
      const dislikeBtn = document.createElement('button');
      dislikeBtn.className = 'options-btn dislike-btn';
      dislikeBtn.title = 'Dislike';
      dislikeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>`;
      
      // Feedback logic
      let feedbackState = null;
      likeBtn.onclick = () => {
        if (feedbackState === 'like') {
          feedbackState = null;
          likeBtn.classList.remove('active');
        } else {
          feedbackState = 'like';
          likeBtn.classList.add('active');
          dislikeBtn.classList.remove('active');
          logChatToSheet({ sessionId, sender: 'feedback', message: messageText, feedback: 'like' });
        }
      };
      
      dislikeBtn.onclick = () => {
        if (feedbackState === 'dislike') {
          feedbackState = null;
          dislikeBtn.classList.remove('active');
        } else {
          feedbackState = 'dislike';
          dislikeBtn.classList.add('active');
          likeBtn.classList.remove('active');
          logChatToSheet({ sessionId, sender: 'feedback', message: messageText, feedback: 'dislike' });
        }
      };
      
      bar.appendChild(copyBtn);
      bar.appendChild(likeBtn);
      bar.appendChild(dislikeBtn);
      container.appendChild(bar);
    }

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
            console.log('Formatting text:', text);
            // Triple backtick code blocks (with optional language)
            text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function(match, lang, code) {
                return '<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
            });
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            // Bold
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Line breaks
            text = text.replace(/\n/g, '<br>');
            console.log('Formatted text:', text);
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
        
        function handleSend() {
            const message = input.value.trim();
            if (!message || isLoading) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Show loading
            showLoading();
            
            // Send to API
            sendToAPI(message);
        }
        
        function addMessage(text, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `mobile-message mobile-${type}-message`;
            
            if (type === 'loading') {
                const emoji = document.createElement('span');
                emoji.className = 'mobile-loading-emoji';
                emoji.textContent = '😵‍💫';
                messageDiv.appendChild(emoji);
                messageDiv.appendChild(document.createTextNode(' my brain go brrr... hold on!'));
            } else if (type === 'error') {
                messageDiv.className = 'mobile-message mobile-error-message';
                messageDiv.textContent = text;
            } else if (type === 'bot') {
                // Apply formatting to bot messages
                messageDiv.innerHTML = formatText(text);
                logChatToSheet({ sessionId: bot.sessionId, sender: 'bot', message: text });
                // Add options bar
                createOptionsBar({ messageText: text, sessionId: bot.sessionId, container: messageDiv, isMobile: true });
            } else {
                // User messages - no formatting for security
                messageDiv.textContent = text;
                logChatToSheet({ sessionId: bot.sessionId, sender: 'user', message: text });
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
                    console.log('Raw AI response:', data.reply);
                    addMessage(data.reply, 'bot');
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
    }

    function initDesktopChat() {
        const desktopMessages = document.getElementById('desktopMessages');
        const desktopInput = document.getElementById('desktopInput');
        const desktopSendButton = document.getElementById('desktopSendButton');
        if (!desktopMessages || !desktopInput || !desktopSendButton) return;
        let isLoading = false;

        // Function to parse and format text
        function formatMessageText(text) {
            console.log('Desktop formatting text:', text);
            // Triple backtick code blocks (with optional language)
            text = text.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, function(match, lang, code) {
                return '<pre><code>' + code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>';
            });
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
            // Bold
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Italic
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // Line breaks
            text = text.replace(/\n/g, '<br>');
            console.log('Desktop formatted text:', text);
            return text;
        }

        function addMessageToChat(text, sender, isError = false, isLoadingMsg = false) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('desktop-message');
            
            if (isError) {
                messageElement.classList.add('desktop-error-message');
                messageElement.textContent = text;
            } else if (isLoadingMsg) {
                messageElement.classList.add('desktop-loading-message');
                messageElement.setAttribute('id', 'desktop-loading-indicator');
                const emoji = document.createElement('span');
                emoji.classList.add('desktop-spinning-emoji');
                emoji.textContent = '😵‍💫';
                messageElement.appendChild(emoji);
                messageElement.appendChild(document.createTextNode(' my brain go brrr... hold on!'));
            } else {
                messageElement.classList.add(sender === 'user' ? 'desktop-user-message' : 'desktop-bot-message');
                
                if (sender === 'bot') {
                    messageElement.innerHTML = formatMessageText(text);
                    logChatToSheet({ sessionId: bot.sessionId, sender: 'bot', message: text });
                    // Add options bar
                    createOptionsBar({ messageText: text, sessionId: bot.sessionId, container: messageElement, isMobile: false });
                } else {
                    messageElement.textContent = text;
                    logChatToSheet({ sessionId: bot.sessionId, sender: 'user', message: text });
                }
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

        async function sendMessage() {
            const prompt = desktopInput.value.trim();
            if (!prompt || isLoading) return;

            addMessageToChat(prompt, 'user');
            desktopInput.value = '';
            showLoadingIndicator();

            try {
                const data = await bot.sendMessage(prompt);
                
                hideLoadingIndicator();

                if (data.reply) {
                    console.log('Desktop Raw AI response:', data.reply);
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