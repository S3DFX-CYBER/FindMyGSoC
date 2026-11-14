const allowed = [
  'priority-p0',
  'priority-p1',
  'priority-p2',
  'priority-p3',
  'priority-p4'
];

// --------------------------------------------------
// SAFE LABEL PARSE
// --------------------------------------------------

let parsedLabels;

try {
  parsedLabels = JSON.parse(
    process.env.LABELS_JSON || '[]'
  );

  if (!Array.isArray(parsedLabels)) {
    parsedLabels = [];
  }

} catch {
  parsedLabels = [];
}

// --------------------------------------------------
// NORMALIZE LABELS
// --------------------------------------------------

const labels = parsedLabels.map(label =>
  String(label)
    .trim()
    .toLowerCase()
);

// --------------------------------------------------
// PRIORITY LABELS
// --------------------------------------------------

const present = labels.filter(label =>
  allowed.includes(label)
);

// Deterministic ordering
present.sort();

const keep =
  present[0] || null;

const remove =
  present.filter(label =>
    label !== keep
  );

// --------------------------------------------------
// OUTPUT
// --------------------------------------------------

process.stdout.write(
  JSON.stringify({
    keep,
    remove,
    allowed
  })
);
