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

const { calculateActivityScore, getActivityBadge } = require('../src/js/app.js');

test('calculateActivityScore returns 0 for null/undefined stats', () => {
  assert.strictEqual(calculateActivityScore(null), 0);
  assert.strictEqual(calculateActivityScore(undefined), 0);
});

test('calculateActivityScore calculates correct score for given stats', () => {
  const stats = {
    commits_30d: 30, // 30 pts
    issues_open: 50,
    issues_closed: 150, // 20 * (150/200) = 15 pts
    pr_response_time: 0, // 20 pts
    maintainers: 3, // 15 pts
    gfi_count: 10 // 15 pts
  };
  // Total expected: 30 + 15 + 20 + 15 + 15 = 95
  assert.strictEqual(calculateActivityScore(stats), 95);
});

test('calculateActivityScore caps metrics correctly', () => {
  const stats = {
    commits_30d: 100, // should cap at 30
    issues_open: 0,
    issues_closed: 100, // 20 pts
    pr_response_time: 0, // 20 pts
    maintainers: 10, // should cap at 15
    gfi_count: 50 // should cap at 15
  };
  // Total expected: 30 + 20 + 20 + 15 + 15 = 100
  assert.strictEqual(calculateActivityScore(stats), 100);
});

test('getActivityBadge returns correct badge data', () => {
  const high = getActivityBadge(80);
  assert.strictEqual(high.label, 'Highly Active');
  assert.ok(high.class.includes('green'));

  const med = getActivityBadge(50);
  assert.strictEqual(med.label, 'Moderately Active');
  assert.ok(med.class.includes('amber'));

  const low = getActivityBadge(10);
  assert.strictEqual(low.label, 'Low Activity');
  assert.ok(low.class.includes('zinc'));
});
