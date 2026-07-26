/* ==========================================================================
   BLOG.JS — Insights & Blog Interactive Controller
   Handles Search, Filter Pills, and Full Article Modal Viewer
   ========================================================================== */

(function () {
  'use strict';

  // Articles data curated from Abhinav's posts & achievements
  const ARTICLES = [
    {
      id: 'post-1',
      title: 'Generative AI as Infrastructure: Lessons from Microsoft × LinkedIn Learning',
      category: 'AI Engineering',
      date: 'Jul 2026',
      readTime: '4 min read',
      tags: ['GenerativeAI', 'MicrosoftCopilot', 'ResponsibleAI', 'AIEngineering'],
      excerpt: 'Many treat AI tools like a search bar: ask, get an answer, and close the tab. This mindset shifts when you build with AI as a foundational infrastructure layer.',
      content: `
        <h2>Generative AI as Infrastructure: Lessons from Microsoft × LinkedIn Learning</h2>
        <p>Many treat AI tools like a search bar: ask, get an answer, and close the tab. This mindset shifts when you are expected to build with these tools, a lesson I reinforced through <em>Career Essentials in Generative AI</em> by Microsoft × LinkedIn Learning.</p>
        <p><strong>Key Takeaways:</strong></p>
        <ul>
          <li><strong>Foundational Layer:</strong> Generative AI functions best as a foundational layer in your technical process, rather than an add-on feature at the end.</li>
          <li><strong>Responsible AI Design:</strong> Responsible AI isn't merely a compliance policy document; it is an architectural decision made during the design phase before any prompt or model pipeline is crafted.</li>
          <li><strong>Bridging the Gap:</strong> The difference between "using AI" and "building with AI" is smaller than it appears, yet many never bridge this gap because they don't attempt to build.</li>
        </ul>
        <p>Sometimes, the most valuable learning isn't about acquiring new information, but gaining a better vocabulary for what you already understand through hands-on building.</p>
      `
    },
    {
      id: 'post-2',
      title: 'Building Qualium AI: Architecting an Agentic Pipeline with Gemini API & Computer Vision',
      category: 'Hackathons & Build',
      date: 'Jun 2026',
      readTime: '5 min read',
      tags: ['QualiumAI', 'GeminiAPI', 'ComputerVision', 'Top15Finalist'],
      excerpt: 'How we built Qualium AI — an AI agent for smart city issue management using Google Gemini API, computer vision, and smart routing — placing Top 15 out of 53 teams at HackAura VITaura\'25.',
      content: `
        <h2>Building Qualium AI: Architecting an Agentic Pipeline with Gemini API & Computer Vision</h2>
        <p>At HackAura (VIT-AP's flagship hackathon), our team set out to solve urban issue reporting through agentic automation. The result was <strong>Qualium AI</strong> — an intelligent agent pipeline designed for civic management.</p>
        <p><strong>Architecture & Innovations:</strong></p>
        <ul>
          <li><strong>Multi-modal Analysis:</strong> Integrated Google Gemini API with computer vision to automatically detect and classify municipal issues from user-submitted photos.</li>
          <li><strong>Automated Routing:</strong> Built automated agent routing logic to assign reports directly to municipal departments based on priority scoring.</li>
          <li><strong>Recognition:</strong> Competed against 53 top development teams and placed as a <strong>Top 15 Finalist</strong>.</li>
        </ul>
        <p>Building under hackathon time constraints proved that combining modern multimodal APIs with clean agentic workflows enables rapid deployment of real-world AI solutions.</p>
      `
    },
    {
      id: 'post-3',
      title: 'Demystifying Hashgraph Consensus: Earning the Hedera HCDA & HCF Certifications',
      category: 'Web3 / Blockchain',
      date: 'Jun 2026',
      readTime: '6 min read',
      tags: ['Hedera', 'HCDA', 'HCF', 'Blockchain', 'Web3'],
      excerpt: 'Insights from earning the Hedera Certified Developer Associate (HCDA) and Foundation (HCF) certifications. Why hashgraph consensus is fundamentally different from traditional blockchains.',
      content: `
        <h2>Demystifying Hashgraph Consensus: Earning the Hedera HCDA & HCF Certifications</h2>
        <p>I completed the Hedera Certified Foundation (HCF) and Hedera Certified Developer Associate (HCDA) certifications by The Hashgraph Association.</p>
        <p><strong>Why Hedera Hashgraph Stands Out:</strong></p>
        <ul>
          <li><strong>Consensus Mechanism:</strong> Unlike traditional proof-of-work/proof-of-stake blockchains with linear blocks, Hedera uses a Directed Acyclic Graph (DAG) with asynchronous Byzantine Fault Tolerance (aBFT).</li>
          <li><strong>Token Service (HTS):</strong> Allows minting native tokens at the protocol level without writing custom smart contracts, drastically reducing gas fees and execution risk.</li>
          <li><strong>Smart Contracts & Security:</strong> EVM-compatible execution combined with high transaction throughput and predictable low costs.</li>
        </ul>
        <p>If you're exploring Web3 infrastructure, understanding distributed ledger technologies like Hedera is essential for building scalable decentralized applications.</p>
      `
    },
    {
      id: 'post-4',
      title: 'Hands-On Insights from the Google for Developers Build with AI Bootcamp',
      category: 'Hackathons & Build',
      date: 'Jun 2026',
      readTime: '4 min read',
      tags: ['GoogleForDevelopers', 'BuildWithAI', 'Hack2Skill', 'PromptEngineering'],
      excerpt: 'Practical takeaways from attending the Google for Developers & Hack2Skill Build with AI Bootcamp. Exploring prompt engineering, model tuning, and cloud integration.',
      content: `
        <h2>Hands-On Insights from the Google for Developers Build with AI Bootcamp</h2>
        <p>Attending the <em>Build with AI Bootcamp</em> organized by Google for Developers and Hack2skill provided valuable practical insights into building production AI applications.</p>
        <p><strong>Core Takeaways:</strong></p>
        <ul>
          <li><strong>Prompt Engineering as Code:</strong> Structured prompts, system instructions, and few-shot examples should be version-controlled and tested like software code.</li>
          <li><strong>Developer Community:</strong> Connecting with fellow developers and exchanging ideas accelerates learning far beyond solo experimentation.</li>
          <li><strong>Google Cloud Integration:</strong> Leveraging Google Cloud AI endpoints for seamless scalability from prototype to production.</li>
        </ul>
      `
    }
  ];

  let currentCategory = 'all';
  let searchQuery = '';

  // DOM Elements
  const gridEl = document.getElementById('blog-grid');
  const searchInput = document.getElementById('blog-search-input');
  const filtersContainer = document.getElementById('blog-filters');
  const modalEl = document.getElementById('article-modal');
  const modalBodyEl = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close');

  function renderArticles() {
    if (!gridEl) return;

    let result = ARTICLES.filter((art) => {
      const matchCat = currentCategory === 'all' || art.category.toLowerCase().includes(currentCategory);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    if (result.length === 0) {
      gridEl.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--c-bg-elevated); border: 1px solid var(--c-border-light); border-radius: 16px;">
          <h3 style="font-family: var(--f-heading); margin-bottom: 0.5rem;">No Articles Found</h3>
          <p style="color: var(--c-text-muted);">Try adjusting your search query or filter topic.</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = result.map((art) => `
      <article class="article-card" data-id="${art.id}" data-cursor-label="Read">
        <div>
          <div class="article-card__meta">
            <span>${art.category}</span>
            <span>&bull;</span>
            <span class="article-card__date">${art.date}</span>
            <span>&bull;</span>
            <span style="color: var(--c-text-muted);">${art.readTime}</span>
          </div>
          <h3 class="article-card__title">${art.title}</h3>
          <p class="article-card__excerpt">${art.excerpt}</p>
          <div class="article-card__tags">
            ${art.tags.map((t) => `<span class="article-tag">#${t}</span>`).join('')}
          </div>
        </div>
        <span class="article-card__readmore">
          Read Full Article &rarr;
        </span>
      </article>
    `).join('');

    // Attach click listener for modal
    gridEl.querySelectorAll('.article-card').forEach((card) => {
      card.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const art = ARTICLES.find((a) => a.id === id);
        if (art && modalEl && modalBodyEl) {
          modalBodyEl.innerHTML = art.content;
          modalEl.classList.add('is-active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    if (window.attachCursorHovers) {
      window.attachCursorHovers();
    }
  }

  function initFilters() {
    if (!filtersContainer) return;
    filtersContainer.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', function () {
        filtersContainer.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('is-active'));
        this.classList.add('is-active');
        currentCategory = this.getAttribute('data-category');
        renderArticles();
      });
    });
  }

  function initControls() {
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value;
        renderArticles();
      });
    }

    if (modalCloseBtn && modalEl) {
      modalCloseBtn.addEventListener('click', closeModal);
      modalEl.addEventListener('click', function (e) {
        if (e.target === modalEl) closeModal();
      });
    }
  }

  function closeModal() {
    if (modalEl) {
      modalEl.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

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

  document.addEventListener('DOMContentLoaded', function () {
    initMobileMenu();
    initCustomCursor();
    initFilters();
    initControls();
    renderArticles();
  });
})();
