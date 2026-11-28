/*
 * The cache policy for /api/gfi, kept out of the handler so it can be tested.
 *
 * ESM on purpose: the handler runs on the Vercel Edge runtime, which does not
 * load CommonJS. An `export` here is what makes the module loadable there.
 *
 * The handler runs on the edge, where the module-level cache survives between
 * requests on the same instance. Two numbers decide how old a client's copy can
 * be, and both used to be written by hand in two places, which is how they drift:
 *
 *   TTL_MS        how long an entry is reused in memory
 *   fresh/stale   how long the CDN may keep the response it was given
 *
 * Worst case a client can receive is fresh + stale. With the values below that
 * is twelve hours, against a dataset that is republished once a day.
 */

export const TTL_MS = 6 * 60 * 60 * 1000;
export const MAX_ENTRIES = 4;
export const MIN_CDN_TTL_S = 60;

/**
 * The Cache-Control header for a response, given how long the underlying entry
 * has left. A response built from a five-hour-old entry must not advertise six
 * fresh hours to the CDN, or the client ends up with an eleven-hour-old copy.
 */
export function primaryCacheControl(remainingMs) {
  const safe = Number.isFinite(remainingMs) ? remainingMs : 0;
  const seconds = Math.max(MIN_CDN_TTL_S, Math.floor(safe / 1000));
  return `public, s-maxage=${seconds}, stale-while-revalidate=${seconds}`;
}

/**
 * A tiny bounded cache: every read reports what is left on the entry, so the
 * caller can bound the CDN lifetime with it.
 *
 * An entry is expired at exactly `ttlMs`, not only after it: "valid for six
 * hours" means the sixth hour is the last, not the seventh.
 */
export function createCache({ ttlMs = TTL_MS, max = MAX_ENTRIES, now = Date.now } = {}) {
  const entries = new Map();

  return {
    get(key) {
      const hit = entries.get(key);
      if (!hit) return null;
      const age = now() - hit.ts;
      if (age >= ttlMs) {
        entries.delete(key);
        return null;
      }
      return { value: hit.value, remainingMs: ttlMs - age };
    },
    set(key, value) {
      // Delete first: assigning to an existing key keeps its original position
      // in a Map, so a rewritten entry would still look like the oldest one and
      // could be evicted moments after it was refreshed.
      entries.delete(key);
      if (entries.size >= max) {
        entries.delete(entries.keys().next().value);
      }
      entries.set(key, { value, ts: now() });
    },
    get size() {
      return entries.size;
    },
  };
}
