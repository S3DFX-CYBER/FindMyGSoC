const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath = '.github/reviewers/mentor-stats.json';

function readJsonSafe(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

function toNum(value) {
  return Number.isFinite(Number(value))
    ? Number(value)
    : 0;
}

function daysSince(iso) {
  if (!iso) {
    return null;
  }

  const time = new Date(iso).getTime();

  if (!Number.isFinite(time)) {
    return null;
  }

  return Math.max(
    0,
    (Date.now() - time) / 86400000
  );
}

function safeParseArray(envVar) {
  try {
    const parsed = JSON.parse(
      process.env[envVar] || '[]'
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

const prAuthor =
  String(process.env.PR_AUTHOR || '')
    .trim()
    .toLowerCase();

const existingRequested = new Set(
  safeParseArray('EXISTING_REQUESTED')
    .map(v => String(v).trim().toLowerCase())
);

const existingReviewers = new Set(
  safeParseArray('EXISTING_REVIEWERS')
    .map(v => String(v).trim().toLowerCase())
);

const recentPings = new Set(
  safeParseArray('RECENT_MENTOR_PINGS')
    .map(v => String(v).trim().toLowerCase())
);

const maxReviewers = Math.max(
  1,
  toNum(process.env.MAX_REVIEWERS || 2)
);

// --------------------------------------------------
// LOAD MENTORS
// --------------------------------------------------

const mentorData = readJsonSafe(
  mentorsPath,
  { reviewers: [] }
);

const mentors = (
  mentorData.reviewers || []
)
  .filter(Boolean)
  .map(username => String(username).trim())
  .filter(username => username.length > 0)
  .filter((username, index, arr) =>
    arr.findIndex(v => v.toLowerCase() === username.toLowerCase()) === index
  );

// --------------------------------------------------
// LOAD + NORMALIZE STATS
// --------------------------------------------------

const rawStats =
  readJsonSafe(
    statsPath,
    { mentors: {} }
  ).mentors || {};

const stats = {};

for (const [key, value] of Object.entries(rawStats)) {
  stats[
    String(key).trim().toLowerCase()
  ] = value || {};
}

// --------------------------------------------------
// SCORE MENTORS
// --------------------------------------------------

const scored = mentors.map((username) => {

  const lower =
    username.toLowerCase();

  const mentorStats =
    stats[lower] || {};

  const recencyDays =
    daysSince(
      mentorStats.last_reviewed_at
    );

  const neverReviewed =
    recencyDays === null;

  // ----------------------------------------
  // ACTIVITY PENALTIES
  // ----------------------------------------

  let inactivityPenalty = 0;

  if (neverReviewed) {
    inactivityPenalty = 0;
  } else {
    inactivityPenalty =
      Math.min(
        40,
        recencyDays * 0.8
      );
  }

  const reviewQuality =
    toNum(
      mentorStats.review_quality_score
    );

  const merged =
    toNum(
      mentorStats.merged_reviews
    );

  const approvals =
    toNum(
      mentorStats.approvals
    );

  const assignmentApprovals =
    toNum(
      mentorStats.assignment_approvals
    );

  const priorityReviews =
    toNum(
      mentorStats.priority_reviews
    );

  const totalReviews =
    toNum(
      mentorStats.reviews
    );

  const overloadPenalty =
    Math.max(
      0,
      totalReviews - approvals * 2
    ) * 0.15;

  // ----------------------------------------
  // SCORE
  // ----------------------------------------

  let score = 0;

  score += Math.min(
    25,
    approvals * 1.2
  );

  score += Math.min(
    20,
    merged * 2
  );

  score += Math.min(
    25,
    reviewQuality
  );

  score += Math.min(
    10,
    assignmentApprovals * 1.5
  );

  score += Math.min(
    8,
    priorityReviews * 0.7
  );

  score += Math.min(
    8,
    Math.log2(totalReviews + 1) * 3
  );

  score -= inactivityPenalty;
  score -= overloadPenalty;

  // ----------------------------------------
  // DISQUALIFICATION
  // ----------------------------------------

  const disqualified = (
    lower === prAuthor ||
    existingRequested.has(lower) ||
    existingReviewers.has(lower) ||
    recentPings.has(lower) ||
    (
      recencyDays !== null &&
      recencyDays > 60
    )
  );

  return {
    username,
    score,
    recencyDays,
    neverReviewed,
    disqualified
  };
});

// --------------------------------------------------
// SELECT REVIEWERS
// --------------------------------------------------

const selected = scored
  .filter(s => !s.disqualified)
  .sort((a, b) =>
    b.score - a.score ||
    (
      (a.recencyDays ?? 9999) -
      (b.recencyDays ?? 9999)
    ) ||
    a.username.localeCompare(
      b.username
    )
  )
  .slice(0, maxReviewers)
  .map(s => s.username);

// --------------------------------------------------
// OUTPUT
// --------------------------------------------------

process.stdout.write(
  JSON.stringify({
    selected,
    candidates: scored.length
  })
);
