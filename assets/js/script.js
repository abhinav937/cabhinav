"use strict";

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
            
            // Hide navbar when scrolling down
            if (scrollDelta > 10 && currentScrollY > 50) {
              this.hideMobileNavbar();
            }
            // Show navbar when scrolling up
            else if (scrollDelta < -10) {
              this.showMobileNavbar();
            }
            // Always show at top
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
      mobileNavContainer.classList.add('navbar-hidden');
      this.isNavbarHidden = true;
    }
  }

  showMobileNavbar() {
    const mobileNavContainer = document.querySelector('.mobile-nav-container');
    if (mobileNavContainer && mobileNavContainer.classList.contains('navbar-hidden')) {
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

    // Hide current section with animation
    if (this.currentSection && this.currentSection !== sectionName) {
      const currentSectionElement = document.getElementById(this.currentSection);
      if (currentSectionElement) {
        currentSectionElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        currentSectionElement.style.opacity = '0';
        currentSectionElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          currentSectionElement.style.display = 'none';
        }, 300);
      }
    }

    // Show new section with animation
    const newSectionElement = document.getElementById(sectionName);
    if (newSectionElement) {
      newSectionElement.style.display = 'block';
      newSectionElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      
      // Small delay to ensure display: block is applied
      setTimeout(() => {
        newSectionElement.style.opacity = '1';
        newSectionElement.style.transform = 'translateY(0)';
        
        // Scroll to top of page for both desktop and mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Ensure desktop navbar stays at top
        if (this.isDesktop) {
          const desktopNavBar = document.querySelector('.desktop-nav-bar');
          if (desktopNavBar) {
            desktopNavBar.style.position = 'fixed !important';
            desktopNavBar.style.top = '0 !important';
            desktopNavBar.style.left = '0 !important';
            desktopNavBar.style.right = '0 !important';
            desktopNavBar.style.bottom = 'auto !important';
            desktopNavBar.style.transform = 'none !important';
            desktopNavBar.style.zIndex = '1000 !important';
          }
        }
      }, 50);
    } else {
      return;
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
  
  function deselectAll() {
    elements.forEach((element) => (element.selected = false));
  }
  
  elements.forEach((element) => {
    element.addEventListener("click", () => {
      deselectAll();
      element.selected = true;
      const clickedId = element.id;
      const items = document.querySelectorAll(".project-item");
      
      items.forEach((item) => {
        if (clickedId === "all" || item.dataset.category === clickedId) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
}

setupFilterLogic();

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  window.navigationManager = new NavigationManager();
  
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

async function fetchPublications(delayMs = 1500) {
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