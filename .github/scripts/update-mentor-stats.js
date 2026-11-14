const fs = require('fs');

const statsPath = '.github/reviewers/mentor-stats.json';
const mentorsPath = '.github/reviewers/gssoc-mentors.json';

// --------------------------------------------------
// ENV
// --------------------------------------------------

const reviewer = String(process.env.REVIEWER || '')
  .trim()
  .toLowerCase();

const reviewState = String(process.env.REVIEW_STATE || '')
  .trim()
  .toLowerCase();

const reviewId = String(process.env.REVIEW_ID || '').trim();

const reviewedAt =
  process.env.REVIEWED_AT ||
  new Date().toISOString();

const isMerged =
  process.env.PR_MERGED === 'true';

const isPriority =
  process.env.IS_PRIORITY === 'true';

const isAssignmentApproval =
  process.env.IS_ASSIGNMENT_APPROVAL === 'true';

const lowEffort =
  process.env.IS_LOW_EFFORT === 'true';

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function readJson(path, fallback) {

  try {

    return JSON.parse(
      fs.readFileSync(path, 'utf8')
    );

  } catch (error) {

    if (
      error &&
      error.code === 'ENOENT'
    ) {
      return fallback;
    }

    throw error;
  }
}

// --------------------------------------------------
// LOAD MENTORS
// --------------------------------------------------

const mentorData = readJson(
  mentorsPath,
  { reviewers: [] }
);

const mentors = new Set(
  (mentorData.reviewers || [])
    .map(m =>
      String(m)
        .trim()
        .toLowerCase()
    )
);

// --------------------------------------------------
// VALIDATE REVIEWER
// --------------------------------------------------

if (!reviewer || !mentors.has(reviewer)) {

  console.log(
    `${reviewer || 'unknown'} is not a registered mentor`
  );

  process.exit(0);
}

// --------------------------------------------------
// LOAD STATS
// --------------------------------------------------

const statsData = readJson(
  statsPath,
  { mentors: {} }
);

statsData.mentors =
  statsData.mentors || {};

// --------------------------------------------------
// NORMALIZE EXISTING KEYS
// --------------------------------------------------

const normalizedMentors = {};

for (const [key, value] of Object.entries(statsData.mentors)) {

  normalizedMentors[
    String(key)
      .trim()
      .toLowerCase()
  ] = value;
}

statsData.mentors =
  normalizedMentors;

// --------------------------------------------------
// INIT MENTOR
// --------------------------------------------------

if (!statsData.mentors[reviewer]) {

  statsData.mentors[reviewer] = {
    reviews: 0,
    approvals: 0,
    changes_requested: 0,
    comments: 0,
    merged_reviews: 0,
    assignment_approvals: 0,
    priority_reviews: 0,
    review_quality_score: 0,
    last_reviewed_at: '',
    review_ids: []
  };
}

const mentor =
  statsData.mentors[reviewer];

// --------------------------------------------------
// REVIEW IDS
// --------------------------------------------------

mentor.review_ids = Array.isArray(
  mentor.review_ids
)
  ? mentor.review_ids.map(id =>
      String(id)
    )
  : [];

// --------------------------------------------------
// DEDUPE
// --------------------------------------------------

if (
  !reviewId ||
  mentor.review_ids.includes(reviewId)
) {

  console.log(
    `Review ${reviewId} already tracked`
  );

  process.exit(0);
}

// --------------------------------------------------
// UPDATE STATS
// --------------------------------------------------

mentor.reviews =
  (mentor.reviews || 0) + 1;

if (reviewState === 'approved') {

  mentor.approvals =
    (mentor.approvals || 0) + 1;
}

if (reviewState === 'changes_requested') {

  mentor.changes_requested =
    (mentor.changes_requested || 0) + 1;
}

if (reviewState === 'commented') {

  mentor.comments =
    (mentor.comments || 0) + 1;
}

if (isMerged) {

  mentor.merged_reviews =
    (mentor.merged_reviews || 0) + 1;
}

if (isAssignmentApproval) {

  mentor.assignment_approvals =
    (mentor.assignment_approvals || 0) + 1;
}

if (isPriority) {

  mentor.priority_reviews =
    (mentor.priority_reviews || 0) + 1;
}

// --------------------------------------------------
// QUALITY SCORE
// --------------------------------------------------

const qualityDelta = lowEffort
  ? -1.5
  : reviewState === 'approved'
    ? 1.2
    : 0.8;

mentor.review_quality_score = Number(
  (
    (mentor.review_quality_score || 0) +
    qualityDelta
  ).toFixed(2)
);

// --------------------------------------------------
// FINALIZE
// --------------------------------------------------

mentor.last_reviewed_at =
  reviewedAt;

mentor.review_ids.push(reviewId);

mentor.review_ids =
  mentor.review_ids.slice(-200);

// --------------------------------------------------
// SORT KEYS
// --------------------------------------------------

const ordered = Object.keys(
  statsData.mentors
)
  .sort()
  .reduce((acc, key) => {

    acc[key] =
      statsData.mentors[key];

    return acc;

  }, {});

// --------------------------------------------------
// SAVE
// --------------------------------------------------

statsData.mentors = ordered;

fs.writeFileSync(
  statsPath,
  JSON.stringify(statsData, null, 2) + '\n'
);

console.log(
  `Updated mentor stats for ${reviewer}`
);
