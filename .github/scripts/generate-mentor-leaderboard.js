const fs = require('fs');

const mentorsPath = '.github/reviewers/gssoc-mentors.json';
const statsPath = '.github/reviewers/mentor-stats.json';
const outPath = '.github/reviewers/mentor-leaderboard.md';

function readJson(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return fallback;
    }

    throw err;
  }
}

function n(v) {
  return Number.isFinite(Number(v))
    ? Number(v)
    : 0;
}

function days(iso) {
  if (!iso) return 9999;

  const timestamp =
    new Date(iso).getTime();

  if (!Number.isFinite(timestamp)) {
    return 9999;
  }

  return Math.max(
    0,
    (Date.now() - timestamp) / 86400000
  );
}

const mentors =
  (
    readJson(mentorsPath, {
      reviewers: []
    }).reviewers || []
  )
    .map((m) =>
      String(m).trim().toLowerCase()
    )
    .filter((m) => m.length > 0)
    .filter((m, i, arr) => arr.indexOf(m) === i);

const rawStats =
  readJson(statsPath, {
    mentors: {}
  }).mentors || {};

const stats =
  Object.fromEntries(
    Object.entries(rawStats).map(
      ([key, value]) => [
        String(key).trim().toLowerCase(),
        value
      ]
    )
  );

const rows = mentors
  .map((username) => {

    const s =
      stats[username] || {};

    const inactiveDays =
      days(s.last_reviewed_at);

    const decay =
      Math.max(
        0,
        1 - Math.min(0.8, inactiveDays / 120)
      );

    const quality =
      n(s.review_quality_score);

    const score =
      (
        (n(s.approvals) * 2) +
        (n(s.merged_reviews) * 3) +
        (n(s.assignment_approvals) * 2) +
        (n(s.reviews) * 0.5) +
        (n(s.priority_reviews) * 1.5) +
        quality
      ) * decay;

    const activity =
      inactiveDays <= 14
        ? '🟢 Active'
        : inactiveDays <= 45
          ? '🟡 Warm'
          : '🔴 Inactive';

    return {
      username,
      score,
      inactiveDays,
      activity,
      approvals: n(s.approvals),
      merged: n(s.merged_reviews),
      quality
    };

  })
  .sort((a, b) => {

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.inactiveDays !== b.inactiveDays) {
      return a.inactiveDays - b.inactiveDays;
    }

    return a.username.localeCompare(
      b.username
    );
  });

const medals = [
  '🥇',
  '🥈',
  '🥉'
];

const lines = [
  '# 🏆 Mentor Leaderboard',
  '',
  '> Dynamic mentor activity ranking based on approvals, merged reviews, quality scoring, assignment participation, and activity recency.',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '| Rank | Mentor | Score | Approvals | Merged Reviews | Quality | Activity |',
  '|---:|---|---:|---:|---:|---:|---|',

  ...rows.map((r, index) =>
    `| ${medals[index] || `#${index + 1}`} | @${r.username} | ${r.score.toFixed(2)} | ${r.approvals} | ${r.merged} | ${r.quality.toFixed(2)} | ${r.activity} |`
  )
];

const next =
  `${lines.join('\n')}\n`;

const normalize = (content) =>
  content.replace(
    /Generated:.*\n/,
    ''
  );

const previous =
  fs.existsSync(outPath)
    ? fs.readFileSync(outPath, 'utf8')
    : '';

if (
  previous &&
  normalize(previous) === normalize(next)
) {
  console.log(
    'No leaderboard changes'
  );

  process.exit(0);
}

fs.writeFileSync(outPath, next);

console.log(
  'Leaderboard updated'
);
