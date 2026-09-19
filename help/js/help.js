/**
 * Promptixa Help Center JavaScript Engine
 * Handles search, filtering, accordions, hash navigation, and interactive variable demo.
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
  const accordions = document.querySelectorAll('.article-accordion');
  const categoryBlocks = document.querySelectorAll('.article-category-block');
  const quickTagBtns = document.querySelectorAll('.quick-tag-btn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  let activeCategory = 'all';
  let currentSearchQuery = '';

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

  // 2. Filter & Search Logic
  function applyFilters() {
    const query = currentSearchQuery.trim().toLowerCase();
    let visibleCount = 0;

    // Show/hide clear button
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query.length > 0 ? 'flex' : 'none';
    }

    categoryBlocks.forEach((block) => {
      const blockCategory = block.dataset.category;
      const blockArticles = block.querySelectorAll('.article-accordion');
      let blockVisibleCount = 0;

      blockArticles.forEach((article) => {
        const articleCategory = article.dataset.category;
        const articleText = (
          article.querySelector('.article-header h3')?.innerText || ''
        ) + ' ' + (
          article.querySelector('.article-body')?.innerText || ''
        ) + ' ' + (
          article.dataset.keywords || ''
        );

        const matchesCategory = (activeCategory === 'all' || activeCategory === articleCategory || activeCategory === blockCategory);
        const matchesQuery = query === '' || articleText.toLowerCase().includes(query);

        if (matchesCategory && matchesQuery) {
          article.style.display = '';
          blockVisibleCount++;
          visibleCount++;

          // Auto-open accordion if there is an active search query
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

    // Update Search Results Indicator
    if (searchResultsBar) {
      if (query.length > 0 || activeCategory !== 'all') {
        searchResultsBar.style.display = 'flex';
        searchCountSpan.textContent = visibleCount;
        searchQuerySpan.textContent = query.length > 0 
          ? `"${currentSearchQuery}"` 
          : (activeCategory !== 'all' ? `Category: ${activeCategory}` : '');
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

  if (resetFilterLink) {
    resetFilterLink.addEventListener('click', () => {
      activeCategory = 'all';
      currentSearchQuery = '';
      if (searchInput) searchInput.value = '';
      categoryTabs.forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.category === 'all');
      });
      applyFilters();
    });
  }

  // 4. Category Tabs
  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category || 'all';
      applyFilters();
    });
  });

  // 5. Quick Tag Buttons
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

  // 6. Deep Linking via URL Hash
  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash) {
      const targetElement = document.querySelector(hash);
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

  // 7. Interactive Variable Simulator Demo
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

  // 8. Back to Top Button
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
