// api/gfi.js — Vercel Edge Function
//
// Serves the pre-fetched good first issue dataset at /data/issues.json.
//
// Why this exists: the daily workflow cannot always commit to `main` (branch
// protection requires a reviewed PR), and a refresh that waits for a human is a
// refresh that stops happening — that is exactly how the dataset ended up
// frozen at 2026-05-09. The workflow therefore publishes the dataset to the
// unprotected `data/latest` branch on every run, and this function serves that
// file through the Vercel edge cache with a 24 hour TTL. Nobody has to merge
// anything for the site to update.
//
// Fallback order:
//   1. data/latest branch  (fresh, published by the scheduled workflow)
//   2. main branch         (last committed copy)
//   3. an empty dataset    (the UI degrades to its "search GitHub" cards)
export const config = { runtime: 'edge' };

const REPO = 'S3DFX-CYBER/FindMyGSoC';
const SOURCES = [
  `https://raw.githubusercontent.com/${REPO}/data/latest/data/issues.json`,
  `https://raw.githubusercontent.com/${REPO}/main/data/issues.json`,
];
const CACHE_KEY = 'gfi-dataset';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_SIZE = 4;
const FETCH_TIMEOUT_MS = 8000;

const CACHE = new Map();

function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    CACHE.delete(CACHE.keys().next().value);
  }
  CACHE.set(key, { value, ts: Date.now() });
}

function isDataset(data) {
  return Boolean(data) && typeof data === 'object' && Array.isArray(data.issues);
}

async function fetchDataset(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', 'User-Agent': 'gsoc-org-finder' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return isDataset(data) ? data : null;
  } catch {
    // Timeout, DNS failure, malformed JSON: try the next source.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  const cached = cacheGet(CACHE_KEY);
  if (cached) {
    return new Response(JSON.stringify(cached), { status: 200, headers });
  }

  for (const source of SOURCES) {
    const data = await fetchDataset(source);
    if (data) {
      cacheSet(CACHE_KEY, data);
      return new Response(JSON.stringify(data), { status: 200, headers });
    }
  }

  // Both sources are unreachable. Return an empty, well-formed dataset so the
  // page falls back to its search cards instead of showing a failed section.
  return new Response(
    JSON.stringify({
      updated_at: null,
      source_org_count: 0,
      total_issues: 0,
      issues: [],
      unavailable: true,
    }),
    { status: 200, headers }
  );
}
