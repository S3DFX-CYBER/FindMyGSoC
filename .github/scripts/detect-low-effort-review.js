const body = (process.env.REVIEW_BODY || '').trim().toLowerCase();
const state = (process.env.REVIEW_STATE || '').toUpperCase();

const weakPhrases = new Set(['lgtm', 'ok', 'approved', 'nice', 'good']);
const emojiOnly = /^[\p{Emoji}\s]+$/u;

const tokenCount = body.split(/\s+/).filter(Boolean).length;
const lowEffort = (
  !body ||
  weakPhrases.has(body) ||
  emojiOnly.test(body) ||
  (state === 'APPROVED' && tokenCount <= 2)
);

process.stdout.write(JSON.stringify({ lowEffort, tokenCount }));
