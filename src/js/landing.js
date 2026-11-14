/**
 * landing.js, FindMyGSoC Landing Page Scripts
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
      // Storage unavailable (private mode, quota exceeded, etc.), fail silently
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
        // Value is not in the allowlist, treat as absent and clean up
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

/** Single source of truth, eliminates duplicated table rows in markup */
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

/** Competitors data (for mobile viewport 1-on-1 tabbed comparision)**/
const COMPETITORS = [
  { key: 'gsoc', label: 'GSoC Portal', href: null },
  { key: 'god', label: 'gsocorganizations.dev', href: 'https://www.gsocorganizations.dev/' },
  { key: 'gh', label: 'GitHub / Manual', href: null },
];

// ── FAQ Data ──────────────────────────────────────────────────────────────────

/** Single source of truth, eliminates duplicated accordion blocks in markup */
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
 * @param {string|false} value  'primary', 'secondary' or false
 * @param {boolean} [isUs]      Marks the FindMyGSoC column
 * @returns {HTMLTableCellElement}
 */
function createComparisonCell(value, isUs) {
  const td = document.createElement('td');
  if (isUs) { td.className = 'us'; }

  const mark = document.createElement('span');
  if (!value) {
    mark.className = 'n';
    mark.textContent = '-';
  } else if (value === 'secondary') {
    mark.className = 'p';
    mark.textContent = 'Partial';
  } else {
    mark.className = 'y';
    mark.textContent = ' Yes';
  }

  td.appendChild(mark);
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
    featureTd.textContent = row.feature;
    tr.appendChild(featureTd);

    tr.appendChild(createComparisonCell(row.fmg, true));
    tr.appendChild(createComparisonCell(row.gsoc));
    tr.appendChild(createComparisonCell(row.god));
    tr.appendChild(createComparisonCell(row.gh));

    fragment.appendChild(tr);
  }

  tbody.appendChild(fragment);
}

function renderMobileComparisonRows(competitorKey) {
  const tbody = document.getElementById('comparisonRowsMobile');
  if (!tbody) { return; }

  tbody.textContent = '';
  const fragment = document.createDocumentFragment();

  for (const row of COMPARISON_DATA) {
    const tr = document.createElement('tr');

    const featureTd = document.createElement('td');
    featureTd.textContent = row.feature;
    tr.appendChild(featureTd);

    tr.appendChild(createComparisonCell(row.fmg, true));
    tr.appendChild(createComparisonCell(row[competitorKey]));

    fragment.appendChild(tr);
  }

  tbody.appendChild(fragment);
}

function updateMobileCompetitorHeader(competitor) {
  const labelEl = document.getElementById('mobileCompetitorLabel');
  if (!labelEl) { return; }

  labelEl.textContent = '';

  if (competitor.href) {
    const link = document.createElement('a');
    link.href = competitor.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'mob-head';
    link.textContent = competitor.label;
    labelEl.appendChild(link);
  } else {
    labelEl.textContent = competitor.label;
  }
}

function setActiveCompetitorTab(key) {
  document.querySelectorAll('.cmp-tab-btn').forEach((btn) => {
    const isActive = btn.dataset.competitor === key;
    btn.setAttribute('aria-selected', String(isActive));
    btn.setAttribute('tabindex', isActive ? '0' : '-1');

    if (isActive) {
      const panel = document.getElementById('comparisonTabpanel');
      if (panel) { panel.setAttribute('aria-labelledby', btn.id); }
    }
  });
}

function initComparisonTabs() {
  const container = document.getElementById('competitorTabs');
  if (!container) { return; }

  const tabs = Array.from(container.querySelectorAll('.cmp-tab-btn'));

  const activate = (key) => {
    const competitor = COMPETITORS.find((c) => c.key === key);
    if (!competitor) { return; }
    renderMobileComparisonRows(key);
    updateMobileCompetitorHeader(competitor);
    setActiveCompetitorTab(key);
  };

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.cmp-tab-btn');
    if (!btn) { return; }
    activate(btn.dataset.competitor);
  });

  container.addEventListener('keydown', (e) => {
    const currentIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');

    let targetIndex = null;
    if (e.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = tabs[targetIndex];
    targetTab.focus();
    activate(targetTab.dataset.competitor);
  });

  activate(COMPETITORS[0].key);
}

/**
 * Renders FAQ accordion items from FAQ_DATA using DOM APIs.
 * Appends items to #faqList.
 */
function renderFaqList() {
  const container = document.getElementById('faqList');
  if (!container) { return; }

  const fragment = document.createDocumentFragment();

  for (const item of FAQ_DATA) {
    const details = document.createElement('details');

    const summary = document.createElement('summary');
    const questionSpan = document.createElement('span');
    questionSpan.textContent = item.q;
    summary.appendChild(questionSpan);

    // Decorative plus marker, the <details> element owns the open/closed state
    const marker = document.createElement('span');
    marker.className = 'pm';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = '+';
    summary.appendChild(marker);

    const answer = document.createElement('div');
    answer.className = 'ans';
    answer.id = item.id;

    const answerPara = document.createElement('p');
    answerPara.textContent = item.a;
    answer.appendChild(answerPara);

    details.appendChild(summary);
    details.appendChild(answer);
    fragment.appendChild(details);
  }

  container.appendChild(fragment);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

/**
 * Applies a theme to <html>. Both the class and the data attribute are set:
 * the class is what the legacy stylesheet keys on, the attribute is what the
 * redesign tokens key on, so either layer switches with the toggle.
 * @param {boolean} isDark
 */
function applyTheme(isDark) {
  const root = document.documentElement;
  root.classList.toggle('dark', isDark);
  if (isDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
  }
}

/** Syncs the theme toggle button icon and aria attributes to current state. */
function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) { return; }

  const isDark = document.documentElement.classList.contains('dark');
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

/** Toggles dark/light theme and persists the choice via SafeStorage. */
function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark);
  SafeStorage.set('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────

/**
 * Opens or closes the mobile navigation drawer.
 * @param {boolean} [force]  Explicit state; toggles when omitted
 */
function toggleMenu(force) {
  const menu = document.getElementById('mobileMenu');
  const btn  = document.getElementById('menuBtn');
  if (!menu || !btn) { return; }

  const isOpen = typeof force === 'boolean' ? force : menu.dataset.open !== 'true';
  menu.dataset.open = String(isOpen);
  btn.setAttribute('aria-expanded', String(isOpen));
  btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

  if (isOpen) {
    const firstLink = menu.querySelector('.drawer-panel a, .drawer-panel button');
    if (firstLink) { firstLink.focus(); }
  } else {
    btn.focus();
  }
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
  // The landing page ships its own footer markup; only patch the injected one.
  if (!document.getElementById('footer-placeholder')) { return; }

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

// ── Reveal on scroll ──────────────────────────────────────────────────────────

/**
 * Adds the `in` class to every `[data-rv]` element as it enters the viewport.
 * The CSS keeps these elements visible when reduced motion is requested, so this
 * is purely additive.
 */
function initReveals() {
  const targets = document.querySelectorAll('[data-rv]');
  if (!targets.length) { return; }

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach((el) => observer.observe(el));
}

/** Adds the hairline border to the sticky nav once the page has scrolled. */
function initNavScrollState() {
  const nav = document.getElementById('nav');
  if (!nav) { return; }

  const sync = () => nav.classList.toggle('stuck', window.scrollY > 8);
  window.addEventListener('scroll', sync, { passive: true });
  sync();
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
  setText('org-count',            String(totalOrgs));
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
  if (menuBtn) { menuBtn.addEventListener('click', () => toggleMenu()); }

  // Drawer: close on backdrop, close button, Escape, or any link inside the panel
  const drawer = document.getElementById('mobileMenu');
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('[data-drawer-close]')) { toggleMenu(false); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') { toggleMenu(false); }
    });
  }

  // Render data-driven sections
  renderComparisonRows();
  initComparisonTabs();
  renderFaqList();

  // Patch footer after dynamic injection
  patchFooterLinks();

  // Smooth anchor scrolling
  wireAnchorScroll();

  // Scroll animations
  initHiwAnimations();
  initReveals();
  initNavScrollState();

  // Live org statistics
  renderLiveStats();
});
