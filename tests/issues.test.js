const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment
globalThis.window = {};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Stub DOM elements for issues page
const mockElements = {
  issuesLastUpdated: { textContent: '' },
  issuesContainer: { innerHTML: '' }
};

const stubGrid = {
  innerHTML: '',
  appendChild: function(node) {
    this.nodes.push(node);
  },
  nodes: []
};

globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => {}
    }
  },
  getElementById: (id) => mockElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#issues .grid') return stubGrid;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => ({
    className: '',
    innerHTML: '',
    onclick: null
  })
};

// Mock fetch
globalThis.fetch = async (url) => {
  return {
    ok: true,
    json: async () => ({
      updated_at: new Date().toISOString(),
      issues: [
        {
          title: 'Fix alignment in navigation <img src=x onerror=alert(1)>',
          repo: 'django/django',
          url: 'https://github.com/django/django/issues/1',
          labels: ['good first issue', '<script>alert(1)</script>'],
          comments: 2
        }
      ]
    })
  };
};

// Set up global ORGS
globalThis.ORGS = require('../src/js/org.js');

// Import the module
require('../src/js/skillExtractor.js');
const { renderGoodFirstIssues } = require('../src/js/app.js');

test('renderGoodFirstIssues fetches and renders issue cards successfully', async () => {
  stubGrid.nodes = [];
  await renderGoodFirstIssues();

  assert.strictEqual(stubGrid.nodes.length, 1);
  const card = stubGrid.nodes[0];
  assert.ok(card.innerHTML.includes('Fix alignment in navigation'));
  assert.ok(card.innerHTML.includes('django/django'));
  assert.ok(!card.innerHTML.includes('<img src=x'));
  assert.ok(!card.innerHTML.includes('<script>'));
  assert.ok(card.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'));
});
