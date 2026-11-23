const test = require('node:test');
const assert = require('node:assert');

// Provide minimal stubs for importing app.js in Node
const noop = () => {};
const mockStorage = { getItem: () => null, setItem: noop, removeItem: noop };
globalThis.localStorage = mockStorage;
globalThis.sessionStorage = mockStorage;
globalThis.document = {
  documentElement: { classList: { toggle: noop } },
  getElementById: () => null,
  addEventListener: noop
};
globalThis.ORGS = [];

const { debounce } = require('../src/js/app.js');

test('debounce invokes callback after specified delay', async () => {
  let callCount = 0;
  let receivedArg = null;

  const fn = debounce((arg) => {
    callCount++;
    receivedArg = arg;
  }, 50);

  fn('initial');
  assert.strictEqual(callCount, 0, 'should not execute immediately');

  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.strictEqual(callCount, 1, 'should execute once after delay');
  assert.strictEqual(receivedArg, 'initial');
});

test('debounce coalesces multiple rapid calls into single execution with latest argument', async () => {
  let callCount = 0;
  let receivedArg = null;

  const fn = debounce((arg) => {
    callCount++;
    receivedArg = arg;
  }, 50);

  fn('call 1');
  fn('call 2');
  fn('call 3');

  assert.strictEqual(callCount, 0, 'should not execute synchronously');

  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.strictEqual(callCount, 1, 'should coalesce calls into a single invocation');
  assert.strictEqual(receivedArg, 'call 3', 'should be called with latest argument');
});

test('debounce uses default delay of 250ms when delay parameter is omitted', async () => {
  let callCount = 0;

  const fn = debounce(() => {
    callCount++;
  });

  fn();

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.strictEqual(callCount, 0, 'should not have executed yet at 100ms with 250ms default');

  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.strictEqual(callCount, 1, 'should have executed after 300ms total');
});

test('debounce preserves caller context (this binding)', async () => {
  const contextObj = {
    tag: 'custom-context',
    run: null
  };

  let capturedContext = null;

  contextObj.run = debounce(function () {
    capturedContext = this;
  }, 50);

  contextObj.run();

  await new Promise((resolve) => setTimeout(resolve, 80));

  assert.strictEqual(capturedContext, contextObj, 'should preserve this binding');
});

test('debounce cancel() clears any pending scheduled invocation', async () => {
  let callCount = 0;

  const fn = debounce(() => {
    callCount++;
  }, 50);

  fn();
  assert.strictEqual(callCount, 0);

  // Cancel before timeout fires
  fn.cancel();

  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.strictEqual(callCount, 0, 'invocation should have been canceled');
});

test('index.html inline script wires debounced handlers with cancellation', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  assert.ok(htmlContent.includes('createDebouncedHandler'), 'index.html should define debounced handler');
  assert.ok(htmlContent.includes('debouncedPerformSearch'), 'index.html should wire debounced search');
  assert.ok(htmlContent.includes('debouncedPerformSearch.cancel()'), 'hero search submit should cancel pending debounce');
  assert.ok(htmlContent.includes('debouncedRenderMentorFinder.cancel()'), 'mentor filter change should cancel pending debounce');
});
