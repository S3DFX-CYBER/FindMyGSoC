/**
 * landing.js — FindMyGSoC Landing Page Scripts
 *
 * Responsibilities:
 *  - Safe client-side storage (theme persistence) with input validation
 *  - Data-driven rendering of the comparison table and FAQ accordion
 *  - Theme toggle & mobile menu wiring
 *  - Smooth-scroll with reduced-motion respect
 *  - Scroll-triggered animations for "How It Works" steps
 *  - Live statistics from ORGS data
 *
 * Security notes:
 *  - localStorage values are validated against an allowlist before use
 *  - All dynamic HTML is built via DOM APIs (createElement/textContent),
 *    never via innerHTML string concatenation, preventing stored-XSS
 */

'use strict';

// ── Safe Storage Wrapper ──────────────────────────────────────────────────────

/**
 * A thin wrapper around localStorage that:
 *  1. Catches SecurityError / QuotaExceededError silently
 *  2. Validates retrieved values against an optional allowlist so that a
 *     tampered storage entry can never inject arbitrary content into the DOM
 */
const SafeStorage = {
  /**
   * @param {string} key
   * @param {string} value
   */
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_e) {
      // Storage unavailable (private mode, quota exceeded, etc.) — fail silently
    }
  },

  /**
   * @param {string} key
   * @param {string[]} [allowList]  If provided, the stored value is only
   *                                returned when it appears in the list.
   * @returns {string|null}
   */
  get(key, allowList) {
    try {
      const raw = window.localStorage.getItem(key);
      if (allowList && raw !== null && !allowList.includes(raw)) {
        // Value is not in the allowlist — treat as absent and clean up
        window.localStorage.removeItem(key);
        return null;
      }
      return raw;
    } catch (_e) {
      return null;
    }
  },
};

// ── Comparison Table Data ─────────────────────────────────────────────────────

/** Single source of truth — eliminates duplicated table rows in markup */
const COMPARISON_DATA = [
  { feature: 'AI skill matching',          fmg: 'primary',   gsoc: false,       god: false,       gh: false },
  { feature: 'Live Good First Issues',     fmg: 'primary',   gsoc: false,       god: false,       gh: 'secondary' },
  { feature: 'Filter by tech & category',  fmg: 'primary',   gsoc: false,       god: 'primary',   gh: 'secondary' },
  { feature: 'Org side-by-side compare',   fmg: 'primary',   gsoc: false,       god: false,       gh: false },
  { feature: 'Proposal editor & PDF export', fmg: 'primary', gsoc: false,       god: false,       gh: false },
  { feature: 'Multi-year participation stats', fmg: 'primary', gsoc: false,     god: 'primary',   gh: false },
  { feature: 'Works offline (PWA)',         fmg: 'primary',   gsoc: false,       god: false,       gh: false },
  { feature: 'No login or signup needed',  fmg: 'primary',   gsoc: 'secondary', god: 'secondary', gh: 'secondary' },
];

// ── FAQ Data ──────────────────────────────────────────────────────────────────

/** Single source of truth — eliminates duplicated accordion blocks in markup */
const FAQ_DATA = [
  {
    id: 'faq-ans-1',
    q: 'What is FindMyGSoC?',
    a: 'FindMyGSoC is an independent open-source dashboard designed to help GSoC applicants explore, analyze, and select optimal open-source organizations. It tracks organization participation stats, aggregates contact resources, tracks live Good First Issues, and features a markdown editor to draft proposals.',
  },
  {
    id: 'faq-ans-2',
    q: 'How does the AI Recommendation matching work?',
    a: 'The AI recommender parses your input\u2014either your GitHub username (to analyze your public repos, languages, and topics) or copy-pasted CV text. It extracts your key skills and computes a match score against the technologies, domains, and codebase complexity of the 184 GSoC organizations in our index.',
  },
  {
    id: 'faq-ans-3',
    q: 'Where is my proposal draft data saved?',
    a: 'Privacy first. All draft proposals, watchlist items, bookmarks, and search history are saved locally inside your browser\u2019s localStorage. No data is ever uploaded to external databases, keeping your ideas and work completely private.',
  },
  {
    id: 'faq-ans-4',
    q: 'Is this platform affiliated with Google?',
    a: 'No, FindMyGSoC is an independent open-source project created and maintained by the developer community. It is not affiliated with, sponsored by, or endorsed by Google LLC. Google Summer of Code is a registered trademark of Google LLC.',
  },
];

// ── DOM Helpers ───────────────────────────────────────────────────────────────

/**
 * Creates a single comparison-table <td> cell using DOM APIs (no innerHTML).
 * @param {string|false} value  Tailwind color name or false for ✗
 * @returns {HTMLTableCellElement}
 */
function createComparisonCell(value) {
  const td = document.createElement('td');
  td.className = 'py-3_5 px-4 text-center';

  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined text-xl';

  if (!value) {
    icon.classList.add('text-zinc-300', 'dark:text-zinc-600');
    icon.textContent = 'cancel';
  } else {
    icon.classList.add(`text-${value}`, 'icon-fill');
    icon.textContent = 'check_circle';
  }

  td.appendChild(icon);
  return td;
}

/**
 * Renders the comparison table body from COMPARISON_DATA using DOM APIs.
 * Appends rows to #comparisonRows.
 */
function renderComparisonRows() {
  const tbody = document.getElementById('comparisonRows');
  if (!tbody) { return; }

  const fragment = document.createDocumentFragment();

  for (const row of COMPARISON_DATA) {
    const tr = document.createElement('tr');

    const featureTd = document.createElement('td');
    featureTd.className = 'py-3_5 pr-6 text-zinc-700 dark:text-zinc-300 font-medium';
    featureTd.textContent = row.feature;
    tr.appendChild(featureTd);

    tr.appendChild(createComparisonCell(row.fmg));
    tr.appendChild(createComparisonCell(row.gsoc));
    tr.appendChild(createComparisonCell(row.god));
    tr.appendChild(createComparisonCell(row.gh));

    fragment.appendChild(tr);
  }

  tbody.appendChild(fragment);
}

/**
 * Renders FAQ accordion items from FAQ_DATA using DOM APIs.
 * Appends items to #faqList.
 */
function renderFaqList() {
  const container = document.getElementById('faqList');
  if (!container) { return; }

  const fragment = document.createDocumentFragment();

  const wrapClass = [
    'border', 'border-zinc-200/70', 'dark:border-zinc-800/80',
    'bg-white/80', 'dark:bg-[#1a1108]/40', 'glass',
    'rounded-2xl', 'overflow-hidden', 'transition-colors', 'duration-300',
  ];

  const btnClass = [
    'faq-trigger', 'flex', 'items-center', 'justify-between', 'w-full',
    'p-6', 'text-left', 'font-bold', 'text-sm', 'sm:text-base',
    'text-zinc-800', 'dark:text-zinc-100',
    'hover:bg-zinc-50/50', 'dark:hover:bg-zinc-800/35',
    'transition-colors', 'focus:outline-none',
  ];

  for (const item of FAQ_DATA) {
    const wrapper = document.createElement('div');
    wrapper.classList.add(...wrapClass);

    // Button
    const btn = document.createElement('button');
    btn.classList.add(...btnClass);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', item.id);

    const questionSpan = document.createElement('span');
    questionSpan.textContent = item.q;
    btn.appendChild(questionSpan);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined faq-icon transition-transform duration-200';
    iconSpan.textContent = 'expand_more';
    btn.appendChild(iconSpan);

    // Answer panel
    const panel = document.createElement('div');
    panel.id = item.id;
    panel.className = 'faq-content transition-all duration-300';

    const answerPara = document.createElement('p');
    answerPara.className = 'p-6 pt-0 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100/50 dark:border-zinc-800/50';
    answerPara.textContent = item.a;

    panel.appendChild(answerPara);
    wrapper.appendChild(btn);
    wrapper.appendChild(panel);
    fragment.appendChild(wrapper);
  }

  container.appendChild(fragment);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

/** Syncs the theme toggle button icon and aria attributes to current state. */
function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  const icon = btn ? btn.querySelector('.material-symbols-outlined') : null;
  if (!icon) { return; }

  const isDark = document.documentElement.classList.contains('dark');
  icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

/** Toggles dark/light theme and persists the choice via SafeStorage. */
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  SafeStorage.set('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────

/** Toggles the mobile navigation drawer. */
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('menuBtn');
  if (!menu || !btn) { return; }

  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  menu.classList.toggle('hidden');
  btn.setAttribute('aria-expanded', String(!isExpanded));

  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) { icon.textContent = !isExpanded ? 'close' : 'menu'; }
}

// ── Footer Patch ──────────────────────────────────────────────────────────────

/**
 * Applies CSS classes and rewrites in-page hrefs on the injected footer element.
 * @param {Element} footer
 */
function applyFooterPatch(footer) {
  footer.classList.add(
    'border-t', 'border-zinc-200', 'dark:border-zinc-800',
    'bg-white', 'dark:bg-[#0f0a05]', 'transition-colors', 'duration-300',
  );
  footer.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === '#orgs' || href === '#timeline') {
      a.setAttribute('href', `/app${href}`);
    }
  });
}

/**
 * Waits for the dynamically-injected footer then patches its links/classes.
 * Uses MutationObserver so it fires exactly once with no polling overhead.
 */
function patchFooterLinks() {
  const existing = document.querySelector('footer.premium-footer');
  if (existing) { applyFooterPatch(existing); return; }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) { continue; }
        const footer = node.matches('footer.premium-footer')
          ? node
          : node.querySelector('footer.premium-footer');
        if (footer) { observer.disconnect(); applyFooterPatch(footer); return; }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Smooth Scroll ─────────────────────────────────────────────────────────────

/** Wires smooth-scroll behaviour on all in-page anchor links. */
function wireAnchorScroll() {
  const NAVBAR_HEIGHT = 72;
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) { return; }
      const target = document.getElementById(targetId);
      if (!target) { return; }
      e.preventDefault();

      // Close mobile menu if open
      const mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        toggleMenu();
      }

      const top = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
}

// ── Scroll-triggered Animations ───────────────────────────────────────────────

/** Fade-in for "How It Works" step cards when they enter the viewport. */
function initHiwAnimations() {
  const steps = document.querySelectorAll('.hiw-step');
  if (!steps.length) { return; }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  steps.forEach((step) => observer.observe(step));
}

// ── Live Statistics ───────────────────────────────────────────────────────────

/**
 * Calculates and renders live org statistics from the ORGS dataset.
 * No-ops gracefully if ORGS is not available.
 */
function renderLiveStats() {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) { return; }

  const totalOrgs    = ORGS.length;
  const veteranOrgs  = ORGS.filter((o) => o.years >= 10).length;
  const newcomerOrgs = ORGS.filter((o) => o.years <= 3).length;

  /** @param {string} id @param {string} value */
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = value; }
  };

  setText('statOrgs',             `${totalOrgs}+`);
  setText('statVeterans',         `${veteranOrgs}+`);
  setText('statNewcomers',        `${newcomerOrgs}+`);
  setText('org-count-text',       `${totalOrgs}+ organizations`);
  setText('dash-org-count',       `${totalOrgs} Orgs`);
  setText('footerOrgCount',       String(totalOrgs));
  setText('footerVeteranOrgCount', String(veteranOrgs));
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────

// Sync theme icon immediately (theme class already applied by inline head script)
updateThemeIcon();

document.addEventListener('DOMContentLoaded', () => {
  // Trigger hero entry animations
  document.body.classList.add('hero-loaded');

  // Wire interactive controls
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) { themeBtn.addEventListener('click', toggleTheme); }

  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) { menuBtn.addEventListener('click', toggleMenu); }

  // Render data-driven sections
  renderComparisonRows();
  renderFaqList();

  // FAQ accordion — event delegation on the dynamically rendered list
  const faqList = document.getElementById('faqList');
  if (faqList) {
    faqList.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-trigger');
      if (!btn) { return; }
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isExpanded));
    });
  }

  // Patch footer after dynamic injection
  patchFooterLinks();

  // Smooth anchor scrolling
  wireAnchorScroll();

  // Scroll animations
  initHiwAnimations();

  // Live org statistics
  renderLiveStats();
});
