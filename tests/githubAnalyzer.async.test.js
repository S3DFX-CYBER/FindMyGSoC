const test = require('node:test');
const assert = require('node:assert');

const memoryStore = {};
globalThis.localStorage = {
  getItem: (key) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key, value) => {
    memoryStore[key] = value;
  },
  removeItem: (key) => {
    delete memoryStore[key];
  },
};

test('analyzeGitHubUser polls queued API jobs until completed response', async () => {
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount++;
    if (fetchCount === 1) {
      return {
        status: 202,
        ok: true,
        json: async () => ({ job: 'job-123', poll: '/api/github?job=job-123' }),
      };
    }
    if (fetchCount === 2) {
      return {
        status: 202,
        ok: true,
        json: async () => ({ job: 'job-123', status: 'processing' }),
      };
    }
    return {
      status: 200,
      ok: true,
      json: async () => ({
        languages: ['JavaScript'],
        topics: ['web'],
        stars: 12,
        activity: 'high',
      }),
    };
  };

  const { analyzeGitHubUser } = require('../src/js/githubAnalyzer.js');
  const result = await analyzeGitHubUser('octocat');

  assert.deepStrictEqual(result, {
    languages: ['JavaScript'],
    topics: ['web'],
    stars: 12,
    activity: 'high',
  });
  assert.strictEqual(fetchCount, 3);
});
