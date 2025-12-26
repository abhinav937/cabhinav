/**
 * Performance optimizations and utility functions for the website
 */

// Intersection Observer for lazy loading
function setupLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.src; // Trigger load
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  }
}

// Debounce utility function
function debounce(func, wait, immediate) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle utility function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Performance monitoring
function setupPerformanceMonitoring() {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
      }, 0);
    });
  }
}

// Error handling utility
function setupErrorHandling() {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Could send to analytics service here
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Could send to analytics service here
  });
}

// Blur-up effect: remove blur when image is loaded
function setupBlurUpEffect() {
  const images = document.querySelectorAll('.image-container img');
  images.forEach(img => {
    const markLoaded = () => {
      img.classList.add('loaded');
      if (img.parentElement && img.parentElement.classList.contains('image-container')) {
        img.parentElement.classList.add('loaded');
      }
    };
    if (img.complete && img.naturalWidth !== 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markLoaded);
    }
  });
}

// Simple Learn More button functionality
function enhanceLearnMoreButtons() {
  const learnMoreButtons = document.querySelectorAll('.md-chip-overlay');
  
  learnMoreButtons.forEach(button => {
    // Ensure fixed positioning
    button.style.position = 'absolute';
    button.style.top = '20px';
    button.style.right = '20px';
    button.style.zIndex = '10';
    
    // Chrome mobile specific fixes
    button.style.webkitTransform = 'translateZ(0)';
    button.style.transform = 'translateZ(0)';
    button.style.webkitBackfaceVisibility = 'hidden';
    button.style.backfaceVisibility = 'hidden';
    
    // Force Chrome to repaint
    const chip = button.querySelector('md-assist-chip');
    if (chip) {
      chip.style.webkitTransform = 'translateZ(0)';
      chip.style.transform = 'translateZ(0)';
      chip.style.webkitPerspective = '1000px';
      chip.style.perspective = '1000px';
    }
  });
}

// Initialize optimizations
document.addEventListener('DOMContentLoaded', () => {
  setupLazyLoading();
  setupPerformanceMonitoring();
  setupErrorHandling();
  setupBlurUpEffect();
  enhanceLearnMoreButtons();
});

// Export utilities for use in other scripts
window.WebsiteOptimizations = {
  debounce,
  throttle,
  setupLazyLoading,
  setupPerformanceMonitoring,
  setupErrorHandling,
  setupBlurUpEffect,
  enhanceLearnMoreButtons
}; 