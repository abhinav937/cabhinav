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
// OPTIMIZED NAVIGATION SYSTEM
// ========================================

class NavigationManager {
  constructor() {
    this.currentSection = 'about';
    this.sections = ['about', 'resume', 'contact'];
    this.isDesktop = window.innerWidth >= 1250;
    this.isMobile = window.innerWidth < 1250;
    this.lastScrollY = 0;
    this.scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
    this.isNavbarHidden = false;
    this.init();
  }

  init() {
    this.setupNavigationButtons();
    this.setupContentSections();
    this.setupMobileNavbar();
    this.setupScrollHandler();
    this.showSection('about');
    this.setupResizeHandler();
  }

  setupScrollHandler() {
    if (this.isMobile) {
      let lastScrollY = window.pageYOffset;
      let ticking = false;
      
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const currentScrollY = window.pageYOffset;
            const scrollDelta = currentScrollY - lastScrollY;
            
            // Hide navbar when scrolling down with smooth threshold
            if (scrollDelta > 8 && currentScrollY > 50) {
              this.hideMobileNavbar();
            }
            // Show navbar when scrolling up with smooth threshold
            else if (scrollDelta < -8) {
              this.showMobileNavbar();
            }
            // Always show at top with smooth transition
            else if (currentScrollY <= 20) {
              this.showMobileNavbar();
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
          });
          ticking = true;
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }

  hideMobileNavbar() {
    const mobileNavContainer = document.querySelector('.mobile-nav-container');
    if (mobileNavContainer && !mobileNavContainer.classList.contains('navbar-hidden')) {
      mobileNavContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      mobileNavContainer.classList.add('navbar-hidden');
      this.isNavbarHidden = true;
    }
  }

  showMobileNavbar() {
    const mobileNavContainer = document.querySelector('.mobile-nav-container');
    if (mobileNavContainer && mobileNavContainer.classList.contains('navbar-hidden')) {
      mobileNavContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      mobileNavContainer.classList.remove('navbar-hidden');
      this.isNavbarHidden = false;
    }
  }

  // Test function to manually trigger hide/show
  testNavbarHide() {
    this.hideMobileNavbar();
  }

  testNavbarShow() {
    this.showMobileNavbar();
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      const wasDesktop = this.isDesktop;
      this.isDesktop = window.innerWidth >= 1250;
      this.isMobile = window.innerWidth < 1250;
      
      // Re-initialize if switching between desktop and mobile
      if (wasDesktop !== this.isDesktop) {
        this.updateNavigationButtons(this.currentSection);
        if (this.isMobile) {
          this.setupScrollHandler();
        } else {
          // Reset navbar state on desktop
          this.isNavbarHidden = false;
          this.lastScrollY = 0;
          this.showMobileNavbar(); // Ensure navbar is visible on desktop
        }
      }
    });
  }

  setupMobileNavbar() {
    if (this.isMobile) {
      // Add mobile-specific classes and behaviors
      const mobileNavContainer = document.querySelector('.mobile-nav-container');
      if (mobileNavContainer) {
        // Add smooth entrance animation
        mobileNavContainer.style.opacity = '0';
        mobileNavContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          mobileNavContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          mobileNavContainer.style.opacity = '1';
          mobileNavContainer.style.transform = 'translateY(0)';
        }, 100);
      }
    }
  }

  setupNavigationButtons() {
    const navButtons = document.querySelectorAll('.nav-bar .segment[data-nav-link]');
    
    navButtons.forEach(button => {
      button.removeAttribute('onclick');
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionName = this.getSectionFromButton(button);
        if (sectionName) {
          this.showSection(sectionName);
          this.addClickAnimation(button);
        }
      });

      // Add touch feedback for mobile
      if (this.isMobile) {
        button.addEventListener('touchstart', () => {
          this.addTouchFeedback(button, true);
        });
        
        button.addEventListener('touchend', () => {
          this.addTouchFeedback(button, false);
        });
      }
    });
  }

  addClickAnimation(button) {
    if (this.isMobile) {
      // Add ripple effect for mobile
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        width: 20px;
        height: 20px;
        top: 50%;
        left: 50%;
        margin-left: -10px;
        margin-top: -10px;
      `;
      
      button.style.position = 'relative';
      button.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  }

  addTouchFeedback(button, isPressed) {
    const iconWrapper = button.querySelector('.mobile-icon-wrapper');
    const icon = button.querySelector('.material-symbols-rounded');
    
    if (isPressed) {
      if (iconWrapper) iconWrapper.style.transform = 'scale(0.9)';
      if (icon) icon.style.transform = 'scale(0.9)';
    } else {
      if (iconWrapper) iconWrapper.style.transform = '';
      if (icon) icon.style.transform = '';
    }
  }

  getSectionFromButton(button) {
    const onclickAttr = button.getAttribute('onclick');
    if (onclickAttr) {
      const match = onclickAttr.match(/toggleContent\('([^']+)'/);
      if (match) return match[1];
    }
    
    const labelText = button.querySelector('.label-text');
    if (labelText) {
      const text = labelText.textContent.toLowerCase().trim();
      if (this.sections.includes(text)) return text;
    }
    
    const ariaLabel = button.getAttribute('aria-label');
    if (ariaLabel) {
      const text = ariaLabel.toLowerCase().replace(' section', '').trim();
      if (this.sections.includes(text)) return text;
    }
    
    return null;
  }

  setupContentSections() {
    this.sections.forEach(sectionName => {
      const section = document.getElementById(sectionName);
      if (section) {
        section.style.display = 'none';
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
      }
    });
  }

  showSection(sectionName) {
    if (!this.sections.includes(sectionName)) return;

    // Instantly hide current section
    if (this.currentSection && this.currentSection !== sectionName) {
      const currentSectionElement = document.getElementById(this.currentSection);
      if (currentSectionElement) {
        currentSectionElement.classList.remove('active');
        currentSectionElement.style.display = 'none';
      }
    }

    // Instantly show new section
    const newSectionElement = document.getElementById(sectionName);
    if (newSectionElement) {
      newSectionElement.style.display = 'block';
      newSectionElement.classList.add('active');
      // Instantly scroll to top
      window.scrollTo(0, 0);
    }

    // Update navigation button states
    this.updateNavigationButtons(sectionName);

    // Update current section
    this.currentSection = sectionName;

    // Fetch publications only when resume section is shown
    if (sectionName === 'resume' && typeof window.publicationsFetched === 'undefined') {
      console.log('Resume section shown, fetching publications...');
      window.publicationsFetched = true;
      fetchPublications();
    } else if (sectionName === 'resume' && window.publicationsFetched) {
      console.log('Resume section shown, but publications already fetched');
    }
  }

  updateNavigationButtons(activeSection) {
    const navButtons = document.querySelectorAll('.nav-bar .segment[data-nav-link]');
    
    navButtons.forEach(button => {
      const buttonSection = this.getSectionFromButton(button);
      const isActive = buttonSection === activeSection;
      
      // Update button state
      if (isActive) {
        button.classList.add('active');
        if (this.isDesktop) {
          this.setDesktopButtonActiveStyle(button);
        } else {
          this.setMobileButtonActiveStyle(button);
        }
      } else {
        button.classList.remove('active');
        if (this.isDesktop) {
          this.setDesktopButtonInactiveStyle(button);
        } else {
          this.setMobileButtonInactiveStyle(button);
        }
      }
    });
  }

  setMobileButtonActiveStyle(button) {
    const iconContainer = button.querySelector('.mobile-icon-wrapper');
    const labelText = button.querySelector('.mobile-nav-label');
    const icon = button.querySelector('.material-symbols-rounded');
    
    if (iconContainer) {
      iconContainer.style.background = 'rgba(232, 222, 248, 1)'; // Exact test2 active background
    }
    
    if (labelText) {
      labelText.style.color = 'rgba(29, 27, 32, 1)'; // Exact test2 active color
      labelText.style.fontWeight = '700'; // Exact test2 active weight
    }
    
    if (icon) {
      icon.style.color = 'rgba(29, 27, 32, 1)'; // Exact test2 active color
      icon.style.fontVariationSettings = '"FILL" 0';
      icon.style.filter = 'none'; // Exact test2 active filter
    }
  }

  setMobileButtonInactiveStyle(button) {
    const iconContainer = button.querySelector('.mobile-icon-wrapper');
    const labelText = button.querySelector('.mobile-nav-label');
    const icon = button.querySelector('.material-symbols-rounded');
    
    if (iconContainer) {
      iconContainer.style.background = 'none';
    }
    
    if (labelText) {
      labelText.style.color = 'rgba(73, 69, 79, 1)'; // Exact test2 inactive color
      labelText.style.fontWeight = '500';
    }
    
    if (icon) {
      icon.style.color = 'rgba(73, 69, 79, 1)'; // Exact test2 inactive color
      icon.style.fontVariationSettings = '"FILL" 0';
      icon.style.filter = 'grayscale(1) brightness(0.6)'; // Exact test2 filter
    }
  }

  setDesktopButtonActiveStyle(button) {
    // Only apply desktop highlighting with style.css primary colors
    const iconContainer = button.querySelector('.desktop-nav-icon-container');
    const labelText = button.querySelector('.desktop-nav-label-text');
    const icon = button.querySelector('.material-symbols-rounded');
    
    if (iconContainer) {
      iconContainer.style.background = '#6f7979'; // From style.css icon-container:hover
    }
    
    if (labelText) {
      labelText.style.fontWeight = '600';
      labelText.style.color = '#E6E0E9'; // MD On-surface color
    }
    
    if (icon) {
      icon.style.color = '#FFFFFF'; // MD On-primary color
      icon.classList.add('filled');
    }
  }

  setDesktopButtonInactiveStyle(button) {
    // Only apply desktop highlighting with MD colors
    const iconContainer = button.querySelector('.desktop-nav-icon-container');
    const labelText = button.querySelector('.desktop-nav-label-text');
    const icon = button.querySelector('.material-symbols-rounded');
    
    if (iconContainer) {
      iconContainer.style.background = '';
    }
    
    if (labelText) {
      labelText.style.fontWeight = '';
      labelText.style.color = '';
    }
    
    if (icon) {
      icon.style.color = 'rgba(255, 255, 255, 0.472)';
      icon.classList.remove('filled');
    }
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

const elementToggleFunc = function (elem) {
  elem.classList.toggle("active");
};

// ========================================
// SIDEBAR FUNCTIONALITY
// ========================================

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () {
    elementToggleFunc(sidebar);
  });
}

// ========================================
// TESTIMONIALS MODAL
// ========================================

const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const testimonialsModalFunc = function () {
  if (modalContainer) modalContainer.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
};

for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    if (modalImg) {
      modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
      modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    }
    if (modalTitle) {
      modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    }
    if (modalText) {
      modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
    }
    testimonialsModalFunc();
  });
}

if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
if (overlay) overlay.addEventListener("click", testimonialsModalFunc);

// ========================================
// CONTACT FORM
// ========================================

const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    if (form && form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else if (formBtn) {
      formBtn.setAttribute("disabled", "");
    }
  });
}

// ========================================
// PAGE NAVIGATION
// ========================================

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const clickedLinkText = this.innerHTML.toLowerCase().trim();
    for (let j = 0; j < pages.length; j++) {
      const pageName = pages[j].dataset.page.toLowerCase();
      if (clickedLinkText.includes(pageName) || pageName === clickedLinkText) {
        pages[j].classList.add("active");
        this.classList.add("active");
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
    window.scrollTo(0, 0);
  });
}

// ========================================
// FILTER CHIPS
// ========================================

function setupFilterLogic() {
  const elements = document.querySelectorAll("md-filter-chip");
  const projectItems = document.querySelectorAll(".project-item");
  
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
  const items = document.querySelectorAll(".project-item");
  
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
  window.navigationManager = new NavigationManager();
  setupGlobalSmoothScrolling();
  
  // Add test functions to global scope for debugging
  window.testHideNavbar = () => {
    if (window.navigationManager) {
      window.navigationManager.testNavbarHide();
    }
  };
  
  window.testShowNavbar = () => {
    if (window.navigationManager) {
      window.navigationManager.testNavbarShow();
    }
  };
});

// Legacy function for backward compatibility
function toggleContent(id, button) {
  if (window.navigationManager) {
    window.navigationManager.showSection(id);
  }
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

async function fetchPublications(delayMs = 100) {
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

    // Clear skeleton loader
    container.innerHTML = "";

    // Check if the response has the expected structure
    const articles = data.data?.articles || data.articles;
    
    if (!articles || articles.length === 0) {
      console.log('No articles found in API response');
      errorMessage.textContent = "No publications found.";
      errorMessage.style.display = "block";
      return;
    }

    console.log(`Found ${articles.length} publications`);

    articles.forEach((article, index) => {
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

      if (typeof gsap !== 'undefined') {
        gsap.to(pubDiv, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: index * 0.2,
          ease: "power2.out",
          onComplete: () => pubDiv.classList.add("show"),
        });
      }
    });
    
    console.log('Publications loaded and displayed successfully');
  } catch (error) {
    console.error("Error fetching publications:", error);
    errorMessage.textContent = "Failed to load publications. Please try again later.";
    errorMessage.style.display = "block";
    container.innerHTML = ''; // Clear skeleton loader
  }
}

// Function to show skeleton loader
function showSkeletonLoader(container) {
  container.innerHTML = `
    <div class="publications-skeleton">
      <div class="skeleton-item">
        <div class="skeleton-title"></div>
        <div class="skeleton-authors"></div>
        <div class="skeleton-publication"></div>
        <div class="skeleton-year"></div>
        <div class="skeleton-links">
          <div class="skeleton-link"></div>
          <div class="skeleton-link"></div>
        </div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-title"></div>
        <div class="skeleton-authors"></div>
        <div class="skeleton-publication"></div>
        <div class="skeleton-year"></div>
        <div class="skeleton-links">
          <div class="skeleton-link"></div>
          <div class="skeleton-link"></div>
        </div>
      </div>
      <div class="skeleton-item">
        <div class="skeleton-title"></div>
        <div class="skeleton-authors"></div>
        <div class="skeleton-publication"></div>
        <div class="skeleton-year"></div>
        <div class="skeleton-links">
          <div class="skeleton-link"></div>
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

// Setup skeleton placeholders for images
function setupImageSkeletons() {
  const images = document.querySelectorAll('img[src*=".jpg"], img[src*=".jpeg"], img[src*=".png"]');
  
  images.forEach(img => {
    // Create skeleton container
    const container = document.createElement('div');
    container.className = 'image-container-skeleton';
    container.style.width = img.offsetWidth || '100%';
    container.style.height = img.offsetHeight || 'auto';
    
    // Create skeleton placeholder
    const skeleton = document.createElement('div');
    skeleton.className = 'image-skeleton';
    skeleton.style.width = '100%';
    skeleton.style.height = '100%';
    
    // Insert skeleton before image
    img.parentNode.insertBefore(container, img);
    container.appendChild(skeleton);
    container.appendChild(img);
    
    // Handle image load
    if (img.complete) {
      img.classList.add('loaded');
      skeleton.style.display = 'none';
    } else {
      img.addEventListener('load', () => {
        img.classList.add('loaded');
        skeleton.style.display = 'none';
      });
      
      img.addEventListener('error', () => {
        skeleton.style.display = 'none';
        img.style.display = 'none';
      });
    }
  });
}

// Initialize image skeletons
document.addEventListener('DOMContentLoaded', () => {
  setupImageSkeletons();
});