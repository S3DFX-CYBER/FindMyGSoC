'use strict';
const fs   = require('fs');
const path = require('path');

const QUEUE_PATH = '.github/reviewers/pending-assignments.json';
const TTL_MS     = 24 * 60 * 60 * 1000;

function readJson(filePath, fallback) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function safeParseArray(raw) {
  try {
    const p = JSON.parse(raw || '[]');
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

const op              = String(process.env.OPERATION    || '').toLowerCase();
const issueNumber     = parseInt(process.env.ISSUE_NUMBER || '0', 10);
const claimant        = String(process.env.CLAIMANT      || '').trim().toLowerCase();
const selectedMentors = safeParseArray(process.env.SELECTED_MENTORS)
                          .map(m => String(m).trim());
const approver        = String(process.env.APPROVER      || '').trim().toLowerCase();

const data = readJson(QUEUE_PATH, { assignments: [] });
if (!Array.isArray(data.assignments)) data.assignments = [];

if (op === 'queue') {
  data.assignments = data.assignments.filter(
    a => !(a.issue_number === issueNumber && a.claimant === claimant && a.status === 'pending')
  );
  data.assignments.push({
    issue_number:   issueNumber,
    claimant,
    requested_at:  new Date().toISOString(),
    pinged_mentors: selectedMentors,
    status:        'pending'
  });
  writeJson(QUEUE_PATH, data);
  process.stdout.write(JSON.stringify({ ok: true }));

} else if (op === 'approve') {
  const entry = data.assignments.find(
    a => a.issue_number === issueNumber && a.status === 'pending'
  );
  if (!entry) {
    process.stdout.write(JSON.stringify({ ok: false, error: 'not_found' }));
    process.exit(0);
  }
  const authorized = (entry.pinged_mentors || []).map(m => m.toLowerCase());
  if (!authorized.includes(approver)) {
    process.stdout.write(JSON.stringify({
      ok: false, error: 'not_authorized',
      claimant: entry.claimant, authorized: entry.pinged_mentors
    }));
    process.exit(0);
  }
  data.assignments = data.assignments.filter(a => a !== entry);
  writeJson(QUEUE_PATH, data);
  process.stdout.write(JSON.stringify({ ok: true, claimant: entry.claimant }));

} else if (op === 'expire') {
  const cutoff  = Date.now() - TTL_MS;
  const expired = data.assignments.filter(
    a => a.status === 'pending' && new Date(a.requested_at).getTime() < cutoff
  );
  process.stdout.write(JSON.stringify({ expired }));

} else if (op === 're-ping') {
  const entry = data.assignments.find(
    a => a.issue_number === issueNumber && a.status === 'pending'
  );
  if (entry) {
    entry.pinged_mentors = selectedMentors;
    entry.requested_at   = new Date().toISOString();
    writeJson(QUEUE_PATH, data);
    process.stdout.write(JSON.stringify({ ok: true, claimant: entry.claimant }));
  } else {
    process.stdout.write(JSON.stringify({ ok: false, error: 'not_found' }));
  }

} else {
  console.error(`Unknown OPERATION: ${op}`);
  process.exit(1);
}
