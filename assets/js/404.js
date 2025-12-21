// Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-FDSLDZ5EWW');

// Easter Egg: Click the error message 5 times for a surprise!
document.addEventListener('DOMContentLoaded', function() {
  let clickCount = 0;
  let resetTimeout = null;
  const errorMessage = document.querySelector('.error-message');
  const messages = [
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
      } else if (clickCount === messages.length) {
        // Show the final message
        errorMessage.textContent = messages[messages.length - 1];
        errorMessage.classList.add('easter-egg-active');
        
        // Final easter egg activation
        if (clickCount === messages.length) {
          // Final easter egg activation
          document.body.classList.add('easter-egg-final');
          
          // Create floating emojis
          const emojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🎁', '🎪'];
          for (let i = 0; i < 20; i++) {
            setTimeout(() => {
              const emoji = document.createElement('div');
              emoji.className = 'floating-emoji';
              emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
              emoji.style.left = Math.random() * 100 + '%';
              emoji.style.animationDelay = Math.random() * 0.5 + 's';
              document.body.appendChild(emoji);
              
              setTimeout(() => emoji.remove(), 3000);
            }, i * 100);
          }
          
        // Reset after 5 seconds
        setTimeout(() => {
          clickCount = 0;
          errorMessage.textContent = messages[0];
          errorMessage.classList.remove('easter-egg-active');
          document.body.classList.remove('easter-egg-final');
        }, 5000);
      } else {
        // Reset if they stop clicking for 2 seconds
        resetTimeout = setTimeout(() => {
          clickCount = 0;
          errorMessage.textContent = messages[0];
          errorMessage.classList.remove('easter-egg-active');
        }, 2000);
      }
    });
  }
});

