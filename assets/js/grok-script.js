// ========================================
// GROK-STYLE PORTFOLIO JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initScrollEffects();
    initAnimations();
    initPublications();
});


// ========================================
// SCROLL EFFECTS
// ========================================

function initScrollEffects() {
    // No navbar to handle scroll effects for
}

// ========================================
// ANIMATIONS
// ========================================

function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all elements with fade-in classes
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-up, .footer');
    fadeElements.forEach(element => {
        observer.observe(element);
    });

    // Add staggered animation delays for timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.15}s`;
    });

    // Add staggered animation delays for publication cards
    const publicationCards = document.querySelectorAll('.publication-card');
    publicationCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Hero text typewriter effect (optional)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // Add a subtle glow effect on hover for interactive elements
        const cards = document.querySelectorAll('.project-card, .card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });
    }
}

// ========================================
// UTILITIES
// ========================================

// Smooth scroll utility
function smoothScrollTo(element, offset = 0) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Debounce utility for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// PUBLICATIONS LOADING
// ========================================

// Load publications when publications section is visible
function initPublications() {
    const publicationsSection = document.getElementById('publications');
    if (!publicationsSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !window.publicationsFetched) {
                window.publicationsFetched = true;
                fetchPublications(0);
            }
        });
    }, { threshold: 0.1 });

    observer.observe(publicationsSection);
}

async function fetchPublications(delayMs = 0) {
    console.log('fetchPublications function called with delay:', delayMs);
    const API_URL = "https://api.cabhinav.com/api/server.js";
    const container = document.getElementById("publications-container");
    const errorMessage = document.getElementById("error-message");

    if (!container || !errorMessage) return;

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
                        /Abhinav Chinnusamy/g,
                        '<strong>Abhinav Chinnusamy</strong>'
                    );

                    const publicationCard = document.createElement('div');
                    publicationCard.className = 'publication-card fade-in-up';
                    publicationCard.style.animationDelay = `${index * 0.1}s`;

                    publicationCard.innerHTML = `
                        <h3 class="publication-title">${article.title || "Untitled"}</h3>
                        <p class="publication-authors">${authors}</p>
                        <p class="publication-venue">${article.venue || ""}</p>
                        <p class="publication-year">${article.year || ""}</p>
                        ${article.abstract ? `<p class="publication-abstract">${article.abstract}</p>` : ''}
                        <div class="publication-links">
                            ${article.doi ? `<a href="${article.doi}" target="_blank">DOI</a>` : ''}
                            ${article.pdf ? `<a href="${article.pdf}" target="_blank">PDF</a>` : ''}
                            ${article.url ? `<a href="${article.url}" target="_blank">Link</a>` : ''}
                        </div>
                    `;

                    container.appendChild(publicationCard);
                });

                errorMessage.style.display = "none";
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
                <h3><span class="skeleton skeleton-text" style="height: 22px; width: 100%; display: block;"></span></h3>
                <p class="authors"><span class="skeleton skeleton-text" style="height: 22px; width: 35%; display: block;"></span></p>
                <p><span class="skeleton skeleton-text" style="height: 22px; width: 80%; display: block;"></span></p>
                <p class="year"><span class="skeleton skeleton-text" style="height: 16px; width: 80px; display: inline-block;"></span></p>
                <div class="links">
                    <span class="skeleton skeleton-button" style="width: 50px; height: 32px;"></span>
                    <span class="skeleton skeleton-button" style="width: 80px; height: 32px;"></span>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// PERFORMANCE OPTIMIZATIONS
// ========================================

// Lazy loading for images (if needed in future)
// Preload critical images
function preloadCriticalImages() {
    const criticalImages = [
        './assets/images/profile/my_profile.jpg',
        './assets/images/projects/yeswegan1.JPEG',
        './assets/images/projects/gan.webp'
    ];

    criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Call optimizations on load
preloadCriticalImages();
