/**
 * Simple, Reliable Skeleton Loading
 * Based on proven patterns from Facebook, LinkedIn, and other major sites
 */

class SimpleSkeleton {
  constructor() {
    this.init();
  }

  init() {
    this.setupImageSkeletons();
    this.setupLazyLoading();
  }

  /**
   * Setup skeleton loading for all images
   */
  setupImageSkeletons() {
    const images = document.querySelectorAll('img[src]');
    
    images.forEach(img => {
      if (!img.closest('.skeleton-image')) {
        this.createSkeletonForImage(img);
      }
    });
  }

  /**
   * Create skeleton container for an image
   */
  createSkeletonForImage(img) {
    const container = document.createElement('div');
    container.className = 'skeleton-image skeleton';
    
    // Determine size based on image or context
    const size = this.detectImageSize(img);
    if (size) {
      container.classList.add(`skeleton-${size}`);
    }
    
    // Determine shape based on context
    const shape = this.detectImageShape(img);
    if (shape) {
      container.classList.add(`skeleton-${shape}`);
    }
    
    // Set dimensions if not specified
    if (!size) {
      container.style.width = '200px';
      container.style.height = '150px';
    }
    
    // Move image into container
    img.parentNode.insertBefore(container, img);
    container.appendChild(img);
    
    // Setup loading events
    this.setupImageLoading(img, container);
    
    return container;
  }

  /**
   * Detect image size based on context or dimensions
   */
  detectImageSize(img) {
    const context = img.closest('.profile-img, .avatar, .user-image');
    if (context) return 'avatar-md';
    
    const width = img.offsetWidth || img.naturalWidth;
    if (width <= 32) return 'xs';
    if (width <= 48) return 'sm';
    if (width <= 64) return 'md';
    if (width <= 96) return 'lg';
    if (width > 96) return 'xl';
    
    return null;
  }

  /**
   * Detect image shape based on context
   */
  detectImageShape(img) {
    const context = img.closest('.profile-img, .avatar, .user-image');
    if (context) return 'circle';
    
    const context2 = img.closest('.carousel, .gallery');
    if (context2) return 'rounded';
    
    return 'rounded'; // Default
  }

  /**
   * Setup image loading events
   */
  setupImageLoading(img, container) {
    if (img.complete && img.naturalHeight !== 0) {
      this.handleImageLoad(img, container);
    } else {
      img.addEventListener('load', () => this.handleImageLoad(img, container));
      img.addEventListener('error', () => this.handleImageError(img, container));
    }
  }

  /**
   * Handle successful image load
   */
  handleImageLoad(img, container) {
    img.classList.add('loaded');
    setTimeout(() => {
      container.classList.add('loaded');
    }, 100);
  }

  /**
   * Handle image load error
   */
  handleImageError(img, container) {
    container.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;">⚠️ Image failed to load</div>';
  }

  /**
   * Setup lazy loading for images with data-src
   */
  setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadLazyImage(img);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      lazyImages.forEach(img => observer.observe(img));
    } else {
      // Fallback for older browsers
      lazyImages.forEach(img => this.loadLazyImage(img));
    }
  }

  /**
   * Load lazy image
   */
  loadLazyImage(img) {
    const src = img.getAttribute('data-src');
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      
      // Create skeleton if not exists
      if (!img.closest('.skeleton-image')) {
        this.createSkeletonForImage(img);
      }
    }
  }

  /**
   * Create skeleton for existing images
   */
  static createForImages(selector = 'img[src]') {
    const images = document.querySelectorAll(selector);
    const skeleton = new SimpleSkeleton();
    
    images.forEach(img => {
      if (!img.closest('.skeleton-image')) {
        skeleton.createSkeletonForImage(img);
      }
    });
  }

  /**
   * Create skeleton for specific image
   */
  static createForImage(img, options = {}) {
    const skeleton = new SimpleSkeleton();
    const container = skeleton.createSkeletonForImage(img);
    
    if (options.size) {
      container.classList.add(`skeleton-${options.size}`);
    }
    
    if (options.shape) {
      container.classList.add(`skeleton-${options.shape}`);
    }
    
    return container;
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.simpleSkeleton = new SimpleSkeleton();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SimpleSkeleton;
} 