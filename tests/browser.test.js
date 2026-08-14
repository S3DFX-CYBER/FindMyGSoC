const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for DOM environment
globalThis.window = {
  addEventListener: () => {},
  location: { search: '' },
  open: () => {}
};
globalThis.location = { search: '' };
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {}
};

function createStubElement(id, tag = 'div') {
  const element = {
    id,
    tagName: tag.toUpperCase(),
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    appendChild: (child) => {
      element.children.push(child);
      return child;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    querySelector: (sel) => createStubElement('sub-' + id),
    querySelectorAll: () => []
  };
  return element;
}

const registeredListeners = {};
const mockElements = {
  searchInput: createStubElement('searchInput', 'input'),
  categoryFilter: createStubElement('categoryFilter', 'select'),
  complexityFilter: createStubElement('complexityFilter', 'select'),
  sortSelect: createStubElement('sortSelect', 'select'),
  mentorSearchInput: createStubElement('mentorSearchInput', 'input'),
  mentorChannelFilter: createStubElement('mentorChannelFilter', 'select'),
  matchAllLanguagesToggle: createStubElement('matchAllLanguagesToggle', 'input'),
  loadMoreBtn: createStubElement('loadMoreBtn', 'button'),
  surpriseBtn: createStubElement('surpriseBtn', 'button'),
  closeOrgModalBtn: createStubElement('closeOrgModalBtn', 'button'),
  closeCompareModalBtn: createStubElement('closeCompareModalBtn', 'button'),
  closeHelpModalBtn: createStubElement('closeHelpModalBtn', 'button'),
  menuBtn: createStubElement('menuBtn', 'button'),
  themeToggleBtn: createStubElement('themeToggleBtn', 'button'),
  mobileMenuBackdrop: createStubElement('mobileMenuBackdrop'),
  closeMenuBtn: createStubElement('closeMenuBtn', 'button'),
  clearRecentlyViewedBtn: createStubElement('clearRecentlyViewedBtn', 'button'),
  emptyStateClearBtn: createStubElement('emptyStateClearBtn', 'button'),
  openCompareModalBtn: createStubElement('openCompareModalBtn', 'button'),
  mFetchBtn: createStubElement('mFetchBtn', 'button'),
  trendingScroll: createStubElement('trendingScroll'),
  selectedLangsStrip: createStubElement('selectedLangsStrip'),
  mentorsContainer: createStubElement('mentorsContainer'),
  
  // Containers
  orgGrid: createStubElement('orgGrid'),
  emptyState: createStubElement('emptyState'),
  orgCount: createStubElement('orgCount'),
  loadMoreContainer: createStubElement('loadMoreContainer')
};

globalThis.document = {
  documentElement: {
    classList: { toggle: () => {} }
  },
  getElementById: (id) => mockElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#issues .grid') return createStubElement('issuesGrid');
    if (sel === '#compare .grid') return createStubElement('compareGrid');
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '.pill[data-lang]') return [
      { dataset: { lang: 'Python' }, addEventListener: () => {}, classList: { remove: () => {} }, setAttribute: () => {} },
      { dataset: { lang: 'JavaScript' }, addEventListener: () => {}, classList: { remove: () => {} }, setAttribute: () => {} }
    ];
    if (sel === '.mobile-menu-link') return [];
    if (sel === '.filter-chip') return [];
    return [];
  },
  createElement: (tag) => createStubElement('created-' + tag, tag),
  addEventListener: (event, handler) => {
    registeredListeners[event] = handler;
  }
};

globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({})
});

// Set up global ORGS
globalThis.ORGS = require('../src/js/org.js');

// Load skillExtractor first to populate global mappings
require('../src/js/skillExtractor.js');

// Require app.js to trigger global definitions
require('../src/js/app.js');

test('DOM Smoke Test: DOMContentLoaded wires up listeners cleanly without throwing', () => {
  assert.ok(typeof registeredListeners['DOMContentLoaded'] === 'function');
  
  // Trigger DOMContentLoaded!
  assert.doesNotThrow(() => {
    registeredListeners['DOMContentLoaded']();
  });
  assert.ok(mockElements.orgGrid.children.length > 0, 'initialization should render organization cards');
});
