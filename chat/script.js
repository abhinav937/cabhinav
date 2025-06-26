(function () {
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
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            text = text.replace(/`(.*?)`/g, '<code>$1</code>');
            text = text.replace(/\n/g, '<br>');
            console.log('Formatted text:', text);
            return text;
        }
        
        // Add welcome message if empty
        if (messagesContainer.children.length === 0) {
            addMessage('Yo! wassup?', 'bot');
            // Test formatting immediately
            setTimeout(() => {
                addMessage('**Test**: This should be *bold* and `code`!', 'bot');
            }, 500);
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
            } else {
                // User messages - no formatting for security
                messageDiv.textContent = text;
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
                const response = await fetch('https://ai-reply-bot.vercel.app/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });
                
                hideLoading();
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
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
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
            text = text.replace(/`(.*?)`/g, '<code>$1</code>');
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
                } else {
                    messageElement.textContent = text;
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
                const response = await fetch('https://ai-reply-bot.vercel.app/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                hideLoadingIndicator();

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
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

        // Auto-resize textarea
        desktopInput.addEventListener('input', () => {
            desktopInput.style.height = 'auto';
            desktopInput.style.height = Math.min(desktopInput.scrollHeight, 200) + 'px';
        });

        // Only add welcome message if chat is empty
        if (!desktopMessages.hasChildNodes()) {
            addMessageToChat("Yo! wassup?", 'bot');
            // Test formatting immediately
            setTimeout(() => {
                addMessageToChat("**Desktop Test**: This should be *bold* and `code`!", 'bot');
            }, 500);
        }

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