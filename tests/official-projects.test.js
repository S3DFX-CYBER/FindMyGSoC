/* eslint-env node */
const test = require('node:test');
const assert = require('node:assert');
const {
  hoursFromText,
  parseDetailHtml,
  outputPathFor,
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

// Shaped like a project detail page: a label, then the comma-separated values.
const DETAIL_HTML = `
<div><h1>6LoWPAN Mesh Under Routing Enhancements</h1>
<p>Contributor</p><p>Usham Roy</p>
<p>Mentors</p><p>Tommaso Pecorella, Adnan Rashid</p>
<p>Technologies</p><p>python, linux, c++, cmake</p>
<p>Topics</p><p>iot, ipv6, network simulation</p>
<p>This project enhances 6LoWPAN mesh under routing. Medium 175 hours.</p></div>`;

test('reads technologies, topics and size from a detail page', () => {
  const d = parseDetailHtml(DETAIL_HTML);
  assert.deepStrictEqual(d.technologies, ['python', 'linux', 'c++', 'cmake']);
  assert.deepStrictEqual(d.topics, ['iot', 'ipv6', 'network simulation']);
  assert.strictEqual(d.hours, 175);
});

test('returns nothing rather than guessing when a section is missing', () => {
  const d = parseDetailHtml('<p>Technologies</p><p>rust</p>');
  assert.deepStrictEqual(d.technologies, ['rust']);
  assert.deepStrictEqual(d.topics, []);
  assert.strictEqual(d.hours, null);
});

test('writes one file per year, so a fetch cannot clobber another year', () => {
  assert.match(outputPathFor(2026), /projects-2026\.json$/);
  assert.match(outputPathFor(2025), /projects-2025\.json$/);
  assert.notStrictEqual(outputPathFor(2025), outputPathFor(2026));
});

// The shape /api/archive/programs/2026/projects/ actually returns, trimmed.
const REAL_PAYLOAD = [
  {
    title: 'PyGoat v3 - Microservices, Labs, and Learning Paths',
    project_code_url: 'https://samyak003.in/gsoc-report.html',
    tech_tags: ['python', 'postgresql', 'django', 'docker'],
    topic_tags: ['web development', 'web application security'],
    status: 'passed',
    program_slug: '2026',
    contributor_display_name: 'samyak003',
    mentor_names: ['Rupak', 'Garvita_Kataria'],
    abstract_short: 'This proposal outlines modernization of Pygoat.',
    abstract_html: 'A structural overhaul. Medium 175 hours of work.',
    id: 'qeGHeh6D',
    organization_name: 'OWASP Foundation',
    organization_slug: 'owasp-foundation',
  },
];

test('reads the payload the archive endpoint really returns', () => {
  const data = buildDataset(REAL_PAYLOAD, 2026);
  const project = data['OWASP Foundation'][0];
  assert.strictEqual(project.title, 'PyGoat v3 - Microservices, Labs, and Learning Paths');
  assert.strictEqual(project.hours, 175, 'size parsed from abstract_html');
  assert.deepStrictEqual(project.mentors, ['Rupak', 'Garvita_Kataria']);
  assert.deepStrictEqual(project.technologies, ['python', 'postgresql', 'django', 'docker']);
  assert.deepStrictEqual(project.topics, ['web development', 'web application security']);
  assert.strictEqual(project.contributor, 'samyak003');
  assert.strictEqual(project.status, 'passed');
  assert.strictEqual(project.codeUrl, 'https://samyak003.in/gsoc-report.html');
  assert.strictEqual(project.url, 'https://summerofcode.withgoogle.com/programs/2026/projects/qeGHeh6D');
});
