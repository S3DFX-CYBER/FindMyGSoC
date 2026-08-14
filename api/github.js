// api/github.js — Vercel Edge Function
export const config = { runtime: 'edge' };
const CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX_SIZE = 1000;

const JOBS = new Map();
const JOB_BY_KEY = new Map();
const QUEUE = [];
const JOB_RESULT_TTL = 10 * 60 * 1000;
const JOB_STALE_TTL = 30 * 60 * 1000;
const MAX_WORKERS = 2;
const WORKER_DELAY_MS = 350;
let activeWorkers = 0;

function safeCacheSet(key, value) {
  if (!CACHE.has(key) && CACHE.size >= CACHE_MAX_SIZE) {
    const firstKey = CACHE.keys().next().value;
    CACHE.delete(firstKey);
  }
  CACHE.set(key, value);
}

function buildJobKey({ repo, user, gfiMode, issuesMode }) {
  return [repo || '', user || '', gfiMode ? '1' : '0', issuesMode ? '1' : '0'].join('|');
}

function makeJobId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function cleanupJobs() {
  const now = Date.now();
  for (const [jobId, job] of JOBS.entries()) {
    const age = now - job.updatedAt;
    const isFinished = job.status === 'done' || job.status === 'failed';
    const shouldDelete = isFinished ? age > JOB_RESULT_TTL : age > JOB_STALE_TTL;
    if (!shouldDelete) continue;
    JOBS.delete(jobId);
    if (JOB_BY_KEY.get(job.key) === jobId) {
      JOB_BY_KEY.delete(job.key);
    }
  }
}

function queueJob(payload) {
  cleanupJobs();
  const key = buildJobKey(payload);
  const existingId = JOB_BY_KEY.get(key);
  if (existingId) {
    const existingJob = JOBS.get(existingId);
    if (existingJob && existingJob.status !== 'failed') {
      return existingJob;
    }
    JOB_BY_KEY.delete(key);
    JOBS.delete(existingId);
  }

  const job = {
    id: makeJobId(),
    key,
    payload,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    result: null,
    error: null,
  };

  JOBS.set(job.id, job);
  JOB_BY_KEY.set(key, job.id);
  QUEUE.push(job.id);
  scheduleWorkers();
  return job;
}

function scheduleWorkers() {
  while (activeWorkers < MAX_WORKERS && QUEUE.length) {
    const jobId = QUEUE.shift();
    const job = JOBS.get(jobId);
    if (!job || job.status !== 'queued') continue;

    activeWorkers++;
    job.status = 'processing';
    job.updatedAt = Date.now();

    executeGitHubQuery(job.payload)
      .then((result) => {
        job.status = 'done';
        job.result = result;
        job.error = null;
        job.updatedAt = Date.now();
      })
      .catch((err) => {
        job.status = 'failed';
        job.error = err?.message || 'Job failed';
        job.updatedAt = Date.now();
      })
      .finally(() => {
        activeWorkers--;
        setTimeout(scheduleWorkers, WORKER_DELAY_MS);
      });
  }
}

async function executeGitHubQuery({ repo, user, gfiMode, issuesMode, ghHeaders }) {
  const fetchWithFallback = async (url, options) => {
    let res = await fetch(url, options);
    if (res.status === 401 && options.headers?.Authorization) {
      const retryOptions = {
        ...options,
        headers: { ...options.headers },
      };
      delete retryOptions.headers.Authorization;
      res = await fetch(url, retryOptions);
    }
    return res;
  };

  // MODE: ?user=username → return user profile analysis for AI recommender
  if (user) {
    const cacheKey = 'user__' + user;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { status: 200, body: { ...cached, cached: true } };
    }

    let page = 1;
    let repos = [];
    while (page <= 3) {
      try {
        const res = await fetchWithFallback(
          `https://api.github.com/users/${user}/repos?per_page=100&sort=updated&page=${page}`,
          {
            headers: ghHeaders,
            signal: AbortSignal.timeout(5000),
          }
        );
        if (!res.ok) {
          if (page === 1) return { status: 502, body: { error: `GitHub ${res.status}` } };
          break;
        }
        const pageRepos = await res.json();
        repos = repos.concat(pageRepos);
        if (pageRepos.length < 100) break;
        page++;
      } catch (e) {
        // Gracefully break loop on timeout/err for pages 2-3, allowing partial results
        if (page === 1) throw e;
        break;
      }
    }

    let totalStars = 0;
    const languageCounts = {};
    const topicCounts = {};
    let activeDays = 9999;

    repos.forEach((r) => {
      if (r.fork) return; // Skip forks for skill analysis
      totalStars += r.stargazers_count;
      if (r.language) {
        languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
      }
      if (r.topics) {
        r.topics.forEach((t) => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      }
      if (r.pushed_at) {
        const d = new Date(r.pushed_at);
        const days = Math.floor((Date.now() - d) / 86400000);
        if (days < activeDays) activeDays = days;
      }
    });

    const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map((x) => x[0]);

    let activity = 'low';
    if (activeDays < 30) activity = 'high';
    else if (activeDays < 90) activity = 'medium';

    const result = {
      languages,
      topics,
      stars: totalStars,
      activity,
      ts: Date.now(),
    };

    safeCacheSet(cacheKey, result);
    return { status: 200, body: result };
  }

  // MODE: ?gfi=1&issues=1 → return actual issue items
  if (gfiMode && issuesMode) {
    const cacheKey = repo + '__issues';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { status: 200, body: { total: cached.total, items: cached.items, cached: true } };
    }

    const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
    const res = await fetchWithFallback(
      `https://api.github.com/search/issues?q=${q}&per_page=30&sort=created&order=desc`,
      { headers: ghHeaders }
    );
    if (!res.ok) {
      return { status: 200, body: { total: 0, items: [], error: `GitHub ${res.status}` } };
    }
    const data = await res.json();
    const total = data.total_count ?? 0;
    const items = (data.items || []).map((i) => ({
      title: i.title,
      html_url: i.html_url,
      created_at: i.created_at,
      comments: i.comments,
      labels: (i.labels || []).map((l) => ({ name: l.name, color: l.color })),
    }));
    safeCacheSet(cacheKey, { total, items, ts: Date.now() });
    safeCacheSet(repo + '__gfi', { gfi: total, ts: Date.now() });
    return { status: 200, body: { total, items } };
  }

  // MODE: ?gfi=1 → return count only
  if (gfiMode) {
    const cacheKey = repo + '__gfi';
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return { status: 200, body: { gfi: cached.gfi } };
    }

    const q = encodeURIComponent(`repo:${repo} label:"good first issue" state:open`);
    const res = await fetchWithFallback(`https://api.github.com/search/issues?q=${q}&per_page=1`, { headers: ghHeaders });
    if (!res.ok) {
      return { status: 200, body: { gfi: null, error: `GitHub ${res.status}` } };
    }
    const data = await res.json();
    const gfi = data.total_count ?? null;
    if (gfi !== null) safeCacheSet(cacheKey, { gfi, ts: Date.now() });
    return { status: 200, body: { gfi } };
  }

  // MODE: standard stats — NO GFI fetch here (avoids search API rate limits)
  const cached = CACHE.get(repo);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { status: 200, body: { ...cached, cached: true } };
  }

  const [repoRes, commitsRes] = await Promise.all([
    fetchWithFallback(`https://api.github.com/repos/${repo}`, { headers: ghHeaders }),
    fetchWithFallback(`https://api.github.com/repos/${repo}/commits?per_page=1`, { headers: ghHeaders }),
  ]);

  if (!repoRes.ok) {
    const err = await repoRes.json().catch(() => ({}));
    return { status: repoRes.status, body: { error: err.message || 'Repo not found' } };
  }

  const repoData = await repoRes.json();

  let lastCommit = '—';
  let activityDays = 9999;
  if (commitsRes.ok) {
    try {
      const commits = await commitsRes.json();
      if (commits[0]?.commit?.author?.date) {
        const d = new Date(commits[0].commit.author.date);
        activityDays = Math.floor((Date.now() - d) / 86400000);
        if (activityDays === 0) lastCommit = 'Today';
        else if (activityDays === 1) lastCommit = '1d ago';
        else if (activityDays < 30) lastCommit = `${activityDays}d ago`;
        else if (activityDays < 365) lastCommit = `${Math.floor(activityDays / 30)}mo ago`;
        else lastCommit = `${Math.floor(activityDays / 365)}y ago`;
      }
    } catch {
      // Non-JSON body (CDN error page, Cloudflare interstitial, empty response).
      // Fall through with safe defaults: lastCommit = '—', activityDays = 9999.
    }
  }

  const activity = activityDays < 14 ? 'active' : activityDays < 60 ? 'moderate' : 'low';

  const result = {
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    issues: repoData.open_issues_count,
    watchers: repoData.watchers_count,
    lastCommit,
    activity,
    language: repoData.language,
    gfi: null, // fetched separately via ?gfi=1 to avoid rate limiting
    ts: Date.now(),
  };

  safeCacheSet(repo, result);
  return { status: 200, body: result };
}

function jsonResponse(body, status, headers, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extraHeaders } });
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const { searchParams } = new URL(req.url);
  const repo = searchParams.get('repo');
  const user = searchParams.get('user');
  const gfiMode = searchParams.get('gfi') === '1';
  const issuesMode = searchParams.get('issues') === '1';
  const asyncMode = searchParams.get('async') === '1';
  const jobId = searchParams.get('job');

  cleanupJobs();

  if (jobId) {
    const job = JOBS.get(jobId);
    if (!job) {
      return jsonResponse({ error: 'Job not found or expired' }, 404, headers);
    }
    if (job.status === 'done' && job.result) {
      return jsonResponse(job.result.body, job.result.status, headers);
    }
    if (job.status === 'failed') {
      return jsonResponse({ error: job.error || 'Background fetch failed' }, 500, headers);
    }
    return jsonResponse({ job: job.id, status: job.status }, 202, headers, { 'Retry-After': '2' });
  }

  if (!repo && !user) {
    return jsonResponse({ error: 'Missing repo or user parameter' }, 400, headers);
  }

  if (repo && !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return jsonResponse({ error: 'Invalid repo' }, 400, headers);
  }

  if (user && !/^[\w.-]+$/.test(user)) {
    return jsonResponse({ error: 'Invalid user' }, 400, headers);
  }

  const token = process.env.GITHUB_TOKEN;
  const ghHeaders = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'gsoc-org-finder',
  };

  if (token) {
    ghHeaders.Authorization = `token ${token}`;
  }

  const payload = { repo, user, gfiMode, issuesMode, ghHeaders };

  if (asyncMode) {
    const job = queueJob(payload);
    if (job.status === 'done' && job.result) {
      return jsonResponse(job.result.body, job.result.status, headers);
    }
    return jsonResponse(
      {
        job: job.id,
        status: job.status,
        poll: `/api/github?job=${encodeURIComponent(job.id)}`,
      },
      202,
      headers,
      { 'Retry-After': '2' }
    );
  }

  try {
    const result = await executeGitHubQuery(payload);
    return jsonResponse(result.body, result.status, headers);
  } catch (err) {
    return jsonResponse({ error: 'Fetch failed: ' + err.message }, 500, headers);
  }
}
