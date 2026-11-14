/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');

const DATA_PATH = path.resolve(__dirname, '../../data/mentors.json');
const MAX_FETCH_FAILED = 35;
const MAX_NO_CONTACT = 100;

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected mentors.json to be an object keyed by org name.');
  }

  const entries = Object.values(parsed);
  const fetchFailed = entries.filter((entry) => entry?.status === 'fetch-failed');
  const noContact = entries.filter((entry) => entry?.status === 'no-contact-found');

  // Threshold is set above the current baseline so the workflow catches regressions
  // without blocking until extractor coverage improves.
  if (fetchFailed.length > MAX_FETCH_FAILED) {
    console.error(`Too many fetch failures: ${fetchFailed.length} (threshold: ${MAX_FETCH_FAILED})`);
    process.exit(1);
  }

  if (noContact.length > MAX_NO_CONTACT) {
    console.warn(`High number of orgs with no contact info: ${noContact.length}`);
  }

  console.log('Mentor data validation passed');
}

main();
