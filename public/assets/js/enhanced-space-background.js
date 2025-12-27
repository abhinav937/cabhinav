// Enhanced Space Background JavaScript
(function() {
  'use strict';

  // Configuration for space background
  const config = {
    starCount: 200,
    shootingStarFrequency: 0.002,
    nebulaCount: 3,
    animationSpeed: 1,
    enableMouseInteraction: true
  };

  // Initialize space background
  function initEnhancedSpaceBackground(container, userConfig = {}) {
    if (!container) return;

    // Merge user config with defaults
    Object.assign(config, userConfig);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    container.appendChild(canvas);

    // Set canvas size
    function resizeCanvas() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star field
    const stars = [];
    for (let i = 0; i < config.starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1) star.brightness = 0;

        const alpha = star.brightness * 0.8 + 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    // Mouse interaction
    if (config.enableMouseInteraction) {
      container.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Create ripple effect at mouse position
        ctx.fillStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 50, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Store reference for cleanup
    container._spaceBackground = {
      canvas,
      ctx,
      stars,
      resizeCanvas,
      destroy: function() {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        window.removeEventListener('resize', resizeCanvas);
      }
    };
  }

  // Global function
  window.initEnhancedSpaceBackground = initEnhancedSpaceBackground;

})();