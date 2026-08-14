const test = require('node:test');
const assert = require('node:assert');

// Mock globalThis/window mappings
globalThis.window = {};

const { normalizeSkill, extractSkills } = require('../src/js/skillExtractor.js');

test('normalizeSkill maps aliases to standard names', () => {
  assert.strictEqual(normalizeSkill('rails'), 'ruby on rails');
  assert.strictEqual(normalizeSkill('nodejs'), 'node.js');
  assert.strictEqual(normalizeSkill('ml'), 'machine learning');
  assert.strictEqual(normalizeSkill('ai'), 'ai');
  assert.strictEqual(normalizeSkill('golang'), 'go');
  assert.strictEqual(normalizeSkill('csharp'), 'csharp');
  assert.strictEqual(normalizeSkill('reactjs'), 'react');
});

test('extractSkills extracts multi-character skills correctly', () => {
  const text = 'I build web applications using React, Python, Django, and Docker.';
  const extracted = extractSkills(text);
  
  assert.ok(extracted.includes('react'));
  assert.ok(extracted.includes('python'));
  assert.ok(extracted.includes('django'));
  assert.ok(extracted.includes('docker'));
});

test('extractSkills handles single-character language C and R with technical context', () => {
  // C programming language match with technical context
  const textC1 = 'I am highly proficient in C programming.';
  assert.ok(extractSkills(textC1).includes('c'));
  
  const textC2 = 'Skills: Python, Rust, C, Assembly.';
  assert.ok(extractSkills(textC2).includes('c'));

  // R programming language match with technical context
  const textR1 = 'I have experience using R statistics and RStudio.';
  assert.ok(extractSkills(textR1).includes('r'));
  
  const textR2 = 'Data science stack: python, julia, r.';
  assert.ok(extractSkills(textR2).includes('r'));

  // False positives should be rejected
  const textFalseC = 'This is a sample text without any lang.';
  assert.strictEqual(extractSkills(textFalseC).includes('c'), false);
  assert.strictEqual(extractSkills(textFalseC).includes('r'), false);
});

test('extractSkills handles Go programming language context rules', () => {
  // Positive matches for Go
  assert.ok(extractSkills('I write Go programming language application services.').includes('go'));
  assert.ok(extractSkills('Backend systems written in Go.').includes('go'));
  assert.ok(extractSkills('Stack: Docker, Go, Kubernetes').includes('go'));

  // Negative matches / false positives
  assert.strictEqual(extractSkills('I go to the store.').includes('go'), false);
  assert.strictEqual(extractSkills('Let us go back to our work.').includes('go'), false);
});
