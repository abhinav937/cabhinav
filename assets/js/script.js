"use strict";

// ========================================
// OPTIMIZED NAVIGATION SYSTEM
// ========================================

class NavigationManager {
  constructor() {
    this.currentSection = 'about';
    this.sections = ['about', 'resume', 'contact'];
    this.isDesktop = window.innerWidth >= 1250;
    this.init();
  }

  init() {
    this.setupNavigationButtons();
    this.setupContentSections();
    this.showSection('about');
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
        }
      });
    });
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
      }
    });
  }

  showSection(sectionName) {
    if (!this.sections.includes(sectionName)) return;

    // Hide current section
    if (this.currentSection && this.currentSection !== sectionName) {
      const currentSectionElement = document.getElementById(this.currentSection);
      if (currentSectionElement) {
        currentSectionElement.style.display = 'none';
      }
    }

    // Show new section
    const newSectionElement = document.getElementById(sectionName);
    if (newSectionElement) {
      newSectionElement.style.display = 'block';
      // Only scroll on desktop to prevent mobile jumping
      if (this.isDesktop) {
        newSectionElement.scrollIntoView({ behavior: 'smooth' });
      }
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
        }
      } else {
        button.classList.remove('active');
        if (this.isDesktop) {
          this.setDesktopButtonInactiveStyle(button);
        }
      }
    });
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

    if (!data.articles || data.articles.length === 0) {
      console.log('No articles found in API response');
      errorMessage.textContent = "No publications found.";
      errorMessage.style.display = "block";
      return;
    }

    console.log(`Found ${data.articles.length} publications`);

    data.articles.forEach((article, index) => {
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