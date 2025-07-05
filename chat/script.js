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
            
            // Clear the messages containers and add welcome message
            const desktopMessages = document.getElementById('desktopMessages');
            const mobileMessages = document.getElementById('mobileMessages');
            
            if (desktopMessages) {
                desktopMessages.innerHTML = '';
                // Create a simple welcome message element
                const welcomeElement = document.createElement('div');
                welcomeElement.classList.add('desktop-message', 'desktop-bot-message');
                welcomeElement.textContent = "Yo! wassup?";
                desktopMessages.appendChild(welcomeElement);
            }
            
            if (mobileMessages) {
                mobileMessages.innerHTML = '';
                // Create a simple welcome message element
                const welcomeElement = document.createElement('div');
                welcomeElement.classList.add('mobile-message', 'mobile-bot-message');
                welcomeElement.textContent = "Yo! wassup?";
                mobileMessages.appendChild(welcomeElement);
            }
            
            return data;
        } catch (error) {
            console.error('Error creating new session:', error);
        }
    }

    // Create session on page load
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(createNewSession, 1000); // Small delay to ensure everything is loaded
    });

    // Space Background Animation
    function initSpaceBackground() {
        const canvas = document.getElementById('background');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Set up gradient background as a semicircle from the top
        function drawBackground() {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createRadialGradient(
                canvas.width / 2, 0, 0,
                canvas.width / 2, 0, Math.max(canvas.width, canvas.height) / 1.5
            );
            gradient.addColorStop(0, 'rgba(100, 100, 100, 0.8)');
            gradient.addColorStop(0.6, 'rgba(100, 100, 100, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, 0, Math.max(canvas.width, canvas.height) / 1.5, 0, Math.PI, true);
            ctx.fill();
        }

        // Create particles with mobile optimization
        const particles = [];
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 50 : 100; // Fewer particles on mobile
        const maxBrightSize = isMobile ? 3 : 5; // Smaller bright particles on mobile
        const maxNormalSize = isMobile ? 1.5 : 2; // Smaller normal particles on mobile
        
        for (let i = 0; i < particleCount; i++) {
            const isBright = Math.random() < 0.1;
            const speed = Math.random() * 0.1 + 0.05;
            const angle = Math.random() * Math.PI * 2;
            particles.push({
                x: Math.floor(Math.random() * (canvas.width / 20)) * 20,
                y: Math.floor(Math.random() * (canvas.height / 20)) * 20,
                size: isBright ? maxBrightSize : maxNormalSize,
                opacitySpeed: Math.random() * 0.001 + 0.0005,
                phase: Math.random() * Math.PI * 2,
                vx: speed * Math.cos(angle),
                vy: speed * Math.sin(angle)
            });
        }

        function animate() {
            // Draw gradient background
            drawBackground();

            particles.forEach(p => {
                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around canvas edges
                if (p.x > canvas.width) p.x -= canvas.width;
                if (p.x < 0) p.x += canvas.width;
                if (p.y > canvas.height) p.y -= canvas.height;
                if (p.y < 0) p.y += canvas.height;

                const opacity = (Math.sin(Date.now() * p.opacitySpeed + p.phase) + 1) / 2;
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.shadowBlur = isMobile ? 10 : 20; // Less blur on mobile
                ctx.shadowColor = 'white';
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }

        animate();

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    const MOBILE_BREAKPOINT = 768;
    let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    let currentTab = 'chat';
    let mobileChatInitialized = false;
    let desktopChatInitialized = false;

    function initApp() {
        // Initialize space background
        initSpaceBackground();
        
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
        
        // Add welcome message if empty
        if (messagesContainer.children.length === 0) {
            addMessage('Yo! wassup?', 'bot');
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
        if (!desktopMessages.hasChildNodes()) {
            addMessageToChat("Yo! wassup?", 'bot');
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