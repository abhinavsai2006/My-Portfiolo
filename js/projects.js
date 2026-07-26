/* ==========================================================================
   PROJECTS.JS — Automatic GitHub Repository Sync Engine
   Fetches public repos from GitHub REST API, filters out forks,
   provides search/filtering/sorting, and renders responsive cards.
   ========================================================================== */

(function () {
  'use strict';

  const GITHUB_USERNAME = 'abhinavsai2006';
  const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;

  // Language color map matching GitHub's official colors
  const LANG_COLORS = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#563d7c',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Shell: '#89e051',
    Jupyter: '#DA5B0B',
    Default: '#C8A97E',
  };

  let allRepos = [];
  let filteredRepos = [];
  let currentLanguageFilter = 'all';
  let currentSort = 'updated';
  let searchQuery = '';

  // DOM Elements
  const gridEl = document.getElementById('projects-grid');
  const searchInput = document.getElementById('projects-search-input');
  const sortSelect = document.getElementById('projects-sort-select');
  const filtersContainer = document.getElementById('projects-filters');
  const totalReposNum = document.getElementById('stat-repos-num');
  const totalStarsNum = document.getElementById('stat-stars-num');
  const totalLangsNum = document.getElementById('stat-langs-num');

  // Format date nicely (e.g., "Jul 2026" or "2 days ago")
  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 30) return `Updated ${diffDays} days ago`;

    return 'Updated ' + date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Show Skeleton Loading State
  function renderSkeletons() {
    if (!gridEl) return;
    gridEl.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
        <div class="skeleton-card">
          <div>
            <div class="skeleton-box skeleton-title"></div>
            <div class="skeleton-box skeleton-text-1"></div>
            <div class="skeleton-box skeleton-text-2"></div>
          </div>
          <div class="skeleton-box skeleton-meta"></div>
        </div>
      `
      )
      .join('');
  }

  // Fetch Repositories from GitHub API
  async function fetchRepositories() {
    renderSkeletons();

    try {
      const response = await fetch(API_URL, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const data = await response.json();

      // Filter out forks & draft repositories
      allRepos = data.filter((repo) => !repo.fork && !repo.archived);

      // Populate Language Filters
      buildLanguageFilters(allRepos);

      // Calculate & Render Stats
      updateStats(allRepos);

      // Filter & Render Cards
      applyFiltersAndSort();
    } catch (err) {
      console.error('Failed to fetch GitHub projects:', err);
      renderError(err.message);
    }
  }

  // Calculate & Display Stats
  function updateStats(repos) {
    if (totalReposNum) totalReposNum.textContent = repos.length;

    const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    if (totalStarsNum) totalStarsNum.textContent = totalStars;

    const languages = new Set(repos.map((r) => r.language).filter(Boolean));
    if (totalLangsNum) totalLangsNum.textContent = languages.size;
  }

  // Build Language Filter Buttons
  function buildLanguageFilters(repos) {
    if (!filtersContainer) return;

    const langCounts = {};
    repos.forEach((repo) => {
      if (repo.language) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      }
    });

    // Sort languages by count descending
    const sortedLangs = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);

    let html = `<button class="filter-pill is-active" data-lang="all">All (${repos.length})</button>`;
    sortedLangs.forEach((lang) => {
      html += `<button class="filter-pill" data-lang="${lang.toLowerCase()}">${lang} (${langCounts[lang]})</button>`;
    });

    filtersContainer.innerHTML = html;

    // Filter pill click listeners
    filtersContainer.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', function () {
        filtersContainer.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('is-active'));
        this.classList.add('is-active');
        currentLanguageFilter = this.getAttribute('data-lang');
        applyFiltersAndSort();
      });
    });
  }

  // Apply Search, Filter, and Sort
  function applyFiltersAndSort() {
    let result = [...allRepos];

    // 1. Language Filter
    if (currentLanguageFilter !== 'all') {
      result = result.filter(
        (repo) => repo.language && repo.language.toLowerCase() === currentLanguageFilter
      );
    }

    // 2. Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((repo) => {
        const nameMatch = repo.name.toLowerCase().includes(q);
        const descMatch = repo.description && repo.description.toLowerCase().includes(q);
        const langMatch = repo.language && repo.language.toLowerCase().includes(q);
        const topicMatch = repo.topics && repo.topics.some((t) => t.toLowerCase().includes(q));
        return nameMatch || descMatch || langMatch || topicMatch;
      });
    }

    // 3. Sorting
    if (currentSort === 'updated') {
      result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    } else if (currentSort === 'stars') {
      result.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    } else if (currentSort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    filteredRepos = result;
    renderProjects(filteredRepos);
  }

  // Render Project Cards to HTML
  function renderProjects(repos) {
    if (!gridEl) return;

    if (repos.length === 0) {
      gridEl.innerHTML = `
        <div class="projects-empty">
          <div class="projects-empty__icon">🔍</div>
          <h3 class="projects-empty__title">No Projects Found</h3>
          <p class="projects-empty__text">No repositories match your current search or filter criteria.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = repos.map((repo) => createRepoCardHTML(repo)).join('');

    // Attach Mousemove Spotlight & Hover listeners
    gridEl.querySelectorAll('.repo-card').forEach((card) => {
      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
        const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });

    if (window.attachCursorHovers) {
      window.attachCursorHovers();
    }
  }

  // Generate HTML for a Single Repo Card
  function createRepoCardHTML(repo) {
    const lang = repo.language || 'Code';
    const langColor = LANG_COLORS[lang] || LANG_COLORS.Default;
    const updatedFormatted = formatDate(repo.updated_at);
    const desc = repo.description || 'No description provided for this repository.';
    const topics = repo.topics || [];

    const topicsHTML = topics.length > 0
      ? `<div class="repo-card__topics">
          ${topics.slice(0, 4).map((t) => `<span class="repo-topic">${t}</span>`).join('')}
         </div>`
      : '';

    return `
      <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-card" data-cursor-label="View">
        <div>
          <div class="repo-card__header">
            <h3 class="repo-card__name">${escapeHTML(repo.name)}</h3>
            <svg class="repo-card__gh-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
            </svg>
          </div>
          <p class="repo-card__desc">${escapeHTML(desc)}</p>
          ${topicsHTML}
        </div>

        <div>
          <div class="repo-card__footer">
            <div class="repo-card__meta-left">
              <span class="repo-card__lang">
                <span class="repo-card__lang-dot" style="background-color: ${langColor};"></span>
                ${lang}
              </span>
              ${
                repo.stargazers_count > 0
                  ? `<span class="repo-card__stars">★ ${repo.stargazers_count}</span>`
                  : ''
              }
              ${
                repo.forks_count > 0
                  ? `<span class="repo-card__forks">🍴 ${repo.forks_count}</span>`
                  : ''
              }
            </div>
            <span class="repo-card__updated">${updatedFormatted}</span>
          </div>
          <span class="repo-card__btn">
            View on GitHub
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </span>
        </div>
      </a>
    `;
  }

  // Render Error Message
  function renderError(message) {
    if (!gridEl) return;
    gridEl.innerHTML = `
      <div class="projects-error">
        <div class="projects-error__icon">⚠️</div>
        <h3 class="projects-error__title">Unable to Load Repositories</h3>
        <p class="projects-error__text">${escapeHTML(message)}</p>
        <button id="retry-btn" class="btn btn--outline">Retry Fetching</button>
      </div>
    `;

    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', fetchRepositories);
    }
  }

  // Utility to escape HTML and prevent XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize Search & Sort Listeners
  function initControls() {
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value;
        applyFiltersAndSort();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        currentSort = e.target.value;
        applyFiltersAndSort();
      });
    }
  }

  // Initialize Mobile Navigation Toggle
  function initMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('menu-overlay');
    if (!hamburger || !overlay) return;

    hamburger.addEventListener('click', function () {
      const isOpen = overlay.classList.contains('is-open');
      overlay.classList.toggle('is-open', !isOpen);
      hamburger.classList.toggle('is-active', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });

    overlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', function () {
        overlay.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        document.body.classList.remove('menu-open');
      });
    });
  // Initialize Custom Smooth Cursor
  function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;

    const cursorEl = document.getElementById('cursor');
    const dotEl = document.getElementById('cursor-dot');
    if (!cursorEl || !dotEl) return;

    const labelEl = cursorEl.querySelector('.cursor__label');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotEl.style.transform = 'translate(' + mouseX + 'px, ' + mouseY + 'px) translate(-50%, -50%)';
    });

    function renderCursor() {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursorEl.style.transform = 'translate(' + cursorX + 'px, ' + cursorY + 'px)';
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    window.attachCursorHovers = function () {
      const interactiveEls = document.querySelectorAll(
        'a, button, [data-magnetic], .repo-card, .article-card, input, select'
      );

      interactiveEls.forEach(function (el) {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = 'true';

        el.addEventListener('mouseenter', function () {
          const label = el.getAttribute('data-cursor-label');
          if (label) {
            cursorEl.classList.add('has-label');
            cursorEl.classList.remove('is-hovering');
            if (labelEl) labelEl.textContent = label;
          } else {
            cursorEl.classList.add('is-hovering');
            cursorEl.classList.remove('has-label');
          }
        });

        el.addEventListener('mouseleave', function () {
          cursorEl.classList.remove('is-hovering', 'has-label');
          if (labelEl) labelEl.textContent = '';
        });
      });
    };

    window.attachCursorHovers();
  }

  // Initialize Everything on DOM Content Loaded
  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initControls();
    initCustomCursor();
    fetchRepositories();
  });
})();
