/**
 * Promptixa Help Center JavaScript Engine
 * WebView-safe architecture: Event delegation, HTML5 <details>/<summary> integration,
 * dual category/topic filtering, dynamic topic card updates, search, and robust clipboard fallback.
 */

(function () {
  'use strict';

  // State Management
  let activeCategory = 'all'; // 'all' or category key, e.g. 'discovering-prompts'
  let activeTopic = null;      // null or topic key, e.g. 'getting-started'
  let currentSearchQuery = '';

  // Human-readable labels map
  const categoryLabels = {
    'all': 'All Topics',
    'getting-started': 'Getting Started',
    'discovering-prompts': 'Finding Prompts',
    'unlocking-copying': 'Unlocking & Copying',
    'variables': 'Prompt Variables',
    'external-ai': 'ChatGPT & Gemini',
    'submissions': 'Create & Submissions',
    'account': 'Account & Profile',
    'troubleshooting': 'Troubleshooting'
  };

  const topicLabels = {
    'getting-started': 'Getting Started',
    'discovering-prompts': 'Finding Prompts',
    'unlocking-copying': 'Unlocking & Copying',
    'variables': 'Prompt Variables',
    'external-ai': 'ChatGPT & Gemini',
    'submissions': 'Creating Prompts',
    'account': 'Account & Profile',
    'troubleshooting': 'Troubleshooting'
  };

  // Safe Cross-Platform Scrolling Helper (Android WebView & Desktop compatible)
  function safeScrollTo(target, offset = 90) {
    if (!target) return;
    let targetY = 0;
    if (typeof target === 'number') {
      targetY = target;
    } else if (target instanceof HTMLElement) {
      const rect = target.getBoundingClientRect();
      targetY = rect.top + window.pageYOffset - offset;
    }

    try {
      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    } catch (e) {
      // Fallback for WebViews with restricted smooth scroll API
      window.scrollTo(0, Math.max(0, targetY));
    }
  }

  // Cross-Platform Clipboard Copy Helper with document.execCommand fallback
  function copyTextToClipboard(text) {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(resolve)
          .catch(() => fallbackCopyText(text, resolve, reject));
      } else {
        fallbackCopyText(text, resolve, reject);
      }
    });
  }

  function fallbackCopyText(text, resolve, reject) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.setAttribute('readonly', '');
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        resolve();
      } else {
        reject(new Error('execCommand copy failed'));
      }
    } catch (err) {
      reject(err);
    }
  }

  // HTML Escape Helper
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  // Unified Filter & Search Engine
  function applyFilters() {
    const query = currentSearchQuery.trim().toLowerCase();
    const searchInput = document.getElementById('helpSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const searchResultsBar = document.getElementById('searchResultsBar');
    const searchCountSpan = document.getElementById('searchCount');
    const searchQuerySpan = document.getElementById('searchQueryDisplay');
    const categoryBlocks = document.querySelectorAll('.article-category-block');
    const topicCards = document.querySelectorAll('.topic-card');
    const accordions = document.querySelectorAll('.article-accordion');
    const categoryTabs = document.querySelectorAll('.cat-tab-btn');

    let totalVisibleCount = 0;

    // Show/hide clear search button
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
    }

    // Step A: Evaluate all articles against Active Category, Active Topic, and Search Query
    categoryBlocks.forEach((block) => {
      const blockTopic = block.dataset.topic || block.id;
      const blockArticles = block.querySelectorAll('.article-accordion');
      let blockVisibleCount = 0;

      blockArticles.forEach((article) => {
        const articleCategories = (article.dataset.category || '').split(/\s+/);
        const articleTopic = article.dataset.topic || blockTopic;
        const articleText = (
          article.querySelector('.article-header h3')?.innerText || ''
        ) + ' ' + (
          article.querySelector('.article-body')?.innerText || ''
        ) + ' ' + (
          article.dataset.keywords || ''
        );

        // 1. Check Category Match
        const matchesCategory = (activeCategory === 'all' || articleCategories.includes(activeCategory));

        // 2. Check Topic Match
        const matchesTopic = (!activeTopic || articleTopic === activeTopic);

        // 3. Check Query Match
        const matchesQuery = (query === '' || articleText.toLowerCase().includes(query));

        // Combined Filter Condition
        const isVisible = matchesCategory && matchesTopic && matchesQuery;

        if (isVisible) {
          article.style.display = '';
          blockVisibleCount++;
          totalVisibleCount++;

          // Auto-open details when user enters a specific search query
          if (query.length > 2) {
            if (article.tagName.toLowerCase() === 'details') {
              article.open = true;
            } else {
              article.classList.add('open');
            }
          }
        } else {
          article.style.display = 'none';
        }
      });

      // Show/hide category block header if no articles match
      block.style.display = blockVisibleCount > 0 ? '' : 'none';
    });

    // Step B: Dynamically update "Explore by Topic" cards based on Active Category & Query
    topicCards.forEach((card) => {
      const cardTopic = card.dataset.topic || (card.getAttribute('href') || '').replace('#', '');
      const countBadge = card.querySelector('.topic-guide-count');

      // Count matching articles for this topic that satisfy activeCategory (and query)
      let topicMatchesCount = 0;
      accordions.forEach((article) => {
        const articleCategories = (article.dataset.category || '').split(/\s+/);
        const articleTopic = article.dataset.topic || article.closest('.article-category-block')?.dataset.topic;
        const articleText = (
          article.querySelector('.article-header h3')?.innerText || ''
        ) + ' ' + (
          article.querySelector('.article-body')?.innerText || ''
        ) + ' ' + (
          article.dataset.keywords || ''
        );

        if (articleTopic === cardTopic) {
          const matchCat = (activeCategory === 'all' || articleCategories.includes(activeCategory));
          const matchQ = (query === '' || articleText.toLowerCase().includes(query));
          if (matchCat && matchQ) {
            topicMatchesCount++;
          }
        }
      });

      if (activeCategory === 'all' && query === '') {
        // No filter active: show all topic cards with default counts
        card.style.display = '';
        card.classList.remove('active');
        if (countBadge) {
          countBadge.textContent = `View ${topicMatchesCount} guide${topicMatchesCount === 1 ? '' : 's'}`;
        }
      } else {
        // Filter is active: show only cards that have at least 1 matching guide
        if (topicMatchesCount > 0) {
          card.style.display = '';
          card.classList.toggle('active', cardTopic === activeTopic);
          if (countBadge) {
            countBadge.textContent = `View ${topicMatchesCount} guide${topicMatchesCount === 1 ? '' : 's'}`;
          }
        } else {
          card.style.display = 'none';
          card.classList.remove('active');
        }
      }
    });

    // Step C: Update Category Tabs Active State
    categoryTabs.forEach((tab) => {
      tab.classList.toggle('active', (tab.dataset.category || 'all') === activeCategory);
    });

    // Step D: Update Search Results Indicator
    if (searchResultsBar && searchCountSpan && searchQuerySpan) {
      const isFiltered = (query.length > 0 || activeCategory !== 'all' || activeTopic !== null);

      if (isFiltered) {
        searchResultsBar.style.display = 'flex';
        searchCountSpan.textContent = totalVisibleCount;

        const labelParts = [];
        if (query.length > 0) {
          labelParts.push(`"${currentSearchQuery}"`);
        }
        if (activeCategory !== 'all') {
          labelParts.push(`Category: ${categoryLabels[activeCategory] || activeCategory}`);
        }
        if (activeTopic) {
          labelParts.push(`Topic: ${topicLabels[activeTopic] || activeTopic}`);
        }

        searchQuerySpan.textContent = labelParts.join(' • ');
      } else {
        searchResultsBar.style.display = 'none';
      }
    }
  }

  // Interactive Variable Simulator Demo
  function updateSimulator() {
    const topicInput = document.getElementById('simTopic');
    const toneInput = document.getElementById('simTone');
    const styleInput = document.getElementById('simStyle');
    const previewOutput = document.getElementById('simPreviewOutput');

    if (!previewOutput) return;

    const topic = topicInput?.value.trim() || '<topic>';
    const tone = toneInput?.value.trim() || '<tone>';
    const style = styleInput?.value.trim() || '<style>';

    const topicFormatted = topicInput?.value.trim() ? `<mark>${escapeHtml(topic)}</mark>` : `<mark style="opacity:0.6">&lt;topic&gt;</mark>`;
    const toneFormatted = toneInput?.value.trim() ? `<mark>${escapeHtml(tone)}</mark>` : `<mark style="opacity:0.6">&lt;tone&gt;</mark>`;
    const styleFormatted = styleInput?.value.trim() ? `<mark>${escapeHtml(style)}</mark>` : `<mark style="opacity:0.6">&lt;style&gt;</mark>`;

    previewOutput.innerHTML = `Write a ${toneFormatted} article about ${topicFormatted} in a ${styleFormatted} format. Include 3 actionable tips and a clear summary.`;
  }

  // Deep Linking via URL Hash
  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const targetId = hash.replace('#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        // If target is an accordion or contains one, ensure it is open
        if (targetElement.tagName.toLowerCase() === 'details') {
          targetElement.open = true;
        } else if (targetElement.classList.contains('article-accordion')) {
          targetElement.classList.add('open');
        } else {
          const nestedDetails = targetElement.querySelector('details.article-accordion');
          if (nestedDetails) nestedDetails.open = true;
        }

        // Ensure parent block is visible
        const parentBlock = targetElement.closest('.article-category-block');
        if (parentBlock) parentBlock.style.display = '';

        safeScrollTo(targetElement, 110);
      }
    }
  }

  // Initialize Event Listeners via Event Delegation on Document
  function initApp() {
    const searchInput = document.getElementById('helpSearchInput');
    const backToTopBtn = document.getElementById('backToTopBtn');

    // Search Input Listener
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        applyFilters();
      });

      // Shortcut '/' key
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      });
    }

    // Input listeners for Simulator fields
    const simFields = ['simTopic', 'simTone', 'simStyle'];
    simFields.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', updateSimulator);
      }
    });

    // Global Click Delegation (Handles all taps / clicks seamlessly in Android WebView & Browsers)
    document.addEventListener('click', (e) => {
      // 1. Category Tab Click
      const catTab = e.target.closest('.cat-tab-btn');
      if (catTab) {
        e.preventDefault();
        activeCategory = catTab.dataset.category || 'all';
        activeTopic = null; // Reset topic filter when switching categories
        applyFilters();
        return;
      }

      // 2. Topic Card Click
      const topicCard = e.target.closest('.topic-card');
      if (topicCard) {
        e.preventDefault();
        const cardTopic = topicCard.dataset.topic || (topicCard.getAttribute('href') || '').replace('#', '');

        if (activeCategory === 'all') {
          // Normal behavior: reset activeTopic, apply filters, scroll to target section
          activeTopic = null;
          applyFilters();
          const targetSection = document.getElementById(cardTopic);
          if (targetSection) {
            safeScrollTo(targetSection, 110);
          }
        } else {
          // Category filter is active: toggle activeTopic under current category
          if (activeTopic === cardTopic) {
            activeTopic = null; // Unselect topic filter while keeping category filter active
          } else {
            activeTopic = cardTopic;
          }
          applyFilters();

          const targetSection = document.getElementById(cardTopic);
          if (targetSection && targetSection.style.display !== 'none') {
            safeScrollTo(targetSection, 110);
          }
        }
        return;
      }

      // 3. Quick Tag Button Click
      const quickTagBtn = e.target.closest('.quick-tag-btn');
      if (quickTagBtn) {
        e.preventDefault();
        const tagText = quickTagBtn.dataset.query || quickTagBtn.innerText.trim();
        if (searchInput) {
          searchInput.value = tagText;
          currentSearchQuery = tagText;
          applyFilters();
          safeScrollTo(searchInput, 100);
        }
        return;
      }

      // 4. Clear Search Button Click
      const clearSearchBtn = e.target.closest('#clearSearchBtn');
      if (clearSearchBtn) {
        e.preventDefault();
        if (searchInput) {
          searchInput.value = '';
          currentSearchQuery = '';
          applyFilters();
          searchInput.focus();
        }
        return;
      }

      // 5. Reset All Filters Button Click
      const resetFilter = e.target.closest('#resetFilterLink');
      if (resetFilter) {
        e.preventDefault();
        activeCategory = 'all';
        activeTopic = null;
        currentSearchQuery = '';
        if (searchInput) searchInput.value = '';
        applyFilters();
        return;
      }

      // 6. Simulator Reset Button Click
      const simReset = e.target.closest('#simResetBtn');
      if (simReset) {
        e.preventDefault();
        const topicInput = document.getElementById('simTopic');
        const toneInput = document.getElementById('simTone');
        const styleInput = document.getElementById('simStyle');
        if (topicInput) topicInput.value = 'Quantum Computing';
        if (toneInput) toneInput.value = 'engaging & beginner-friendly';
        if (styleInput) styleInput.value = 'step-by-step guide';
        updateSimulator();
        return;
      }

      // 7. Simulator Copy Button Click
      const simCopy = e.target.closest('#simCopyBtn');
      if (simCopy) {
        e.preventDefault();
        const previewOutput = document.getElementById('simPreviewOutput');
        const plainText = previewOutput ? previewOutput.innerText : '';
        const originalHTML = simCopy.innerHTML;

        copyTextToClipboard(plainText)
          .then(() => {
            simCopy.innerHTML = `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Copied!
            `;
            simCopy.style.backgroundColor = '#10b981';
            setTimeout(() => {
              simCopy.innerHTML = originalHTML;
              simCopy.style.backgroundColor = '';
            }, 2000);
          })
          .catch(() => {
            alert('Prompt customized: ' + plainText);
          });
        return;
      }

      // 8. Back to Top Button Click
      const backTop = e.target.closest('#backToTopBtn');
      if (backTop) {
        e.preventDefault();
        safeScrollTo(0);
        return;
      }

      // 9. Internal Hash Anchor Links (e.g. #faq, #troubleshooting, #contact, #simulator)
      const anchorLink = e.target.closest('a[href^="#"]');
      if (anchorLink && !anchorLink.classList.contains('topic-card')) {
        const hash = anchorLink.getAttribute('href');
        if (hash && hash.length > 1) {
          const targetId = hash.replace('#', '');
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            e.preventDefault();
            if (targetElement.tagName.toLowerCase() === 'details') {
              targetElement.open = true;
            }
            safeScrollTo(targetElement, 110);
            try {
              history.pushState(null, null, hash);
            } catch (err) {
              // Ignore pushState errors in restricted WebView contexts
            }
          }
        }
      }
    });

    // Scroll listener for Back to Top visibility
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }, { passive: true });
    }

    // Hashchange listener for URL deep-linking
    window.addEventListener('hashchange', handleUrlHash);

    // Initial setups
    updateSimulator();
    applyFilters();
    handleUrlHash();
  }

  // Boot on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
