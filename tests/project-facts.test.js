/* eslint-env node */
const test = require('node:test');
const assert = require('node:assert');
const {
  factsFromPage,
  extractSizes,
  extractProjects,
  extractDifficulty,
} = require('../scripts/extract-project-facts.js');

const HOURS_PAGE = `
<html><body>
  <h2>Improve the widget parser</h2>
  <p>This project rewrites the parser. Size: 175 hours.</p>
  <h2>Write documentation for the CLI</h2>
  <p>Small, self-contained. 90 hours of work.</p>
</body></html>`;

const SIZE_WORDS_PAGE = `
<html><body>
  <h3>Port the exporter</h3>
  <p><strong>Project size:</strong> Large</p>
  <p>Difficulty: Hard</p>
</body></html>`;

const NOTHING_PAGE = `
<html><body><h1>Our ideas list</h1><p>Coming soon.</p></body></html>`;

test('reads GSoC project sizes in hours', () => {
  assert.deepStrictEqual(extractSizes(HOURS_PAGE), [90, 175]);
});

test('reads size words as their hour equivalents', () => {
  assert.deepStrictEqual(extractSizes(SIZE_WORDS_PAGE), [350]);
});

test('ignores hour counts that are not GSoC sizes', () => {
  const page = '<p>We meet for 24 hours and then work 48 hours.</p>';
  assert.deepStrictEqual(extractSizes(page), []);
});

test('pairs each size with the nearest heading before it', () => {
  const projects = extractProjects(HOURS_PAGE);
  const bySize = Object.fromEntries(projects.map((p) => [p.hours, p.title]));
  assert.match(bySize[175], /Improve the widget parser/);
  assert.match(bySize[90], /Write documentation/);
});

test('reads stated difficulty without inventing one', () => {
  assert.deepStrictEqual(extractDifficulty(SIZE_WORDS_PAGE).sort(), ['hard']);
  assert.deepStrictEqual(extractDifficulty(NOTHING_PAGE), []);
});

test('returns null rather than guessing when a page states nothing', () => {
  assert.strictEqual(factsFromPage(NOTHING_PAGE, 'https://example.org/ideas'), null);
});

test('records the source and the sizes it found', () => {
  const facts = factsFromPage(HOURS_PAGE, 'https://example.org/ideas');
  assert.strictEqual(facts.source, 'https://example.org/ideas');
  assert.deepStrictEqual(facts.sizes, [90, 175]);
  assert.ok(facts.projects.length >= 2);
  assert.ok(typeof facts.fetchedAt === 'string');
});

test('does not duplicate the same title and size', () => {
  const repeated = `${HOURS_PAGE}<p>175 hours</p>`;
  const projects = extractProjects(repeated);
  const keys = projects.map((p) => `${p.title}|${p.hours}`);
  assert.strictEqual(new Set(keys).size, keys.length);
});
