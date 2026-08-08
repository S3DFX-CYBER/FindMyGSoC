/* global ORGS, openModal, toggleCompare, toggleBookmark, openRandomOrg, clearAllFilters, openCompareModal, fetchModalGH, unselectLanguage, clearAllLanguages */
/* exported openAnalytics, closeAnEvent, fetchAll, fetchModalGH, toggleCompareFromModal, openCompare, closeCompareEv, imgErr, toggleBookmark, toggleChip, resetFilters, closeModalEv, openIssuesPage, closeIssuesPage, fetchAllIssues, showMoreIssues */

// ══════════════════════════════════════════════
// GLOBAL STATE & COMPATIBILITY LAYER
// ══════════════════════════════════════════════
let filteredOrgs = [];
let MENTOR_DATA = {};
let mentorDataState = 'idle';
const compareList = []; // list of org names
const bookmarkedSet = new Set(parseStoredBookmarks());

// Recently Viewed Organizations
const RECENTLY_VIEWED_KEY = 'recentlyViewedOrgs';
const RECENTLY_VIEWED_LIMIT = 8;
let recentlyViewed = (() => {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(name => typeof name === 'string');
  } catch {
    return [];
  }
})();

const selectedLanguages = new Set();
let matchAllLanguages = false;
let activeChip = null; // quick-filter chip key
let visibleCount = 12;
let focusedIdx = -1; // for keyboard card navigation

// Expose globals for external components (recommender, recommendation-ui, etc.)
globalThis.pills = selectedLanguages;
globalThis.matchAllLanguages = matchAllLanguages;
globalThis.compareList = compareList;
globalThis.bookmarkedSet = bookmarkedSet;

const CATEGORY_META = {
  science: { className: 'bg-blue-100 text-blue-700', label: 'Science' },
  programming: { className: 'bg-violet-100 text-violet-700', label: 'Programming' },
  data: { className: 'bg-cyan-100 text-cyan-700', label: 'Data' },
  web: { className: 'bg-green-100 text-green-700', label: 'Web' },
  os: { className: 'bg-orange-100 text-orange-700', label: 'OS / Systems' },
  security: { className: 'bg-red-100 text-red-700', label: 'Security' },
  media: { className: 'bg-pink-100 text-pink-700', label: 'Media' },
  infra: { className: 'bg-yellow-100 text-yellow-700', label: 'Infrastructure' },
  ai: { className: 'bg-purple-100 text-purple-700', label: 'AI / ML' },
  dev: { className: 'bg-teal-100 text-teal-700', label: 'Dev Tools' },
  other: { className: 'bg-zinc-100 text-zinc-600', label: 'Other' },
};

const LANGUAGE_ALIASES = {
  'python': ['python'],
  'javascript': ['javascript', 'js'],
  'typescript': ['typescript', 'ts'],
  'c/c++': ['c', 'c++', 'cpp'],
  'java': ['java'],
  'rust': ['rust'],
  'go': ['go', 'golang'],
  'ruby': ['ruby'],
  'haskell': ['haskell'],
  'scala': ['scala'],
  'ml/ai': ['ml', 'ai', 'machine learning', 'artificial intelligence'],
  'robotics': ['robotics', 'robot', 'ros']
};

const LANGUAGE_MAP = {};
(() => {
  const toDisplayKey = (k) => {
    if (k === 'ml/ai') return 'ML/AI';
    if (k === 'c/c++') return 'C/C++';
    return k.split(/[\s/]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };
  Object.keys(LANGUAGE_ALIASES).forEach(k => {
    const display = toDisplayKey(k);
    LANGUAGE_MAP[display] = LANGUAGE_ALIASES[k];
    LANGUAGE_MAP[k] = LANGUAGE_ALIASES[k];
  });
})();
globalThis.LANGUAGE_MAP = LANGUAGE_MAP;

const UMBRELLA_ORGS = new Set([
  'Apache Software Foundation', 'CNCF', 'Eclipse Foundation', 'FOSSASIA', 'GNOME Foundation',
  'GNU Project', 'Jenkins', 'KDE Community', 'NumFOCUS', 'OpenMRS', 'openSUSE Project',
  'OWASP Foundation', 'The Linux Foundation', 'Wikimedia Foundation', 'AOSSIE', 'CERN-HSF',
  'CCExtractor Development', 'Blender Foundation', 'Open Robotics', 'JBoss Community',
  'The Honeynet Project', 'MetaBrainz Foundation Inc', 'OSGeo (Open Source Geospatial Foundation)',
  'SW360', 'DBpedia', 'LibreOffice', 'Oppia Foundation', 'Sugar Labs', 'Internet Archive',
  'VideoLAN', 'JdeRobot', 'Kubeflow', 'INCF', 'OpenAstronomy', 'Machine Learning for Science (ML4SCI)',
  'SageMath', 'National Resource for Network Biology (NRNB)', 'FOSSology', 'JabRef e.V.',
  'LabLua', 'Liquid Galaxy project', 'Free and Open Source Silicon Foundation',
]);

const CHANNEL_ICONS = {
  Slack: '💬', Zulip: '💬', Discord: '🎮', Matrix: '🔗', IRC: '🖥️', 'Mailing list': '📧'
};

const CONTACT_TIPS = {
  Slack: 'Join and say hi in the GSoC channel before DMing mentors.',
  Discord: 'Introduce yourself in the public channel before asking project-specific questions.',
  Zulip: 'Post a new topic in the GSoC stream with your background and interest.',
  Matrix: "Say hello in the public room and mention the project area you're exploring.",
  IRC: 'Stay in the channel for a while; replies are often asynchronous.',
  'Mailing list': "Send a short intro email with your background and the idea you're interested in."
};

// ══════════════════════════════════════════════
// THEME & FOUC PROTECTION
// ══════════════════════════════════════════════
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', saved === 'dark');
    updateThemeIcon();
  } catch (e) {
    console.warn('Theme init failed:', e);
  }
})();

globalThis.toggleTheme = function () {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
};

function updateThemeIcon() {
  const btn = document.getElementById('themeToggleBtn');
  const icon = btn ? btn.querySelector('.material-symbols-outlined') : null;
  if (icon) {
    const isDark = typeof document.documentElement.classList.contains === 'function'
      ? document.documentElement.classList.contains('dark')
      : false;
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
}

// ══════════════════════════════════════════════
// DYNAMIC TIMELINE & COUNTDOWN
// ══════════════════════════════════════════════
const GSOC_SELECTION_DATE = new Date('2026-05-08T18:00:00Z');
const MILESTONES = [
  { date: new Date('2026-02-19T00:00:00Z'), label: 'Accepted Orgs Announced', note: null },
  { date: new Date('2026-03-16T00:00:00Z'), label: 'Contributor Proposals Open', note: null },
  { date: new Date('2026-03-31T23:30:00+05:30'), label: 'Proposal Submission Deadline', note: 'Submit your project proposals by 11:30 PM!' },
  { date: GSOC_SELECTION_DATE, label: 'Accepted Projects Announced', note: null },
  { date: new Date('2026-05-25T00:00:00Z'), label: 'Coding Officially Begins', note: 'Start working on your GSoC project!' },
  { date: new Date('2026-07-06T18:00:00Z'), label: 'Midterm Evaluations Begin', note: 'Mentors and contributors submit midterm evaluations.' },
  { date: new Date('2026-07-10T18:00:00Z'), label: 'Midterm Evaluation Deadline', note: null },
  { date: new Date('2026-08-17T00:00:00Z'), label: 'Final Submissions Begin', note: 'Submit your final work product and evaluation.' },
  { date: new Date('2026-08-24T18:00:00Z'), label: 'Final Submission Deadline (Standard)', note: 'Standard 12-week projects: submit final work product and evaluation.' },
  { date: new Date('2026-08-31T18:00:00Z'), label: 'Mentor Final Evaluations Due (Standard)', note: null },
  { date: new Date('2026-11-02T18:00:00Z'), label: 'Extended Timeline Final Deadline', note: 'Last date for all contributors on extended timelines to submit final work.' },
  { date: new Date('2026-11-09T18:00:00Z'), label: 'Extended Mentor Evaluations Due', note: 'Final date for mentors to submit evaluations for extended projects.' },
].filter(m => !isNaN(m.date.getTime()));

function renderTimeline() {
  const container = document.getElementById('timeline-milestones');
  if (!container || MILESTONES.length === 0) return;

  try {
    const now = new Date();
    if (isNaN(now.getTime())) return;

    let activeIdx = MILESTONES.findIndex(m => m.date > now);
    if (activeIdx === -1) activeIdx = MILESTONES.length - 1;

    const allPast = MILESTONES[MILESTONES.length - 1].date <= now;

    container.innerHTML = MILESTONES.map((m, i) => {
      const isActive = i === activeIdx;
      const isLast = i === MILESTONES.length - 1;
      const connector = !isLast ? `<div class="w-0.5 h-10 bg-zinc-200 dark:bg-zinc-700"></div>` : '';
      let dateStr;
      try {
        dateStr = m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
      } catch (err) {
        console.warn('[Timeline] Date formatting failed for:', m.date, err);
        dateStr = m.date.toISOString().slice(0, 10);
      }

      if (isActive && !allPast) {
        return `<div class="flex gap-3 sm:gap-4">
          <div class="flex flex-col items-center"><div class="w-3 h-3 rounded-full bg-primary ring-4 ring-orange-100 dark:ring-orange-950/40 pulse-dot"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-primary">${escapeHtml(dateStr)}</p>
          <p class="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">${escapeHtml(m.label)}</p>
          ${m.note ? `<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">${escapeHtml(m.note)}</p>` : ''}</div>
        </div>`;
      } else if (isActive && allPast) {
        return `<div class="flex gap-3 sm:gap-4">
          <div class="flex flex-col items-center"><div class="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 dark:ring-green-950/40"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-green-600">${escapeHtml(dateStr)}</p>
          <p class="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight">${escapeHtml(m.label)}</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">✓ Completed</p></div>
        </div>`;
      } else {
        return `<div class="flex gap-3 sm:gap-4 opacity-40">
          <div class="flex flex-col items-center"><div class="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>${connector}</div>
          <div><p class="text-[10px] font-bold text-zinc-400">${escapeHtml(dateStr)}</p>
          <p class="text-sm font-bold text-zinc-500 dark:text-zinc-400">${escapeHtml(m.label)}</p></div>
        </div>`;
      }
    }).join('');
  } catch (err) {
    console.warn('[Timeline] renderTimeline failed:', err);
  }
}

function updateCountdown() {
  const countdownEl = document.getElementById('countdown');
  const labelEl = document.getElementById('countdown-label');
  if (!countdownEl || !labelEl || MILESTONES.length === 0) return;

  try {
    const now = new Date();
    if (isNaN(now.getTime())) return;

    const next = MILESTONES.find(m => m.date > now);

    if (!next) {
      labelEl.textContent = 'GSoC 2026 selection complete';
      countdownEl.textContent = '🎉 All done!';
      countdownEl.classList.remove('text-primary');
      countdownEl.classList.add('text-green-600');
      return;
    }

    labelEl.textContent = `Until: ${next.label}`;
    countdownEl.classList.remove('text-green-600');
    countdownEl.classList.add('text-primary');
    const diff = next.date - now;
    if (diff <= 0) { renderTimeline(); updateCountdown(); return; }
    const d = Math.floor(diff / 864e5), h = Math.floor((diff % 864e5) / 36e5), m = Math.floor((diff % 36e5) / 6e4);
    countdownEl.textContent = `${d}d ${h}h ${m}m`;
  } catch (err) {
    console.warn('[Timeline] updateCountdown failed:', err);
  }
}

// ══════════════════════════════════════════════
// ANALYTICS ENGINE
// ══════════════════════════════════════════════
const AN = {
  g(k, d) { try { return JSON.parse(localStorage.getItem('gaf_' + k)) ?? d; } catch { return d; } },
  s(k, v) {
    try {
      localStorage.setItem('gaf_' + k, JSON.stringify(v));
    } catch (err) {
      console.warn('Analytics storage write failed for key:', k, err);
    }
  },
  inc(k) { this.s(k, (this.g(k, 0) + 1)); },
  push(k, v, max = 20) { const a = this.g(k, []); a.unshift(v); this.s(k, a.slice(0, max)); },
  today() { return new Date().toISOString().slice(0, 10); },
  trackVisit() {
    this.inc('total');
    const td = this.today(), daily = this.g('daily', {});
    daily[td] = (daily[td] || 0) + 1; this.s('daily', daily);
    if (!sessionStorage.getItem('gaf_s')) sessionStorage.setItem('gaf_s', Date.now());
  },
  trackSearch(t) { if (t.length > 1) { this.inc('searches'); this.push('sterms', t.toLowerCase().trim()); } },
  trackCat(c) { if (c) { this.inc('filters'); const cf = this.g('cats', {}); cf[c] = (cf[c] || 0) + 1; this.s('cats', cf); } },
  trackOrg(n) { this.inc('views'); const oc = this.g('orgs', {}); oc[n] = (oc[n] || 0) + 1; this.s('orgs', oc); },
  todayVisits() { return this.g('daily', {})[this.today()] || 0; },
  sessionTime() {
    const s = sessionStorage.getItem('gaf_s'); if (!s) return '—';
    const sec = Math.floor((Date.now() - parseInt(s)) / 1000);
    return sec < 60 ? sec + 's' : Math.floor(sec / 60) + 'm' + (sec % 60) + 's';
  },
  topCats() { return Object.entries(this.g('cats', {})).sort((a, b) => b[1] - a[1]).slice(0, 6); },
  topOrgs() { return Object.entries(this.g('orgs', {})).sort((a, b) => b[1] - a[1]).slice(0, 5); },
  topTerms() { const f = {}; this.g('sterms', []).forEach(t => { f[t] = (f[t] || 0) + 1; }); return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, 12); }
};
AN.trackVisit();

function renderTrending() {
  const top = AN.topOrgs();
  const sec = document.getElementById('trendingSection');
  const scroll = document.getElementById('trendingScroll');
  if (!top.length || !sec || !scroll) { if (sec) sec.style.display = 'none'; return; }
  sec.style.display = 'block';
  scroll.innerHTML = top.map(([name, views], i) => {
    const o = ORGS.find(x => x.name === name);
    if (!o) return '';
    return safeHTML`<div class="trend-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700" data-org-name="${o.name}">
      <div class="trend-rank">${String(i + 1)}</div>
      <div class="trend-info">
        <div class="trend-name">${name}</div>
        <div class="trend-views">${String(views)} view${views !== 1 ? 's' : ''} · ${getCategoryMeta(o.cat).label}</div>
      </div>
    </div>`;
  }).join('');
}

globalThis.openAnalytics = function () {
  const aTot = document.getElementById('aTot');
  if (!aTot) return;
  aTot.textContent = AN.g('total', 0).toLocaleString();
  document.getElementById('aToday').textContent = AN.todayVisits();
  document.getElementById('aSearches').textContent = AN.g('searches', 0);
  document.getElementById('aViews').textContent = AN.g('views', 0);
  document.getElementById('aFilters').textContent = AN.g('filters', 0);
  document.getElementById('aTime').textContent = AN.sessionTime();
  const tc = AN.topCats(), mx = tc[0]?.[1] || 1;
  document.getElementById('catChart').innerHTML = tc.length
    ? tc.map(([c, n]) => `<div class="bar-row"><span class="bar-lbl">${escapeHtml(getCategoryMeta(c).label)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n / mx * 100)}%"></div></div><span class="bar-val">${escapeHtml(String(n))}</span></div>`).join('')
    : '<span style="color:var(--muted);font-size:12px">Use category filters to track data</span>';
  const to = AN.topOrgs(), mo = to[0]?.[1] || 1;
  document.getElementById('orgChart').innerHTML = to.length
    ? to.map(([o, n]) => `<div class="bar-row"><span class="bar-lbl" style="font-size:10px">${escapeHtml(o.length > 16 ? o.slice(0, 16) + '…' : o)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(n / mo * 100)}%"></div></div><span class="bar-val">${escapeHtml(String(n))}</span></div>`).join('')
    : '<span style="color:var(--muted);font-size:12px">Click org cards to track views</span>';
  const tt = AN.topTerms();
  document.getElementById('srchTerms').innerHTML = tt.length
    ? tt.map(([t, c], i) => `<span class="sch ${i < 3 ? 'hot' : ''}">${escapeHtml(t)} (${escapeHtml(String(c))})</span>`).join('')
    : '<span style="color:var(--muted);font-size:12px">No searches yet</span>';
  openModalElement('anBg');
};
globalThis.closeAnEvent = function (e) { if (e.target === document.getElementById('anBg')) closeModalElement('anBg'); };

// ══════════════════════════════════════════════
// URL VALIDATION & SANITIZATION HELPERS
// ══════════════════════════════════════════════
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Centralized DOM-Safe Dynamic Rendering
class SafeHTMLString extends String {
  constructor(value) {
    super(value);
  }
}
SafeHTMLString.prototype.__isSafeHTML = true;

function safeHTML(strings, ...values) {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const val = values[i];
      if (val && val.__isSafeHTML) {
        result += val.toString();
      } else if (Array.isArray(val)) {
        result += val.map(v => (v && v.__isSafeHTML) ? v.toString() : escapeHtml(v)).join('');
      } else {
        result += escapeHtml(val !== undefined && val !== null ? String(val) : '');
      }
    }
  }
  return new SafeHTMLString(result);
}

function rawHTML(value) {
  return new SafeHTMLString(value || '');
}

globalThis.safeHTML = safeHTML;
globalThis.rawHTML = rawHTML;

function sanitizeHrefUrl(url) {
  if (!url || !String(url).trim()) return null;
  try {
    const u = new URL(String(url).trim());
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch (err) {
    console.debug('Invalid URL or disallowed protocol in sanitizeHrefUrl:', url, err);
  }
  return null;
}

// ══════════════════════════════════════════════
// URL VALIDATION & SANITIZATION
// ══════════════════════════════════════════════
/**
 * Generic URL validator — ensures only http/https protocols are allowed.
 * Does NOT auto-prepend a protocol. The caller must pass a fully-formed URL.
 *
 * @param {string} url - A fully-formed URL string to validate
 * @returns {string|null} - The trimmed URL if valid, null otherwise
 */
function validateUrl(url) {
  if (!url || !url.trim()) return null;
  try {
    const trimmed = url.trim();
    const urlObj = new URL(trimmed);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return trimmed;
    }
    console.warn('Rejected non-HTTP(S) URL:', url);
    return null;
  } catch (e) {
    console.warn('Invalid URL format:', url, e);
    return null;
  }
}

/**
 * Validates and sanitizes project ideas URLs for safe display.
 * Automatically prepends https:// if no protocol is specified.
 * Delegates to validateUrl() for the actual protocol check.
 *
 * @param {string} ideasUrl - The raw URL string from organization data
 * @returns {string|null} - Sanitized URL if valid, null otherwise
 */
function validateIdeasUrl(ideasUrl) {
  if (!ideasUrl || !ideasUrl.trim()) return null;
  let url = ideasUrl.trim();
  if (!url.includes('://')) {
    url = 'https://' + url;
  }
  return validateUrl(url);
}

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.other;
}

// ══════════════════════════════════════════════
// GITHUB API CLIENT
// ══════════════════════════════════════════════
const API = '/api/github';
const ghCache = (() => {
  try {
    return JSON.parse(localStorage.getItem('gaf_ghc') || '{}');
  } catch {
    return {};
  }
})();

function saveCache(key, value) {
  try {
    localStorage.setItem('gaf_ghc', JSON.stringify(ghCache));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.warn('LocalStorage quota exceeded, clearing GitHub cache...');
      for (const k in ghCache) delete ghCache[k];
      if (key && value !== undefined) ghCache[key] = value;
      try {
        localStorage.setItem('gaf_ghc', JSON.stringify(ghCache));
      } catch (err) {
        console.error('Failed to save even after clearing cache', err);
      }
    }
  }
}

function cleanCache() {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  let changed = false;
  for (const key in ghCache) {
    const entry = ghCache[key];
    if (!entry || typeof entry.ts !== 'number' || Number.isNaN(entry.ts) || now - entry.ts > ONE_DAY) {
      delete ghCache[key];
      changed = true;
    }
  }
  if (changed) saveCache();
}
cleanCache();

async function checkAPI() {
  try {
    const r = await fetch(`${API}?repo=django/django`);
    const banner = document.getElementById('apiBanner');
    if (!banner) return;
    if (r.ok) {
      banner.className = 'api-banner api-ok';
      document.getElementById('apiStrong').textContent = '✓ GitHub API Connected';
      document.getElementById('apiText').textContent = 'Live stats (stars, forks, good first issues) available for all visitors.';
      const fetchBtn = document.getElementById('fetchBtn');
      if (fetchBtn) fetchBtn.style.display = 'flex';
    } else {
      banner.className = 'api-banner api-warn';
      document.getElementById('apiStrong').textContent = '⚠ API Error';
      document.getElementById('apiText').textContent = 'Add GITHUB_TOKEN in Vercel dashboard and redeploy.';
    }
  } catch {
    const banner = document.getElementById('apiBanner');
    if (banner) {
      document.getElementById('apiStrong').textContent = '○ Running Locally';
      document.getElementById('apiText').textContent = 'Deploy to Vercel for live GitHub stats.';
    }
  }
}

async function fetchGH(repo) {
  if (!repo) return null;
  if (ghCache[repo] && Date.now() - ghCache[repo].ts < 3600000) return ghCache[repo];
  try {
    const r = await fetch(`${API}?repo=${encodeURIComponent(repo)}`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.error) return null;
    d.ts = Date.now();
    ghCache[repo] = d;
    saveCache(repo, d);
    return d;
  } catch { return null; }
}

async function fetchGFI(repo) {
  if (!repo) return null;
  const cacheKey = repo + '__gfi';
  const hit = ghCache[cacheKey];
  if (hit && Date.now() - hit.ts < 3600000 && hit.count !== null && hit.count !== undefined) return hit.count;
  try {
    const r = await fetch(`${API}?repo=${encodeURIComponent(repo)}&gfi=1`);
    if (!r.ok) return null;
    const d = await r.json();
    if (d.gfi === null || d.gfi === undefined) return null;
    ghCache[cacheKey] = { count: d.gfi, ts: Date.now() };
    saveCache(cacheKey, ghCache[cacheKey]);
    return d.gfi;
  } catch { return null; }
}

// ══════════════════════════════════════════════
// MODAL & KEYBOARD CONTROLLER (ACCESSIBILITY HARDENED)
// ══════════════════════════════════════════════
let activeTriggerElement = null;

function openModalElement(modalId, triggerElement = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  activeTriggerElement = triggerElement || document.activeElement;

  if (modalId === 'mobileMenu') {
    modal.classList.remove('hidden');
    const panel = document.getElementById('menuPanel');
    if (panel) setTimeout(() => { panel.style.transform = 'translateX(0)'; }, 10);
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close menu');
    }
  } else {
    modal.classList.add('open');
  }

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';

  // Set focus to close button
  const closeBtn = modal.querySelector('.close-btn, [onclick*="close"]');
  if (closeBtn) closeBtn.focus();

  modal.addEventListener('keydown', trapFocus);
}

function closeModalElement(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  if (modalId === 'mobileMenu') {
    const panel = document.getElementById('menuPanel');
    if (panel) panel.style.transform = 'translateX(-100%)';
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
  } else {
    modal.classList.remove('open');
  }

  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  modal.removeEventListener('keydown', trapFocus);

  if (activeTriggerElement) {
    activeTriggerElement.focus();
    activeTriggerElement = null;
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = e.currentTarget;
  const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    if (menu.classList.contains('hidden')) {
      openModalElement('mobileMenu');
    } else {
      closeModalElement('mobileMenu');
    }
  }
}
globalThis.toggleMenu = toggleMenu;

function setActiveMenu(clickedLink) {
  const allLinks = document.querySelectorAll('.mobile-menu-link');
  allLinks.forEach(link => {
    link.classList.remove('text-orange-600', 'bg-orange-50', 'font-bold');
    link.classList.add('text-zinc-700', 'hover:bg-zinc-100', 'font-medium');
  });

  clickedLink.classList.remove('text-zinc-700', 'hover:bg-zinc-100', 'font-medium');
  clickedLink.classList.add('text-orange-600', 'bg-orange-50', 'font-bold');

  setTimeout(() => {
    closeModalElement('mobileMenu');
  }, 300);
}
globalThis.setActiveMenu = setActiveMenu;

// Keyboard grid card selection navigation
const GRID_COLS = () => {
  const g = document.getElementById('orgGrid');
  if (!g || !g.children.length) return 3;
  const firstRect = g.children[0].getBoundingClientRect();
  let cols = 1;
  for (let i = 1; i < g.children.length; i++) {
    if (Math.abs(g.children[i].getBoundingClientRect().top - firstRect.top) < 5) cols++;
    else break;
  }
  return cols;
};

function scrollToFocused() {
  setTimeout(() => {
    const g = document.getElementById('orgGrid');
    const card = g?.querySelector(`[data-filtered-idx="${focusedIdx}"]`);
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, 30);
}

function updateCardFocus() {
  const cards = document.querySelectorAll('#orgGrid article');
  cards.forEach((card, idx) => {
    const isFocused = idx === focusedIdx;
    card.classList.toggle('ring-2', isFocused);
    card.classList.toggle('ring-primary', isFocused);
  });
}

// Global keydown helper functions to manage Cognitive Complexity
function handleEscapeKey(e) {
  const activeModal = document.querySelector('.modal-bg.open, #mobileMenu:not(.hidden), .modal-bg.compare-bg.open');
  if (activeModal) {
    e.preventDefault();
    closeModalElement(activeModal.id);
    return true;
  }
  return false;
}

function handleNavigationRight(e, n) {
  e.preventDefault();
  focusedIdx = Math.min(focusedIdx + 1, n - 1);
  if (focusedIdx < 0) focusedIdx = 0;
  if (focusedIdx >= visibleCount) {
    visibleCount = Math.min(visibleCount + 12, n);
    renderOrgs(false);
  }
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationLeft(e) {
  e.preventDefault();
  focusedIdx = Math.max(focusedIdx - 1, 0);
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationDown(e, n) {
  e.preventDefault();
  const cols = GRID_COLS();
  focusedIdx = Math.min(focusedIdx + cols, n - 1);
  if (focusedIdx < 0) focusedIdx = 0;
  if (focusedIdx >= visibleCount) {
    visibleCount = Math.min(visibleCount + 12, n);
    renderOrgs(false);
  }
  scrollToFocused();
  updateCardFocus();
}

function handleNavigationUp(e) {
  e.preventDefault();
  const cols = GRID_COLS();
  focusedIdx = Math.max(focusedIdx - cols, 0);
  scrollToFocused();
  updateCardFocus();
}

function handleGlobalKeydown(e) {
  if (e.key === 'Escape' && handleEscapeKey(e)) return;

  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

  const n = filteredOrgs.length;
  if (e.key === '?') {
    e.preventDefault();
    openModalElement('helpModal');
    return;
  }
  if (e.key === '/') {
    e.preventDefault();
    document.getElementById('searchInput')?.focus();
    return;
  }

  if (n <= 0) return;

  switch (e.key) {
    case 'ArrowRight':
      handleNavigationRight(e, n);
      break;
    case 'ArrowLeft':
      handleNavigationLeft(e);
      break;
    case 'ArrowDown':
      handleNavigationDown(e, n);
      break;
    case 'ArrowUp':
      handleNavigationUp(e);
      break;
    case 'Enter':
      if (focusedIdx >= 0 && focusedIdx < n) {
        e.preventDefault();
        openModal(filteredOrgs[focusedIdx].name);
      }
      break;
    case 'c':
    case 'C':
      if (focusedIdx >= 0 && focusedIdx < n) {
        e.preventDefault();
        toggleCompare(null, filteredOrgs[focusedIdx].name);
      }
      break;
  }
}

// Global keydown short-router
document.addEventListener('keydown', handleGlobalKeydown);

// ══════════════════════════════════════════════
// BOOKMARK SYSTEM (WATCHLIST)
// ══════════════════════════════════════════════
function parseStoredBookmarks() {
  try {
    const parsed = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function syncBookmark(name, shouldAdd) {
  if (!name) return;
  if (shouldAdd) bookmarkedSet.add(name);
  else bookmarkedSet.delete(name);
  localStorage.setItem('bookmarks', JSON.stringify([...bookmarkedSet]));

  refreshOrgGridAfterBookmarkChange();
  renderWatchlist();
  updateAIInsights();
}

globalThis.toggleBookmark = function (e, name) {
  if (e) e.stopPropagation();
  if (!name) return;
  syncBookmark(name, !bookmarkedSet.has(name));
};

function refreshVisibleBookmarkButtons() {
  document.querySelectorAll('#orgGrid .bookmark-btn[data-bookmark-org]').forEach(btn => {
    const name = btn.dataset.bookmarkOrg;
    const isBookmarked = bookmarkedSet.has(name);
    btn.classList.toggle('active', isBookmarked);
    btn.classList.toggle('text-zinc-300', !isBookmarked);
    btn.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
    btn.setAttribute('aria-label', isBookmarked ? `Remove bookmark from ${name}` : `Add bookmark to ${name}`);
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.toggle('icon-fill', isBookmarked);
  });
}

function refreshOrgGridAfterBookmarkChange() {
  if (activeChip === 'bookmarked') {
    applyFiltersPreservingVisibleCount();
    return;
  }
  refreshVisibleBookmarkButtons();
}

function applyFiltersPreservingVisibleCount() {
  const savedCount = visibleCount;
  applyFilters();
  while (visibleCount < savedCount && visibleCount < filteredOrgs.length) {
    visibleCount += 12;
    renderOrgs(false);
  }
}

function clearAllBookmarks() {
  if (!bookmarkedSet.size) return;
  if (!confirm(`Remove all ${bookmarkedSet.size} bookmarked organization(s)? This cannot be undone.`)) return;
  bookmarkedSet.clear();
  localStorage.setItem('bookmarks', JSON.stringify([]));
  applyFilters();
  renderWatchlist();
  updateAIInsights();
}
document.getElementById('clearAllBookmarksBtn')?.addEventListener('click', clearAllBookmarks);

function renderWatchlist() {
  const container = document.getElementById('watchlistContainer');
  const clearBtn = document.getElementById('clearAllBookmarksBtn');
  if (!container) return;

  container.innerHTML = '';
  const bookmarks = [...bookmarkedSet]
    .map(name => ORGS.find(o => o.name === name))
    .filter(Boolean);

  if (clearBtn) clearBtn.classList.toggle('hidden', bookmarks.length === 0);

  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
        <span class="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600 mb-4 block">bookmark_border</span>
        <p class="font-bold text-zinc-500 mb-1">Your Watchlist is Empty</p>
        <p class="text-sm text-zinc-400">Click the ★ on any organization card to start tracking it here.</p>
      </div>`;
    return;
  }

  bookmarks.forEach(org => {
    const githubOwner = githubOwnerFromValue(org.github);
    const logoUrl = githubOwner ? `https://github.com/${githubOwner}.png?size=80` : '';
    const category = getCategoryMeta(org.cat);

    const topTags = (org.tags || []).slice(0, 4)
      .map(t => safeHTML`<span class="px-2 py-0.5 bg-surface-container-low dark:bg-zinc-800 text-[10px] font-mono rounded text-zinc-600 dark:text-zinc-400">${t}</span>`);

    const item = document.createElement('div');
    item.className = 'bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-800 flex gap-4 items-start hover:shadow-lg hover:border-primary/20 transition-all animate-fade-up';
    item.dataset.watchlistOrg = org.name;

    const logoHtml = logoUrl
      ? safeHTML`<img src="${logoUrl}" data-org-name="${org.name}" alt="${org.name} logo" class="w-full h-full object-contain">`
      : safeHTML`<span class="material-symbols-outlined text-primary text-xl">corporate_fare</span>`;

    item.innerHTML = safeHTML`
      <div class="w-12 h-12 rounded-xl bg-surface-container-low dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-100 dark:border-zinc-700">
        ${logoHtml}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
          <h4 class="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">${org.name}</h4>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="text-[10px] font-label font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${category.className}">${category.label}</span>
            <span class="text-[10px] font-label font-bold uppercase tracking-wider text-white bg-primary px-2 py-0.5 rounded-full">★ Saved</span>
          </div>
        </div>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-1">${org.desc || ''}</p>
        <div class="flex flex-wrap gap-1.5 mb-3">${topTags}</div>
        <div class="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div class="flex items-center gap-3 text-xs text-zinc-400">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">calendar_today</span>
              ${String(org.years)}y in GSoC
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">bar_chart</span>
              ${org.competition || '—'}
            </span>
          </div>
          <button data-bookmark-org="${org.name}"
                  class="bookmark-remove-btn text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-xs">bookmark_remove</span>
            Remove
          </button>
        </div>
      </div>`;

    container.appendChild(item);
    attachOrgCardListeners(item);
  });
}

// ══════════════════════════════════════════════
// COMPARE SYSTEM
// ══════════════════════════════════════════════
globalThis.toggleCompare = function (e, name) {
  if (e) e.stopPropagation();
  if (!name) return;
  const idx = compareList.indexOf(name);
  if (idx > -1) {
    compareList.splice(idx, 1);
  } else {
    if (compareList.length >= 3) {
      alert("You can only compare up to 3 organizations at a time.");
      return;
    }
    compareList.push(name);
  }
  renderOrgs(true);
  renderCompare();
};

function renderCompare() {
  const container = document.querySelector('#compare .grid');
  if (!container) return;
  if (typeof document.createElement !== 'function') return;
  container.innerHTML = '';

  compareList.forEach(name => {
    const org = ORGS.find(o => o.name === name);
    if (!org) return;
    const githubOwner = githubOwnerFromValue(org.github);
    const logoUrl = githubOwner ? `https://github.com/${githubOwner}.png?size=80` : '';

    const item = document.createElement('div');
    item.className = 'bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800';
    item.innerHTML = safeHTML`
      <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center mx-auto mb-3 overflow-hidden">
        <img src="${logoUrl}" data-org-name="${org.name}" class="w-full h-full object-contain" />
      </div>
      <p class="font-bold text-sm truncate">${org.name}</p>
      <p class="text-[10px] text-zinc-500 dark:text-zinc-400 font-label uppercase mt-1">${String(org.years)}y · ${org.competition}</p>
      <button data-compare-org="${org.name}" class="text-[9px] text-red-500 font-bold uppercase mt-2 hover:underline">Remove</button>
    `;
    container.appendChild(item);
    attachOrgCardListeners(item);
  });

  // Empty slots helper
  for (let i = compareList.length; i < 3; i++) {
    const empty = document.createElement('div');
    empty.className = 'bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center opacity-50';
    empty.innerHTML = `
      <div class="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3"><span class="material-symbols-outlined text-zinc-400">add</span></div>
      <p class="font-bold text-sm text-zinc-400">Add org</p>
      <p class="text-[10px] text-zinc-400 font-label uppercase mt-1">Slot ${i + 1}</p>
    `;
    container.appendChild(empty);
  }
}

function renderCompareModal() {
  const body = document.getElementById('compareModalBody');
  if (!body) return;

  const selectedOrgs = compareList.map(name => ORGS.find(o => o.name === name)).filter(Boolean);
  if (selectedOrgs.length < 2) {
    body.innerHTML = `
      <div class="py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
        <span class="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-600 mb-3">compare_arrows</span>
        <p class="font-bold text-zinc-700 dark:text-zinc-300">Select at least 2 organizations to compare.</p>
        <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Use the Compare button on organization cards, then open this tool again.</p>
      </div>`;
    return;
  }

  const rows = [
    ['Category', org => getCategoryMeta(org.cat).label],
    ['GSoC Years', org => org.years],
    ['First Year', org => org.firstYear],
    ['Competition', org => org.competition],
    ['Codebase', org => org.codebase],
    ['Tech Stack', org => org.tags.join(', ')],
    ['Best Fit', org => org.fit.join(', ')],
    ['Repository', org => org.github || '—'],
  ];

  body.innerHTML = `
    <table class="w-full min-w-[720px] text-sm">
      <thead>
        <tr class="border-b border-zinc-200 dark:border-zinc-700">
          <th class="text-left py-3 px-4 text-xs uppercase tracking-widest text-zinc-400">Metric</th>
          ${selectedOrgs.map(org => `<th class="text-left py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">${escapeHtml(org.name)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, getValue]) => `
          <tr class="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <td class="py-3 px-4 font-bold text-zinc-500">${label}</td>
            ${selectedOrgs.map(org => `<td class="py-3 px-4 text-zinc-700 dark:text-zinc-300">${escapeHtml(String(getValue(org)))}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

globalThis.openCompareModal = function () {
  renderCompare();
  renderCompareModal();
  openModalElement('compareModal');
};

function closeCompareModal() {
  closeModalElement('compareModal');
}
globalThis.closeCompareModal = closeCompareModal;

// ══════════════════════════════════════════════
// FILTER & CARD DIRECTORY RENDERING
// ══════════════════════════════════════════════
function orgMatchesLanguages(org, selectedLanguages) {
  if (!selectedLanguages.size) return true;
  const orgTags = new Set((org.tags || []).map(t => t.trim().toLowerCase()));

  if (globalThis.matchAllLanguages) {
    return [...selectedLanguages].every(label => {
      const aliases = (LANGUAGE_MAP[label] || [label]).map(a => a.trim().toLowerCase());
      return aliases.some(alias => orgTags.has(alias));
    });
  } else {
    return [...selectedLanguages].some(label => {
      const aliases = (LANGUAGE_MAP[label] || [label]).map(a => a.trim().toLowerCase());
      return aliases.some(alias => orgTags.has(alias));
    });
  }
}

function matchesFilters(o, cat, compF, search) {
  const orgName = o.name.toLowerCase();
  if (cat && o.cat !== cat) return false;
  if (compF && compF !== 'all' && o.codebase !== compF) return false;
  if (search && !orgName.includes(search)) return false;
  if (selectedLanguages.size > 0 && !orgMatchesLanguages(o, selectedLanguages)) return false;

  if (activeChip) {
    if (activeChip === 'bookmarked' && !bookmarkedSet.has(o.name)) return false;
    if (activeChip === 'veterans' && o.years < 10) return false;
    if (activeChip === 'newcomers' && o.years > 3) return false;
    if (activeChip === 'low-competition' && o.competition !== 'chill') return false;
    if (activeChip === 'high-competition' && o.competition !== 'hot') return false;
    if (activeChip === 'active' && (!o._gh || o._gh.activity !== 'active')) return false;
  }

  return true;
}

function searchComparator(a, b, search, sort) {
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  if (nameA === search && nameB !== search) return -1;
  if (nameB === search && nameA !== search) return 1;
  if (nameA.startsWith(search) && !nameB.startsWith(search)) return -1;
  if (nameB.startsWith(search) && !nameA.startsWith(search)) return 1;
  return applySecondarySort(a, b, sort);
}

function applyFilters() {
  const search = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const categoryValue = document.getElementById('categoryFilter')?.value || 'all';
  const cat = categoryValue === 'all' ? '' : categoryValue;
  const compF = document.getElementById('complexityFilter')?.value || 'all';
  const sort = document.getElementById('sortSelect')?.value || 'alpha';

  filteredOrgs = ORGS.filter(o => matchesFilters(o, cat, compF, search));

  // Smart sorting: Exact match first, startsWith second, alphabetic/secondary sort third
  if (search) {
    filteredOrgs.sort((a, b) => searchComparator(a, b, search, sort));
  } else {
    filteredOrgs.sort((a, b) => applySecondarySort(a, b, sort));
  }

  renderOrgs(true);

  // Sync state to URL
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (cat) params.set('cat', cat);
  if (compF && compF !== 'all') params.set('comp', compF);
  if (sort && sort !== 'alpha') params.set('sort', sort);
  if (selectedLanguages.size) params.set('lang', [...selectedLanguages].join(','));
  if (activeChip) params.set('chip', activeChip);
  if (typeof history !== 'undefined' && typeof history.replaceState === 'function' && typeof location !== 'undefined') {
    history.replaceState(null, '', params.toString() ? '?' + params.toString() : location.pathname);
  }
}

function applySecondarySort(a, b, sortType) {
  if (sortType === 'years-desc') return b.years - a.years;
  if (sortType === 'years-asc') return a.years - b.years;
  if (sortType === 'comp-low') return ['chill', 'moderate', 'hot'].indexOf(a.competition) - ['chill', 'moderate', 'hot'].indexOf(b.competition);
  if (sortType === 'stars') return (b._gh?.stars || 0) - (a._gh?.stars || 0);
  if (sortType === 'gfi') return (b._gh?.gfi || 0) - (a._gh?.gfi || 0);
  return a.name.localeCompare(b.name);
}

function renderOrgs(reset = true) {
  const grid = document.getElementById('orgGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  if (reset) {
    grid.innerHTML = '';
    visibleCount = 12;
  }

  if (filteredOrgs.length === 0) {
    grid.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    document.getElementById('orgCount').textContent = '0';
    document.getElementById('loadMoreContainer').style.display = 'none';
    return;
  } else {
    grid.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
  }

  const slice = filteredOrgs.slice(visibleCount - 12, visibleCount);
  slice.forEach((org, i) => {
    const isBookmarked = bookmarkedSet.has(org.name);
    const isComparing = compareList.includes(org.name);
    const isFocused = focusedIdx === (visibleCount - 12 + i);
    const card = document.createElement('article');
    card.className = `group bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 transition-all hover:shadow-xl hover:border-primary/20 animate-fade-up ${isComparing ? 'ring-2 ring-primary/30' : ''} ${isFocused ? 'ring-2 ring-primary' : ''}`;
    card.dataset.org = org.name;
    card.setAttribute('role', 'article');
    card.setAttribute('aria-label', `Organization: ${org.name}`);
    card.setAttribute('tabindex', '0');

    const githubOwner = githubOwnerFromValue(org.github);
    const logoUrl = githubOwner ? `https://github.com/${githubOwner}.png?size=80` : '';

    const logoHtml = logoUrl
      ? safeHTML`<img src="${logoUrl}" data-org-name="${org.name}" alt="${org.name} logo" class="w-full h-full object-contain rounded-lg" />`
      : safeHTML`<div class="logo-placeholder flex w-full h-full items-center justify-center text-primary font-bold text-xl bg-primary/5">${(org.name || '?')[0].toUpperCase()}</div>`;

    const tagsHtml = org.tags.slice(0, 3).map(t => safeHTML`<span class="px-2 py-0.5 bg-surface-container-low dark:bg-zinc-800 text-[10px] font-mono rounded text-zinc-600 dark:text-zinc-400">${t}</span>`);
    const moreTagsHtml = org.tags.length > 3 ? safeHTML`<span class="px-2 py-0.5 bg-surface-container-low dark:bg-zinc-800 text-[10px] font-mono rounded text-zinc-600 dark:text-zinc-400 cursor-help" title="${org.tags.slice(3).join(', ')}">+${String(org.tags.length - 3)}</span>` : '';

    const catLabel = getCategoryMeta(org.cat).label.toUpperCase();
    const isBookmarkedStr = isBookmarked ? 'true' : 'false';

    card.innerHTML = safeHTML`
      <div class="flex justify-between items-start mb-4">
        <div class="w-14 h-14 rounded-xl bg-surface-container-low dark:bg-zinc-800 flex items-center justify-center p-2 overflow-hidden border border-zinc-100 dark:border-zinc-700">
          ${logoHtml}
        </div>
        <div class="flex items-center gap-2">
          <span class="bg-primary/10 text-primary text-[10px] font-label uppercase tracking-widest px-2 py-1 rounded-full font-bold">${String(org.years)}y Veteran</span>
          <span class="complexity-badge ${org.codebase}">${org.codebase}</span>
          <button class="bookmark-btn ${isBookmarked ? 'active text-orange-500' : 'text-zinc-300'}" data-bookmark-org="${org.name}" title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}" aria-pressed="${isBookmarkedStr}" aria-label="${isBookmarked ? 'Remove bookmark from ' : 'Add bookmark to '}${org.name}">
            <span class="material-symbols-outlined text-lg ${isBookmarked ? 'icon-fill' : ''}">star</span>
          </button>
        </div>
      </div>
      <h3 class="font-headline text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors dark:text-zinc-100">${org.name}</h3>
      <span class="category-tag inline-block mb-3">${catLabel}</span>
      <p class="text-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-2 dark:text-zinc-400">${org.desc}</p>
      <div class="flex flex-wrap gap-1.5 mb-4">
        ${tagsHtml}
        ${moreTagsHtml}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button data-compare-org="${org.name}" class="text-[10px] font-bold uppercase tracking-widest ${isComparing ? 'text-primary' : 'text-zinc-400'} hover:text-primary flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">${isComparing ? 'check_circle' : 'compare_arrows'}</span> ${isComparing ? 'Comparing' : 'Compare'}
        </button>
        <button data-open-org="${org.name}" class="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">View Details <span class="material-symbols-outlined text-sm">arrow_forward</span></button>
      </div>`;

    grid.appendChild(card);
    attachOrgCardListeners(card);
  });

  document.getElementById('orgCount').textContent = filteredOrgs.length;
  document.getElementById('loadMoreContainer').style.display = (visibleCount < filteredOrgs.length) ? 'flex' : 'none';
}

function attachOrgCardListeners(root) {
  // Image error fallbacks
  root.querySelectorAll('img[data-org-name]').forEach(img => {
    if (img.__attached) return;
    img.addEventListener('error', (e) => {
      handleImgError(e.target, e.target.dataset.orgName);
    });
    img.__attached = true;
  });

  // Bookmark toggling
  root.querySelectorAll('[data-bookmark-org]').forEach(btn => {
    if (btn.__attached) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.bookmarkOrg;
      toggleBookmark(e, name);
    });
    btn.__attached = true;
  });

  // Compare toggling
  root.querySelectorAll('[data-compare-org]').forEach(btn => {
    if (btn.__attached) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.compareOrg;
      toggleCompare(e, name);
    });
    btn.__attached = true;
  });

  // Modal activation click
  root.querySelectorAll('[data-open-org]').forEach(btn => {
    if (btn.__attached) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(btn.dataset.openOrg, btn);
    });
    btn.__attached = true;
  });

  if (root.classList?.contains('org-card') || root.classList?.contains('trend-card')) {
    root.addEventListener('click', () => {
      const name = root.dataset.org || root.querySelector('.trend-name')?.textContent;
      if (name) openModal(name, root);
    });
  }
}

function handleImgError(img, orgName) {
  if (img.dataset.triedClearbit) {
    img.style.display = 'none';
    const placeholder = img.parentElement.querySelector('.logo-placeholder');
    if (placeholder) {
      placeholder.style.display = 'flex';
      placeholder.textContent = orgName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
  } else {
    img.dataset.triedClearbit = 'true';
    const domain = orgName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.org';
    img.src = `https://logo.clearbit.com/${domain}`;
  }
}

// Global capturing image error event listener to replace inline onerror attributes
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('error', (event) => {
    if (event.target && event.target.tagName === 'IMG') {
      const img = event.target;
      const orgName = img.dataset.orgName;
      if (orgName) {
        const isRec = img.classList.contains('rec-logo') || img.closest('#aiResultsContainer');
        if (isRec && typeof globalThis.handleRecImgError === 'function') {
          globalThis.handleRecImgError(img, orgName);
        } else {
          handleImgError(img, orgName);
        }
      } else if (img.classList.contains('issue-logo')) {
        img.style.display = 'none';
      }
    }
  }, true);
}

globalThis.clearAllFilters = function () {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) heroSearch.value = '';

  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) categoryFilter.value = 'all';
  const complexityFilter = document.getElementById('complexityFilter');
  if (complexityFilter) complexityFilter.value = 'all';
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'alpha';

  // Reset chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('bg-orange-600', 'text-white');
    chip.classList.add('bg-surface-container-highest');
  });

  activeChip = null;
  selectedLanguages.clear();
  document.querySelectorAll('.pill.active').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-pressed', 'false');
  });

  renderSelectedLanguages();
  applyFilters();
};

// ══════════════════════════════════════════════
// LIVE GITHUB STATS - API INTEGRATED FLOW
// ══════════════════════════════════════════════
function updateModalGHStats(org, d, gfi) {
  org._gh = d;
  const mStars = document.getElementById('mStars');
  const mForks = document.getElementById('mForks');
  const mIssues = document.getElementById('mIssues');
  const mActivity = document.getElementById('mActivity');

  if (mStars) mStars.textContent = fmt(d.stars);
  if (mForks) mForks.textContent = fmt(d.forks);
  if (mIssues) mIssues.textContent = fmt(d.issues);
  if (mActivity) {
    const act = d.activity || 'moderate';
    mActivity.textContent = act.charAt(0).toUpperCase() + act.slice(1);
    mActivity.className = act === 'active' || act === 'high' || act === 'hot' ? 'gh-stat-item text-green-500' : 'gh-stat-item text-blue-400';
  }

  if (gfi !== null) {
    org._gh.gfi = gfi;
    const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
    placeholders.forEach(p => p.textContent = fmt(gfi));
  }
}

globalThis.fetchModalGH = async function () {
  const header = document.querySelector('#orgModal #orgModalTitle');
  if (!header) return;
  const orgName = header.textContent;
  const org = ORGS.find(o => o.name === orgName);
  if (!org || !org.github) return;

  const btn = document.getElementById('mFetchBtn');
  btn.textContent = 'Fetching Stats...';
  btn.disabled = true;

  // Clear caches for force refresh
  const cacheKey = org.github;
  delete ghCache[cacheKey];
  delete ghCache[cacheKey + '__gfi'];

  try {
    const d = await fetchGH(org.github);
    if (d) {
      const gfi = await fetchGFI(org.github);
      updateModalGHStats(org, d, gfi);

      btn.textContent = 'Stats Updated!';
      try {
        applyFilters();
        renderCompareModal();
      } catch (renderErr) {
        console.warn('Live stats updated, but UI refresh failed:', renderErr);
      }
    } else {
      btn.textContent = 'Failed to Fetch';
    }
  } catch (e) {
    btn.textContent = 'Error';
  } finally {
    setTimeout(() => {
      btn.textContent = 'Fetch Live Stats';
      btn.disabled = false;
    }, 3000);
  }
};

function fmt(n) { return (!n && n !== 0) ? '—' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n); }

// ══════════════════════════════════════════════
// MODAL DETAILS POPULATOR
// ══════════════════════════════════════════════

function renderModalHeader(org) {
  const isBookmarked = bookmarkedSet.has(org.name);
  const isComparing = compareList.includes(org.name);
  const ideasLinkHTML = (() => {
    const u = sanitizeHrefUrl(org.ideas);
    return u ? `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer" class="mentor-link-chip"><span>💡</span><span>Visit ideas page</span></a>` : '';
  })();

  return `
    <span class="category-tag">${escapeHtml(String(org.cat).toUpperCase())}</span>
      <div class="flex items-start justify-between pr-10 gap-4">
        <div>
          <h2>${escapeHtml(org.name)}</h2>
          <p class="text-zinc-500">GSoC Partner for ${escapeHtml(String(org.years))} Years</p>
          ${ideasLinkHTML}
        </div>
        <div class="flex flex-col items-end gap-2">
          <button id="modalCompareBtn" data-compare-org="${escapeHtml(org.name)}" class="text-[10px] font-bold uppercase tracking-widest ${isComparing ? 'text-primary' : 'text-orange-400'} hover:text-primary flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">${isComparing ? 'check_circle' : 'compare_arrows'}</span> ${isComparing ? 'Comparing' : 'Add to compare'}
          </button>
          <button
            id="modalBookmarkBtn"
            class="bookmark-btn ${isBookmarked ? 'active' : 'text-orange-300'} flex-shrink-0"
            data-bookmark-org="${escapeHtml(org.name)}"
            aria-label="${isBookmarked ? 'Remove bookmark' : 'Add to Watchlist'}"
            title="${isBookmarked ? 'Remove bookmark' : 'Add to Watchlist'}"
          >
            <span class="material-symbols-outlined text-2xl ${isBookmarked ? 'icon-fill' : ''}">
              star
            </span>
          </button>
        </div>
      </div>
      `;
}
globalThis.renderModalHeader = renderModalHeader;
globalThis.openModal = function (name, triggerElement = null) {
  const org = ORGS.find(o => o.name === name);
  if (!org) return;

  AN.trackOrg(org.name);
  addRecentlyViewed(org.name);

  const mHeader = document.getElementById('mHeader');
  if (mHeader) {
    mHeader.innerHTML = renderModalHeader(org);
  }

  const mDesc = document.getElementById('mDesc');
  if (mDesc) mDesc.textContent = org.desc;

  const cc = { hot: 'var(--red)', moderate: '#92600A', chill: 'var(--green)' };
  const mMetrics = document.getElementById('mMetrics');
  if (mMetrics) {
    const yearsColor = org.years >= 8 ? '#C2410C' : org.years >= 4 ? 'var(--blue)' : 'var(--purple)';
    const competitionColor = cc[org.competition] || '#ccc';
    const competitionIcon = org.competition === 'hot' ? '🔥' : org.competition === 'moderate' ? '🟡' : '😎';
    mMetrics.innerHTML = safeHTML`
      <div class="metric-card"><p class="metric-value" style="color:${yearsColor}">${String(org.years)}</p><p class="metric-label">Years In</p></div>
      <div class="metric-card"><p class="metric-value" style="color:${competitionColor}">${competitionIcon}</p><p class="metric-label">Competition</p></div>
      <div class="metric-card"><p class="metric-value font-mono text-sm" style="color:var(--orange)">${String(org.firstYear)}</p><p class="metric-label">First Year</p></div>
      <div class="metric-card"><p class="metric-value font-mono text-sm" style="color:var(--green)" id="mGfiPlaceholder">—</p><p class="metric-label">Good 1st Issues</p></div>
    `;
  }

  const gh = org._gh;
  const mStars = document.getElementById('mStars');
  const mForks = document.getElementById('mForks');
  const mIssues = document.getElementById('mIssues');
  const mActivity = document.getElementById('mActivity');

  if (mStars) mStars.textContent = gh ? fmt(gh.stars) : '—';
  if (mForks) mForks.textContent = gh ? fmt(gh.forks) : '—';
  if (mIssues) mIssues.textContent = gh ? fmt(gh.issues) : '—';
  if (mActivity) {
    const act = gh ? (gh.activity || 'moderate') : 'moderate';
    mActivity.textContent = act.charAt(0).toUpperCase() + act.slice(1);
    mActivity.className = act === 'active' || act === 'high' || act === 'hot' ? 'gh-stat-item text-green-500' : 'gh-stat-item text-blue-400';
  }

  if (gh && gh.gfi !== undefined) {
    const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
    placeholders.forEach(p => p.textContent = fmt(gh.gfi));
  }

  const mFetchBtn = document.getElementById('mFetchBtn');
  if (mFetchBtn) mFetchBtn.textContent = gh ? '↻ Refresh' : 'Fetch Live Stats';

  const mTech = document.getElementById('mTech');
  if (mTech) mTech.innerHTML = org.tags.map(t => safeHTML`<span class="tech-tag">${t}</span>`).join('');

  const mFit = document.getElementById('mFit');
  if (mFit) mFit.innerHTML = org.fit.map(f => safeHTML`<span class="fit-tag">${f}</span>`).join('');

  // Timeline list
  let timelineHtml = '';
  for (let y = 2020; y <= 2026; y++) {
    const active = (y >= org.firstYear);
    timelineHtml += `<span class="${y === 2026 ? 'current-year' : ''} ${active ? 'opacity-100' : 'opacity-30'}">${y}</span>`;
  }
  const mTimeline = document.getElementById('mTimeline');
  if (mTimeline) mTimeline.innerHTML = timelineHtml;

  // Sanitize href links
  const ideasUrl = validateIdeasUrl(org.ideas);
  const repoHref = githubUrlFromValue(org.github);

  const ideasBtn = document.getElementById('mIdeasBtn');
  const repoBtn = document.getElementById('mRepoBtn');

  if (ideasBtn) {
    if (ideasUrl) {
      ideasBtn.href = ideasUrl;
      ideasBtn.style.display = 'inline-flex';
    } else {
      ideasBtn.removeAttribute('href');
      ideasBtn.style.display = 'none';
    }
  }

  if (repoBtn) {
    if (repoHref) {
      repoBtn.href = repoHref;
      repoBtn.style.display = 'inline-flex';
    } else {
      repoBtn.removeAttribute('href');
      repoBtn.style.display = 'none';
    }
  }

  // Copy Ideas Button
  const oldCopy = document.getElementById('mIdeasCopyBtn');
  if (oldCopy) oldCopy.remove();
  if (org.ideas && ideasBtn) {
    const copyBtn = document.createElement('button');
    copyBtn.id = 'mIdeasCopyBtn';
    copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span> Copy Link';
    copyBtn.className = 'modal-cta modal-repo-link flex items-center justify-center gap-2';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(org.ideas).then(() => {
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">check_circle</span> Copied!';
        copyBtn.style.background = '#dcfce7';
        copyBtn.style.color = '#166534';
        setTimeout(() => {
          copyBtn.innerHTML = '<span class="material-symbols-outlined text-lg">content_copy</span> Copy Link';
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2000);
      });
    });
    ideasBtn.after(copyBtn);
  }

  renderMentorContactSection(org);
  openModalElement('orgModal', triggerElement);

  // Lazily retrieve GFIs if missing
  if (org.github && (org._gh?.gfi === null || org._gh?.gfi === undefined)) {
    const placeholder = document.getElementById('mGfiPlaceholder');
    if (placeholder) placeholder.textContent = '…';
    fetchGFI(org.github).then(gfi => {
      if (gfi !== null) {
        if (!org._gh) org._gh = {};
        org._gh.gfi = gfi;
        const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
        placeholders.forEach(p => p.textContent = fmt(gfi));
        renderOrgs(false);
        renderCompareModal();
      } else {
        const placeholders = document.querySelectorAll('.metric-card #mGfiPlaceholder');
        placeholders.forEach(p => p.textContent = '—');
      }
    });
  }
};

function closeModal() {
  closeModalElement('orgModal');
}
globalThis.closeModal = closeModal;

function closeHelpModal() {
  closeModalElement('helpModal');
}
globalThis.closeHelpModal = closeHelpModal;

globalThis.openRandomOrg = function () {
  const orgsToUse = filteredOrgs.length > 0 ? filteredOrgs : ORGS;
  if (!orgsToUse.length) {
    alert('No organizations match your filters — try clearing some!');
    return;
  }
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  const randomIdx = array[0] % orgsToUse.length;
  openModal(orgsToUse[randomIdx].name);
};

// ══════════════════════════════════════════════
// RECENTLY VIEWED UTILITIES
// ══════════════════════════════════════════════
function addRecentlyViewed(name) {
  if (!name) return;
  try {
    recentlyViewed = recentlyViewed.filter(n => n !== name);
    recentlyViewed.unshift(name);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  } catch (e) {
    console.warn('Failed to add to recently viewed:', e);
  }
}

function removeRecentlyViewed(name) {
  try {
    recentlyViewed = recentlyViewed.filter(n => n !== name);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  } catch (e) {
    console.warn('Failed to remove from recently viewed:', e);
  }
}

function clearRecentlyViewed() {
  try {
    recentlyViewed = [];
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recentlyViewed));
    renderRecentlyViewed();
  } catch (e) {
    console.warn('Failed to clear recently viewed:', e);
  }
}

function renderRecentlyViewed() {
  const section = document.getElementById('recentlyViewedSection');
  const container = document.getElementById('recentlyViewedContainer');
  const overflowBadge = document.getElementById('recentlyViewedOverflowBadge');
  if (!section || !container) return;

  if (recentlyViewed.length === 0) {
    section.classList.add('hidden');
    if (overflowBadge) overflowBadge.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  container.innerHTML = '';

  const overflowCount = Math.max(recentlyViewed.length - RECENTLY_VIEWED_LIMIT, 0);
  if (overflowBadge) {
    overflowBadge.textContent = overflowCount > 0 ? `+${overflowCount}` : '';
    overflowBadge.classList.toggle('hidden', overflowCount === 0);
  }

  recentlyViewed.slice(0, RECENTLY_VIEWED_LIMIT).forEach(name => {
    const org = ORGS.find(o => o.name === name);
    if (!org) return;
    const category = getCategoryMeta(org.cat);

    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-100 dark:border-zinc-800 hover:border-primary transition-colors cursor-pointer flex items-center justify-between';
    card.innerHTML = safeHTML`
      <div class="flex-1 min-w-0">
        <h4 class="font-bold text-sm mb-1 dark:text-zinc-100">${org.name}</h4>
        <div class="flex items-center gap-2 flex-wrap">
          <span class="${category.className} rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">${category.label}</span>
          <span class="text-[10px] text-zinc-500 dark:text-zinc-400">${String(org.years)} years</span>
        </div>
      </div>
      <div class="flex items-center gap-2 ml-2 flex-shrink-0">
        <button class="text-zinc-400 hover:text-red-500 transition-colors" data-remove-recent="${name}" title="Remove from recently viewed" aria-label="Remove ${name} from recently viewed">
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>`;

    card.addEventListener('click', () => openModal(org.name, card));

    const removeBtn = card.querySelector('[data-remove-recent]');
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecentlyViewed(removeBtn.dataset.removeRecent);
    });

    container.appendChild(card);
  });
}
document.getElementById('clearRecentlyViewedBtn')?.addEventListener('click', clearRecentlyViewed);

// ══════════════════════════════════════════════
// LANGUAGE PILLS SYSTEM
// ══════════════════════════════════════════════
globalThis.togglePill = function (el) {
  const lang = el.dataset.lang;
  const isActive = el.classList.toggle('active');
  el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  if (isActive) selectedLanguages.add(lang);
  else selectedLanguages.delete(lang);
  renderSelectedLanguages();
  applyFilters();
};

globalThis.unselectLanguage = function (lang) {
  selectedLanguages.delete(lang);
  const pillBtn = document.querySelector(`.pill[data-lang="${lang}"]`);
  if (pillBtn) {
    pillBtn.classList.remove('active');
    pillBtn.setAttribute('aria-pressed', 'false');
  }
  renderSelectedLanguages();
  applyFilters();
};

globalThis.clearAllLanguages = function () {
  selectedLanguages.clear();
  document.querySelectorAll('.pill.active').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-pressed', 'false');
  });
  renderSelectedLanguages();
  applyFilters();
};

function renderSelectedLanguages() {
  const container = document.getElementById('selectedLangsStrip');
  if (!container) return;

  if (selectedLanguages.size === 0) {
    container.innerHTML = '<span class="empty-state">No languages selected</span>';
    return;
  }

  const badges = [...selectedLanguages].map(lang => {
    return safeHTML`<span class="selected-lang-badge" data-lang="${lang}">
      ${lang}
      <button class="unselect-lang-btn" aria-label="Remove ${lang}">×</button>
    </span>`;
  }).join('');

  const clearAll = safeHTML`<button class="clear-all-langs-btn">Clear all</button>`;
  container.innerHTML = badges + clearAll;
}

// ══════════════════════════════════════════════
// DYNAMIC GOOD FIRST ISSUES (INDEX PAGE GRID)
// ══════════════════════════════════════════════
async function renderGoodFirstIssues() {
  try {
    const res = await fetch('/data/issues.json?v=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const container = document.querySelector('#issues .grid');
    if (!container) return;
    const issues = Array.isArray(data.issues) ? data.issues : [];
    const lastUpdatedEl = document.getElementById('issuesLastUpdated');
    if (lastUpdatedEl) {
      if (data.updated_at) {
        const mins = Math.max(1, Math.floor((Date.now() - new Date(data.updated_at).getTime()) / 60000));
        const relative = mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} hours ago`;
        lastUpdatedEl.textContent = `Last updated: ${relative}`;
      } else {
        lastUpdatedEl.textContent = 'Last updated: unavailable';
      }
    }

    if (!issues.length) {
      renderFallbackOrgSearchCards(container);
      return;
    }

    container.innerHTML = '';
    issues.slice(0, 6).forEach(issue => {
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group cursor-pointer';

      const safeUrl = sanitizeHrefUrl(issue.url);
      if (safeUrl) card.addEventListener?.('click', () => globalThis.open(safeUrl, '_blank'));

      const labelsHtml = (issue.labels || []).slice(0, 2)
        .map(l => safeHTML`<span class="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">${l}</span>`);
      card.innerHTML = safeHTML`
        <div class="flex items-start justify-between mb-3">
          <h4 class="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 dark:text-zinc-100">${issue.title || ''}</h4>
          <span class="material-symbols-outlined text-zinc-300 group-hover:text-primary text-lg">open_in_new</span>
        </div>
        <p class="text-xs text-zinc-500 mb-3 font-mono">${issue.repo || ''}</p>
        <div class="flex flex-wrap gap-1.5">
          ${labelsHtml}
          <span class="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">${String(issue.comments || 0)} comments</span>
        </div>`;
      container.appendChild(card);
    });
  } catch (e) {
    console.error("GFI render failed:", e);
    const container = document.querySelector('#issues .grid');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full bg-white rounded-xl p-8 border border-zinc-100 text-center">
          <p class="text-sm font-bold text-zinc-900 mb-2">Unable to load pre-fetched issues</p>
          <p class="text-sm text-zinc-600 max-w-xl mx-auto">Cached issue data could not be retrieved at this time. Please refresh the page or try again later.</p>
        </div>`;
    }
  }
}

function renderFallbackOrgSearchCards(container) {
  if (typeof document.createElement !== 'function') return;
  const orgsWithGithub = ORGS.filter(o => typeof o.github === 'string' && o.github.trim());
  container.innerHTML = '';

  const notice = document.createElement('p');
  notice.className = 'col-span-full text-sm text-zinc-500';
  notice.textContent = 'Live pre-fetched issues are still syncing. Browse open Good First Issues for all organizations below.';
  container.appendChild(notice);

  orgsWithGithub.forEach(org => {
    const card = document.createElement('a');
    card.href = `https://github.com/issues?q=${encodeURIComponent(`repo:${org.github} is:issue is:open label:"good first issue"`)}`;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800 hover:shadow-lg transition-all group cursor-pointer block';
    card.innerHTML = safeHTML`
      <div class="flex items-start justify-between mb-3">
        <h4 class="font-bold text-sm group-hover:text-primary transition-colors line-clamp-1 dark:text-zinc-100">Browse open Good First Issues</h4>
        <span class="material-symbols-outlined text-zinc-300 group-hover:text-primary text-lg">open_in_new</span>
      </div>
      <p class="text-xs text-zinc-500 mb-3 font-mono">${org.github}</p>
      <div class="flex flex-wrap gap-1.5">
        <span class="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold">${org.name}</span>
        <span class="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">Label: good first issue</span>
      </div>`;
    container.appendChild(card);
  });
}

// ══════════════════════════════════════════════
// AI WATCHLIST INSIGHTS GENERATOR
// ══════════════════════════════════════════════
function updateAIInsights() {
  const el = document.getElementById('aiInsightText');
  if (!el) return;

  const bookmarks = [...bookmarkedSet]
    .map(name => ORGS.find(o => o.name === name))
    .filter(Boolean);

  if (bookmarks.length === 0) {
    el.textContent = 'Star organizations to get personalized contribution advice.';
    return;
  }

  // 1. Category frequency
  const catCount = {};
  bookmarks.forEach(o => { catCount[o.cat] = (catCount[o.cat] || 0) + 1; });
  const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

  // 2. Tag frequency (top 3)
  const tagCount = {};
  bookmarks.flatMap(o => o.tags || []).forEach(t => {
    const key = t.toLowerCase().trim();
    tagCount[key] = (tagCount[key] || 0) + 1;
  });
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => t);

  // 3. Competition blend
  const compCount = { hot: 0, moderate: 0, chill: 0 };
  bookmarks.forEach(o => { if (compCount[o.competition] !== undefined) compCount[o.competition]++; });
  const highComp = compCount.hot >= bookmarks.length * 0.5;
  const lowComp = compCount.chill >= bookmarks.length * 0.5;

  // Domain-specific tool recommendations
  const DOMAIN_ADVICE = {
    ai: { tools: 'PyTorch, TensorFlow, Hugging Face, or scikit-learn', action: 'contribute to model training pipelines or evaluation utilities' },
    data: { tools: 'Pandas, Apache Spark, DuckDB, or dbt', action: 'look for data pipeline, ETL, or visualisation issues' },
    science: { tools: 'NumPy, SciPy, Astropy, or ROOT', action: 'explore numerical computation or simulation-related tickets' },
    security: { tools: 'Metasploit, Wireshark, OpenSSL, or OWASP tooling', action: 'hunt for documentation or testing improvements in security repos' },
    infra: { tools: 'Kubernetes, Terraform, Prometheus, or Ansible', action: 'target CI/CD configuration, observability, or deployment issues' },
    web: { tools: 'React, Vue, Svelte, or Node.js ecosystem libraries', action: 'focus on accessibility fixes, UI components, or API improvements' },
    programming: { tools: 'LLVM, GCC, rustc, or language toolchain packages', action: 'dive into compiler warnings, test coverage, or RFC implementations' },
    os: { tools: 'Linux kernel toolchain, QEMU, or POSIX libraries', action: 'start with documentation, porting, or driver-level good-first issues' },
    dev: { tools: 'LSP plugins, tree-sitter grammars, or CLI tooling', action: 'pick up linter rules, editor extensions, or test-suite tasks' },
    media: { tools: 'FFmpeg, GStreamer, VLC plugin SDK, or libav', action: 'explore codec, subtitle, or format compatibility tickets' },
    other: { tools: 'the project\'s primary language ecosystem', action: 'read the CONTRIBUTING guide and tackle labelled good-first issues' },
  };
  const advice = DOMAIN_ADVICE[topCat] || DOMAIN_ADVICE.other;

  const strategyMsg = highComp
    ? '⚠️ Your watchlist skews towards <strong>high-competition</strong> orgs — consider adding a few <em>Chill</em> orgs to diversify your odds.'
    : lowComp
      ? '✅ Smart move — your watchlist is weighted towards <strong>lower-competition</strong> orgs, which improves acceptance probability.'
      : '📊 Your watchlist has a <strong>balanced mix</strong> of competition levels — a solid hedging strategy.';

  const stackLine = topTags.length
    ? `Your saved orgs centre on <strong>${topTags.map(t => escapeHtml(t)).join(', ')}</strong>.`
    : 'Your saved orgs span a diverse set of technologies.';

  el.innerHTML = `
    <div class="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <p>
        <span class="font-bold">📌 Stack Focus:</span>
        ${stackLine}
        Highlight experience with <strong>${escapeHtml(advice.tools)}</strong> in your proposals.
      </p>
      <p>
        <span class="font-bold">🎯 Domain Strategy (${escapeHtml(getCategoryMeta(topCat).label)}):</span>
        Before submitting, ${escapeHtml(advice.action)} to demonstrate early commitment to mentors.
      </p>
      <p>${strategyMsg}</p>
      <p class="text-orange-600 dark:text-orange-400 text-[10px] font-label uppercase tracking-widest pt-1 border-t border-zinc-200 dark:border-zinc-800">
        Based on ${bookmarks.length} saved org${bookmarks.length !== 1 ? 's' : ''} · Automated insight
      </p>
    </div>`;
}

// ══════════════════════════════════════════════
// DYNAMIC GOOD FIRST ISSUES PAGE OVERLAY
// ══════════════════════════════════════════════
let allIssues = [];
let filteredIssues = [];
let shownIssues = 0;
const ISSUES_PAGE_SIZE = 40;
let issuesFetching = false;

globalThis.openIssuesPage = function () {
  openModalElement('issuesPage');
  loadCachedIssues();
};

globalThis.closeIssuesPage = function () {
  closeModalElement('issuesPage');
};

globalThis.fetchAllIssues = async function () {
  if (issuesFetching) return;
  issuesFetching = true;
  const btn = document.getElementById('fetchIssuesBtn');
  const spin = document.getElementById('fetchIssuesSpin');
  const txt = document.getElementById('fetchIssuesTxt');
  btn.disabled = true; spin.style.display = 'inline-block';

  allIssues = [];
  const orgsWithGithub = ORGS.filter(o => o.github);
  let done = 0;
  let found = 0;

  document.getElementById('issuesContainer').innerHTML = `
    <div class="fetch-progress">
      <div style="font-size:14px;font-weight:600;color:var(--ink)">Fetching Good First Issues…</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px" id="fpStatus">Checking 0 / ${orgsWithGithub.length} orgs</div>
      <div class="fp-bar-wrap"><div class="fp-bar" id="fpBar" style="width:0%"></div></div>
      <div style="font-size:11px;color:var(--green);margin-top:8px;font-weight:600" id="fpFound">0 issues found so far</div>
    </div>`;

  const BATCH = 5;
  for (let i = 0; i < orgsWithGithub.length; i += BATCH) {
    const batch = orgsWithGithub.slice(i, i + BATCH);
    await Promise.all(batch.map(async o => {
      try {
        const r = await fetch(`${API}?repo=${encodeURIComponent(o.github)}&gfi=1&issues=1`);
        if (!r.ok) return;
        const data = await r.json();
        if (data.items?.length) {
          const owner = githubOwnerFromValue(o.github);
          const logo = owner ? `https://github.com/${owner}.png?size=64` : '';
          data.items.forEach(issue => {
            const labelNames = (issue.labels || []).map(l => typeof l === 'string' ? l : (l.name || ''));
            allIssues.push({
              title: issue.title,
              url: issue.html_url,
              org: o.name,
              orgCat: o.cat,
              orgTags: o.tags,
              logo,
              repo: o.github,
              created_at: issue.created_at,
              labels: labelNames,
              comments: issue.comments || 0,
            });
          });
          found += data.items.length;
        }
        const gfiCount = data.total ?? data.gfi;
        if (gfiCount !== null && gfiCount !== undefined) {
          if (!o._gh) o._gh = {};
          o._gh.gfi = gfiCount;
        }
      } catch (err) {
        console.warn('Failed fetching GFI issues for org:', o.github, err);
      }
      done++;
    }));

    const pct = Math.round(done / orgsWithGithub.length * 100);
    const fpStatus = document.getElementById('fpStatus');
    const fpBar = document.getElementById('fpBar');
    const fpFound = document.getElementById('fpFound');
    if (fpStatus) fpStatus.textContent = `Checking ${done} / ${orgsWithGithub.length} orgs`;
    if (fpBar) fpBar.style.width = pct + '%';
    if (fpFound) fpFound.textContent = `${found} issues found so far`;
    txt.textContent = `${done}/${orgsWithGithub.length}…`;
    await new Promise(r => setTimeout(r, 60));
  }

  allIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  issuesFetching = false;
  btn.disabled = false; spin.style.display = 'none'; txt.textContent = '↻ Refresh';

  filterIssues();
  renderOrgs(true);
  updateStats();
};

async function loadCachedIssues() {
  if (allIssues.length || issuesFetching) return;
  try {
    const res = await fetch('/data/issues.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.issues)) return;

    const orgByGithub = new Map(ORGS.map(o => [o.github?.toLowerCase(), o]));
    const orgByName = new Map(ORGS.map(o => [o.name?.toLowerCase(), o]));

    allIssues = data.issues.map(issue => {
      const key = issue.github?.toLowerCase() || issue.repo?.toLowerCase() || issue.org?.toLowerCase();
      const orgMeta = orgByGithub.get(key) || orgByName.get(issue.org?.toLowerCase());
      const owner = githubOwnerFromValue(issue.github || issue.repo);
      return {
        title: issue.title || '',
        url: issue.url || '',
        org: issue.org || '',
        orgCat: orgMeta?.cat || '',
        orgTags: orgMeta?.tags || [],
        logo: owner ? `https://github.com/${owner}.png?size=64` : '',
        repo: issue.repo || issue.github || '',
        created_at: issue.created_at || '',
        labels: Array.isArray(issue.labels) ? issue.labels.map(l => typeof l === 'string' ? l : (l.name || '')) : [],
        comments: typeof issue.comments === 'number' ? issue.comments : Number(issue.comments || 0),
      };
    });

    allIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    filterIssues();
  } catch (err) {
    console.warn('Failed to load cached issues:', err);
  }
}

function filterIssues() {
  const search = (document.getElementById('issueSearch')?.value || '').toLowerCase().trim();
  const cat = document.getElementById('issueCatFilter')?.value || '';
  const lang = document.getElementById('issueLangFilter')?.value || '';

  filteredIssues = allIssues.filter(iss => {
    if (cat && iss.orgCat !== cat) return false;
    if (lang && !iss.orgTags.some(t => t.includes(lang))) return false;
    if (search && !iss.title.toLowerCase().includes(search) && !iss.org.toLowerCase().includes(search)) return false;
    return true;
  });

  shownIssues = 0;
  renderIssues();
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 864e5);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return d + 'd ago';
  if (d < 365) return Math.floor(d / 30) + 'mo ago';
  return Math.floor(d / 365) + 'y ago';
}

function renderIssues() {
  const container = document.getElementById('issuesContainer');
  const statsDiv = document.getElementById('issuesStats');
  const loadMore = document.getElementById('loadMoreWrap');
  if (!container || !statsDiv || !loadMore) return;

  if (!allIssues.length) {
    container.innerHTML = `<div class="issue-empty"><div class="ei">🟢</div><h3>Ready to find your first issue?</h3><p>Click "Load Issues" to fetch Good First Issues from all GSoC orgs.</p></div>`;
    statsDiv.style.display = 'none'; loadMore.style.display = 'none'; return;
  }

  if (!filteredIssues.length) {
    container.innerHTML = `<div class="issue-empty"><div class="ei">🔍</div><h3>No issues match your filters</h3><p>Try adjusting the search or category.</p></div>`;
    statsDiv.style.display = 'flex'; loadMore.style.display = 'none';
  } else {
    shownIssues = Math.min(shownIssues + ISSUES_PAGE_SIZE, filteredIssues.length);
    const visible = filteredIssues.slice(0, shownIssues);
    container.innerHTML = `<div class="issues-grid grid grid-cols-1 md:grid-cols-2 gap-4">${visible.map(renderIssueCard).join('')}</div>`;
    loadMore.style.display = shownIssues < filteredIssues.length ? 'flex' : 'none';
  }

  const orgsWithIssues = new Set(allIssues.map(i => i.org)).size;
  document.getElementById('issTotal').textContent = allIssues.length.toLocaleString();
  document.getElementById('issOrgs').textContent = String(orgsWithIssues);
  document.getElementById('issShown').textContent = String(Math.min(shownIssues, filteredIssues.length));
  statsDiv.style.display = 'flex';
}

function renderIssueCard(iss) {
  const langTags = iss.orgTags.slice(0, 2).map(t => safeHTML`<span class="issue-label lang">${t}</span>`);
  const gfiNames = ['good first issue', 'good-first-issue'];
  const otherLabels = iss.labels.filter(l => !gfiNames.includes(String(l).toLowerCase())).slice(0, 2)
    .map(l => safeHTML`<span class="issue-label" style="background:rgba(107,33,168,.06);color:var(--purple);border:1px solid rgba(107,33,168,.2)">${l}</span>`);

  const safeHref = sanitizeHrefUrl(iss.url);
  const imgSrc = sanitizeHrefUrl(iss.logo);

  const imgHtml = imgSrc
    ? safeHTML`<img class="issue-logo w-10 h-10 object-contain rounded-lg border border-zinc-100" src="${imgSrc}" alt="${iss.org}" loading="lazy">`
    : '';

  const commentsHtml = iss.comments > 0
    ? safeHTML`<span style="font-size:10px;color:var(--muted)">💬 ${String(iss.comments)}</span>`
    : '';

  const timeStr = relativeTime(iss.created_at);

  if (safeHref) {
    return safeHTML`<a class="issue-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex p-4 gap-4 rounded-xl hover:shadow" href="${safeHref}" target="_blank" rel="noopener noreferrer">
      ${imgHtml}
      <div class="issue-body flex-1 min-w-0">
        <div class="issue-top flex justify-between items-center gap-2 mb-1.5">
          <span class="issue-org font-bold text-xs text-primary truncate">${iss.org}</span>
          <span class="issue-label gfi bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">✓ Good First Issue</span>
          ${commentsHtml}
        </div>
        <div class="issue-title font-bold text-sm text-zinc-950 dark:text-zinc-100 mb-2 truncate">${iss.title}</div>
        <div class="issue-meta flex flex-wrap items-center gap-1.5">
          ${langTags}
          ${otherLabels}
          <span class="issue-date text-[10px] text-zinc-400 font-label ml-auto">${timeStr}</span>
        </div>
      </div>
    </a>`.toString();
  } else {
    return safeHTML`<div class="issue-card bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex p-4 gap-4 rounded-xl">
      ${imgHtml}
      <div class="issue-body flex-1 min-w-0">
        <div class="issue-top flex justify-between items-center gap-2 mb-1.5">
          <span class="issue-org font-bold text-xs text-primary truncate">${iss.org}</span>
          <span class="issue-label gfi bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">✓ Good First Issue</span>
          ${commentsHtml}
        </div>
        <div class="issue-title font-bold text-sm text-zinc-950 dark:text-zinc-100 mb-2 truncate">${iss.title}</div>
        <div class="issue-meta flex flex-wrap items-center gap-1.5">
          ${langTags}
          ${otherLabels}
          <span class="issue-date text-[10px] text-zinc-400 font-label ml-auto">${timeStr}</span>
        </div>
      </div>
    </div>`.toString();
  }
}

globalThis.showMoreIssues = function () {
  const container = document.getElementById('issuesContainer');
  const next = filteredIssues.slice(shownIssues, shownIssues + ISSUES_PAGE_SIZE);
  shownIssues += next.length;
  container.querySelector('.issues-grid').insertAdjacentHTML('beforeend', next.map(renderIssueCard).join(''));
  document.getElementById('loadMoreWrap').style.display = shownIssues < filteredIssues.length ? 'flex' : 'none';
  document.getElementById('issShown').textContent = String(shownIssues);
};

// ══════════════════════════════════════════════
// STATS COUNTERS
// ══════════════════════════════════════════════
function updateStats() {
  document.getElementById('totalStat').textContent = String(ORGS.length);
  document.getElementById('veteranStat').textContent = String(ORGS.filter(o => o.years >= 8).length);
  document.getElementById('newcomerStat').textContent = String(ORGS.filter(o => o.years <= 3).length);
  document.getElementById('visitorStat').textContent = String(AN.todayVisits());
}

// ══════════════════════════════════════════════
// UTILITIES FOR CARD ATTRIBUTES MAPPING
// ══════════════════════════════════════════════
function trimGitHubPathSlashes(path) {
  let start = 0;
  let end = path.length;
  while (start < end && path[start] === '/') start += 1;
  while (end > start && path[end - 1] === '/') end -= 1;
  return path.slice(start, end);
}

function githubPathFromValue(value) {
  const github = String(value || '').trim();
  if (!github) return '';
  try {
    const url = new URL(github);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return '';
    return trimGitHubPathSlashes(url.pathname);
  } catch {
    return trimGitHubPathSlashes(github);
  }
}

function githubOwnerFromValue(value) {
  return githubPathFromValue(value).split('/')[0] || '';
}

function githubUrlFromValue(value) {
  const path = githubPathFromValue(value);
  return path ? `https://github.com/${path}` : '';
}

function orgLogoOwner(o) {
  return githubOwnerFromValue(o.github);
}

function orgLogo(o) {
  const owner = orgLogoOwner(o);
  if (!owner) return '';
  return `https://github.com/${owner}.png?size=64`;
}

function repoUrl(o) {
  if (!o.github) return '';
  const owner = githubOwnerFromValue(o.github);
  const path = githubPathFromValue(o.github);
  if (UMBRELLA_ORGS.has(o.name) || !path.includes('/')) return owner ? `https://github.com/${owner}` : '';
  return githubUrlFromValue(o.github);
}

function repoLinkLabel(o) {
  if (!o.github) return '';
  const owner = githubOwnerFromValue(o.github);
  const path = githubPathFromValue(o.github);
  if (UMBRELLA_ORGS.has(o.name) || !path.includes('/')) return owner + ' (org)';
  return path;
}

globalThis.orgLogo = orgLogo;
globalThis.repoUrl = repoUrl;
globalThis.repoLinkLabel = repoLinkLabel;

// ══════════════════════════════════════════════
// MENTORS FINDER RENDERERS
// ══════════════════════════════════════════════
async function loadMentorData() {
  if (mentorDataState !== 'idle') return;
  mentorDataState = 'loading';
  try {
    const res = await fetch('/data/mentors.json?v=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    MENTOR_DATA = data.mentors || {};
    mentorDataState = 'loaded';
    renderMentorFinder();
  } catch (err) {
    console.warn('Failed to load mentors.json:', err);
    mentorDataState = 'error';
    const container = document.getElementById('mentorsContainer');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-8 text-center">
          <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">Mentor search unavailable</p>
          <p class="text-sm text-zinc-600 dark:text-zinc-400">Failed to fetch mentor listings. Please try again later.</p>
        </div>`;
    }
  }
}

function renderMentorFinder() {
  const container = document.getElementById('mentorsContainer');
  if (!container || mentorDataState !== 'loaded') return;

  const search = (document.getElementById('mentorSearchInput')?.value || '').toLowerCase().trim();
  const channel = document.getElementById('mentorChannelFilter')?.value || '';

  const matched = [];
  Object.entries(MENTOR_DATA).forEach(([orgName, mentors]) => {
    if (!Array.isArray(mentors)) return;
    mentors.forEach(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search) ||
        orgName.toLowerCase().includes(search) ||
        (m.channels || []).some(c => String(c.value).toLowerCase().includes(search));

      const matchChannel = !channel ||
        (m.channels || []).some(c => c.type === channel);

      if (matchSearch && matchChannel) {
        matched.push({ orgName, ...m });
      }
    });
  });

  container.innerHTML = '';

  if (matched.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <span class="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700 mb-4 block">person_search</span>
        <p class="font-bold text-zinc-500 mb-1">No Mentors Match Your Query</p>
        <p class="text-sm text-zinc-400">Try adjusting your keyword filter or changing communication channels.</p>
      </div>`;
    return;
  }

  matched.slice(0, 30).forEach(m => {
    const card = document.createElement('div');
    card.className = 'mentor-card p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all animate-fade-up';

    const channelsHtml = (m.channels || []).map(c => {
      const icon = CHANNEL_ICONS[c.type] || '💬';
      const isUrl = sanitizeHrefUrl(c.value);
      if (isUrl) {
        return safeHTML`<a href="${isUrl}" target="_blank" rel="noopener noreferrer" class="mentor-link-chip" title="${CONTACT_TIPS[c.type] || ''}">
          ${icon} ${c.type}
        </a>`;
      } else {
        return safeHTML`<span class="mentor-handle-chip" title="${CONTACT_TIPS[c.type] || ''}">
          ${icon} ${c.value}
        </span>`;
      }
    });

    card.innerHTML = safeHTML`
      <div>
        <div class="flex items-start justify-between mb-3">
          <h4 class="font-bold text-sm text-zinc-900 dark:text-zinc-100">${m.name}</h4>
          <span class="text-[10px] font-label font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-950/40 dark:text-orange-400">${m.role || 'Mentor'}</span>
        </div>
        <p class="text-xs text-primary font-bold mb-4 hover:underline cursor-pointer mentor-org-trigger" data-org-name="${m.orgName}">${m.orgName}</p>
      </div>
      <div class="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        ${channelsHtml}
      </div>`;
    container.appendChild(card);
  });
}

function renderMentorContactSection(org) {
  const container = document.getElementById('mMentorsSection');
  if (!container) return;

  container.innerHTML = '';
  const mentors = MENTOR_DATA[org.name];

  if (!mentors || !mentors.length) {
    container.innerHTML = safeHTML`
      <div class="mentor-empty border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 text-center bg-zinc-50 dark:bg-zinc-900/40">
        <p class="text-xs text-zinc-500">Contact details unavailable for ${org.name}. Browse their GSoC Ideas Page for mentor details.</p>
      </div>`;
    return;
  }

  mentors.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mentor-card p-4 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 rounded-xl mb-3 last:mb-0';

    const channelsHtml = (m.channels || []).map(c => {
      const icon = CHANNEL_ICONS[c.type] || '💬';
      const isUrl = sanitizeHrefUrl(c.value);
      if (isUrl) {
        return safeHTML`<a href="${isUrl}" target="_blank" rel="noopener noreferrer" class="mentor-link-chip hover:shadow-sm">
          ${icon} ${c.type}: Connect
        </a>`;
      } else {
        return safeHTML`<span class="mentor-handle-chip">
          ${icon} ${c.type}: ${c.value}
        </span>`;
      }
    });

    card.innerHTML = safeHTML`
      <div class="flex items-center justify-between mb-2">
        <h5 class="font-bold text-xs text-zinc-900 dark:text-zinc-100">${m.name}</h5>
        <span class="text-[9px] font-bold text-zinc-500 uppercase">${m.role || 'Mentor'}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 mt-2.5">
        ${channelsHtml}
      </div>`;
    container.appendChild(card);
  });
}

// Stale Data Banner Notice Check
function applyStaleDataNotice() {
  const now = new Date();
  if (now > GSOC_SELECTION_DATE) {
    const alertBanner = document.getElementById('selectionStaleAlert');
    if (alertBanner) alertBanner.classList.remove('hidden');

    const mentorStaleNote = document.getElementById('mentorStaleNote');
    const mentorBannerDot = document.getElementById('mentorBannerDot');
    if (mentorStaleNote) mentorStaleNote.classList.remove('hidden');
    if (mentorBannerDot) {
      mentorBannerDot.classList.remove('pulse-dot');
      mentorBannerDot.style.backgroundColor = '#a1a1aa'; // Zinc-400
    }
  }
}

// ══════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Sync bookmarks from storage initially
  ORGS.forEach(o => {
    if (o.github && ghCache[o.github]) {
      o._gh = ghCache[o.github];
    }
  });

  // Restore filter state from URL parameters
  (function restoreFiltersFromURL() {
    const params = new URLSearchParams(location.search);
    const setElValue = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    };

    setElValue('searchInput', params.get('q'));
    setElValue('hero-search', params.get('q'));
    setElValue('categoryFilter', params.get('cat'));
    setElValue('complexityFilter', params.get('comp'));
    setElValue('sortSelect', params.get('sort'));

    const lang = params.get('lang');
    if (lang) {
      lang.split(',').map(s => s.trim()).filter(Boolean).forEach(l => {
        selectedLanguages.add(l);
        const pillBtn = document.querySelector(`.pill[data-lang="${l}"]`);
        if (pillBtn) {
          pillBtn.classList.add('active');
          pillBtn.setAttribute('aria-pressed', 'true');
        }
      });
      renderSelectedLanguages();
    }

    const chip = params.get('chip');
    if (chip) {
      activeChip = chip;
      document.querySelectorAll('.filter-chip').forEach(el => {
        const text = el.textContent.trim().toLowerCase();
        let key = null;
        if (text.includes('bookmarked')) key = 'bookmarked';
        else if (text.includes('veteran')) key = 'veterans';
        else if (text.includes('newcomer')) key = 'newcomers';
        else if (text.includes('low competition')) key = 'low-competition';
        else if (text.includes('high competition')) key = 'high-competition';
        else if (text.includes('actively')) key = 'active';

        if (key === chip) {
          el.classList.add('bg-orange-600', 'text-white');
          el.classList.remove('bg-surface-container-highest');
        }
      });
    }
  })();

  updateCountdown();
  const countdownTimer = setInterval(updateCountdown, 60000);
  if (typeof countdownTimer.unref === 'function') countdownTimer.unref();
  renderTimeline();
  applyStaleDataNotice();

  // Watchlist, comparison, analytics
  applyFilters();
  renderWatchlist();
  renderCompare();
  renderTrending();
  updateAIInsights();
  checkAPI();
  loadMentorData();
  renderGoodFirstIssues();

  // Wire up filter event listeners
  document.getElementById('searchInput')?.addEventListener('input', applyFilters);
  document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
  document.getElementById('complexityFilter')?.addEventListener('change', applyFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
  document.getElementById('mentorSearchInput')?.addEventListener('input', renderMentorFinder);
  document.getElementById('mentorChannelFilter')?.addEventListener('change', renderMentorFinder);
  document.getElementById('matchAllLanguagesToggle')?.addEventListener('change', (e) => {
    matchAllLanguages = e.target.checked;
    globalThis.matchAllLanguages = matchAllLanguages;
    applyFilters();
  });

  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    visibleCount += 12;
    renderOrgs(false);
  });

  document.getElementById('surpriseBtn')?.addEventListener('click', openRandomOrg);

  // Programmatic event listeners replacing inline HTML handlers for close and action buttons
  document.getElementById('closeOrgModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('closeCompareModalBtn')?.addEventListener('click', closeCompareModal);
  document.getElementById('closeHelpModalBtn')?.addEventListener('click', closeHelpModal);
  document.getElementById('menuBtn')?.addEventListener('click', toggleMenu);
  document.getElementById('themeToggleBtn')?.addEventListener('click', globalThis.toggleTheme);

  const backdrop = document.getElementById('mobileMenuBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', toggleMenu);
    backdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  document.getElementById('closeMenuBtn')?.addEventListener('click', toggleMenu);

  document.querySelectorAll('.mobile-menu-link').forEach(link => {
    link.addEventListener('click', () => {
      setActiveMenu(link);
    });
  });

  // Sync hero-search
  const heroSearch = document.getElementById('hero-search');
  if (heroSearch) {
    heroSearch.value = document.getElementById('searchInput')?.value || new URLSearchParams(location.search).get('q') || '';
    heroSearch.addEventListener('input', (e) => {
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.value = e.target.value;
        const orgsSec = document.getElementById('orgs');
        if (orgsSec) orgsSec.scrollIntoView({ behavior: 'smooth' });
        applyFilters();
      }
    });
  }

  // Quick chips listeners
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.trim().toLowerCase();
      const isCurrentlyActive = chip.classList.contains('bg-orange-600');

      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('bg-orange-600', 'text-white');
        c.classList.add('bg-surface-container-highest');
      });

      if (isCurrentlyActive) {
        activeChip = null;
      } else {
        chip.classList.add('bg-orange-600', 'text-white');
        chip.classList.remove('bg-surface-container-highest');

        if (text.includes('bookmarked')) activeChip = 'bookmarked';
        else if (text.includes('veteran')) activeChip = 'veterans';
        else if (text.includes('newcomer')) activeChip = 'newcomers';
        else if (text.includes('low competition')) activeChip = 'low-competition';
        else if (text.includes('high competition')) activeChip = 'high-competition';
        else if (text.includes('actively')) activeChip = 'active';
        else activeChip = null;
      }
      applyFilters();
    });
  });

  // Phase 2: Add programmatic event listeners to pills, empty state clear button, and compare modal button
  document.querySelectorAll('.pill[data-lang]').forEach(pill => {
    pill.addEventListener('click', () => {
      if (typeof globalThis.togglePill === 'function') {
        globalThis.togglePill(pill);
      }
    });
  });

  document.getElementById('emptyStateClearBtn')?.addEventListener('click', clearAllFilters);
  document.getElementById('openCompareModalBtn')?.addEventListener('click', openCompareModal);

  // Wire up live stats fetch button
  document.getElementById('mFetchBtn')?.addEventListener('click', fetchModalGH);

  // Event delegation for trending cards scroll list
  const trendingScroll = document.getElementById('trendingScroll');
  if (trendingScroll) {
    trendingScroll.addEventListener('click', (e) => {
      const card = e.target.closest('.trend-card');
      if (card && card.dataset.orgName) {
        openModal(card.dataset.orgName);
      }
    });
  }

  // Event delegation for selected languages strip
  const selectedStrip = document.getElementById('selectedLangsStrip');
  if (selectedStrip) {
    selectedStrip.addEventListener('click', (e) => {
      const unselectBtn = e.target.closest('.unselect-lang-btn');
      if (unselectBtn) {
        const badge = unselectBtn.closest('.selected-lang-badge');
        if (badge && badge.dataset.lang) {
          unselectLanguage(badge.dataset.lang);
        }
        return;
      }
      const clearAllBtn = e.target.closest('.clear-all-langs-btn');
      if (clearAllBtn) {
        clearAllLanguages();
      }
    });
  }

  // Event delegation for mentors container
  const mentorsContainer = document.getElementById('mentorsContainer');
  if (mentorsContainer) {
    mentorsContainer.addEventListener('click', (e) => {
      const trigger = e.target.closest('.mentor-org-trigger');
      if (trigger && trigger.dataset.orgName) {
        openModal(trigger.dataset.orgName);
      }
    });
  }
});

// ══════════════════════════════════════════════
// EXPORT FOR NODE ENVIRONMENT TESTING COMPATIBILITY
// ══════════════════════════════════════════════
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeHrefUrl,
    validateIdeasUrl,
    githubPathFromValue,
    githubOwnerFromValue,
    githubUrlFromValue,
    orgMatchesLanguages,
    applySecondarySort,
    openModal,
    renderModalHeader,
    closeModal,
    safeHTML,
    rawHTML,
    renderGoodFirstIssues
  };
}
