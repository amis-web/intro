// Initialize Lucide Icons
lucide.createIcons();

// Global variables
let worksData = [];
let workContents = {};
let displayedCount = 0;
const INITIAL_DISPLAY = 6;
const LOAD_MORE_COUNT = 10;
let currentFilter = 'all';

// 1. Mobile Menu Toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});

// 2. Intersection Observer for Fade-in Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-visible');
            // Stop observing once visible
            observer.unobserve(entry.target); 
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-hidden').forEach(el => {
    observer.observe(el);
});

// 3. Number Counter Animation
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.counter');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const duration = 2000; // ms
                const increment = target / (duration / 16); 
                
                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                updateCounter();
            });
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
if(statsSection) counterObserver.observe(statsSection);

// 4. Load Works Data from JSON and Markdown files
async function loadWorksData() {
    try {
        // Load works metadata from JSON
        const response = await fetch('assets/data/works.json');
        let data = await response.json();
        
        // Sort by date (newest first)
        worksData = data.sort((a, b) => {
            const dateA = new Date(a.date.replace(/\./g, '-'));
            const dateB = new Date(b.date.replace(/\./g, '-'));
            return dateB - dateA;
        });
        
        // Load all markdown content files
        for (const work of worksData) {
            const mdResponse = await fetch(work.contentFile);
            const mdText = await mdResponse.text();
            workContents[work.id] = mdText;
        }
        
        // Render initial work cards
        displayedCount = 0;
        renderWorkCards(INITIAL_DISPLAY);
        updateLoadMoreButton();
        
        // Initialize filter and modal after rendering
        initializeWorksFilter();
        initializeModal();
        initializeLoadMore();
        
    } catch (error) {
        console.error('Error loading works data:', error);
    }
}

// Render work cards dynamically
function renderWorkCards(count = INITIAL_DISPLAY, append = false) {
    const worksGrid = document.getElementById('works-grid');
    if (!worksGrid) return;
    
    if (!append) {
        worksGrid.innerHTML = '';
        displayedCount = 0;
    }
    
    // Filter works based on current filter
    const filteredWorks = currentFilter === 'all' 
        ? worksData 
        : worksData.filter(work => work.category === currentFilter);
    
    // Determine how many to display
    const endIndex = Math.min(displayedCount + count, filteredWorks.length);
    const worksToDisplay = filteredWorks.slice(displayedCount, endIndex);
    
    worksToDisplay.forEach(work => {
        const imagePositionClass = `img-position-${work.imagePosition || 'center'}`;
        
        const cardHTML = `
            <div class="work-item group cursor-pointer fade-hidden" data-category="${work.category}" data-modal="${work.id}">
                <div class="overflow-hidden rounded-lg mb-4 relative aspect-video">
                    <img src="${work.image}" alt="${work.title}" class="w-full h-full object-cover ${imagePositionClass} transition-transform duration-500 group-hover:scale-110">
                    <div class="absolute top-2 left-2 bg-${work.badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded">${work.badge}</div>
                </div>
                <div class="text-xs text-slate-400 mb-1">${work.date}</div>
                <h3 class="font-bold text-navy-900 group-hover:text-accent-500 transition-colors">${work.title}</h3>
            </div>
        `;
        
        worksGrid.innerHTML += cardHTML;
    });
    
    displayedCount = endIndex;
    
    // Trigger fade-in animation for new elements
    setTimeout(() => {
        document.querySelectorAll('.work-item.fade-hidden').forEach(el => {
            el.classList.add('fade-visible');
        });
        // Re-initialize Lucide icons
        lucide.createIcons();
    }, 100);
}

// 5. Works Filter Logic
function initializeWorksFilter() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); 
            
            // Styling manual toggle since I used custom CSS class .active
            tabBtns.forEach(b => {
                b.classList.remove('bg-navy-900', 'text-white', 'border-navy-900');
                b.classList.add('border-slate-200');
            });
            btn.classList.remove('border-slate-200');
            btn.classList.add('bg-navy-900', 'text-white', 'border-navy-900');

            const filter = btn.getAttribute('data-filter');
            currentFilter = filter;
            
            // Reset and re-render with initial count
            displayedCount = 0;
            renderWorkCards(INITIAL_DISPLAY, false);
            updateLoadMoreButton();
        });
    });
    
    // Initial tab styling
    const activeTab = document.querySelector('.tab-btn.active');
    if(activeTab) {
         activeTab.classList.remove('border-slate-200');
         activeTab.classList.add('bg-navy-900', 'text-white', 'border-navy-900');
    }
}

// Update Load More Button visibility
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!loadMoreBtn) return;
    
    const filteredWorks = currentFilter === 'all' 
        ? worksData 
        : worksData.filter(work => work.category === currentFilter);
    
    if (displayedCount < filteredWorks.length) {
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.classList.add('hidden');
    }
}

// Initialize Load More functionality
function initializeLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', () => {
        renderWorkCards(LOAD_MORE_COUNT, true);
        updateLoadMoreButton();
    });
}

// 6. Modal Logic
function initializeModal() {
    const modal = document.getElementById('workModal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    // Open modal
    const workItems = document.querySelectorAll('.work-item');
    workItems.forEach(item => {
        item.addEventListener('click', () => {
            const modalId = item.getAttribute('data-modal');
            const work = worksData.find(w => w.id === modalId);
            const mdContent = workContents[modalId];
            
            if (work && mdContent) {
                // Parse markdown to HTML using marked.js
                const htmlContent = marked.parse(mdContent);
                
                // Apply image position class
                const imagePositionClass = `img-position-${work.imagePosition || 'center'}`;
                const modalImageElement = document.querySelector('.modal-image-element');
                
                // Remove existing position classes
                modalImageElement.classList.remove('img-position-top', 'img-position-center', 'img-position-bottom');
                // Add new position class
                modalImageElement.classList.add(imagePositionClass);
                
                document.querySelector('.modal-badge').textContent = work.badge;
                document.querySelector('.modal-title').textContent = work.title;
                document.querySelector('.modal-date').textContent = work.date;
                modalImageElement.src = work.image;
                document.querySelector('.modal-body').innerHTML = htmlContent;
                
                modal.classList.remove('hidden');
                modal.classList.add('show');
                document.body.classList.add('modal-open');
                
                // Re-initialize Lucide icons in modal
                setTimeout(() => lucide.createIcons(), 100);
            }
        });
    });

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    };

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Close modal with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
}

// Initialize: Load works data when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadWorksData();
});
