const test = require('node:test');
const assert = require('node:assert');

const {
  MAX_ISSUES_PER_ORG,
  MAX_FAILURE_SHARE,
  normalizeTargets,
  repoUrl,
  issuesUrl,
  isEligibleIssue,
  mapIssue,
  fetchJson,
  collectIssues,
  rejectionReason,
} = require('../agent/scripts/fetch-issues.js');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-07T00:00:00Z');
const CUTOFF = NOW - 365 * DAY;

function issue(overrides = {}) {
  return {
    html_url: 'https://github.com/acme/widget/issues/1',
    repository_url: 'https://api.github.com/repos/acme/widget',
    title: 'Fix the docs',
    state: 'open',
    labels: [{ name: 'good first issue' }, { name: 'docs' }],
    comments: 2,
    assignee: null,
    assignees: [],
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    ...overrides,
  };
}

/**
 * Fake GitHub: `repos` maps "owner/repo" to { meta, pages: [[issue, ...], ...] }.
 * A missing key answers 404, which is what a renamed repository looks like.
 */
function fakeFetch(repos, calls = []) {
  return async (url) => {
    calls.push(url);
    const path = new URL(url).pathname.replace(/^\//, '');
    const parts = path.split('/');           // repos / owner / repo [/ issues]
    const key = `${parts[1]}/${parts[2]}`;
    const entry = repos[key];

    if (!entry) return { ok: false, status: 404, headers: {} };

    if (parts.length === 3) {
      return { ok: true, status: 200, headers: {}, json: async () => entry.meta || {} };
    }

    const page = Number(new URL(url).searchParams.get('page') || '1');
    const payload = (entry.pages || [])[page - 1] || [];
    return { ok: true, status: 200, headers: {}, json: async () => payload };
  };
}

test('normalizeTargets keeps owner/repo entries and reports the rest', () => {
  const { targets, skipped } = normalizeTargets([
    { name: 'Good', github: 'acme/widget' },
    { name: 'Padded', github: '  acme/other  ' },
    { name: 'OwnerOnly', github: 'c2siorg' },
    { name: 'Empty', github: '' },
    { name: 'Missing' },
  ]);

  assert.deepStrictEqual(targets.map((t) => t.github), ['acme/widget', 'acme/other']);
  assert.strictEqual(targets[0].owner, 'acme');
  assert.strictEqual(skipped.length, 3);
  assert.deepStrictEqual(skipped.map((s) => s.reason), ['not owner/repo', 'empty github value', 'empty github value']);
});

test('issuesUrl asks for open issues with the good first issue label', () => {
  const parsed = new URL(issuesUrl('acme/widget'));

  assert.strictEqual(parsed.origin + parsed.pathname, 'https://api.github.com/repos/acme/widget/issues');
  assert.strictEqual(parsed.searchParams.get('state'), 'open');
  assert.strictEqual(parsed.searchParams.get('labels'), 'good first issue');
  assert.strictEqual(parsed.searchParams.get('page'), '1');
  assert.strictEqual(parsed.searchParams.get('per_page'), '50');

  assert.strictEqual(new URL(issuesUrl('acme/widget', 3)).searchParams.get('page'), '3');
  assert.strictEqual(repoUrl('acme/widget'), 'https://api.github.com/repos/acme/widget');
});

test('isEligibleIssue accepts a fresh unassigned issue', () => {
  assert.strictEqual(isEligibleIssue(issue(), CUTOFF), true);
});

test('isEligibleIssue rejects pull requests, assigned issues and stale issues', () => {
  assert.strictEqual(isEligibleIssue(issue({ pull_request: { url: 'x' } }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(issue({ assignees: [{ login: 'someone' }] }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(issue({ assignee: { login: 'someone' } }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(issue({ state: 'closed' }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(issue({ updated_at: '2024-01-01T00:00:00Z' }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(issue({ updated_at: 'not a date' }), CUTOFF), false);
  assert.strictEqual(isEligibleIssue(null, CUTOFF), false);
});

test('mapIssue produces the shape the frontend reads', () => {
  const mapped = mapIssue(issue(), { name: 'Acme', github: 'acme/widget', owner: 'acme' });

  assert.strictEqual(mapped.org, 'Acme');
  assert.strictEqual(mapped.github, 'acme/widget');
  assert.strictEqual(mapped.repo, 'acme/widget');
  assert.strictEqual(mapped.logo, 'https://avatars.githubusercontent.com/acme');
  assert.strictEqual(mapped.url, 'https://github.com/acme/widget/issues/1');
  assert.deepStrictEqual(mapped.labels, ['good first issue', 'docs']);
  assert.strictEqual(mapped.comments, 2);
  assert.strictEqual(mapped.language, null);
});

test('fetchJson reports 404 as a skip rather than an error', async () => {
  const result = await fetchJson('https://api.github.com/repos/gone/repo/issues', {}, fakeFetch({}));

  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.status, 404);
  assert.strictEqual(result.skipped, true);
});

test('fetchJson retries a 403 and succeeds on the next attempt', async () => {
  let calls = 0;
  const flaky = async () => {
    calls += 1;
    if (calls === 1) {
      return { ok: false, status: 403, headers: { 'retry-after': '0' } };
    }
    return { ok: true, status: 200, headers: {}, json: async () => [issue()] };
  };

  const result = await fetchJson('https://api.github.com/repos/acme/widget/issues', {}, flaky);

  assert.strictEqual(result.ok, true);
  assert.strictEqual(calls, 2);
});

test('collectIssues keeps unassigned issues, dedupes and respects the per-org cap', async () => {
  const calls = [];
  const fetchImpl = fakeFetch(
    {
      'acme/widget': {
        meta: { archived: false, has_issues: true },
        pages: [[
          issue({ html_url: 'https://github.com/acme/widget/issues/1' }),
          issue({ html_url: 'https://github.com/acme/widget/issues/2', updated_at: '2026-10-19T00:00:00Z' }),
          issue({ html_url: 'https://github.com/acme/widget/issues/3', updated_at: '2026-10-18T00:00:00Z' }),
          issue({ html_url: 'https://github.com/acme/widget/issues/4', updated_at: '2026-10-17T00:00:00Z' }),
          issue({ html_url: 'https://github.com/acme/widget/issues/5', assignees: [{ login: 'taken' }] }),
        ]],
      },
      'acme/other': {
        meta: { archived: false, has_issues: true },
        pages: [[
          issue({ html_url: 'https://github.com/acme/widget/issues/1' }),
          issue({
            html_url: 'https://github.com/acme/other/issues/9',
            repository_url: 'https://api.github.com/repos/acme/other',
          }),
        ]],
      },
    },
    calls
  );

  const { issues, failures, empty } = await collectIssues({
    targets: [
      { name: 'Acme', github: 'acme/widget', owner: 'acme' },
      { name: 'Other', github: 'acme/other', owner: 'acme' },
      { name: 'Gone', github: 'gone/repo', owner: 'gone' },
    ],
    fetchImpl,
    now: NOW,
    concurrency: 1,
  });

  assert.strictEqual(issues.length, MAX_ISSUES_PER_ORG + 1);
  assert.deepStrictEqual(
    issues.map((i) => i.url),
    [
      'https://github.com/acme/widget/issues/1',
      'https://github.com/acme/widget/issues/2',
      'https://github.com/acme/widget/issues/3',
      'https://github.com/acme/other/issues/9',
    ]
  );
  assert.strictEqual(failures.length, 0);
  assert.strictEqual(empty.length, 1);
});

test('collectIssues skips archived repositories and repositories without issues', async () => {
  const fetchImpl = fakeFetch({
    'acme/archived': { meta: { archived: true, has_issues: true }, pages: [[issue()]] },
    'acme/disabled': { meta: { archived: false, has_issues: false }, pages: [[issue()]] },
    'acme/live': { meta: { archived: false, has_issues: true }, pages: [[issue()]] },
  });

  const result = await collectIssues({
    targets: [
      { name: 'Archived', github: 'acme/archived', owner: 'acme' },
      { name: 'Disabled', github: 'acme/disabled', owner: 'acme' },
      { name: 'Live', github: 'acme/live', owner: 'acme' },
    ],
    fetchImpl,
    now: NOW,
    concurrency: 1,
  });

  assert.deepStrictEqual(result.archived, ['acme/archived']);
  assert.deepStrictEqual(result.noIssues, ['acme/disabled']);
  assert.strictEqual(result.issues.length, 1);
  assert.strictEqual(result.failures.length, 0);
});

test('collectIssues pages past a first page with nothing eligible', async () => {
  const fetchImpl = fakeFetch({
    'acme/widget': {
      meta: { archived: false, has_issues: true },
      pages: [
        // A full first page where every issue is already assigned.
        Array.from({ length: 50 }, (_, i) => issue({
          html_url: `https://github.com/acme/widget/issues/${i + 1}`,
          assignees: [{ login: 'taken' }],
        })),
        [issue({ html_url: 'https://github.com/acme/widget/issues/99' })],
      ],
    },
  });

  const { issues } = await collectIssues({
    targets: [{ name: 'Acme', github: 'acme/widget', owner: 'acme' }],
    fetchImpl,
    now: NOW,
    concurrency: 1,
  });

  assert.deepStrictEqual(issues.map((i) => i.url), ['https://github.com/acme/widget/issues/99']);
});

test('collectIssues records a failure without aborting the run', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('acme/broken')) throw new Error('socket hang up');
    return { ok: true, status: 200, headers: {}, json: async () => ({ archived: false, has_issues: true }) };
  };

  const { issues, failures } = await collectIssues({
    targets: [
      { name: 'Broken', github: 'acme/broken', owner: 'acme' },
      { name: 'Acme', github: 'acme/widget', owner: 'acme' },
    ],
    fetchImpl,
    now: NOW,
    concurrency: 1,
  });

  assert.strictEqual(issues.length, 0);
  assert.strictEqual(failures.length, 1);
  assert.strictEqual(failures[0].github, 'acme/broken');
});

test('rejectionReason blocks empty and mostly-failed runs', () => {
  const one = [{ github: 'a/b' }];

  assert.strictEqual(rejectionReason({ selected: 0, failures: [], empty: [], isSmokeTest: false }), null);

  assert.match(
    rejectionReason({ selected: 1, failures: [], empty: one, isSmokeTest: false }),
    /every repository failed/
  );

  assert.match(
    rejectionReason({ selected: 1, failures: one, empty: [], isSmokeTest: false }),
    /every repository failed/
  );

  const failures = Array.from({ length: 20 }, (_, i) => ({ github: `a/r${i}` }));
  assert.match(
    rejectionReason({ selected: 184, failures, empty: [], isSmokeTest: false }),
    /over the 10% limit/
  );

  // A handful of failures is tolerated.
  assert.strictEqual(
    rejectionReason({ selected: 184, failures: failures.slice(0, Math.floor(184 * MAX_FAILURE_SHARE)), empty: [], isSmokeTest: false }),
    null
  );

  // Smoke tests are exempt: they cover a slice of orgs by design.
  assert.strictEqual(rejectionReason({ selected: 5, failures, empty: [], isSmokeTest: true }), null);
});
