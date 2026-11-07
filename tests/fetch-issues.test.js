const test = require('node:test');
const assert = require('node:assert');

const {
  MAX_ISSUES_PER_ORG,
  normalizeTargets,
  issuesUrl,
  isEligibleIssue,
  mapIssue,
  fetchJson,
  collectIssues,
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

function fakeFetch(payloadByRepo, calls = []) {
  return async (url) => {
    calls.push(url);
    const repo = url.split('/repos/')[1].split('/issues')[0];
    const payload = payloadByRepo[repo];

    if (payload === undefined) {
      return { ok: false, status: 404, headers: {} };
    }

    return {
      ok: true,
      status: 200,
      headers: {},
      json: async () => payload,
    };
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
  const url = issuesUrl('acme/widget');
  const parsed = new URL(url);

  assert.strictEqual(parsed.origin + parsed.pathname, 'https://api.github.com/repos/acme/widget/issues');
  assert.strictEqual(parsed.searchParams.get('state'), 'open');
  assert.strictEqual(parsed.searchParams.get('labels'), 'good first issue');
  assert.strictEqual(parsed.searchParams.get('per_page'), '50');
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
      'acme/widget': [
        issue({ html_url: 'https://github.com/acme/widget/issues/1' }),
        issue({ html_url: 'https://github.com/acme/widget/issues/2', updated_at: '2026-10-19T00:00:00Z' }),
        issue({ html_url: 'https://github.com/acme/widget/issues/3', updated_at: '2026-10-18T00:00:00Z' }),
        issue({ html_url: 'https://github.com/acme/widget/issues/4', updated_at: '2026-10-17T00:00:00Z' }),
        issue({ html_url: 'https://github.com/acme/widget/issues/5', assignees: [{ login: 'taken' }] }),
      ],
      'acme/other': [
        issue({ html_url: 'https://github.com/acme/widget/issues/1' }),
        issue({
          html_url: 'https://github.com/acme/other/issues/9',
          repository_url: 'https://api.github.com/repos/acme/other',
        }),
      ],
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

  assert.strictEqual(calls.length, 3);
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

test('collectIssues records a failure without aborting the run', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('acme/broken')) throw new Error('socket hang up');
    return { ok: true, status: 200, headers: {}, json: async () => [issue()] };
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

  assert.strictEqual(issues.length, 1);
  assert.strictEqual(failures.length, 1);
  assert.strictEqual(failures[0].github, 'acme/broken');
});
