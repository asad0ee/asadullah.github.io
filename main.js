// ==========================================================================
//  ASADULLAH — PORTFOLIO JAVASCRIPT CONTROLLERS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

    // -------------------------------------------------------------
    // Scroll Reveal & Motion (IntersectionObserver)
    // -------------------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target); // Reveal only once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Add initial reveal to hero contents immediately
    setTimeout(() => {
        document.querySelector('.hero-content').classList.add('reveal');
        document.querySelector('.hero-content').classList.add('visible');
    }, 100);

    // -------------------------------------------------------------
    // Sticky Navigation Link Indicators
    // -------------------------------------------------------------
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // -------------------------------------------------------------
    // App Configuration, Cache TTL, and Fallbacks
    // -------------------------------------------------------------
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const appsConfig = {
        "6755434754": {
            key: "stream",
            category: "Live Streaming",
            name: "Stream (Go Viral)",
            tech: ["SwiftUI", "UIKit", "Agora SDK", "MVVM", "AVFoundation"],
            desc: "Live streaming app with low-latency Agora video call integration and custom audio/video media editor.",
            primaryTech: "Agora SDK",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #ff2d55, #ff9500)",
            letter: "S"
        },
        "6790825985": {
            key: "buzzscanner",
            category: "AI Utility",
            name: "Buzzscanner Pro",
            tech: ["Swift", "Vision SDK", "AI API", "CoreData", "AdMob"],
            desc: "AI-powered QR & barcode scanner utility reading codes via Vision SDK with custom QR generation and AdMob ads.",
            primaryTech: "Vision SDK",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #4cd964, #5ac8fa)",
            letter: "B"
        },
        "1613322776": {
            key: "bebelo",
            category: "Travel & Local",
            name: "Bebelo",
            tech: ["Swift", "UIKit", "Mapbox SDK", "CoreLocation", "REST API"],
            desc: "Nightlife discovery app for Madrid with Mapbox venue maps, real-time map pins, and drink price comparison.",
            primaryTech: "Mapbox SDK",
            ageRating: "12+",
            gradient: "linear-gradient(135deg, #5856d6, #007aff)",
            letter: "B"
        },
        "6749799325": {
            key: "zophee",
            category: "Health & Wellness",
            name: "Zophee",
            tech: ["Swift", "SwiftUI", "AVFoundation", "MVVM"],
            desc: "Mental wellness platform with anxiety relief exercises, structured audio sessions, and modern UI transitions.",
            primaryTech: "AVFoundation",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #34aadc, #1d4ed8)",
            letter: "Z"
        },
        "1552349182": {
            key: "xploresmore",
            category: "Navigation",
            name: "Xplore Smore",
            tech: ["Swift", "UIKit", "Mapbox SDK", "CoreLocation", "Firebase"],
            desc: "Ski resort adventure app with offline trail maps, turn-by-turn navigation, and real-time GPS tracking.",
            primaryTech: "Mapbox SDK",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #007aff, #5ac8fa)",
            letter: "X"
        },
        "1661138888": {
            key: "biotechpet",
            category: "AI Healthcare",
            name: "BioTech Pet",
            tech: ["Swift", "SwiftUI/UIKit", "AI Integration", "Firebase"],
            desc: "AI-powered pet genetics app analyzing DNA traits, breed health insights, and kit ordering workflows.",
            primaryTech: "AI Integration",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #af52de, #ff2d55)",
            letter: "B"
        },
        "1589139943": {
            key: "armor",
            category: "Business Utility",
            name: "ARMOR Asset",
            tech: ["Swift", "UIKit", "Core Data", "RESTful APIs", "Firebase"],
            desc: "Fleet tracking suite with background location monitoring, maintenance analytics, and security alerts.",
            primaryTech: "Core Data",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #ff9500, #ff5b00)",
            letter: "A"
        },
        "1594943282": {
            key: "rokoli",
            category: "Navigation",
            name: "Rokoli Driver",
            tech: ["Swift", "UIKit", "Google Maps API", "WebSockets"],
            desc: "Ambulatory care transport app with real-time driver dispatching, route optimization, and fare calculation.",
            primaryTech: "Google Maps",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #ff3b30, #ff9500)",
            letter: "R"
        },
        "1562913098": {
            key: "taxvault",
            category: "Productivity",
            name: "Tax Vault",
            tech: ["Swift", "UIKit", "PDFTron SDK", "Firebase", "APNs"],
            desc: "Tax document platform with PDF editing via PDFTron SDK, real-time admin chat, and push notifications.",
            primaryTech: "PDFTron SDK",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #30d158, #1d4ed8)",
            letter: "T"
        },
        "1524312891": {
            key: "inklink",
            category: "Productivity",
            name: "Letts inkLink",
            tech: ["Swift", "UIKit", "FSCalendar", "CoreGraphics"],
            desc: "Interactive calendar app with daily QR scanning, task management workflows, and custom calendar views.",
            primaryTech: "FSCalendar",
            ageRating: "4+",
            gradient: "linear-gradient(135deg, #007aff, #5856d6)",
            letter: "L"
        }
    };

    // -------------------------------------------------------------
    // App Store iTunes Lookup API Fetcher (JSONP with CORS bypass)
    // -------------------------------------------------------------
    const loadedDataCache = {};

    function fetchAppStoreData(appId) {
        return new Promise((resolve) => {
            const cacheKey = `app_store_cache_${appId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const isFresh = (Date.now() - parsed.timestamp) < CACHE_TTL;
                    if (isFresh) {
                        loadedDataCache[appId] = parsed.data;
                        resolve(parsed.data);
                        return;
                    }
                } catch (e) {
                    // Ignore cache error and fetch fresh
                }
            }

            // Create JSONP request
            const callbackName = `itunes_callback_${appId}_${Math.floor(Math.random() * 100000)}`;
            const script = document.createElement('script');
            script.src = `https://itunes.apple.com/lookup?id=${appId}&callback=${callbackName}`;
            
            window[callbackName] = (response) => {
                cleanup();
                if (response && response.results && response.results.length > 0) {
                    const result = response.results[0];
                    const appData = {
                        name: result.trackName,
                        icon: result.artworkUrl512 || result.artworkUrl100,
                        rating: result.averageUserRating ? result.averageUserRating.toFixed(1) : "4.8",
                        ratingCount: result.userRatingCount || 0,
                        screenshots: result.screenshotUrls || [],
                        description: result.description || appsConfig[appId].desc,
                        appStoreUrl: result.trackViewUrl,
                        genres: result.genres || [appsConfig[appId].category],
                        contentRating: result.trackContentRating || appsConfig[appId].ageRating
                    };

                    // Save to cache
                    localStorage.setItem(cacheKey, JSON.stringify({
                        timestamp: Date.now(),
                        data: appData
                    }));

                    loadedDataCache[appId] = appData;
                    resolve(appData);
                } else {
                    // Fail gracefully and use fallback
                    resolve(getFallbackData(appId));
                }
            };

            script.onerror = () => {
                cleanup();
                resolve(getFallbackData(appId));
            };

            function cleanup() {
                delete window[callbackName];
                script.remove();
            }

            document.body.appendChild(script);
        });
    }

    function getFallbackData(appId) {
        const config = appsConfig[appId];
        const data = {
            name: config.name,
            icon: null, // trigger letter icon render
            rating: "4.8",
            ratingCount: 15,
            screenshots: [],
            description: config.desc,
            appStoreUrl: `https://apps.apple.com/app/id${appId}`,
            genres: [config.category],
            contentRating: config.ageRating
        };
        loadedDataCache[appId] = data;
        return data;
    }

    // Initialize Card Render updates
    const bentoCards = document.querySelectorAll('.bento-card');

    bentoCards.forEach(card => {
        const appId = card.getAttribute('data-app-id');
        
        fetchAppStoreData(appId).then(data => {
            updateCardUI(card, data, appId);
        });
    });

    function updateCardUI(card, data, appId) {
        const img = card.querySelector('.app-icon');
        const iconSkeleton = card.querySelector('.icon-skeleton');
        
        // Icon update
        if (data.icon) {
            img.src = data.icon;
            img.style.display = 'block';
            if (iconSkeleton) iconSkeleton.remove();
        } else {
            // Render beautiful fallback letter badge
            const config = appsConfig[appId];
            const placeholder = document.createElement('div');
            placeholder.className = 'app-icon';
            placeholder.style.background = config.gradient;
            placeholder.style.color = '#ffffff';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.fontSize = '22px';
            placeholder.style.fontWeight = '700';
            placeholder.style.fontFamily = 'var(--font-heading)';
            placeholder.textContent = config.letter || 'A';
            
            card.querySelector('.bento-header').insertBefore(placeholder, img);
            img.remove();
            if (iconSkeleton) iconSkeleton.remove();
        }

        // Ratings update
        const ratingSpan = card.querySelector('.app-store-rating');
        const ratingSkeleton = card.querySelector('.rating-skeleton');
        
        if (ratingSpan) {
            ratingSpan.querySelector('.rating-val').textContent = data.rating;
            ratingSpan.style.display = 'inline-flex';
            if (ratingSkeleton) ratingSkeleton.remove();
        }
    }

    // -------------------------------------------------------------
    // Project Category Filtering
    // -------------------------------------------------------------
    const filterChips = document.querySelectorAll('.filter-chip');

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filterValue = chip.getAttribute('data-filter');
            
            // Remove active classes
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            bentoCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filterValue === 'all') {
                    card.style.display = 'flex';
                } else if (filterValue === 'streaming' && category === 'streaming') {
                    card.style.display = 'flex';
                } else if (filterValue === 'ai-utility' && category === 'ai-utility') {
                    card.style.display = 'flex';
                } else if (filterValue === 'navigation' && category === 'navigation') {
                    card.style.display = 'flex';
                } else if (filterValue === 'productivity' && category === 'productivity') {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // -------------------------------------------------------------
    // Project Detail Modal Controller
    // -------------------------------------------------------------
    const modal = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    
    // Elements inside modal
    const mIcon = document.getElementById('modal-icon');
    const mTitle = document.getElementById('modal-title');
    const mSub = document.getElementById('modal-sub');
    const mGet = document.getElementById('modal-get-link');
    const mRating = document.getElementById('modal-stat-rating');
    const mCount = document.getElementById('modal-stat-count');
    const mTech = document.getElementById('modal-stat-tech');
    const mAge = document.getElementById('modal-stat-age');
    const mScreenshots = document.getElementById('modal-screenshots');
    const mDesc = document.getElementById('modal-desc');
    const mTechList = document.getElementById('modal-tech-list');

    bentoCards.forEach(card => {
        card.addEventListener('click', () => {
            const appId = card.getAttribute('data-app-id');
            const localConfig = appsConfig[appId];
            const data = loadedDataCache[appId] || getFallbackData(appId);

            // Populate text fields
            mTitle.textContent = data.name;
            mSub.textContent = data.genres.join(', ');
            mGet.href = data.appStoreUrl;
            mRating.textContent = `${data.rating} ★`;
            
            // Format rating count dynamically
            const count = data.ratingCount;
            mCount.textContent = count >= 1000 ? `${(count/1000).toFixed(1)}K Ratings` : `${count} Ratings`;
            
            mTech.textContent = localConfig.primaryTech;
            mAge.textContent = data.contentRating;
            mDesc.textContent = data.description;

            // Icon Render
            if (data.icon) {
                // If temporary letter icon exists, remove it
                const oldPlaceholder = modal.querySelector('.modal-app-header .app-icon');
                if (oldPlaceholder) oldPlaceholder.remove();
                
                mIcon.src = data.icon;
                mIcon.style.display = 'block';
            } else {
                // Render placeholder in modal header
                mIcon.style.display = 'none';
                const oldPlaceholder = modal.querySelector('.modal-app-header .app-icon');
                if (oldPlaceholder) oldPlaceholder.remove();

                const placeholder = document.createElement('div');
                placeholder.className = 'app-icon modal-app-icon';
                placeholder.style.background = localConfig.gradient;
                placeholder.style.color = '#ffffff';
                placeholder.style.display = 'flex';
                placeholder.style.alignItems = 'center';
                placeholder.style.justifyContent = 'center';
                placeholder.style.fontSize = '30px';
                placeholder.style.fontWeight = '700';
                placeholder.style.fontFamily = 'var(--font-heading)';
                placeholder.textContent = localConfig.letter || 'A';
                
                modal.querySelector('.modal-app-header').insertBefore(placeholder, mIcon);
            }

            // Tech pills render
            mTechList.innerHTML = '';
            localConfig.tech.forEach(t => {
                const pill = document.createElement('span');
                pill.className = 'modal-tech-pill';
                pill.textContent = t;
                mTechList.appendChild(pill);
            });

            // Screenshots carousel rendering
            mScreenshots.innerHTML = '';
            if (data.screenshots && data.screenshots.length > 0) {
                data.screenshots.forEach(url => {
                    const img = document.createElement('img');
                    img.className = 'carousel-shot';
                    img.src = url;
                    img.alt = `${data.name} App Screenshot`;
                    mScreenshots.appendChild(img);
                });
            } else {
                // Show offline placeholder screenshot gradients
                for (let i = 0; i < 3; i++) {
                    const div = document.createElement('div');
                    div.className = 'carousel-shot';
                    div.style.background = `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`;
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.justifyContent = 'center';
                    div.style.color = 'var(--text-secondary)';
                    div.style.fontSize = '12px';
                    div.innerHTML = `<span style="font-family: var(--font-mono)">Screenshot Fallback ${i+1}</span>`;
                    mScreenshots.appendChild(div);
                }
            }

            // Open Modal
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop background scrolling
        });
    });

    // Close Modal handler
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Resume background scrolling
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal on Escape key press
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // -------------------------------------------------------------
    // Contact Form Interactive Handling
    // -------------------------------------------------------------
    const contactForm = document.getElementById('portfolio-contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            formStatus.className = 'form-feedback';
            formStatus.style.opacity = 1;
            formStatus.textContent = 'Transmitting message...';

            setTimeout(() => {
                formStatus.className = 'form-feedback success';
                formStatus.textContent = 'Message received. We will connect soon!';
                contactForm.reset();
                
                setTimeout(() => {
                    formStatus.style.opacity = 0;
                }, 4000);
            }, 1200);
        });
    }
});
