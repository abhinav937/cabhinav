'use strict';

// Element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// Sidebar variables and toggle (placeholders)
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });

// Testimonials variables and modal logic (placeholders)
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
}
for (let i = 0; i < testimonialsItem.length; i++) {
  testimonialsItem[i].addEventListener("click", function () {
    if (modalImg) modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    if (modalImg) modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    if (modalTitle) modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    if (modalText) modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
    testimonialsModalFunc();
  });
}
if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
if (overlay) overlay.addEventListener("click", testimonialsModalFunc);

// Contact form logic (placeholders)
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {
    if (form && form.checkValidity()) formBtn.removeAttribute("disabled");
    else if (formBtn) formBtn.setAttribute("disabled", "");
  });
}

// Page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// Add event to all nav links with new scroll logic
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const clickedLinkText = this.innerHTML.toLowerCase().trim(); // e.g., "Checkout my resume" or "Resume"
    for (let j = 0; j < pages.length; j++) { // Use 'j' to avoid scoping conflict
      const pageName = pages[j].dataset.page.toLowerCase(); // e.g., "resume"
      if (clickedLinkText.includes(pageName) || pageName === clickedLinkText) { // Match "resume" in "Checkout my resume"
        pages[j].classList.add("active");
        this.classList.add("active"); // Keep the clicked link active
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active"); // Reset other links
      }
    }
    window.scrollTo(0, 0); // Scroll to top
  });
}

// Material 3 Select chips (placeholders)
function setupFilterLogic() {
  const elements = document.querySelectorAll('md-filter-chip');
  function deselectAll() { elements.forEach(element => element.selected = false); }
  elements.forEach(element => {
    element.addEventListener('click', () => {
      deselectAll();
      element.selected = true;
      const clickedId = element.id;
      const items = document.querySelectorAll('.project-item');
      items.forEach(item => {
        if (clickedId === 'all' || item.dataset.category === clickedId) item.style.display = 'block';
        else item.style.display = 'none';
      });
    });
  });
}
setupFilterLogic();

// Material 3 Navbar
var activeContentId = 'about';

// Initialize the active state
(function initializeActiveState() {
  var initialActiveButton = document.getElementById('about1');
  if (initialActiveButton) {
    initialActiveButton.classList.add('active');
    const iconContainer = initialActiveButton.querySelector('.icon-container');
    const labelText = initialActiveButton.querySelector('.label-text');
    const icon = initialActiveButton.querySelector('.material-symbols-rounded');
    if (iconContainer) iconContainer.style.background = '#475959c6';
    if (labelText) {
      labelText.style.fontWeight = '600';
      labelText.style.color = '#E6E0E9';
    }
    if (icon) {
      icon.style.color = '#FFFFFF';
      icon.classList.add('filled');
      console.log('Initialized About icon color:', icon.style.color);
    }
    var initialContent = document.getElementById('about');
    if (initialContent) initialContent.style.display = 'block';
  }
})();

// Revised toggleContent function
function toggleContent(id, button) {
  console.log('toggleContent called with id:', id, 'button:', button);

  if (activeContentId === id) {
    console.log('Already active, no changes needed');
    return;
  }

  // Hide the currently active content
  if (activeContentId !== null) {
    var activeContent = document.getElementById(activeContentId);
    if (activeContent) {
      activeContent.style.display = 'none';
      console.log('Hid content:', activeContentId);
    }
  }

  // Show the new content
  var content = document.getElementById(id);
  if (content) {
    content.style.display = 'block';
    content.scrollIntoView({ behavior: "smooth" });
    console.log('Showing content:', id);
  } else {
    console.log('No content found for id:', id);
    return;
  }

  // Find the corresponding navbar button
  let targetNavButton = null;
  document.querySelectorAll('.nav-bar .segment[data-nav-link]').forEach(navBtn => {
    if (navBtn.getAttribute('onclick').includes(`'${id}'`)) {
      targetNavButton = navBtn;
    }
  });

  // Reset all navigation buttons
  document.querySelectorAll('[data-nav-link]').forEach(function (btn) {
    if (btn !== targetNavButton) { // Skip the target navbar button
      btn.classList.remove('active');
      if (btn.tagName.toLowerCase() === 'md-text-button') {
        btn.style.color = 'rgba(255, 255, 255, 0.472)';
        btn.style.fontWeight = '';
        console.log('Reset md-text-button:', btn);
      } else {
        const iconContainer = btn.querySelector('.icon-container');
        const labelText = btn.querySelector('.label-text');
        const icon = btn.querySelector('.material-symbols-rounded');
        if (iconContainer) iconContainer.style.background = '';
        if (labelText) {
          labelText.style.fontWeight = '';
          labelText.style.color = '';
        }
        if (icon) {
          icon.style.color = 'rgba(255, 255, 255, 0.472)';
          icon.classList.remove('filled');
          console.log('Reset icon color for:', btn, 'to:', icon.style.color);
        }
      }
    }
  });

  // Apply active styling to the corresponding navbar button (not the clicked button)
  if (targetNavButton) {
    targetNavButton.classList.add('active');
    const iconContainer = targetNavButton.querySelector('.icon-container');
    const labelText = targetNavButton.querySelector('.label-text');
    const icon = targetNavButton.querySelector('.material-symbols-rounded');
    if (iconContainer) iconContainer.style.background = '#475959c6';
    if (labelText) {
      labelText.style.fontWeight = '600';
      labelText.style.color = '#E6E0E9';
    }
    if (icon) {
      icon.style.color = '#FFFFFF';
      icon.classList.add('filled');
      console.log('Set active icon color for navbar button:', targetNavButton, 'to:', icon.style.color);
    }
  } else {
    console.log('No corresponding navbar button found for id:', id);
  }

  activeContentId = id;
  console.log('Updated activeContentId to:', activeContentId);
}