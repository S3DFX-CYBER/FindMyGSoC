const test = require('node:test');
const assert = require('node:assert');

// Mock Service Worker Environment Globals
const listeners = {};
globalThis.self = {
  addEventListener: (event, handler) => {
    listeners[event] = handler;
  },
  skipWaiting: async () => { },
  clients: {
    claim: async () => { }
  }
};
globalThis.addEventListener = globalThis.self.addEventListener;
globalThis.skipWaiting = globalThis.self.skipWaiting;
globalThis.clients = globalThis.self.clients;

const stubCache = {
  putCalls: [],
  matchVal: null,
  put: async (req, resp) => {
    stubCache.putCalls.push({ req, resp });
  }
};

globalThis.caches = {
  open: async () => stubCache,
  match: async (req) => {
    caches.matchedReq = req;
    return caches.matchVal;
  },
  matchedReq: null,
  matchVal: null
};

let fetchAttempted = false;
globalThis.fetch = async (req) => {
  fetchAttempted = true;
  globalThis.fetch.calledWith = req;
  if (globalThis.fetch.shouldFail) {
    throw new Error('Network failure');
  }
  return {
    status: 200,
    clone: () => ({ status: 200 })
  };
};
globalThis.fetch.shouldFail = false;
globalThis.fetch.calledWith = null;

require('../sw.js');

test('Service Worker Fetch: Static Asset triggers Stale-While-Revalidate strategy', async () => {
  assert.ok(typeof listeners['fetch'] === 'function');

  // Set up cached response
  const cachedResponse = {
    status: 200,
    clone: () => ({ status: 200 })
  };
  globalThis.caches.matchVal = cachedResponse;
  fetchAttempted = false;
  globalThis.fetch.shouldFail = false;

  const event = {
    request: { url: 'https://example.com/src/js/app.js' },
    respondWith: (promise) => {
      event.promise = promise;
    },
    waitUntil: (promise) => {
      event.waitUntilPromise = promise;
    }
  };

  listeners['fetch'](event);
  const response = await event.promise;

  assert.strictEqual(response.status, 200);
  assert.ok(globalThis.caches.matchedReq);

  // Stale-while-revalidate triggers background fetch to update the cache
  if (event.waitUntilPromise) {
    await event.waitUntilPromise;
  }
  assert.ok(fetchAttempted);
});

test('Service Worker Fetch: API endpoint triggers Network-First strategy (success)', async () => {
  globalThis.caches.matchVal = null;
  fetchAttempted = false;
  globalThis.fetch.shouldFail = false;
  stubCache.putCalls = [];

  const event = {
    request: { url: 'https://example.com/api/github?repo=test' },
    respondWith: (promise) => {
      event.promise = promise;
    }
  };

  listeners['fetch'](event);
  const response = await event.promise;

  assert.strictEqual(response.status, 200);
  assert.ok(fetchAttempted);
  assert.strictEqual(stubCache.putCalls.length, 1);
});

test('Service Worker Fetch: API endpoint triggers Network-First strategy and falls back to cache when offline', async () => {
  const cachedResponse = {
    status: 200,
    clone: () => ({ status: 200 }),
    fromCache: true
  };
  globalThis.caches.matchVal = cachedResponse;
  fetchAttempted = false;
  globalThis.fetch.shouldFail = true; // offline simulation

  const event = {
    request: { url: 'https://example.com/api/github?repo=test' },
    respondWith: (promise) => {
      event.promise = promise;
    }
  };

  listeners['fetch'](event);
  const response = await event.promise;

  assert.strictEqual(response.status, 200);
  assert.ok(response.fromCache);
});
