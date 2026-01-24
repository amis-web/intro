// Initialize Lucide Icons
lucide.createIcons();

// Check if marked.js is loaded
if (typeof marked === 'undefined') {
    console.error('marked.js is not loaded. Please check the CDN connection.');
}

// Global variables
let worksData = [];
let workContents = {};
let newsData = [];
let newsContents = {};
let displayedCount = 0;
// レスポンシブ対応: モバイル時は3件、PC時は6件表示
const INITIAL_DISPLAY = window.innerWidth < 768 ? 3 : 6;
const LOAD_MORE_COUNT = 3;
const NEWS_DISPLAY_COUNT = 3;
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
            <div class="work-item group cursor-pointer fade-hidden bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300" data-category="${work.category}" data-modal="${work.id}">
                <div class="flex flex-col">
                    <!-- モバイル: 画像非表示、PC: 画像表示 -->
                    <div class="hidden md:block overflow-hidden relative aspect-video">
                        <img src="${work.image}" alt="${work.title}" class="w-full h-full object-cover ${imagePositionClass} transition-transform duration-500 group-hover:scale-110">
                        <div class="absolute top-2 left-2 bg-${work.badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded">${work.badge}</div>
                    </div>
                    <div class="p-4 md:p-6">
                        <!-- モバイル用バッジ -->
                        <div class="md:hidden mb-2">
                            <span class="inline-block bg-${work.badgeColor} text-white text-[10px] font-bold px-2 py-1 rounded">${work.badge}</span>
                        </div>
                        <div class="text-xs text-slate-400 mb-1">${work.date}</div>
                        <h3 class="font-bold text-navy-900 group-hover:text-accent-500 transition-colors">${work.title}</h3>
                    </div>
                </div>
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
let modalInitialized = false;

function initializeModal() {
    const modal = document.getElementById('workModal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    // Open modal (use event delegation to avoid duplicate listeners)
    const worksGrid = document.getElementById('works-grid');
    if (worksGrid && !modalInitialized) {
        worksGrid.addEventListener('click', (e) => {
            const workItem = e.target.closest('.work-item');
            if (workItem) {
                const modalId = workItem.getAttribute('data-modal');
                openWorkModalById(modalId, true);
            }
        });
    }

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
        
        // ハッシュをクリア（スクロール位置を維持）
        if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    };

    // モーダルのクローズイベントは一度だけ登録
    if (!modalInitialized) {
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                closeModal();
            }
        });
        
        modalInitialized = true;
    }
}

// Open work modal by ID (with optional URL update)
function openWorkModalById(modalId, updateUrl = false) {
    const modal = document.getElementById('workModal');
    const work = worksData.find(w => w.id === modalId);
    const mdContent = workContents[modalId];
    
    if (work && mdContent) {
        // Parse markdown to HTML using marked.js
        let htmlContent;
        try {
            if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
                htmlContent = marked.parse(mdContent);
            } else {
                console.error('marked.parse is not available');
                htmlContent = mdContent.replace(/\n/g, '<br>');
            }
        } catch (error) {
            console.error('Error parsing markdown:', error);
            htmlContent = mdContent.replace(/\n/g, '<br>');
        }
        
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
        
        // スクロール位置を常にトップにリセット
        const modalScrollContainer = modal.querySelector('.overflow-y-auto');
        if (modalScrollContainer) {
            modalScrollContainer.scrollTop = 0;
        }
        
        // Update URL using hash
        if (updateUrl) {
            window.location.hash = `works/${modalId}`;
        }
        
        // Re-initialize Lucide icons in modal
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// Initialize: Load works data when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadWorksData();
    loadNewsData();
});

// 7. Load News Data from JSON and Markdown files
async function loadNewsData() {
    try {
        // Load news metadata from JSON
        const response = await fetch('assets/data/news.json');
        let data = await response.json();
        
        // Sort by date (newest first)
        newsData = data.sort((a, b) => {
            const dateA = new Date(a.date.replace(/\./g, '-'));
            const dateB = new Date(b.date.replace(/\./g, '-'));
            return dateB - dateA;
        });
        
        // Load all markdown content files
        for (const news of newsData) {
            const mdResponse = await fetch(news.contentFile);
            const mdText = await mdResponse.text();
            newsContents[news.id] = mdText;
        }
        
        // Render news items (top 3)
        renderNewsItems();
        
        // Initialize news modal
        initializeNewsModal();
        
    } catch (error) {
        console.error('Error loading news data:', error);
    }
}

// Render news items dynamically
function renderNewsItems() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;
    
    newsGrid.innerHTML = '';
    
    // Display only the latest 3 news items
    const newsToDisplay = newsData.slice(0, NEWS_DISPLAY_COUNT);
    
    newsToDisplay.forEach(news => {
        const imagePositionClass = `img-position-${news.imagePosition || 'center'}`;
        
        // Determine badge color classes based on categoryColor
        let badgeColorClass = '';
        switch(news.categoryColor) {
            case 'blue':
                badgeColorClass = 'bg-blue-100 text-blue-600';
                break;
            case 'orange':
                badgeColorClass = 'bg-accent-100 text-accent-600';
                break;
            case 'green':
                badgeColorClass = 'bg-green-100 text-green-600';
                break;
            case 'purple':
                badgeColorClass = 'bg-purple-100 text-purple-600';
                break;
            case 'pink':
                badgeColorClass = 'bg-pink-100 text-pink-600';
                break;
            case 'red':
                badgeColorClass = 'bg-red-100 text-red-600';
                break;
            default:
                badgeColorClass = 'bg-slate-100 text-slate-600';
        }
        
        const cardHTML = `
            <div class="news-item group cursor-pointer bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300" data-modal="${news.id}">
                <div class="flex flex-col md:flex-row h-auto md:h-56">
                    <!-- モバイル: 画像非表示、PC: 画像表示 -->
                    <div class="hidden md:block md:w-1/4 md:h-full overflow-hidden flex-shrink-0">
                        <img src="${news.image}" alt="${news.title}" class="w-full h-full object-cover ${imagePositionClass} transition-transform duration-500 group-hover:scale-105">
                    </div>
                    <div class="p-4 md:p-6 md:w-3/4 flex flex-col justify-center">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-xs text-slate-400 font-mono">${news.date}</span>
                            <span class="px-2 py-0.5 ${badgeColorClass} rounded text-[10px] font-bold">${news.category}</span>
                        </div>
                        <h3 class="font-bold text-base md:text-lg text-navy-900 mb-1 md:mb-2 group-hover:text-accent-500 transition-colors line-clamp-2">${news.title}</h3>
                        <p class="text-sm text-slate-500 line-clamp-2 hidden md:block">${news.description || ''}</p>
                    </div>
                </div>
            </div>
        `;
        
        newsGrid.innerHTML += cardHTML;
    });
    
    // Re-initialize Lucide icons
    lucide.createIcons();
}

// 8. News Modal Logic (updated to use markdown content)
let newsModalInitialized = false;

function initializeNewsModal() {
    // Use event delegation to avoid duplicate listeners
    const newsGrid = document.getElementById('news-grid');
    if (newsGrid && !newsModalInitialized) {
        newsGrid.addEventListener('click', (e) => {
            const newsItem = e.target.closest('.news-item');
            if (newsItem) {
                const modalId = newsItem.getAttribute('data-modal');
                openNewsModalById(modalId, true);
            }
        });
        newsModalInitialized = true;
    }
}

function openNewsModalById(newsId, updateUrl = false) {
    const news = newsData.find(n => n.id === newsId);
    const mdContent = newsContents[newsId];
    
    if (news && mdContent) {
        openNewsModal(news, mdContent, updateUrl);
    }
}

function openNewsModal(news, mdContent, updateUrl = false) {
    // Create modal if it doesn't exist
    let newsModal = document.getElementById('newsModal');
    
    if (!newsModal) {
        // Create modal HTML (keep original design, but with internal scrolling)
        const modalHTML = `
            <div id="newsModal" class="modal hidden fixed inset-0 z-50">
                <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
                    <div class="modal-overlay fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
                    
                    <div class="modal-content bg-white rounded-xl shadow-2xl max-w-4xl w-full relative z-10 max-h-[90dvh] flex flex-col">
                        <button class="news-modal-close absolute top-4 right-4 z-50 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110">
                            <i data-lucide="x" class="w-6 h-6 text-navy-900"></i>
                        </button>
                        
                        <div class="overflow-y-auto flex-1">
                            <div class="modal-image-container h-64 md:h-80 overflow-hidden rounded-t-xl">
                                <img class="news-modal-image w-full h-full object-cover" src="" alt="">
                            </div>
                            
                            <div class="p-6 md:p-10">
                                <div class="flex items-center gap-3 mb-4">
                                    <span class="news-modal-date text-sm text-slate-400 font-mono"></span>
                                    <span class="news-modal-badge px-3 py-1 rounded text-xs font-bold"></span>
                                </div>
                                
                                <h2 class="news-modal-title text-2xl md:text-3xl font-bold text-navy-900 mb-6 leading-tight"></h2>
                                
                                <div class="news-modal-body markdown-content prose prose-slate max-w-none">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        newsModal = document.getElementById('newsModal');
        
        // Add close handlers
        const closeBtn = newsModal.querySelector('.news-modal-close');
        const overlay = newsModal.querySelector('.modal-overlay');
        
        const closeNewsModal = () => {
            newsModal.classList.remove('show');
            setTimeout(() => {
                newsModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }, 300);
            
            // ハッシュをクリア（スクロール位置を維持）
            if (window.location.hash) {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };
        
        closeBtn.addEventListener('click', closeNewsModal);
        overlay.addEventListener('click', closeNewsModal);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && newsModal.classList.contains('show')) {
                closeNewsModal();
            }
        });
    }
    
    // Parse markdown to HTML using marked.js
    let htmlContent;
    try {
        if (typeof marked !== 'undefined' && typeof marked.parse === 'function') {
            htmlContent = marked.parse(mdContent);
        } else {
            console.error('marked.parse is not available');
            htmlContent = mdContent.replace(/\n/g, '<br>');
        }
    } catch (error) {
        console.error('Error parsing markdown:', error);
        htmlContent = mdContent.replace(/\n/g, '<br>');
    }
    
    // Apply image position class
    const imagePositionClass = `img-position-${news.imagePosition || 'center'}`;
    const modalImageElement = newsModal.querySelector('.news-modal-image');
    
    // Remove existing position classes
    modalImageElement.classList.remove('img-position-top', 'img-position-center', 'img-position-bottom');
    // Add new position class
    modalImageElement.classList.add(imagePositionClass);
    
    // Update modal content
    modalImageElement.src = news.image;
    newsModal.querySelector('.news-modal-date').textContent = news.date;
    newsModal.querySelector('.news-modal-title').textContent = news.title;
    newsModal.querySelector('.news-modal-body').innerHTML = htmlContent;
    
    // Set badge color based on categoryColor
    const badge = newsModal.querySelector('.news-modal-badge');
    badge.textContent = news.category;
    
    // Remove all badge color classes
    badge.className = 'news-modal-badge px-3 py-1 rounded text-xs font-bold';
    
    // Add appropriate color class
    switch(news.categoryColor) {
        case 'blue':
            badge.classList.add('bg-blue-100', 'text-blue-600');
            break;
        case 'orange':
            badge.classList.add('bg-accent-100', 'text-accent-600');
            break;
        case 'green':
            badge.classList.add('bg-green-100', 'text-green-600');
            break;
        case 'purple':
            badge.classList.add('bg-purple-100', 'text-purple-600');
            break;
        case 'pink':
            badge.classList.add('bg-pink-100', 'text-pink-600');
            break;
        case 'red':
            badge.classList.add('bg-red-100', 'text-red-600');
            break;
        default:
            badge.classList.add('bg-slate-100', 'text-slate-600');
    }
    
    // Show modal
    newsModal.classList.remove('hidden');
    setTimeout(() => {
        newsModal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // スクロール位置を常にトップにリセット
        const modalScrollContainer = newsModal.querySelector('.overflow-y-auto');
        if (modalScrollContainer) {
            modalScrollContainer.scrollTop = 0;
        }
    }, 10);
    
    // Update URL using hash
    if (updateUrl) {
        window.location.hash = `news/${news.id}`;
    }
    
    // Re-initialize Lucide icons
    lucide.createIcons();
}

// 9. Handle URL-based navigation (Hash-based)
function handleHashNavigation() {
    const hash = window.location.hash.slice(1); // Remove # symbol
    
    if (!hash) {
        // No hash, close all modals
        closeAllModals();
        return;
    }
    
    // Check for works/:id pattern
    const workMatch = hash.match(/^works\/(.+)$/);
    if (workMatch) {
        const workId = workMatch[1];
        // Wait for data to load if not ready yet
        if (worksData.length > 0) {
            openWorkModalById(workId, false);
        } else {
            // Retry after data loads
            setTimeout(() => handleHashNavigation(), 100);
        }
        return;
    }
    
    // Check for news/:id pattern
    const newsMatch = hash.match(/^news\/(.+)$/);
    if (newsMatch) {
        const newsId = newsMatch[1];
        // Wait for data to load if not ready yet
        if (newsData.length > 0) {
            openNewsModalById(newsId, false);
        } else {
            // Retry after data loads
            setTimeout(() => handleHashNavigation(), 100);
        }
        return;
    }
}

// Helper function to close all modals
function closeAllModals() {
    const workModal = document.getElementById('workModal');
    const newsModal = document.getElementById('newsModal');
    
    if (workModal && workModal.classList.contains('show')) {
        workModal.classList.remove('show');
        setTimeout(() => {
            workModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }
    
    if (newsModal && newsModal.classList.contains('show')) {
        newsModal.classList.remove('show');
        setTimeout(() => {
            newsModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 300);
    }
}

// Handle browser back/forward buttons and hash changes
window.addEventListener('hashchange', handleHashNavigation);

// Initialize hash navigation on page load
window.addEventListener('DOMContentLoaded', () => {
    handleHashNavigation();
});
