"use strict";

// ========================================
// SMOOTH SCROLLING UTILITIES
// ========================================

// Enhanced smooth scrolling utility function
const smoothScrollTo = (target, options = {}) => {
  const {
    duration = 600,
    easing = 'ease-out',
    offset = 0
  } = options;

  return new Promise((resolve) => {
    const startPosition = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = typeof target === 'number' ? target : 
      (target.offsetTop || target.getBoundingClientRect().top + startPosition) - offset;
    
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    
    // Dynamic duration based on distance
    const actualDuration = Math.min(duration, Math.max(300, Math.abs(distance) * 0.6));
    
    // Non-bouncy easing function
    const easeOut = (t) => 1 - Math.pow(1 - t, 2);
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / actualDuration, 1);
      const easedProgress = easeOut(progress);
      
      const newPosition = startPosition + (distance * easedProgress);
      window.scrollTo(0, newPosition);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        // Ensure we reach the exact target
        window.scrollTo(0, targetPosition);
        resolve();
      }
    };
    
    requestAnimationFrame(animateScroll);
  });
};

// Smooth scroll to top utility
const smoothScrollToTop = () => {
  return smoothScrollTo(0, { duration: 500 });
};









// ========================================
// FILTER CHIPS
// ========================================

function setupFilterLogic() {
  const elements = document.querySelectorAll("md-filter-chip");
  const projectItems = document.querySelectorAll(".project-card");

  // Add project count to filter chips
  function updateFilterCounts() {
    const counts = {
      all: projectItems.length,
      power: 0,
      embedded: 0,
      analog: 0
    };

    projectItems.forEach(item => {
      const category = item.dataset.category;
      if (category && counts.hasOwnProperty(category)) {
        counts[category]++;
      }
    });

    // Update chip labels with counts
    elements.forEach(element => {
      const category = element.id;
      const count = counts[category] || 0;
      const originalLabel = element.getAttribute('data-original-label') || element.label;

      if (!element.getAttribute('data-original-label')) {
        element.setAttribute('data-original-label', originalLabel);
      }

      element.label = `${originalLabel} (${count})`;
    });
  }
  
  function deselectAll() {
    elements.forEach((element) => (element.selected = false));
  }
  
  function filterProjects(category) {
  const items = document.querySelectorAll(".project-card");
  
  items.forEach((item, index) => {
    const shouldShow = category === "all" || item.dataset.category === category;
    
    if (shouldShow) {
      item.style.display = "block";
      item.style.opacity = "0";
      item.style.transform = "translateY(20px)";
      
      // Stagger animation for visible items
      setTimeout(() => {
        item.style.transition = "all 0.4s ease-out";
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, index * 100);
    } else {
      item.style.transition = "all 0.3s ease-in";
      item.style.opacity = "0";
      item.style.transform = "translateY(-20px)";
      
      setTimeout(() => {
        item.style.display = "none";
      }, 300);
    }
  });
  
  // Update URL without page reload
  const url = new URL(window.location);
  if (category === "all") {
    url.searchParams.delete('filter');
  } else {
    url.searchParams.set('filter', category);
  }
  window.history.replaceState({}, '', url);
}
  
  // Initialize filter counts
  updateFilterCounts();
  
  // Handle filter chip clicks
  elements.forEach((element) => {
    element.addEventListener("click", () => {
      deselectAll();
      element.selected = true;
      const clickedId = element.id;
      
      // Add visual feedback
      element.style.transform = "scale(0.95)";
      setTimeout(() => {
        element.style.transform = "scale(1)";
      }, 150);
      
      filterProjects(clickedId);
    });
  });
  

  
  // Check URL parameters on page load
  const urlParams = new URLSearchParams(window.location.search);
  const initialFilter = urlParams.get('filter');
  if (initialFilter) {
    const filterElement = document.getElementById(initialFilter);
    if (filterElement) {
      filterElement.click();
    }
  }
  

}



setupFilterLogic();

// ========================================
// GLOBAL SMOOTH SCROLLING SETUP
// ========================================

// Enhance all anchor links with smooth scrolling
const setupGlobalSmoothScrolling = () => {
  // Handle anchor links
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a[href^="#"]');
    if (target) {
      e.preventDefault();
      const targetId = target.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        smoothScrollTo(targetElement, { duration: 600, offset: 20 });
      }
    }
  });

  // Handle buttons that should scroll to top
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-scroll-to-top]');
    if (target) {
      e.preventDefault();
      smoothScrollToTop();
    }
  });
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  setupGlobalSmoothScrolling();
  
  // Initialize hash navigation
  const hashSuccess = handleHashNavigation();
  
  // If no hash or invalid hash, default to about
  if (!hashSuccess) {
    const aboutSection = document.getElementById('about');
    const aboutButton = document.querySelector('[onclick*="about"]');
    if (aboutSection && aboutButton) {
      toggleContent('about', aboutButton);
    }
  }
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashNavigation);
  
  // Add keyboard navigation (exact same as desktop)
  document.addEventListener('keydown', (e) => {
    // Only handle navigation keys when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const navButtons = document.querySelectorAll('[data-nav-link]');
    const activeButton = document.querySelector('[data-nav-link].active');
    const currentIndex = Array.from(navButtons).indexOf(activeButton);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevButton = navButtons[currentIndex - 1];
          const prevId = prevButton.getAttribute('onclick')?.match(/toggleContent\('([^']+)'/)?.[1];
          if (prevId) toggleContent(prevId, prevButton);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < navButtons.length - 1) {
          const nextButton = navButtons[currentIndex + 1];
          const nextId = nextButton.getAttribute('onclick')?.match(/toggleContent\('([^']+)'/)?.[1];
          if (nextId) toggleContent(nextId, nextButton);
        }
        break;
      case 'Home':
        e.preventDefault();
        const firstButton = navButtons[0];
        const firstId = firstButton.getAttribute('onclick')?.match(/toggleContent\('([^']+)'/)?.[1];
        if (firstId) toggleContent(firstId, firstButton);
        break;
      case 'End':
        e.preventDefault();
        const lastButton = navButtons[navButtons.length - 1];
        const lastId = lastButton.getAttribute('onclick')?.match(/toggleContent\('([^']+)'/)?.[1];
        if (lastId) toggleContent(lastId, lastButton);
        break;
    }
  });
  
  // Add focus management (exact same as desktop)
  const navButtons = document.querySelectorAll('[data-nav-link]');
  navButtons.forEach(button => {
    button.addEventListener('focus', () => {
      // Ensure proper focus styling
      button.setAttribute('tabindex', '0');
    });
    
    button.addEventListener('blur', () => {
      // Maintain accessibility
      if (!button.classList.contains('active')) {
        button.setAttribute('tabindex', '0');
      }
    });
  });
  
  // Handle resize events to update button states when switching between mobile/desktop
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Re-apply current active state to ensure proper styling
      const activeButton = document.querySelector('[data-nav-link].active');
      if (activeButton) {
        const activeId = activeButton.getAttribute('onclick')?.match(/toggleContent\('([^']+)'/)?.[1];
        if (activeId) {
          // Re-apply the active state without changing the URL
          const navButtons = document.querySelectorAll('[data-nav-link]');
          const isMobile = window.innerWidth < 1250;
          
          navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (!isMobile) {
              const stateLayer = btn.querySelector('.state-layer');
              const desktopIcon = btn.querySelector('.material-symbols-rounded');
              if (stateLayer) stateLayer.style.backgroundColor = 'transparent';
              if (desktopIcon) desktopIcon.style.color = 'rgba(255, 255, 255, 0.472)';
            }
          });
          
          activeButton.classList.add('active');
          if (!isMobile) {
            const stateLayer = activeButton.querySelector('.state-layer');
            const desktopIcon = activeButton.querySelector('.material-symbols-rounded');
            if (stateLayer) stateLayer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            if (desktopIcon) desktopIcon.style.color = 'rgba(255, 255, 255, 1)';
          }
        }
      }
    }, 100);
  });
});

// Simple navigation function - back to the old way
function toggleContent(id, button) {
  // Get all content sections
  const sections = document.querySelectorAll('article[data-page]');
  const targetSection = document.getElementById(id);
  
  if (targetSection) {
    // Hide all sections instantly
    sections.forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });
    
    // Show target section instantly
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
  
  // Update navigation button states (exact same functionality for desktop and mobile)
  const navButtons = document.querySelectorAll('[data-nav-link]');
  const isMobile = window.innerWidth < 1250;
  
  navButtons.forEach(btn => {
    btn.classList.remove('active');
    
    if (!isMobile) {
      // Desktop button states - only apply on desktop
      const stateLayer = btn.querySelector('.state-layer');
      const desktopIcon = btn.querySelector('.material-symbols-rounded');
      
      if (stateLayer) stateLayer.style.backgroundColor = 'transparent';
      if (desktopIcon) desktopIcon.style.color = 'rgba(255, 255, 255, 0.472)';
    }
    // Mobile button states are handled entirely by CSS via .active class
  });
  
  if (button) {
    button.classList.add('active');
    
    if (!isMobile) {
      // Desktop button states - only apply on desktop
      const stateLayer = button.querySelector('.state-layer');
      const desktopIcon = button.querySelector('.material-symbols-rounded');
      
      if (stateLayer) stateLayer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      if (desktopIcon) desktopIcon.style.color = 'rgba(255, 255, 255, 1)';
    }
    // Mobile button states are handled entirely by CSS via .active class
  }
  
  // Update URL with hash (only for non-default pages)
  if (id !== 'about') {
    window.location.hash = id;
  } else {
    // Remove hash for about page (default)
    window.history.replaceState(null, '', window.location.pathname);
  }
  
  // Fetch publications only when resume section is shown
  if (id === 'resume' && typeof window.publicationsFetched === 'undefined') {
    console.log('Resume section shown, fetching publications...');
    window.publicationsFetched = true;
    // Fetch publications immediately
    fetchPublications(0);
  }
}

// Handle hash-based navigation on page load
function handleHashNavigation() {
  const hash = window.location.hash.substring(1);
  const validPages = ['about', 'resume', 'contact'];
  
  if (hash && validPages.includes(hash)) {
    const targetSection = document.getElementById(hash);
    const targetButton = document.querySelector(`[onclick*="${hash}"]`);
    
    if (targetSection && targetButton) {
      toggleContent(hash, targetButton);
      return true;
    }
  } else if (!hash) {
    // No hash means default to about page
    const aboutSection = document.getElementById('about');
    const aboutButton = document.querySelector('[onclick*="about"]');
    if (aboutSection && aboutButton) {
      toggleContent('about', aboutButton);
      return true;
    }
  }
  return false;
}



// ========================================
// JOB DURATION CALCULATIONS
// ========================================

function calculateMonths(startDateStr, endDateStr) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const [startMonthStr, startYearStr] = startDateStr.split(" ");
  const startMonth = months.indexOf(startMonthStr);
  const startYear = parseInt(startYearStr);

  let endMonth, endYear;
  if (endDateStr === "Present") {
    const now = new Date();
    endMonth = now.getMonth();
    endYear = now.getFullYear();
  } else {
    const [endMonthStr, endYearStr] = endDateStr.split(" ");
    endMonth = months.indexOf(endMonthStr);
    endYear = parseInt(endYearStr);
  }

  const yearsDiff = endYear - startYear;
  const monthsDiff = endMonth - startMonth;
  return yearsDiff * 12 + monthsDiff + 1;
}

function formatDuration(totalMonths) {
  if (totalMonths <= 11) {
    return `${totalMonths} mo${totalMonths !== 1 ? "s" : ""}`;
  } else {
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;
    let result = `${years} yr${years !== 1 ? "s" : ""}`;
    if (remainingMonths > 0) {
      result += ` ${remainingMonths} mo${remainingMonths !== 1 ? "s" : ""}`;
    }
    return result;
  }
}

// Update job durations
document.querySelectorAll(".date-duration").forEach((element) => {
  const startDate = element.getAttribute("data-start");
  const endDate = element.getAttribute("data-end");
  const months = calculateMonths(startDate, endDate);
  const durationElement = element.querySelector(".duration");
  if (durationElement) {
    durationElement.textContent = formatDuration(months);
  }
});

// ========================================
// PUBLICATIONS FETCHING
// ========================================

async function fetchPublications(delayMs = 0) {
  console.log('fetchPublications function called with delay:', delayMs);
  const API_URL = "https://api.cabhinav.com/api/server.js";
  const container = document.getElementById("publications-container");
  const errorMessage = document.getElementById("error-message");

  // Show skeleton loader first
  showSkeletonLoader(container);

  // Add configurable delay to show loading animation
  await new Promise(resolve => setTimeout(resolve, delayMs));

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();

    console.log('API fetch successful:', data);

    // Check if the response has the expected structure
    const articles = data.data?.articles || data.articles;

    if (!articles || articles.length === 0) {
      console.log('No articles found in API response');
      container.innerHTML = "";
      errorMessage.textContent = "No publications found.";
      errorMessage.style.display = "block";
      return;
    }

    console.log(`Found ${articles.length} publications`);

    // Sort articles by year in descending order (newest first)
    const sortedArticles = articles.sort((a, b) => {
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearB - yearA;
    });

    // Simple fade out of skeleton and replace with content
    const skeletonContainer = container.querySelector('.publications-skeleton');
    if (skeletonContainer) {
      skeletonContainer.style.transition = 'opacity 0.5s ease-out';
      skeletonContainer.style.opacity = '0';

      setTimeout(() => {
        container.innerHTML = "";

        // Add real content
        sortedArticles.forEach((article, index) => {
          const authors = (article.authors || "Unknown Authors").replace(
            "A Chinnusamy",
            "<b>Abhinav Chinnusamy</b>"
          );

          const pubDiv = document.createElement("div");
          pubDiv.className = "publication";
          pubDiv.innerHTML = `
            <h3>${article.title}</h3>
            <p class="authors">${authors}</p>
            <p>${article.publication || "N/A"}</p>
            <p class="year">Year: ${article.year || "N/A"}</p>
            <div class="links">
              ${article.link ? `<a href="${article.link}" target="_blank">View</a>` : ""}
              ${article.cited_by?.link ? `<a href="${article.cited_by.link}" target="_blank">Cited by ${article.cited_by.value}</a>` : ""}
            </div>
          `;

          container.appendChild(pubDiv);
        });

        console.log('Publications loaded and displayed successfully');
      }, 500);
    }

  } catch (error) {
    console.error("Error fetching publications:", error);
    container.innerHTML = "";
    errorMessage.textContent = "Failed to load publications. Please try again later.";
    errorMessage.style.display = "block";
  }
}

// Function to show skeleton loader
function showSkeletonLoader(container) {
  container.innerHTML = `
    <div class="publications-skeleton">
      <div class="publication publication-skeleton-item">
        <h3><span class="skeleton skeleton-text" style="height: 22px; width: 100%; display: block;"></span></h3>
        <p class="authors"><span class="skeleton skeleton-text" style="height: 22px; width: 35%; display: block;"></span></p>
        <p><span class="skeleton skeleton-text" style="height: 22px; width: 80%; display: block;"></span></p>
        <p class="year"><span class="skeleton skeleton-text" style="height: 16px; width: 80px; display: inline-block;"></span></p>
        <div class="links">
          <span class="skeleton skeleton-button" style="width: 50px; height: 32px;"></span>
          <span class="skeleton skeleton-button" style="width: 80px; height: 32px;"></span>
        </div>
      </div>
      <div class="publication publication-skeleton-item">
        <h3><span class="skeleton skeleton-text" style="height: 24px; width: 100%; display: block;"></span></h3>
        <p class="authors"><span class="skeleton skeleton-text" style="height: 19px; width: 55%; display: block;"></span></p>
        <p><span class="skeleton skeleton-text" style="height: 19px; width: 75%; display: block;"></span></p>
        <p class="year"><span class="skeleton skeleton-text" style="height: 17px; width: 80px; display: inline-block;"></span></p>
        <div class="links">
          <span class="skeleton skeleton-button" style="width: 50px; height: 32px;"></span>
        </div>
      </div>
      <div class="publication publication-skeleton-item">
        <h3><span class="skeleton skeleton-text" style="height: 24px; width: 100%; display: block;"></span></h3>
        <p class="authors"><span class="skeleton skeleton-text" style="height: 19px; width: 30%; display: block;"></span></p>
        <p><span class="skeleton skeleton-text" style="height: 19px; width: 85%; display: block;"></span></p>
        <p class="year"><span class="skeleton skeleton-text" style="height: 17px; width: 80px; display: inline-block;"></span></p>
        <div class="links">
          <span class="skeleton skeleton-button" style="width: 50px; height: 32px;"></span>
        </div>
      </div>
    </div>
  `;
}

// ========================================
// CAROUSEL ENHANCEMENTS
// ========================================

// Keyboard navigation for carousels
function setupCarouselKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Only handle arrow keys when not typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const activeCarousel = document.querySelector('.carousel.active, .carousel:focus-within');
    if (!activeCarousel) return;
    
    const carouselInstance = bootstrap.Carousel.getInstance(activeCarousel);
    if (!carouselInstance) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        carouselInstance.prev();
        break;
      case 'ArrowRight':
        e.preventDefault();
        carouselInstance.next();
        break;
      case 'Escape':
        e.preventDefault();
        carouselInstance.pause();
        break;
    }
  });
}

// Auto-pause on hover functionality
function setupCarouselHoverPause() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    const carouselInstance = bootstrap.Carousel.getInstance(carousel);
    if (!carouselInstance) return;
    
    carousel.addEventListener('mouseenter', () => {
      carouselInstance.pause();
    });
    
    carousel.addEventListener('mouseleave', () => {
      carouselInstance.cycle();
    });
  });
}

// Mobile touch gestures for carousels
function setupCarouselTouchGestures() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = false;
    };
    
    const handleTouchMove = (e) => {
      if (!startX || !startY) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      // Only trigger if horizontal movement is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isDragging = true;
        e.preventDefault();
      }
    };
    
    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      
      const currentX = e.changedTouches[0].clientX;
      const diffX = startX - currentX;
      const threshold = 50;
      
      const carouselInstance = bootstrap.Carousel.getInstance(carousel);
      if (!carouselInstance) return;
      
      if (diffX > threshold) {
        carouselInstance.next();
      } else if (diffX < -threshold) {
        carouselInstance.prev();
      }
      
      startX = 0;
      startY = 0;
      isDragging = false;
    };
    
    carousel.addEventListener('touchstart', handleTouchStart, { passive: false });
    carousel.addEventListener('touchmove', handleTouchMove, { passive: false });
    carousel.addEventListener('touchend', handleTouchEnd, { passive: false });
  });
}

// Enhanced mobile controls
function setupEnhancedMobileControls() {
  // Add larger touch targets for mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .carousel-control-prev,
      .carousel-control-next {
        width: 50px !important;
        height: 50px !important;
        background: rgba(0, 0, 0, 0.3) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      
      .carousel-control-prev:hover,
      .carousel-control-next:hover {
        background: rgba(0, 0, 0, 0.5) !important;
      }
      
      .carousel-indicators button {
        width: 12px !important;
        height: 12px !important;
        border-radius: 50% !important;
        margin: 0 4px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// Image preloading for carousels
function preloadCarouselImages() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    const images = carousel.querySelectorAll('img');
    images.forEach((img, index) => {
      // Preload first image, lazy load others
      if (index === 0) {
        img.loading = 'eager';
      } else {
        img.loading = 'lazy';
      }
    });
  });
}

// Initialize all carousel enhancements
function initializeCarouselEnhancements() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupCarouselKeyboardNavigation();
      setupCarouselHoverPause();
      setupCarouselTouchGestures();
      setupEnhancedMobileControls();
      preloadCarouselImages();
    });
  } else {
    setupCarouselKeyboardNavigation();
    setupCarouselHoverPause();
    setupCarouselTouchGestures();
    setupEnhancedMobileControls();
    preloadCarouselImages();
  }
}

// Initialize carousel enhancements
initializeCarouselEnhancements();

// Simple Manual Lazy Loading System
class ManualLazyLoader {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupIntersectionObserver();
    this.handleAlreadyLoadedImages();
  }

  setupLazyLoading() {
    // Add loading="lazy" to all images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }

  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback for older browsers - load all images immediately
      this.loadAllImages();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px 0px', // Start loading 50px before entering viewport
      threshold: 0.01
    });

    // Observe all images
    const images = document.querySelectorAll('img');
    images.forEach(img => observer.observe(img));
  }

  loadImage(img) {
    // If image is already loaded, do nothing
    if (img.complete && img.naturalHeight !== 0) {
      this.handleImageLoad(img);
      return;
    }

    // Add loading event listeners
    img.addEventListener('load', () => {
      this.handleImageLoad(img);
    });

    img.addEventListener('error', () => {
      this.handleImageError(img);
    });
  }

  handleImageLoad(img) {
    img.classList.add('loaded');
    // Add loaded class to container to stop shimmer
    const container = img.closest('.image-container');
    if (container) {
      container.classList.add('image-loaded');
    }
  }

  handleImageError(img) {
    img.classList.add('error');
    console.warn('Failed to load image:', img.src);
  }

  loadAllImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => this.loadImage(img));
  }

  handleAlreadyLoadedImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete && img.naturalHeight !== 0) {
        this.handleImageLoad(img);
      }
    });
  }
}

// Initialize Manual Lazy Loader
const manualLazyLoader = new ManualLazyLoader();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Manual Lazy Loader initialized');
});

// Wait for all resources (CSS, JS, images) to load before showing images
window.addEventListener('load', function() {
  console.log('All resources loaded, showing images');
  const images = document.querySelectorAll('img');

  // Add loaded class to all images with a small stagger for smooth reveal
  images.forEach((img, index) => {
    setTimeout(() => {
      img.classList.add('loaded');
    }, index * 50); // 50ms stagger between each image
  });
});