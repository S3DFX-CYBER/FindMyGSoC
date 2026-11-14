const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment before importing app.js
globalThis.window = {};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {}
};
globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => {}
    }
  },
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Import the module
const { escapeHtml, sanitizeHrefUrl, validateIdeasUrl, safeHTML } = require('../src/js/app.js');

test('escapeHtml sanitizes unsafe HTML strings', () => {
  assert.strictEqual(escapeHtml('<script>alert("XSS")</script>'), '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  assert.strictEqual(escapeHtml('Hello & Welcome'), 'Hello &amp; Welcome');
  assert.strictEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
  assert.strictEqual(escapeHtml("'single'"), '&#39;single&#39;');
});

test('sanitizeHrefUrl filters out dangerous protocols', () => {
  assert.strictEqual(sanitizeHrefUrl('https://example.com'), 'https://example.com/');
  assert.strictEqual(sanitizeHrefUrl('http://example.com/path?query=1'), 'http://example.com/path?query=1');
  assert.strictEqual(sanitizeHrefUrl('javascript:alert(1)'), null);
  assert.strictEqual(sanitizeHrefUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.strictEqual(sanitizeHrefUrl('vbscript:msgbox(1)'), null);
  assert.strictEqual(sanitizeHrefUrl('file:///etc/passwd'), null);
  assert.strictEqual(sanitizeHrefUrl(''), null);
  assert.strictEqual(sanitizeHrefUrl('   '), null);
  assert.strictEqual(sanitizeHrefUrl('invalid-url'), null);
});

test('safeHTML escapes scalar and array interpolations', () => {
  const rendered = safeHTML`<div title="${'" onclick="alert(1)'}">${[
    '<img src=x onerror=alert(1)>',
    safeHTML`<span>${'safe text'}</span>`
  ]}</div>`;

  assert.ok(!String(rendered).includes('<img src=x'));
  assert.ok(!String(rendered).includes('onclick="alert(1)"'));
  assert.ok(String(rendered).includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(String(rendered).includes('<span>safe text</span>'));
});

test('validateIdeasUrl formats and validates ideas page URLs', () => {
  assert.strictEqual(validateIdeasUrl('example.com/ideas'), 'https://example.com/ideas');
  assert.strictEqual(validateIdeasUrl('http://example.com'), 'http://example.com');
  assert.strictEqual(validateIdeasUrl('https://example.com/ideas.html'), 'https://example.com/ideas.html');
  assert.strictEqual(validateIdeasUrl('javascript:alert(1)'), null);
  assert.strictEqual(validateIdeasUrl(''), null);
  assert.strictEqual(validateIdeasUrl(null), null);
});
