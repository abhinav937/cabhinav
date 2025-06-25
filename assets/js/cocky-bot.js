// chatbot.js
(function () {
    // Define a minimum screen width for the chatbot to be active (e.g., 1024px for desktop only)
    const MIN_DESKTOP_WIDTH = 1024; // This will exclude most tablets and all phones

    // Function to initialize the chatbot
    function initChatbot() {
        // Only proceed with injecting HTML/CSS and adding listeners if on a desktop screen
        if (window.innerWidth < MIN_DESKTOP_WIDTH) {
            console.log('Chatbot not initialized: Screen width is less than desktop minimum.');
            return; // Exit if not on desktop
        }

        // Inject CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Basic resets and body styles */
            body {
                margin: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
            md-fab.chatbot-button {
                --md-fab-container-color: var(--primary-color);
                --md-fab-icon-color: #e5e7eb;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 1000000; /* Ensure it's above other content */
            }
            md-fab.chatbot-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            }

            /* Chat window */
            .chatbot-window {
                display: none; /* Controlled by JS */
                width: min(90vw, 380px); /* Desktop width */
                
                /* New Positioning for desktop: */
                position: fixed; /* Anchored to viewport directly */
                right: calc(2rem + env(safe-area-inset-right));
                bottom: calc(4rem + 2rem + env(safe-area-inset-bottom)); /* FAB height + container bottom + safe area */
                
                /* Dynamic Height Adjustment (initial, will be overridden by JS for max height) */
                max-height: calc(100vh - 4rem - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)); /* Max height to fit in viewport, leave space at top and bottom */

                background: rgba(17, 24, 39, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 1rem;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: slideIn 0.3s ease-out;
                transform-origin: bottom right;
                z-index: 1000000; /* Ensure it's above other content */
            }
            .chatbot-window.visible {
                display: flex;
            }
            @keyframes slideIn {
                from { transform: scale(0.8) translateY(20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .chatbot-header {
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: #e5e7eb;
                padding: 1rem 1.5rem;
                font-size: 1.1rem;
                font-weight: 600;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                flex-shrink: 0;
            }
            .chatbot-close {
                cursor: pointer;
                font-size: 1.2rem;
                transition: transform 0.2s ease;
            }
            .chatbot-close:hover {
                transform: rotate(90deg);
            }
            .chatbot-messages {
                flex: 1;
                padding: 1rem 1.5rem;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                background: rgba(31, 41, 55, 0.9);
                scrollbar-width: thin;
                scrollbar-color: var(--primary-color) transparent;
                scroll-behavior: smooth;
            }
            .chatbot-messages::-webkit-scrollbar {
                width: 6px;
            }
            .chatbot-messages::-webkit-scrollbar-thumb {
                background: var(--primary-color);
                border-radius: 3px;
            }
            .message {
                padding: 0.75rem 1rem;
                border-radius: 1.2rem;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.5;
                transition: transform 0.2s ease, background-color 0.2s ease;
            }
            .message:hover {
                transform: translateY(-2px);
            }
            .user-message {
                background: var(--primary-color);
                color: #e5e7eb;
                align-self: flex-end;
                border-bottom-right-radius: 0.3rem;
            }
            .bot-message {
                background: rgba(55, 65, 81, 0.9);
                color: #d1d5db;
                align-self: flex-start;
                border-bottom-left-radius: 0.3rem;
            }
            .error-message {
                background: rgba(127, 29, 29, 0.9);
                color: #f87171;
                align-self: stretch;
                text-align: center;
                border: 1px solid #b91c1c;
                border-radius: 0.5rem;
            }
            .loading-message {
                color: #9ca3af;
                font-style: italic;
                align-self: flex-start;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .spinning-emoji {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .chatbot-input {
                display: flex;
                padding: 1rem;
                border-top: 1px solid rgba(55, 65, 81, 0.5);
                background: rgba(31, 41, 55, 0.9);
                position: relative;
                z-index: 10;
                flex-shrink: 0;
            }
            .chatbot-input input {
                flex: 1;
                padding: 0.75rem 1rem;
                border: 1px solid rgba(75, 85, 99, 0.7);
                border-radius: 1.5rem;
                font-size: 0.95rem;
                margin-right: 0.75rem;
                outline: none;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
                background: rgba(55, 65, 81, 0.8);
                color: #d1d5db;
                box-shadow: 0 0 8px rgba(37, 99, 235, 0.1), 0 0 12px rgba(30, 64, 175, 0.05);
            }
            .chatbot-input input:focus {
                border-color: var(--primary-color);
                box-shadow: 0 0 12px rgba(37, 99, 235, 0.5), 0 0 16px rgba(30, 64, 175, 0.3);
            }
            .chatbot-input input::placeholder {
                color: #9ca3af;
            }
            .chatbot-input button {
                padding: 0.75rem 1.5rem;
                background: var(--primary-color);
                color: #e5e7eb;
                border: none;
                border-radius: 1.5rem;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 500;
                transition: background-color 0.2s ease, transform 0.2s ease;
            }
            .chatbot-input button:hover {
                background: var(--secondary-color);
                transform: scale(1.05);
            }
            .chatbot-input button:disabled {
                background: #4b5563;
                cursor: not-allowed;
                transform: none;
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);

        // Inject HTML
        const container = document.createElement('div');
        container.className = 'chatbot-container';
        container.innerHTML = `
            <md-fab class="chatbot-button" aria-label="Toggle chatbot">
                <md-icon slot="icon">chat</md-icon>
            </md-fab>
            <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-label="Chatbot window">
                <div class="chatbot-header">
                    <span>A-M-A</span>
                    <span class="chatbot-close" role="button" aria-label="Close chatbot">✖</span>
                </div>
                <div class="chatbot-messages" id="chatbotMessages" role="log" aria-live="polite"></div>
                <div class="chatbot-input">
                    <input type="text" id="chatbotInput" placeholder="Type your message..." aria-label="Message input" autocomplete="off">
                    <button id="sendButton" aria-label="Send message">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // JavaScript functionality
        const chatMessages = document.getElementById('chatbotMessages');
        const messageInput = document.getElementById('chatbotInput');
        const sendButton = document.getElementById('sendButton');
        const chatWindow = document.getElementById('chatbotWindow');
        const fabButton = document.querySelector('.chatbot-button');
        const closeButton = document.querySelector('.chatbot-close');
        let isLoading = false;

        function adjustChatWindowPosition() {
            // Calculate available space for the chatbot window
            const viewportHeight = window.innerHeight;
            const fabHeight = fabButton.offsetHeight;
            const fabBottomSpacing = parseFloat(getComputedStyle(fabButton.parentElement).bottom); // Spacing from bottom of viewport

            // Calculate current bottom edge of the chat window if it were to open
            // This is bottom of FAB + spacing between FAB and chat window
            const chatWindowBottomEdge = fabHeight + fabBottomSpacing + 1.5 * 16; // 1.5rem, assuming 16px/rem

            // Define a minimum top spacing (e.g., 2rem from the top of the viewport)
            const minTopSpacing = 2 * 16; // 2rem, assuming 16px/rem

            // Calculate the maximum possible height the window can take
            const maxCalculatedHeight = viewportHeight - chatWindowBottomEdge - minTopSpacing;
            
            // Set the max-height based on available space, ensuring it doesn't go negative
            chatWindow.style.maxHeight = `${Math.max(200, maxCalculatedHeight)}px`; // Ensure a reasonable minimum height

            // The 'bottom' CSS property already handles the position correctly,
            // the max-height ensures it doesn't go off-screen upwards.
            // No explicit 'top' calculation is needed if max-height handles overflow.
        }

        function toggleChatbot() {
            chatWindow.classList.toggle('visible');
            if (chatWindow.classList.contains('visible')) {
                messageInput.focus();
                chatMessages.scrollTop = chatMessages.scrollHeight;
                // Adjust position when opening to ensure it fits
                adjustChatWindowPosition();
            }
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
                messageElement.appendChild(document.createTextNode(' my brain go brrr... hold on!'));
            } else {
                messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
                messageElement.textContent = text;
            }
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            // Re-adjust max height after new message might have been added and scrolled
            adjustChatWindowPosition(); 
        }

        function showLoadingIndicator() {
            if (isLoading) return;
            isLoading = true;
            sendButton.disabled = true;
            messageInput.disabled = true;
            addMessageToChat('', 'bot', false, true);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            adjustChatWindowPosition(); // Adjust for loading message height
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
            adjustChatWindowPosition(); // Adjust after loading message removed
        }

        async function sendMessage() {
            const prompt = messageInput.value.trim();
            if (!prompt || isLoading) return;

            addMessageToChat(prompt, 'user');
            messageInput.value = '';
            showLoadingIndicator();

            try {
                const response = await fetch('https://ai-reply-bot.vercel.app/api/gemini', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt })
                });

                hideLoadingIndicator();

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data.reply) {
                    addMessageToChat(data.reply, 'bot');
                } else if (data.error) {
                    addMessageToChat(`Error: ${data.error}`, 'system', true);
                } else {
                    addMessageToChat('Received an empty response from the AI.', 'system', true);
                }
            } catch (error) {
                hideLoadingIndicator();
                console.error('Error sending message:', error);
                addMessageToChat(`Error: ${error.message}`, 'system', true);
            }
        }

        // Debounce function
        function debounce(func, delay) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), delay);
            };
        }

        const debouncedAdjustChatWindowPosition = debounce(adjustChatWindowPosition, 100);

        // Event listeners
        fabButton.addEventListener('click', toggleChatbot);
        closeButton.addEventListener('click', toggleChatbot);
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });

        // Listen to window resize to adjust max-height
        window.addEventListener('resize', () => {
            if (window.innerWidth < MIN_DESKTOP_WIDTH) {
                // If resized to mobile/tablet size, ensure chatbot is hidden and cleaned up
                if (chatWindow.classList.contains('visible')) {
                    toggleChatbot(); // Close if open
                }
                // Optional: remove elements if you want to completely destroy it for mobile
                // For now, just stopping interaction and hiding is sufficient
            } else {
                // If resized back to desktop size or just a desktop resize, adjust position
                 fabButton.style.display = 'flex'; // Ensure FAB is visible on desktop
                 debouncedAdjustChatWindowPosition(); // Adjust position based on new window size
            }
        });

        // Initial message
        addMessageToChat("Yo, what's up?", 'bot');

        // Initial adjustment on load to set correct max-height
        adjustChatWindowPosition();
    }

    // Load Material Web Components
    // The initChatbot call is now conditional inside this onload
    if (!customElements.get('md-fab')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@material/web@1.0.0/all.js';
        script.onload = initChatbot;
        document.head.appendChild(script);
    } else {
        initChatbot();
    }
})();