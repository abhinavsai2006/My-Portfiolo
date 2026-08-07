/* ==========================================================================
   PROJECTS.JS — Automatic GitHub Repository Sync Engine
   Fetches public repos from GitHub REST API, filters out forks,
   provides search/filtering/sorting, and renders responsive cards.
   Includes LocalStorage caching and static fallback data to withstand
   GitHub API 403 Rate Limits and network outages.
   ========================================================================== */

(function () {
  'use strict';

  const GITHUB_USERNAME = 'abhinavsai2006';
  const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`;
  const CACHE_KEY = 'github_repos_cache';

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

  // Static Fallback Repositories for GitHub API Rate Limits (HTTP 403) or offline status
  const FALLBACK_REPOS = [
    {
      name: 'INSURECORE',
      description: 'AI-powered core insurance platform for modern policy management and automated claims processing.',
      html_url: 'https://github.com/abhinavsai2006/INSURECORE',
      stargazers_count: 0,
      forks_count: 0,
      language: 'TypeScript',
      updated_at: '2026-07-22T20:13:41Z',
      topics: ['ai', 'insurance', 'typescript', 'fullstack'],
      fork: false,
      archived: false,
    },
    {
      name: 'DeepCoalSeg',
      description: 'Deep learning model for coal petrography image segmentation and microscopic feature analysis.',
      html_url: 'https://github.com/abhinavsai2006/DeepCoalSeg',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-07-25T19:16:06Z',
      topics: ['deep-learning', 'computer-vision', 'python', 'segmentation'],
      fork: false,
      archived: false,
    },
    {
      name: 'Syntactic-Intelligence',
      description: 'Advanced NLP and syntactic structure analysis engine for automated code & text parsing.',
      html_url: 'https://github.com/abhinavsai2006/Syntactic-Intelligence',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-07-19T17:41:20Z',
      topics: ['nlp', 'python', 'ai', 'machine-learning'],
      fork: false,
      archived: false,
    },
    {
      name: 'AI-Code-reviewer',
      description: 'AI-assisted automated code review application providing instant feedback and quality improvements.',
      html_url: 'https://github.com/abhinavsai2006/AI-Code-reviewer',
      stargazers_count: 0,
      forks_count: 0,
      language: 'HTML',
      updated_at: '2026-07-17T17:37:16Z',
      topics: ['ai', 'code-review', 'javascript', 'developer-tools'],
      fork: false,
      archived: false,
    },
    {
      name: 'SmartERP',
      description: 'Smart Enterprise Resource Planning web application designed for resource management and analytics.',
      html_url: 'https://github.com/abhinavsai2006/SmartERP',
      stargazers_count: 0,
      forks_count: 0,
      language: 'TypeScript',
      updated_at: '2026-07-04T08:11:59Z',
      topics: ['typescript', 'erp', 'web-app'],
      fork: false,
      archived: false,
    },
    {
      name: 'SignFlow',
      description: 'Sign language recognition and real-time gesture translation tool powered by computer vision.',
      html_url: 'https://github.com/abhinavsai2006/SignFlow',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-06-19T13:17:25Z',
      topics: ['computer-vision', 'sign-language', 'python', 'ai'],
      fork: false,
      archived: false,
    },
    {
      name: 'fitpulse',
      description: 'Fitness tracking and health analytics application with activity monitoring dashboards.',
      html_url: 'https://github.com/abhinavsai2006/fitpulse',
      stargazers_count: 0,
      forks_count: 0,
      language: 'JavaScript',
      updated_at: '2026-04-14T18:27:39Z',
      topics: ['health', 'javascript', 'web-app'],
      fork: false,
      archived: false,
    },
    {
      name: 'Civic-AI',
      description: 'AI-driven civic engagement platform for community problem reporting and resolution tracking.',
      html_url: 'https://github.com/abhinavsai2006/Civic-AI',
      stargazers_count: 0,
      forks_count: 0,
      language: 'CSS',
      updated_at: '2026-04-09T06:23:18Z',
      topics: ['civic-tech', 'ai', 'web'],
      fork: false,
      archived: false,
    },
    {
      name: 'LaundryHub',
      description: 'On-demand laundry booking and service tracking web platform with real-time status updates.',
      html_url: 'https://github.com/abhinavsai2006/LaundryHub',
      stargazers_count: 0,
      forks_count: 0,
      language: 'TypeScript',
      updated_at: '2026-03-22T15:14:36Z',
      topics: ['typescript', 'web-app', 'services'],
      fork: false,
      archived: false,
    },
    {
      name: 'Quallium-Ai',
      description: 'AI-based content generation and document synthesis engine for automated workflow productivity.',
      html_url: 'https://github.com/abhinavsai2006/Quallium-Ai',
      stargazers_count: 0,
      forks_count: 0,
      language: 'CSS',
      updated_at: '2026-03-06T18:40:14Z',
      topics: ['ai', 'nlp', 'llm'],
      fork: false,
      archived: false,
    },
    {
      name: 'EduVision-X',
      description: 'AI-powered personalized education platform for adaptive learning and intelligent tutoring.',
      html_url: 'https://github.com/abhinavsai2006/EduVision-X',
      stargazers_count: 0,
      forks_count: 1,
      language: 'TypeScript',
      updated_at: '2026-03-05T15:49:00Z',
      topics: ['education', 'ai', 'typescript'],
      fork: false,
      archived: false,
    },
    {
      name: 'Code-vision',
      description: 'Code analysis, visual AST exploration, and automated refactoring recommendations.',
      html_url: 'https://github.com/abhinavsai2006/Code-vision',
      stargazers_count: 0,
      forks_count: 0,
      language: 'JavaScript',
      updated_at: '2026-03-05T16:15:17Z',
      topics: ['developer-tools', 'javascript', 'ai'],
      fork: false,
      archived: false,
    },
    {
      name: 'Sentiment-Analysis',
      description: 'NLP-based sentiment classification model with microservices API for real-time text analysis.',
      html_url: 'https://github.com/abhinavsai2006/Sentiment-Analysis',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-02-20T16:08:53Z',
      topics: ['python', 'nlp', 'machine-learning'],
      fork: false,
      archived: false,
    },
    {
      name: 'Legal-Guard',
      description: 'AI legal document analyzer and risk mitigation assistant for contract review.',
      html_url: 'https://github.com/abhinavsai2006/Legal-Guard',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-02-15T16:29:29Z',
      topics: ['python', 'legal-tech', 'ai'],
      fork: false,
      archived: false,
    },
    {
      name: 'Maya-AI',
      description: 'Voice-based human-like personal AI assistant with real-time speech and modular architecture.',
      html_url: 'https://github.com/abhinavsai2006/Maya-AI',
      stargazers_count: 0,
      forks_count: 0,
      language: 'Python',
      updated_at: '2026-01-17T20:58:27Z',
      topics: ['voice-ai', 'python', 'assistant'],
      fork: false,
      archived: false,
    },
    {
      name: 'ultimate-career-ai',
      description: 'AI career planning, resume optimization, and skill guidance platform.',
      html_url: 'https://github.com/abhinavsai2006/ultimate-career-ai',
      stargazers_count: 0,
      forks_count: 0,
      language: 'JavaScript',
      updated_at: '2025-09-17T14:52:29Z',
      topics: ['career', 'ai', 'javascript'],
      fork: false,
      archived: false,
    },
    {
      name: 'My-Portfiolo',
      description: 'Personal portfolio website featuring dark aesthetic, dynamic project loading, and interactive UI.',
      html_url: 'https://github.com/abhinavsai2006/My-Portfiolo',
      stargazers_count: 0,
      forks_count: 0,
      language: 'CSS',
      updated_at: '2026-07-26T14:56:24Z',
      topics: ['portfolio', 'css', 'javascript'],
      fork: false,
      archived: false,
    },
  ];

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

  // Display Notice Banner (for rate-limit fallback or cached state)
  function showNotice(message) {
    if (!gridEl || !gridEl.parentNode) return;
    let noticeEl = document.getElementById('projects-notice');
    if (!noticeEl) {
      noticeEl = document.createElement('div');
      noticeEl.id = 'projects-notice';
      noticeEl.className = 'projects-notice';
      gridEl.parentNode.insertBefore(noticeEl, gridEl);
    }
    noticeEl.innerHTML = `<span>ℹ️ ${escapeHTML(message)}</span>`;
    noticeEl.style.display = 'flex';
  }

  // Remove Notice Banner
  function removeNotice() {
    const noticeEl = document.getElementById('projects-notice');
    if (noticeEl) {
      noticeEl.style.display = 'none';
    }
  }

  // Fetch Repositories from GitHub API with Caching and Fallback
  async function fetchRepositories() {
    renderSkeletons();

    // Check LocalStorage Cache
    let cachedRepos = null;
    try {
      const cachedStr = localStorage.getItem(CACHE_KEY);
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr);
        if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
          cachedRepos = parsed.data;
        }
      }
    } catch (e) {
      console.warn('LocalStorage cache read error:', e);
    }

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

      // Save to LocalStorage cache
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: allRepos })
        );
      } catch (e) {
        // Ignore quota / private browsing errors
      }

      removeNotice();
      processAndRenderRepos(allRepos);
    } catch (err) {
      console.warn('GitHub API Fetch fallback triggered:', err.message);

      if (cachedRepos && cachedRepos.length > 0) {
        allRepos = cachedRepos;
        removeNotice();
        processAndRenderRepos(allRepos);
      } else if (FALLBACK_REPOS && FALLBACK_REPOS.length > 0) {
        allRepos = FALLBACK_REPOS;
        removeNotice();
        processAndRenderRepos(allRepos);
      } else {
        renderError(err.message);
      }
    }
  }

  // Populate UI elements after fetching / falling back to repos
  function processAndRenderRepos(repos) {
    // Populate Language Filters
    buildLanguageFilters(repos);

    // Calculate & Render Stats
    updateStats(repos);

    // Filter & Render Cards
    applyFiltersAndSort();
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

    const buttonsHTML = `
      <button class="filter-btn filter-pill active is-active" data-lang="all">
        All (${repos.length})
      </button>
      ${sortedLangs
        .map(
          (lang) => `
        <button class="filter-btn filter-pill" data-lang="${lang}">
          ${lang} (${langCounts[lang]})
        </button>
      `
        )
        .join('')}
    `;

    filtersContainer.innerHTML = buttonsHTML;

    // Attach click listeners to filter buttons
    filtersContainer.querySelectorAll('.filter-btn, .filter-pill').forEach((btn) => {
      btn.addEventListener('click', function () {
        filtersContainer.querySelectorAll('.filter-btn, .filter-pill').forEach((b) => {
          b.classList.remove('active');
          b.classList.remove('is-active');
        });
        btn.classList.add('active');
        btn.classList.add('is-active');
        currentLanguageFilter = btn.dataset.lang;
        applyFiltersAndSort();
      });
    });
  }

  // Apply Search, Language Filters, and Sorting
  function applyFiltersAndSort() {
    let result = [...allRepos];

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (repo) =>
          repo.name.toLowerCase().includes(q) ||
          (repo.description && repo.description.toLowerCase().includes(q)) ||
          (repo.language && repo.language.toLowerCase().includes(q)) ||
          (repo.topics && repo.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Language filter
    if (currentLanguageFilter !== 'all') {
      result = result.filter((repo) => repo.language === currentLanguageFilter);
    }

    // Sort repos
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
  }

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
