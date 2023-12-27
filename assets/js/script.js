'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// // custom select variables
// const select = document.querySelector("[data-select]");
// const selectItems = document.querySelectorAll("[data-select-item]");
// const selectValue = document.querySelector("[data-selecct-value]");
// const filterBtn = document.querySelectorAll("[data-filter-btn]");

// select.addEventListener("click", function () { elementToggleFunc(this); });

// // add event in all select items
// for (let i = 0; i < selectItems.length; i++) {
//   selectItems[i].addEventListener("click", function () {

//     let selectedValue = this.innerText.toLowerCase();
//     selectValue.innerText = this.innerText;
//     elementToggleFunc(select);
//     filterFunc(selectedValue);

//   });
// }

// // filter variables
// const filterItems = document.querySelectorAll("[data-filter-item]");

// const filterFunc = function (selectedValue) {

//   for (let i = 0; i < filterItems.length; i++) {

//     if (selectedValue === "all") {
//       filterItems[i].classList.add("active");
//     } else if (selectedValue === filterItems[i].dataset.category) {
//       filterItems[i].classList.add("active");
//     } else {
//       filterItems[i].classList.remove("active");
//     }

//   }

// }

// // add event in all filter button items for large screen
// let lastClickedBtn = filterBtn[0];

// for (let i = 0; i < filterBtn.length; i++) {

//   filterBtn[i].addEventListener("click", function () {

//     let selectedValue = this.innerText.toLowerCase();
//     selectValue.innerText = this.innerText;
//     filterFunc(selectedValue);

//     lastClickedBtn.classList.remove("active");
//     this.classList.add("active");
//     lastClickedBtn = this;

//   });

// }



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}

// material 3 Select chips
function setupFilterLogic() {
  const elements = document.querySelectorAll('md-filter-chip');

  function deselectAll() {
      elements.forEach(element => element.selected = false);
  }

  elements.forEach(element => {
      element.addEventListener('click', () => {
          deselectAll();
          element.selected = true;
          const clickedId = element.id;
          const items = document.querySelectorAll('.project-item');
          items.forEach(item => {
              if (clickedId === 'all' || item.dataset.category === clickedId) {
                  item.style.display = 'block';
              } else {
                  item.style.display = 'none';
              }
          });
      });
  });
}

// Call setupFilterLogic when the DOM is ready
setupFilterLogic();setupFilterLogic();



// Material 3 navbar

var activeContentId = 'about'; // Set the default active section

// Initialize the active state for the default section
(function initializeActiveState() {
  var initialActiveButton = document.getElementById('about1'); // Target using data-nav-link attribute
  if (initialActiveButton) {
    initialActiveButton.querySelector('.icon-container').style.background = '#475959c6';
    initialActiveButton.querySelector('.label-text').style.fontWeight  = '600';
    initialActiveButton.querySelector('.label-text').style.color  = '#E6E0E9';
    initialActiveButton.querySelector('.material-symbols-rounded').style.color  = '#FFFFFF';
    initialActiveButton.querySelector('.material-symbols-rounded').classList.add('filled');
    // Assuming you have a function to display the initial content
    displayInitialContent('about');
  }
})();

function toggleContent(id, button) {
  console.log(id, activeContentId);
  console.log(button, id)
  // Check if the clicked button is already active
  var isActiveButton = activeContentId === id;
  console.log(isActiveButton);

  // Hide the currently active content if the button is not already active
  if ((!isActiveButton && activeContentId !== null)) {
    var activeContent = document.getElementById(activeContentId);
    if (activeContent) {
      activeContent.style.display = 'none';
    }
  }


  // Display the selected content section
  var content = document.getElementById(id);
  if (content) {
    isActiveButton = true
    content.style.display = 'block';
  }

  // Deactivate all buttons and reset icon container backgrounds
  document.querySelectorAll('.segment').forEach(function (btn) {
    btn.classList.remove('active');
    btn.querySelector('.icon-container').style.background = ''; // Reset background
    btn.querySelector('.label-text').style.fontWeight  = ''; // Reset background
    btn.querySelector('.label-text').style.color  = ''; // Reset background
    btn.querySelector('.material-symbols-rounded').style.color  = 'rgba(255, 255, 255, 0.472)'; // Reset background
    btn.querySelector('.material-symbols-rounded').classList.remove('filled'); // Remove 'filled' class
  });

  // Activate the clicked button and apply the active icon container background
  if (isActiveButton) {
    console.log(isActiveButton);
    button.classList.add('active');
    button.querySelector('.icon-container').style.background = '#475959c6';
    button.querySelector('.label-text').style.fontWeight  = '600';
    button.querySelector('.label-text').style.color  = '#E6E0E9';
    button.querySelector('.material-symbols-rounded').style.color  = '#FFFFFF';
    button.querySelector('.material-symbols-rounded').classList.add('filled');
    activeContentId = id;
  }
}
