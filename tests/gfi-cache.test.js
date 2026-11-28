/* eslint-env node */
const test = require('node:test');
const assert = require('node:assert');
const { TTL_MS, MIN_CDN_TTL_S, primaryCacheControl, createCache } = require('../src/js/gfiCache.js');

test('a fresh entry advertises the full TTL to the CDN', () => {
  assert.strictEqual(primaryCacheControl(TTL_MS), `public, s-maxage=21600, stale-while-revalidate=21600`);
});

test('an old entry advertises only what is left on it', () => {
  // Five hours into a six-hour entry: one hour left, not six.
  const oneHour = 60 * 60 * 1000;
  assert.strictEqual(primaryCacheControl(oneHour), `public, s-maxage=3600, stale-while-revalidate=3600`);
});

test('a nearly expired entry floors at a minute rather than advertising zero', () => {
  assert.strictEqual(primaryCacheControl(1000), `public, s-maxage=${MIN_CDN_TTL_S}, stale-while-revalidate=${MIN_CDN_TTL_S}`);
  assert.strictEqual(primaryCacheControl(0), `public, s-maxage=${MIN_CDN_TTL_S}, stale-while-revalidate=${MIN_CDN_TTL_S}`);
  assert.strictEqual(primaryCacheControl(-5000), `public, s-maxage=${MIN_CDN_TTL_S}, stale-while-revalidate=${MIN_CDN_TTL_S}`);
  assert.strictEqual(primaryCacheControl(undefined), `public, s-maxage=${MIN_CDN_TTL_S}, stale-while-revalidate=${MIN_CDN_TTL_S}`);
});

test('the header and the in-memory TTL come from one constant', () => {
  // If the TTL changes, the header changes with it. This is the drift the review
  // flagged: two hand-written sixes in different places.
  assert.match(primaryCacheControl(TTL_MS), new RegExp(`s-maxage=${TTL_MS / 1000}\\b`));
});

test('a cache entry reports its remaining life and then expires', () => {
  let clock = 0;
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => clock });

  cache.set('k', { issues: [] });
  assert.deepStrictEqual(cache.get('k'), { value: { issues: [] }, remainingMs: 1000 });

  clock = 400;
  assert.strictEqual(cache.get('k').remainingMs, 600);

  clock = 1001;
  assert.strictEqual(cache.get('k'), null, 'an expired entry is gone');
  assert.strictEqual(cache.size, 0, 'and it is dropped from the map');
});

test('the cache is bounded', () => {
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => 0 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.strictEqual(cache.size, 2);
  assert.strictEqual(cache.get('a'), null, 'the oldest entry is evicted');
  assert.strictEqual(cache.get('c').value, 3);
});
