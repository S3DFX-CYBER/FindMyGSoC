const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment
globalThis.window = {
  location: { search: '' },
  addEventListener: () => {},
  open: () => {}
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
globalThis.sessionStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Stub DOM elements with focus support
const activeElementTracker = {
  activeElement: null
};

class StubElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.innerHTML = '';
    this.textContent = '';
    this.className = '';
    this.style = {};
    this.dataset = {};
    this.classes = new Set();
    this.classList = {
      add: (cls) => this.classes.add(cls),
      remove: (cls) => this.classes.delete(cls),
      contains: (cls) => this.classes.has(cls),
      toggle: (cls, force) => {
        if (force !== undefined) {
          if (force) this.classes.add(cls);
          else this.classes.delete(cls);
        } else {
          if (this.classes.has(cls)) this.classes.delete(cls);
          else this.classes.add(cls);
        }
      }
    };
    this.listeners = {};
  }
  
  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }
  
  removeEventListener(event, handler) {
    delete this.listeners[event];
  }
  
  querySelector(sel) {
    return new StubElement('sub-' + this.id);
  }
  
  querySelectorAll(sel) {
    return [];
  }
  
  setAttribute(name, value) {
    this[name] = value;
  }
  
  getAttribute(name) {
    return this[name];
  }
  
  focus() {
    activeElementTracker.activeElement = this;
  }
  
  click() {
    if (this.listeners['click']) {
      this.listeners['click']({ stopPropagation: () => {} });
    }
  }
}

const mockElements = {
  orgModal: new StubElement('orgModal'),
  compareModal: new StubElement('compareModal'),
  helpModal: new StubElement('helpModal'),
  mHeader: new StubElement('mHeader'),
  mMetrics: new StubElement('mMetrics'),
  mDesc: new StubElement('mDesc'),
  mTech: new StubElement('mTech'),
  mFit: new StubElement('mFit'),
  mTimeline: new StubElement('mTimeline'),
  mFetchBtn: new StubElement('mFetchBtn', 'button'),
  mStars: new StubElement('mStars'),
  mForks: new StubElement('mForks'),
  mIssues: new StubElement('mIssues'),
  mActivity: new StubElement('mActivity'),
  mMentorsSection: new StubElement('mMentorsSection'),
  closeOrgModalBtn: new StubElement('closeOrgModalBtn', 'button'),
  closeCompareModalBtn: new StubElement('closeCompareModalBtn', 'button'),
  closeHelpModalBtn: new StubElement('closeHelpModalBtn', 'button'),
  themeToggleBtn: new StubElement('themeToggleBtn', 'button')
};

// Mock document
globalThis.document = {
  documentElement: {
    classList: {
      toggle: () => {},
      contains: () => false
    },
    style: {}
  },
  body: {
    style: {}
  },
  getElementById: (id) => mockElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#issues .grid') return new StubElement('issuesGrid');
    if (sel === '#orgModal #orgModalTitle') return mockElements.mHeader;
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '.metric-card #mGfiPlaceholder') return [new StubElement('placeholder')];
    if (sel === '.pill[data-lang]') return [];
    if (sel === '.filter-chip') return [];
    return [];
  },
  addEventListener: () => {},
  get activeElement() {
    return activeElementTracker.activeElement;
  },
  set activeElement(el) {
    activeElementTracker.activeElement = el;
  }
};

// Mock fetch
globalThis.fetch = async (url) => {
  return {
    ok: true,
    json: async () => ({
      stars: 4200,
      forks: 800,
      issues: 12,
      activity: 'high'
    })
  };
};

// Set up global ORGS
globalThis.ORGS = require('../src/js/org.js');

// Import app.js
require('../src/js/skillExtractor.js');
const app = require('../src/js/app.js');

test('openModal populates description, headers, metrics, and restores focus correctly on close', () => {
  const triggerBtn = new StubElement('testTriggerBtn', 'button');
  globalThis.document.activeElement = triggerBtn;

  // Open modal
  app.openModal('The Linux Foundation');

  assert.strictEqual(
    mockElements.mDesc.textContent,
    'Non-profit consortium fostering growth of Linux.'
  );
  assert.ok(mockElements.mHeader.innerHTML.includes('The Linux Foundation'));
  assert.ok(mockElements.mMetrics.innerHTML.includes('11')); // 11 years

  // Close modal
  app.closeModal();

  // Focus must be restored back to triggerBtn
  assert.strictEqual(globalThis.document.activeElement, triggerBtn);
});

test('fetchModalGH triggers live stats endpoint and populates modal fields correctly', async () => {
  mockElements.mHeader.textContent = 'The Linux Foundation';
  mockElements.mFetchBtn.textContent = 'Fetch Live Stats';

  try {
    await globalThis.fetchModalGH();
  } catch (err) {
    console.error("fetchModalGH test exception:", err);
    throw err;
  }

  assert.strictEqual(mockElements.mStars.textContent, '4.2k');
  assert.strictEqual(mockElements.mForks.textContent, '800');
  assert.strictEqual(mockElements.mIssues.textContent, '12');
  assert.strictEqual(mockElements.mActivity.textContent, 'High');
  assert.strictEqual(mockElements.mFetchBtn.textContent, 'Stats Updated!');
});
test('modal focus trap loops focus correctly', () => {
  const modal = mockElements.orgModal;
  const btnFirst = new StubElement('btnFirst', 'button');
  const btnLast = new StubElement('btnLast', 'button');
  
  modal.querySelectorAll = (sel) => {
    return [btnFirst, btnLast];
  };

  // Open modal first to attach keydown listener
  app.openModal('The Linux Foundation');

  // Trigger focus trap keydown with Tab when focused on last element
  globalThis.document.activeElement = btnLast;
  let preventedDefault = false;
  modal.listeners['keydown']({
    key: 'Tab',
    shiftKey: false,
    currentTarget: modal,
    preventDefault: () => { preventedDefault = true; }
  });

  assert.strictEqual(globalThis.document.activeElement, btnFirst);
  assert.strictEqual(preventedDefault, true);

  // Trigger focus trap keydown with Shift+Tab when focused on first element
  globalThis.document.activeElement = btnFirst;
  preventedDefault = false;
  modal.listeners['keydown']({
    key: 'Tab',
    shiftKey: true,
    currentTarget: modal,
    preventDefault: () => { preventedDefault = true; }
  });

  assert.strictEqual(globalThis.document.activeElement, btnLast);
  assert.strictEqual(preventedDefault, true);
  
  // Clean up
  app.closeModal();
});
