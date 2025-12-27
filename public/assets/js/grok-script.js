// Grok Chat Script
(function() {
  'use strict';

  // Chat configuration
  const chatConfig = {
    maxMessages: 100,
    typingDelay: 1000,
    enableSound: false,
    enableAnimations: true
  };

  // Initialize chat functionality
  function initGrokChat() {
    console.log('Grok chat initialized');

    // Add any chat-specific functionality here
    // This is a placeholder for chat enhancements

    // Auto-scroll to bottom of chat
    function scrollToBottom() {
      const chatContainer = document.querySelector('.grok-chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }

    // Message animation
    function animateMessage(messageElement) {
      if (!chatConfig.enableAnimations) return;

      messageElement.style.opacity = '0';
      messageElement.style.transform = 'translateY(20px)';

      setTimeout(() => {
        messageElement.style.transition = 'all 0.3s ease';
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
      }, 100);
    }

    // Typing indicator
    function showTypingIndicator() {
      const indicator = document.createElement('div');
      indicator.className = 'typing-indicator';
      indicator.innerHTML = '<span>Typing...</span>';
      return indicator;
    }

    // Message handling
    function addMessage(content, type = 'user') {
      const messageElement = document.createElement('div');
      messageElement.className = `grok-message ${type}`;
      messageElement.innerHTML = `<div class="message-content">${content}</div>`;

      const chatContainer = document.querySelector('.grok-chat-container');
      if (chatContainer) {
        chatContainer.appendChild(messageElement);
        animateMessage(messageElement);
        scrollToBottom();
      }
    }

    // Global functions for React components to use
    window.grokChat = {
      addMessage,
      showTypingIndicator,
      scrollToBottom
    };
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrokChat);
  } else {
    initGrokChat();
  }

  // Global function
  window.initGrokChat = initGrokChat;

})();
