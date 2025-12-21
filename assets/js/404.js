// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-FDSLDZ5EWW');

// Easter Egg: Click the error message 5 times for a surprise!
(function() {
  'use strict';
  
  function initEasterEgg() {
    var clickCount = 0;
    var resetTimeout = null;
    var errorMessage = document.querySelector('.error-message');
    var messages = [
      "you are not supposed to be here",
      "still not supposed to be here...",
      "seriously, go away",
      "this is getting awkward",
      "ok fine, you found me 🎉"
    ];

    if (errorMessage) {
      errorMessage.addEventListener('click', function() {
        // Clear any pending reset timeout
        if (resetTimeout) {
          clearTimeout(resetTimeout);
          resetTimeout = null;
        }
        
        clickCount++;
        
        if (clickCount < messages.length) {
          // Show the next message (clickCount is the index for the next message)
          errorMessage.textContent = messages[clickCount];
          errorMessage.classList.add('easter-egg-active');
          
          // Reset if they stop clicking for 2 seconds
          resetTimeout = setTimeout(function() {
            clickCount = 0;
            errorMessage.textContent = messages[0];
            errorMessage.classList.remove('easter-egg-active');
          }, 2000);
        } else if (clickCount === messages.length) {
          // Show the final message and trigger easter egg
          errorMessage.textContent = messages[messages.length - 1];
          errorMessage.classList.add('easter-egg-active');
          
          // Final easter egg activation
          document.body.classList.add('easter-egg-final');
          
          // Create floating emojis
          var emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🎁', '🎪'];
          for (var i = 0; i < 20; i++) {
            setTimeout(function(index) {
              return function() {
                var emoji = document.createElement('div');
                emoji.className = 'floating-emoji';
                emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                emoji.style.left = Math.random() * 100 + '%';
                emoji.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(emoji);
                
                setTimeout(function() {
                  if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                  }
                }, 3000);
              };
            }(i), i * 100);
          }
          
          // Reset after 5 seconds
          setTimeout(function() {
            clickCount = 0;
            errorMessage.textContent = messages[0];
            errorMessage.classList.remove('easter-egg-active');
            document.body.classList.remove('easter-egg-final');
          }, 5000);
        }
      });
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEasterEgg);
  } else {
    // DOM is already ready
    initEasterEgg();
  }
})();

