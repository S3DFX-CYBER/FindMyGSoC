/* eslint-env node */

/**
 * Refreshes data/issues.json with open, unassigned "good first issue" issues
 * for every organisation in the dataset.
 *
 * Why the REST issues endpoint and not /search/issues:
 * the search API is capped at 30 requests/minute for authenticated calls, so
 * the previous implementation (184 search queries fired five at a time) spent
 * most of its run in secondary rate limiting and silently wrote a near-empty
 * dataset. Listing issues per repository uses the 5,000 requests/hour core
 * budget instead, which comfortably covers ~184 repositories.
 *
 * Usage:
 *   node agent/scripts/fetch-issues.js                 # full refresh
 *   node agent/scripts/fetch-issues.js --limit 5       # smoke test
 *   node agent/scripts/fetch-issues.js --dry-run       # print, do not write
 *
 * Env:
 *   GITHUB_TOKEN  optional, but raises the rate limit from 60 to 5,000 req/h
 *   GFI_LIMIT     same as --limit
 */

const fs = require('node:fs');
const path = require('node:path');
const ORGS = require('../../src/js/org.js');

const DEFAULT_OUTPUT = path.resolve(__dirname, '../../data/issues.json');
const ISSUE_LABEL = 'good first issue';
const MAX_ISSUES_PER_ORG = 3;
const MAX_AGE_DAYS = 365;
const PER_PAGE = 50;
const CONCURRENCY = 4;
const STAGGER_MS = 120;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits the org dataset into queryable targets and entries that cannot be
 * queried. `github` must be `owner/repo`; an owner-only value (or an empty one)
 * is a data bug, reported instead of silently ignored.
 */
function normalizeTargets(orgs) {
  const targets = [];
  const skipped = [];

  for (const org of orgs) {
    const github = typeof org.github === 'string' ? org.github.trim() : '';

    if (!github) {
      skipped.push({ name: org.name, github, reason: 'empty github value' });
      continue;
    }

    if (!github.includes('/')) {
      skipped.push({ name: org.name, github, reason: 'not owner/repo' });
      continue;
    }

    targets.push({
      name: org.name,
      github,
      owner: github.split('/')[0],
    });
  }

  return { targets, skipped };
}

/** Builds the REST issues URL for one repository. */
function issuesUrl(github, perPage = PER_PAGE) {
  const query = new URLSearchParams({
    state: 'open',
    labels: ISSUE_LABEL,
    sort: 'updated',
    direction: 'desc',
    per_page: String(perPage),
  });

  return `https://api.github.com/repos/${github}/issues?${query.toString()}`;
}

/**
 * An issue is only useful to a newcomer if it is open, unassigned and has been
 * touched in the last year. `/issues` also returns pull requests, which are
 * filtered out here.
 */
function isEligibleIssue(issue, cutoffMs) {
  if (!issue || typeof issue !== 'object') return false;
  if (issue.pull_request) return false;
  if (issue.state && issue.state !== 'open') return false;
  if (issue.assignee) return false;
  if (Array.isArray(issue.assignees) && issue.assignees.length > 0) return false;

  const updated = Date.parse(issue.updated_at);
  return Number.isFinite(updated) && updated >= cutoffMs;
}

/** Maps a GitHub issue onto the shape data/issues.json has always used. */
function mapIssue(issue, target) {
  const repositoryUrl = issue.repository_url || `https://api.github.com/repos/${target.github}`;
  const repo = repositoryUrl.split('/').slice(-2).join('/');

  return {
    org: target.name,
    github: target.github,
    logo: `https://avatars.githubusercontent.com/${target.owner}`,
    title: issue.title,
    url: issue.html_url,
    repo,
    labels: Array.isArray(issue.labels)
      ? issue.labels.map((label) => (typeof label === 'string' ? label : label.name))
      : [],
    comments: issue.comments || 0,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    language: null,
  };
}

function headerValue(res, name) {
  const headers = res && res.headers;
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : null;
}

/**
 * GETs a URL with a timeout and a bounded retry on rate limiting.
 * Resolves to { ok, status, data } - it never throws for an HTTP error, so one
 * dead repository cannot take the whole run down.
 */
async function fetchJson(url, headers, fetchImpl = fetch) {
  for (let attempt = 0; ; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetchImpl(url, { headers, signal: controller.signal });

      if (res.ok) {
        return { ok: true, status: res.status, data: await res.json() };
      }

      // 404: repository deleted or renamed. 410: issues disabled.
      if (res.status === 404 || res.status === 410) {
        return { ok: false, status: res.status, skipped: true };
      }

      const retryable = res.status === 403 || res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= MAX_RETRIES) {
        return { ok: false, status: res.status };
      }

      const retryAfter = Number(headerValue(res, 'retry-after'));
      const reset = Number(headerValue(res, 'x-ratelimit-reset'));
      const resetMs = Number.isFinite(reset) && reset > 0 ? reset * 1000 - Date.now() : 0;
      const waitMs = Math.min(
        Math.max(
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0,
          resetMs,
          1000 * 2 ** attempt
        ),
        60000
      );

      await sleep(waitMs);
    } catch (error) {
      if (attempt >= MAX_RETRIES) {
        return { ok: false, status: 0, error: error.message };
      }
      await sleep(1000 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Queries every target with a small worker pool. Dedupe and the per-org cap are
 * applied in completion order, so a repository can never be listed twice.
 */
async function collectIssues({
  targets,
  fetchImpl = fetch,
  headers = {},
  now = Date.now(),
  maxPerOrg = MAX_ISSUES_PER_ORG,
  concurrency = CONCURRENCY,
  log = () => {},
}) {
  const cutoffMs = now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const seen = new Set();
  const issues = [];
  const failures = [];
  const empty = [];
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor];
      cursor += 1;

      const result = await fetchJson(issuesUrl(target.github), headers, fetchImpl);

      if (!result.ok) {
        if (result.skipped) {
          empty.push({ github: target.github, status: result.status });
        } else {
          failures.push({ github: target.github, status: result.status, error: result.error });
        }
        continue;
      }

      if (!Array.isArray(result.data)) {
        failures.push({ github: target.github, status: result.status, error: 'unexpected payload' });
        continue;
      }

      let added = 0;
      for (const issue of result.data) {
        if (added >= maxPerOrg) break;
        if (!isEligibleIssue(issue, cutoffMs)) continue;
        if (seen.has(issue.html_url)) continue;

        seen.add(issue.html_url);
        issues.push(mapIssue(issue, target));
        added += 1;
      }

      log(`  ${target.github} -> ${added}`);
      await sleep(STAGGER_MS);
    }
  }

  const workers = Array.from(
    { length: Math.max(1, Math.min(concurrency, targets.length)) },
    () => worker()
  );

  await Promise.all(workers);

  return { issues, failures, empty, cutoffMs };
}

function parseArgs(argv) {
  const args = { limit: 0, dryRun: false, output: DEFAULT_OUTPUT };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--limit') {
      args.limit = Number.parseInt(argv[i + 1], 10) || 0;
      i += 1;
    } else if (arg.startsWith('--limit=')) {
      args.limit = Number.parseInt(arg.slice('--limit='.length), 10) || 0;
    } else if (arg === '--output') {
      args.output = path.resolve(argv[i + 1]);
      i += 1;
    }
  }

  const envLimit = Number.parseInt(process.env.GFI_LIMIT, 10);
  if (!args.limit && Number.isFinite(envLimit)) args.limit = envLimit;

  return args;
}

function buildHeaders(token = process.env.GITHUB_TOKEN) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gsoc-org-finder-actions',
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { targets, skipped } = normalizeTargets(ORGS);
  const selected = args.limit > 0 ? targets.slice(0, args.limit) : targets;

  if (skipped.length > 0) {
    console.warn(`⚠️  ${skipped.length} organisations cannot be queried:`);
    skipped.forEach((entry) => console.warn(`   ${entry.name}: ${entry.reason} (${entry.github || 'n/a'})`));
  }

  console.log(`🚀 Checking ${selected.length} of ${targets.length} organisations for "${ISSUE_LABEL}"`);

  const { issues, failures, empty } = await collectIssues({
    targets: selected,
    headers: buildHeaders(),
    log: (line) => console.log(line),
  });

  issues.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

  const dataset = {
    updated_at: new Date().toISOString(),
    source_org_count: targets.length,
    checked_org_count: selected.length,
    total_issues: issues.length,
    issues,
  };

  console.log(
    `\n🎉 ${issues.length} unassigned issues from ` +
      `${new Set(issues.map((issue) => issue.org)).size} organisations`
  );

  if (empty.length > 0) {
    console.log(`ℹ️  ${empty.length} repositories have no issues tab (404/410)`);
  }

  if (failures.length > 0) {
    console.error(`❌ ${failures.length} repositories could not be read:`);
    failures.slice(0, 10).forEach((f) => console.error(`   ${f.github}: ${f.status} ${f.error || ''}`.trim()));
  }

  // Refuse to publish a dataset built from nothing: a total failure is a broken
  // token or a broken network, not an empty world.
  if (selected.length > 0 && failures.length === selected.length) {
    console.error('Every request failed; leaving the existing dataset untouched.');
    process.exit(1);
  }

  if (args.dryRun) {
    console.log(JSON.stringify(dataset, null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(dataset, null, 2)}\n`);
  console.log(`💾 Wrote ${path.relative(process.cwd(), args.output)}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal fetch error:', error);
    process.exit(1);
  });
}

module.exports = {
  MAX_ISSUES_PER_ORG,
  MAX_AGE_DAYS,
  normalizeTargets,
  issuesUrl,
  isEligibleIssue,
  mapIssue,
  fetchJson,
  collectIssues,
  buildHeaders,
  parseArgs,
};
