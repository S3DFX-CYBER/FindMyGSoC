'use strict';

const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath = '.github/reviewers/mentor-stats.json';

function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function toNum(v) {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function daysSince(iso) {
  if (!iso) return null;

  const t = new Date(iso).getTime();

  if (!Number.isFinite(t)) {
    return null;
  }

  return Math.max(0, (Date.now() - t) / 86400000);
}

function safeParseArray(envVar) {
  try {
    const parsed = JSON.parse(process.env[envVar] || '[]');

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch {
    return [];
  }
}

/**
 * Fisher-Yates shuffle
 */
function shuffle(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

const claimant = String(
  process.env.ISSUE_CLAIMANT || ''
)
  .trim()
  .toLowerCase();

const excluded = new Set(
  safeParseArray('EXCLUDED_MENTORS')
    .map(v => String(v).trim().toLowerCase())
);

const maxMentors = Math.max(
  1,
  toNum(process.env.MAX_MENTORS || 2)
);

/**
 * Load mentors
 */
const mentorData = readJsonSafe(
  mentorsPath,
  { reviewers: [] }
);

const mentors = (mentorData.reviewers || [])
  .filter(Boolean)
  .map(v => String(v).trim())
  .filter(v => v.length > 0)
  .filter((v, i, arr) =>
    arr.findIndex(
      x => x.toLowerCase() === v.toLowerCase()
    ) === i
  );

/**
 * Load stats
 */
const rawStats = readJsonSafe(
  statsPath,
  { mentors: {} }
).mentors || {};

const stats = {};

for (const [key, value] of Object.entries(rawStats)) {
  stats[String(key).trim().toLowerCase()] =
    value || {};
}

/**
 * Score mentors
 */
const scored = mentors.map(username => {

  const lower = username.toLowerCase();

  const s = stats[lower] || {};

  const recencyDays = daysSince(
    s.last_reviewed_at
  );

  const approvals = toNum(s.approvals);
  const merged = toNum(s.merged_reviews);
  const quality = toNum(s.review_quality_score);
  const assignmentApprovals = toNum(
    s.assignment_approvals
  );
  const totalReviews = toNum(s.reviews);

  /**
   * Activity score
   */
  let score = 0;

  score += approvals * 2;
  score += merged * 3;
  score += quality * 1.5;
  score += assignmentApprovals * 2;
  score += Math.log2(totalReviews + 1) * 4;

  /**
   * Inactivity penalty
   */
  if (recencyDays !== null) {
    score -= Math.min(20, recencyDays * 0.35);
  }

  /**
   * Disqualifications
   */
  const disqualified =
    lower === claimant ||
    excluded.has(lower) ||
    (
      recencyDays !== null &&
      recencyDays > 60
    );

  return {
    username,
    lower,
    score,
    recencyDays,
    disqualified
  };
});

/**
 * Active mentor pool
 *
 * Instead of ALWAYS selecting top mentors,
 * we:
 *
 * 1. Keep only active mentors
 * 2. Take top ~15 by score
 * 3. Shuffle randomly
 * 4. Pick 2 random mentors
 *
 * This ensures:
 * - active mentors are prioritized
 * - mentor selection rotates
 * - same 2 mentors are NOT pinged every issue
 */

const activeMentors = scored
  .filter(m => !m.disqualified)
  .sort((a, b) => b.score - a.score);

/**
 * Dynamic pool size
 */
const poolSize = Math.max(
  maxMentors * 4,
  15
);

const mentorPool = activeMentors.slice(
  0,
  Math.min(poolSize, activeMentors.length)
);

/**
 * Randomize pool
 */
const randomizedPool = shuffle(mentorPool);

/**
 * Final selected mentors
 */
const selected = randomizedPool
  .slice(0, maxMentors)
  .map(m => m.username);

process.stdout.write(
  JSON.stringify({
    selected,
    candidates: activeMentors.length,
    pool_size: mentorPool.length
  })
);