/**
 * Promptixa Help Center JavaScript Engine
 * Handles search, dual category/topic filtering, dynamic topic card updates,
 * accordions, hash navigation, and interactive variable demo.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('helpSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResultsBar = document.getElementById('searchResultsBar');
  const searchCountSpan = document.getElementById('searchCount');
  const searchQuerySpan = document.getElementById('searchQueryDisplay');
  const resetFilterLink = document.getElementById('resetFilterLink');
  const categoryTabs = document.querySelectorAll('.cat-tab-btn');
  const topicCards = document.querySelectorAll('.topic-card');
  const accordions = document.querySelectorAll('.article-accordion');
  const categoryBlocks = document.querySelectorAll('.article-category-block');
  const quickTagBtns = document.querySelectorAll('.quick-tag-btn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // Filter State
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

  // 1. Accordion Toggle
  accordions.forEach((accordion) => {
    const header = accordion.querySelector('.article-header');
    if (header) {
      header.addEventListener('click', () => {
        const isOpen = accordion.classList.contains('open');
        accordion.classList.toggle('open');
        header.setAttribute('aria-expanded', !isOpen);
      });

      // Keyboard support
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    }
  });

  // 2. Unified Filter & Search Engine
  function applyFilters() {
    const query = currentSearchQuery.trim().toLowerCase();
    let totalVisibleCount = 0;

    // Show/hide clear button
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
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

          // Auto-open accordion if user entered a specific search query
          if (query.length > 2) {
            article.classList.add('open');
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

      // Count matching articles for this topic that satisfy the activeCategory (and query)
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
          // Hide card if it has zero matching guides for the active category/query
          card.style.display = 'none';
          card.classList.remove('active');
        }
      }
    });

    // Step C: Update Search Results Indicator
    if (searchResultsBar) {
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

  // 3. Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value;
      applyFilters();
    });

    // Keyboard shortcut '/' to focus search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        currentSearchQuery = '';
        applyFilters();
        searchInput.focus();
      }
    });
  }

  // 4. Reset All Filters Link
  if (resetFilterLink) {
    resetFilterLink.addEventListener('click', () => {
      activeCategory = 'all';
      activeTopic = null;
      currentSearchQuery = '';
      if (searchInput) searchInput.value = '';
      categoryTabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.category === 'all');
      });
      applyFilters();
    });
  }

  // 5. Category Tabs Listener
  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category || 'all';
      activeTopic = null; // Reset topic when switching categories so all matching topics are available
      applyFilters();
    });
  });

  // 6. Topic Cards Navigation Listener
  topicCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      const cardTopic = card.dataset.topic || (card.getAttribute('href') || '').replace('#', '');

      if (activeCategory === 'all') {
        // Normal behavior when no category filter is active
        activeTopic = null;
        applyFilters();
        const targetElement = document.getElementById(cardTopic);
        if (targetElement) {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      } else {
        // Category filter is active: keep category filter and apply topic filter
        e.preventDefault();

        // Toggle active topic
        if (activeTopic === cardTopic) {
          activeTopic = null; // Unselect topic filter while keeping category filter active
        } else {
          activeTopic = cardTopic;
        }

        applyFilters();

        const targetElement = document.getElementById(cardTopic);
        if (targetElement && targetElement.style.display !== 'none') {
          setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
      }
    });
  });

  // 7. Quick Tag Buttons
  quickTagBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tagText = btn.dataset.query || btn.innerText.trim();
      if (searchInput) {
        searchInput.value = tagText;
        currentSearchQuery = tagText;
        applyFilters();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // 8. Deep Linking via URL Hash
  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace('#', '');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        if (targetElement.classList.contains('article-accordion')) {
          targetElement.classList.add('open');
        } else {
          const nestedAccordion = targetElement.querySelector('.article-accordion');
          if (nestedAccordion) nestedAccordion.classList.add('open');
        }
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }

  window.addEventListener('hashchange', handleUrlHash);
  handleUrlHash();

  // 9. Interactive Variable Simulator Demo
  const topicInput = document.getElementById('simTopic');
  const toneInput = document.getElementById('simTone');
  const styleInput = document.getElementById('simStyle');
  const previewOutput = document.getElementById('simPreviewOutput');
  const simCopyBtn = document.getElementById('simCopyBtn');
  const simResetBtn = document.getElementById('simResetBtn');

  function updateSimulator() {
    if (!previewOutput) return;

    const topic = topicInput?.value.trim() || '<topic>';
    const tone = toneInput?.value.trim() || '<tone>';
    const style = styleInput?.value.trim() || '<style>';

    const topicFormatted = topicInput?.value.trim() ? `<mark>${escapeHtml(topic)}</mark>` : `<mark style="opacity:0.6">&lt;topic&gt;</mark>`;
    const toneFormatted = toneInput?.value.trim() ? `<mark>${escapeHtml(tone)}</mark>` : `<mark style="opacity:0.6">&lt;tone&gt;</mark>`;
    const styleFormatted = styleInput?.value.trim() ? `<mark>${escapeHtml(style)}</mark>` : `<mark style="opacity:0.6">&lt;style&gt;</mark>`;

    previewOutput.innerHTML = `Write a ${toneFormatted} article about ${topicFormatted} in a ${styleFormatted} format. Include 3 actionable tips and a clear summary.`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  if (topicInput && toneInput && styleInput) {
    [topicInput, toneInput, styleInput].forEach((input) => {
      input.addEventListener('input', updateSimulator);
    });

    if (simResetBtn) {
      simResetBtn.addEventListener('click', () => {
        topicInput.value = 'Quantum Computing';
        toneInput.value = 'engaging & beginner-friendly';
        styleInput.value = 'step-by-step guide';
        updateSimulator();
      });
    }

    if (simCopyBtn) {
      simCopyBtn.addEventListener('click', () => {
        const plainText = previewOutput ? previewOutput.innerText : '';
        navigator.clipboard.writeText(plainText).then(() => {
          const originalHTML = simCopyBtn.innerHTML;
          simCopyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Copied!
          `;
          simCopyBtn.style.backgroundColor = '#10b981';
          setTimeout(() => {
            simCopyBtn.innerHTML = originalHTML;
            simCopyBtn.style.backgroundColor = '';
          }, 2000);
        }).catch(() => {
          alert('Customized prompt copied to clipboard!');
        });
      });
    }

    // Initialize with default values
    updateSimulator();
  }

  // 10. Back to Top Button
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
