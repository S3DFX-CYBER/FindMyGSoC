const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment before importing app.js
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
globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => {}
    }
  },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Set up global ORGS
globalThis.ORGS = require('../src/js/org.js');

// Import the modules
const { orgMatchesLanguages, applySecondarySort } = require('../src/js/app.js');
require('../src/js/skillExtractor.js'); // Populates LANGUAGE_MAP on global

test('orgMatchesLanguages returns true when languages set is empty', () => {
  const org = { tags: ['python', 'django'] };
  const selectedLangs = new Set();
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs), true);
});

test('orgMatchesLanguages filters correctly with matchAllLanguages = false', () => {
  const org = { tags: ['python', 'django'] };
  const selectedLangs = new Set(['Python', 'Java']);
  
  globalThis.matchAllLanguages = false;
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs), true);
});

test('orgMatchesLanguages filters correctly with matchAllLanguages = true', () => {
  const org = { tags: ['python', 'django'] };
  
  // Both match
  const selectedLangs1 = new Set(['Python', 'Django']);
  globalThis.matchAllLanguages = true;
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs1), true);

  // One mismatch
  const selectedLangs2 = new Set(['Python', 'Java']);
  assert.strictEqual(orgMatchesLanguages(org, selectedLangs2), false);
});

test('applySecondarySort sorts correctly', () => {
  const a = { name: 'A', years: 10, competition: 'hot', _gh: { stars: 100, gfi: 5 } };
  const b = { name: 'B', years: 5, competition: 'chill', _gh: { stars: 50, gfi: 15 } };

  // stars sort (descending)
  assert.ok(applySecondarySort(a, b, 'stars') < 0);
  
  // gfi sort (descending)
  assert.ok(applySecondarySort(a, b, 'gfi') > 0);

  // years-desc sort
  assert.ok(applySecondarySort(a, b, 'years-desc') < 0);

  // years-asc sort
  assert.ok(applySecondarySort(a, b, 'years-asc') > 0);

  // alphabetical sort (default)
  assert.ok(applySecondarySort(a, b, 'alpha') < 0);
});
