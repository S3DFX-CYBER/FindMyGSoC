const test = require('node:test');
const assert = require('node:assert');

// Minimal browser stubs: app.js wires listeners at load time.
globalThis.window = { location: { search: '' }, addEventListener: () => {}, open: () => {} };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
globalThis.document = {
  documentElement: { classList: { toggle: () => {}, add: () => {}, remove: () => {} } },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, setAttribute: () => {}, appendChild: () => {} })
};
globalThis.ORGS = require('../src/js/org.js');

const { gsocOrgUrl, buildMentorIntro, mentorPathHtml } = require('../src/js/app.js');

test('gsocOrgUrl returns the official page only when ideas is already one', () => {
  assert.strictEqual(
    gsocOrgUrl({ ideas: 'https://summerofcode.withgoogle.com/programs/2026/organizations/owasp-foundation' }),
    'https://summerofcode.withgoogle.com/programs/2026/organizations/owasp-foundation'
  );
  assert.strictEqual(
    gsocOrgUrl({ ideas: 'https://summerofcode.withgoogle.com/archive/2021/organizations/5704942551040000/' }),
    'https://summerofcode.withgoogle.com/archive/2021/organizations/5704942551040000/'
  );
  assert.strictEqual(gsocOrgUrl({ ideas: 'https://owasp.org/initiatives/gsoc/' }), '');
  assert.strictEqual(gsocOrgUrl({ ideas: 'https://summerofcode.withgoogle.com/programs/2026/organizations/' }), '');
  assert.strictEqual(gsocOrgUrl({}), '');
  assert.strictEqual(gsocOrgUrl(null), '');
});

test('buildMentorIntro names the org and keeps the placeholders a newcomer must fill', () => {
  const text = buildMentorIntro({ name: 'OWASP Foundation' });

  assert.match(text, /OWASP Foundation ideas page/);
  assert.match(text, /<your GitHub handle>/);
  assert.match(text, /<project>/);
  assert.match(text, /<repo or issue>/);
  assert.match(text, /good first issue/);
  assert.strictEqual(text.split('\n').length, 4);
});

test('buildMentorIntro survives an org without a name', () => {
  assert.match(buildMentorIntro(null), /this organisation/);
});

test('mentorPathHtml always renders the three steps', () => {
  const html = mentorPathHtml({ name: 'OWASP Foundation', ideas: 'https://owasp.org/initiatives/gsoc/' });

  assert.match(html, /How to reach these mentors/);
  assert.match(html, /Open their GSoC page/);
  assert.match(html, /Read what they want built/);
  assert.match(html, /Say hello in public, not in a DM/);
  assert.match(html, /data-copy-intro/);
  assert.match(html, /owasp\.org\/initiatives\/gsoc/);
});

test('mentorPathHtml falls back to the GSoC index when the org has no official url', () => {
  const html = mentorPathHtml({ name: 'Blender Foundation', ideas: 'https://developer.blender.org/' });

  assert.match(html, /Find them on the GSoC organisations page/);
  assert.match(html, /summerofcode\.withgoogle\.com\/programs\/2026\/organizations/);
});

test('mentorPathHtml escapes the org name it echoes back', () => {
  const html = mentorPathHtml({ name: '<img src=x onerror=alert(1)>', ideas: '' });
  assert.ok(!html.includes('<img src=x'));
  assert.match(html, /&lt;img/);
});

test('every org in the dataset renders a path without throwing', () => {
  globalThis.ORGS.forEach((org) => {
    const html = mentorPathHtml(org);
    assert.ok(html.includes('How to reach these mentors'), org.slug);
    assert.ok(!html.includes('undefined'), org.slug);
  });
});
