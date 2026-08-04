const test = require('node:test');
const assert = require('node:assert');

// --- DOM mocks -----------------------------------------------------------

function createStubEl(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    placeholder: '',
    className: '',
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    children: [],
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      toggle(c, force) {
        if (force === undefined) this._classes.has(c) ? this._classes.delete(c) : this._classes.add(c);
        else force ? this._classes.add(c) : this._classes.delete(c);
      },
      contains(c) { return this._classes.has(c); }
    },
    appendChild(child) { el.children.push(child); return child; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    focus() {}
  };
  return el;
}

const fileUploadEl = createStubEl('aiResumeFile', 'input');
const fileChangeListeners = [];
fileUploadEl.addEventListener = (evt, handler) => { fileChangeListeners.push(handler); };

const resumeTextEl = createStubEl('aiResumeText', 'textarea');
const errorStateEl = createStubEl('aiErrorState');
const errorMsgEl = createStubEl('aiErrorMsg');
const resultsContainerEl = createStubEl('aiResultsContainer');

const mockElements = {
  aiResumeFile: fileUploadEl,
  aiResumeText: resumeTextEl,
  aiGhUsername: createStubEl('aiGhUsername', 'input'),
  aiLoadingState: createStubEl('aiLoadingState'),
  aiErrorState: errorStateEl,
  aiResultsContainer: resultsContainerEl,
  aiErrorMsg: errorMsgEl,
  btnGetRecommendations: createStubEl('btnGetRecommendations', 'button')
};

globalThis.window = {};
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };

const docListeners = {};
globalThis.document = {
  getElementById: (id) => mockElements[id] || null,
  addEventListener: (event, handler) => { docListeners[event] = handler; },
  querySelectorAll: () => []
};
globalThis.pdfjsLib = undefined;

const recommendationUi = require('../src/js/recommendation-ui.js');

if (docListeners['DOMContentLoaded']) {
  docListeners['DOMContentLoaded']();
}

// --- helpers -------------------------------------------------------------

function makeFile(name, size, content, type) {
  const buf = Buffer.from(content, 'utf8');
  return {
    name,
    size,
    type: type || '',
    arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    text: async () => content
  };
}

function resetStubs() {
  fileUploadEl.value = '';
  resumeTextEl.value = '';
  resumeTextEl.placeholder = '';
  errorStateEl.classList._classes.clear();
  errorMsgEl.textContent = '';
  globalThis.pdfjsLib = undefined;
}

function triggerUpload(file) {
  fileUploadEl.value = file.name;
  errorStateEl.classList._classes.clear();
  errorMsgEl.textContent = '';
  return Promise.all(fileChangeListeners.map(h => h({ target: { files: [file] } })));
}

// --- tests ---------------------------------------------------------------

const escapeHtml = recommendationUi.safeEscapeHtml;

test('escapeHtml polyfill escapes XSS vectors', () => {
  assert.strictEqual(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(escapeHtml('A & B'), 'A &amp; B');
  assert.strictEqual(escapeHtml('"quoted"'), '&quot;quoted&quot;');
  assert.strictEqual(escapeHtml("'single'"), '&#039;single&#039;');
  assert.strictEqual(escapeHtml('clean text'), 'clean text');
});

test('escapeHtml handles edge cases', () => {
  assert.strictEqual(escapeHtml(''), '');
  assert.strictEqual(escapeHtml(null), 'null');
  assert.strictEqual(escapeHtml(undefined), 'undefined');
  assert.strictEqual(escapeHtml(123), '123');
});

test('pdfjsLib is not loaded at page init (lazy-load)', () => {
  assert.strictEqual(typeof pdfjsLib, 'undefined', 'pdfjsLib should not be loaded eagerly');
});

test('.txt upload reads file content into textarea', async () => {
  resetStubs();
  await triggerUpload(makeFile('resume.txt', 50, 'Python, React, Docker'));
  assert.strictEqual(resumeTextEl.value, 'Python, React, Docker');
});

test('rejects file over 5MB', async () => {
  resetStubs();
  const bigFile = makeFile('huge.txt', 6 * 1024 * 1024, 'x');
  await triggerUpload(bigFile);
  assert.ok(errorMsgEl.textContent.includes('File too large'), 'should show size error');
  assert.ok(errorMsgEl.textContent.includes('6.0MB'), 'should include actual file size');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('rejects unsupported file type (.md)', async () => {
  resetStubs();
  await triggerUpload(makeFile('notes.md', 100, '# Hello'));
  assert.ok(errorMsgEl.textContent.includes('Unsupported file type'), 'should show type error');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('rejects .txt renamed to .pdf when MIME type mismatches', async () => {
  resetStubs();
  const spoofed = makeFile('resume.pdf', 100, 'Python, React', 'text/plain');
  await triggerUpload(spoofed);
  assert.ok(errorMsgEl.textContent.includes('File type mismatch'), 'should show MIME mismatch error');
  assert.ok(errorMsgEl.textContent.includes('.pdf'), 'should mention expected extension');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('accepts .pdf when MIME type is empty (browser did not supply type)', async () => {
  resetStubs();
  const noMime = makeFile('resume.pdf', 100, 'Python, React', '');
  await triggerUpload(noMime);
  assert.strictEqual(resumeTextEl.value, '', 'should not populate text (pdfjsLib not mocked)');
  assert.ok(!errorMsgEl.textContent.includes('File type mismatch'), 'should not reject on empty MIME');
});

test('accepts .pdf and extracts text via mock pdfjsLib', async () => {
  resetStubs();
  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: () => Promise.resolve({
          getTextContent: () => Promise.resolve({
            items: [{ str: 'PDF extracted text', hasEOL: false }]
          })
        })
      })
    })
  };

  await triggerUpload(makeFile('resume.pdf', 200, 'dummy'));
  assert.strictEqual(resumeTextEl.value, 'PDF extracted text');
});

test('multi-page PDF concatenates all pages', async () => {
  resetStubs();
  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: 'already-set' },
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 3,
        getPage: (n) => Promise.resolve({
          getTextContent: () => Promise.resolve({
            items: [{ str: `Page${n}`, hasEOL: n === 3 }]
          })
        })
      })
    })
  };

  await triggerUpload(makeFile('multipage.pdf', 300, 'dummy'));
  assert.ok(resumeTextEl.value.includes('Page1'));
  assert.ok(resumeTextEl.value.includes('Page2'));
  assert.ok(resumeTextEl.value.includes('Page3'));
});

test('empty PDF text shows image-based error', async () => {
  resetStubs();
  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: () => Promise.resolve({
          getTextContent: () => Promise.resolve({ items: [] })
        })
      })
    })
  };

  await triggerUpload(makeFile('scanned.pdf', 200, 'dummy'));
  assert.ok(errorMsgEl.textContent.includes('No extractable text'), 'should show empty-text error');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('stale-token prevents older upload from overwriting newer', async () => {
  resetStubs();

  let resolveFirst;
  const firstPromise = new Promise(r => { resolveFirst = r; });

  let getDocCallCount = 0;
  let slowParkedResolve;
  const slowParked = new Promise(r => { slowParkedResolve = r; });

  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: 'set' },
    getDocument: () => {
      getDocCallCount++;
      if (getDocCallCount === 1) {
        slowParkedResolve();
        return { promise: firstPromise };
      }
      return {
        promise: Promise.resolve({
          numPages: 1,
          getPage: () => Promise.resolve({
            getTextContent: () => Promise.resolve({
              items: [{ str: 'second result', hasEOL: false }]
            })
          })
        })
      };
    }
  };

  // Fire first (slow) upload — park it on the getDocument promise before starting the second.
  const slowUpload = triggerUpload(makeFile('slow.pdf', 200, 'dummy'));
  await slowParked;
  assert.strictEqual(getDocCallCount, 1, 'slow upload should be parked on getDocument');

  // Fire second (fast) upload — it completes and writes its result.
  await triggerUpload(makeFile('fast.pdf', 200, 'dummy'));
  assert.strictEqual(resumeTextEl.value, 'second result');

  // Resolve the slow upload now — its token is stale and must not overwrite.
  resolveFirst({
    numPages: 1,
    getPage: () => Promise.resolve({
      getTextContent: () => Promise.resolve({
        items: [{ str: 'first result (stale)', hasEOL: false }]
      })
    })
  });

  await slowUpload;
  assert.strictEqual(resumeTextEl.value, 'second result',
    'first (stale) upload should not overwrite second upload result');
});

test('.txt upload shows error when file.text() rejects', async () => {
  resetStubs();
  const badFile = {
    name: 'corrupt.txt',
    size: 10,
    text: () => Promise.reject(new Error('read failed'))
  };
  await triggerUpload(badFile);
  assert.ok(errorMsgEl.textContent.includes('Failed to read file'), 'should show read error');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('PDF parse error shows generic error message', async () => {
  resetStubs();
  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: 'set' },
    getDocument: () => ({
      promise: Promise.reject(new Error('corrupt pdf'))
    })
  };

  await triggerUpload(makeFile('bad.pdf', 200, 'not a real pdf'));
  assert.ok(errorMsgEl.textContent.includes('Failed to read PDF'), 'should show PDF error');
  assert.strictEqual(fileUploadEl.value, '', 'file input should be cleared');
});

test('placeholder resets to default after successful upload', async () => {
  resetStubs();
  globalThis.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: 'set' },
    getDocument: () => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: () => Promise.resolve({
          getTextContent: () => Promise.resolve({
            items: [{ str: 'done', hasEOL: false }]
          })
        })
      })
    })
  };

  const DEFAULT_PLACEHOLDER = 'Paste your resume or list your skills here (e.g. Python, React, Machine Learning)...';
  await triggerUpload(makeFile('ok.pdf', 100, 'dummy'));
  assert.strictEqual(resumeTextEl.placeholder, DEFAULT_PLACEHOLDER);
});
