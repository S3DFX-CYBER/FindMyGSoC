/* eslint-env node */
const test = require('node:test');
const assert = require('node:assert');
const {
  hoursFromText,
  normaliseProject,
  buildDataset,
  projectArray,
  looksLikeProject,
} = require('../scripts/fetch-official-projects.js');

// Shaped like the real payload: the size lives in the prose, not in a field.
const PAYLOAD = {
  results: [
    {
      id: 'b4304175',
      title: '6LoWPAN Mesh Under Routing Enhancements',
      description: 'Replacing unconditional flooding with Trickle suppression. Medium 175 hours.',
      organization: { name: 'The ns-3 Network Simulator Project' },
      mentors: [{ name: 'Tommaso Pecorella' }, { name: 'Adnan Rashid' }],
      projectTechnologies: ['python', 'c++'],
      projectTopics: ['iot', 'networking'],
      contributor: { name: 'Usham Roy' },
    },
    {
      id: 'XpIvwSE0',
      title: 'OWASP Web Application Honeypot',
      description: 'Total effort is 350 hours across 13 weeks.',
      organization: { name: 'OWASP Foundation' },
      mentors: ['Adrian Winckles'],
      projectTechnologies: ['python', 'docker'],
      projectTopics: ['security'],
      contributor: { name: 'R1sh0bh' },
    },
    {
      id: 'noSize01',
      title: 'A project with no stated size',
      description: 'This description never says how long the project is.',
      organization: { name: 'OWASP Foundation' },
      mentors: [],
      projectTechnologies: [],
      projectTopics: [],
    },
    // Not a project: no title.
    { id: 'junk', description: 'nothing here' },
  ],
};

test('reads the size from prose', () => {
  assert.strictEqual(hoursFromText('Medium 175 hours.'), 175);
  assert.strictEqual(hoursFromText('Total effort is 350 hours across 13 weeks'), 350);
  assert.strictEqual(hoursFromText('a 90 hour project'), 90);
});

test('reads size words, and never guesses', () => {
  assert.strictEqual(hoursFromText('Project size: Large'), 350);
  assert.strictEqual(hoursFromText('no duration stated here'), null);
  assert.strictEqual(hoursFromText(''), null);
  assert.strictEqual(hoursFromText(null), null);
});

test('ignores hour counts that are not GSoC sizes', () => {
  assert.strictEqual(hoursFromText('we meet for 40 hours'), null);
  assert.strictEqual(hoursFromText('2000 hours of work'), null);
});

test('finds the project array in the shapes the API uses', () => {
  assert.ok(Array.isArray(projectArray(PAYLOAD)));
  assert.ok(Array.isArray(projectArray({ projects: [] })));
  assert.strictEqual(projectArray({ nope: 1 }), null);
});

test('rejects items that are not projects', () => {
  assert.strictEqual(looksLikeProject({ title: 'x' }), false);
  assert.strictEqual(looksLikeProject({ organization: 'x' }), false);
  assert.strictEqual(looksLikeProject({ title: 'x', organization: { name: 'y' } }), true);
});

test('normalises a project into what the app reads', () => {
  const p = normaliseProject(PAYLOAD.results[0], 2026);
  assert.strictEqual(p.org, 'The ns-3 Network Simulator Project');
  assert.strictEqual(p.title, '6LoWPAN Mesh Under Routing Enhancements');
  assert.strictEqual(p.hours, 175);
  assert.deepStrictEqual(p.mentors, ['Tommaso Pecorella', 'Adnan Rashid']);
  assert.deepStrictEqual(p.technologies, ['python', 'c++']);
  assert.deepStrictEqual(p.topics, ['iot', 'networking']);
  assert.strictEqual(p.contributor, 'Usham Roy');
  assert.match(p.url, /\/programs\/2026\/projects\/b4304175$/);
});

test('builds a dataset grouped by organisation', () => {
  const data = buildDataset(PAYLOAD, 2026);
  assert.strictEqual(data._meta.projects, 3, 'the title-less item is dropped');
  assert.strictEqual(data._meta.organisations, 2);
  assert.strictEqual(data._meta.withHours, 2, 'the third project states no size');
  assert.strictEqual(data['OWASP Foundation'].length, 2);

  const byTitle = Object.fromEntries(data['OWASP Foundation'].map((p) => [p.title, p]));
  assert.strictEqual(byTitle['OWASP Web Application Honeypot'].hours, 350);
  assert.strictEqual(
    byTitle['A project with no stated size'].hours,
    null,
    'no size means null, not a guess'
  );
});

test('refuses a payload with no project array', () => {
  assert.throws(() => buildDataset({ nope: true }), /project array/);
});
