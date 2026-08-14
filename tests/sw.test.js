const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Mock Service Worker Environment Globals
const listeners = {};
globalThis.self = {
  addEventListener: (event, handler) => {
    listeners[event] = handler;
  },
  skipWaiting: async () => {},
  clients: {
    claim: async () => {}
  }
};
globalThis.addEventListener = globalThis.self.addEventListener;
globalThis.skipWaiting = globalThis.self.skipWaiting;
globalThis.clients = globalThis.self.clients;

const stubCache = {
  addAll: async (assets) => {
    stubCache.added = assets;
  },
  put: async (req, resp) => {
    stubCache.putCalls.push({ req, resp });
  },
  added: [],
  putCalls: []
};

globalThis.caches = {
  open: async (name) => {
    globalThis.caches.openedName = name;
    return stubCache;
  },
  // Use the name derived above so this mock stays accurate when the version bumps.
  keys: async () => ['old-cache-v1', CURRENT_CACHE_NAME],
  delete: async (name) => {
    globalThis.caches.deleted.push(name);
    return true;
  },
  match: async (req) => {
    globalThis.caches.matchReq = req;
    if (req.url && req.url.includes('stale-asset.js')) {
      return { status: 200, clone: () => ({ status: 200 }) };
    }
    return null;
  },
  deleted: [],
  matchReq: null
};

globalThis.fetch = async (req) => {
  globalThis.fetch.calledWith = req;
  return {
    status: 200,
    clone: () => ({ status: 200 })
  };
};

globalThis.URL = class {
  constructor(url) {
    this.href = url;
    // Support both full URLs and path-only strings used in tests
    try {
      const parsed = new globalThis.URL(url);
      this.origin   = parsed.origin;
      this.pathname = parsed.pathname;
      this.protocol = parsed.protocol;
    } catch {
      // path-only strings (e.g. '/data/issues.json') — no origin/protocol
      this.origin   = 'https://example.com';
      this.pathname = url;
      this.protocol = 'https:';
    }
  }
};

// Derive CACHE_NAME from sw.js source so the test never needs a hardcoded version string.
// If sw.js bumps the date/version, this test automatically uses the new value.
const swPath = path.join(__dirname, '../sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');
const cacheNameMatch = swContent.match(/const CACHE_NAME\s*=\s*'([^']+)'/);
if (!cacheNameMatch) throw new Error('Could not parse CACHE_NAME from sw.js');
const CURRENT_CACHE_NAME = cacheNameMatch[1];
require('../sw.js'); // executes it in our mocked environment

test('Service Worker registers install assets list manifest', async () => {
  assert.ok(typeof listeners['install'] === 'function');
  
  let installEventCalled = false;
  const event = {
    waitUntil: (p) => {
      event.promise = p;
      installEventCalled = true;
    }
  };
  
  listeners['install'](event);
  await event.promise;

  assert.ok(installEventCalled);
  assert.ok(globalThis.caches.openedName.startsWith('gsoc-finder-'));
  assert.ok(stubCache.added.includes('index.html'));
  assert.ok(stubCache.added.includes('src/js/app.js'));
});

test('Service Worker activate event deletes old caches', async () => {
  assert.ok(typeof listeners['activate'] === 'function');
  
  const event = {
    waitUntil: (p) => {
      event.promise = p;
    }
  };
  
  globalThis.caches.deleted = [];
  listeners['activate'](event);
  await event.promise;

  assert.ok(globalThis.caches.deleted.includes('old-cache-v1'));
  assert.strictEqual(globalThis.caches.deleted.includes(CURRENT_CACHE_NAME), false);
});
