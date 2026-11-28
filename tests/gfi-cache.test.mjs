import test from 'node:test';
import assert from 'node:assert';
import { TTL_MS, MIN_CDN_TTL_S, primaryCacheControl, createCache } from '../src/js/gfiCache.mjs';

test('a fresh entry advertises the full TTL to the CDN', () => {
  assert.strictEqual(primaryCacheControl(TTL_MS), 'public, s-maxage=21600, stale-while-revalidate=21600');
});

test('an old entry advertises only what is left on it', () => {
  // Five hours into a six-hour entry: one hour left, not six.
  const oneHour = 60 * 60 * 1000;
  assert.strictEqual(primaryCacheControl(oneHour), 'public, s-maxage=3600, stale-while-revalidate=3600');
});

test('a nearly expired entry floors at a minute rather than advertising zero', () => {
  const floor = `public, s-maxage=${MIN_CDN_TTL_S}, stale-while-revalidate=${MIN_CDN_TTL_S}`;
  assert.strictEqual(primaryCacheControl(1000), floor);
  assert.strictEqual(primaryCacheControl(0), floor);
  assert.strictEqual(primaryCacheControl(-5000), floor);
  assert.strictEqual(primaryCacheControl(undefined), floor);
});

test('the header and the in-memory TTL come from one constant', () => {
  assert.match(primaryCacheControl(TTL_MS), new RegExp(`s-maxage=${TTL_MS / 1000}\\b`));
});

test('an entry reports its remaining life, and expires at exactly the TTL', () => {
  let clock = 0;
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => clock });

  cache.set('k', { issues: [] });
  assert.deepStrictEqual(cache.get('k'), { value: { issues: [] }, remainingMs: 1000 });

  clock = 400;
  assert.strictEqual(cache.get('k').remainingMs, 600);

  // The boundary itself: at exactly ttlMs the entry is expired, not valid for
  // zero more milliseconds.
  clock = 1000;
  assert.strictEqual(cache.get('k'), null, 'an entry at exactly the TTL is expired');
  assert.strictEqual(cache.size, 0, 'and it is dropped from the map');
});

test('one millisecond before the TTL the entry is still served', () => {
  let clock = 0;
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => clock });
  cache.set('k', 'value');

  clock = 999;
  assert.deepStrictEqual(cache.get('k'), { value: 'value', remainingMs: 1 });
});

test('rewriting a key moves it to the end, so eviction does not drop it', () => {
  const clock = 0;
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => clock });

  cache.set('a', 1);
  cache.set('b', 2);
  // Refresh 'a'. Without the delete-then-insert, it keeps the oldest position
  // and the next eviction removes the entry that was just written.
  cache.set('a', 3);
  cache.set('c', 4);

  assert.strictEqual(cache.get('a').value, 3, 'the refreshed entry survives');
  assert.strictEqual(cache.get('b'), null, 'the genuinely oldest entry is evicted');
  assert.strictEqual(cache.get('c').value, 4);
  assert.strictEqual(cache.size, 2);
});

test('the cache never grows past its bound', () => {
  const cache = createCache({ ttlMs: 1000, max: 2, now: () => 0 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.strictEqual(cache.size, 2);
  assert.strictEqual(cache.get('a'), null);
  assert.strictEqual(cache.get('c').value, 3);
});
