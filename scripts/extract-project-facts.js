/* eslint-env node */
/**
 * Extracts project-level facts from each organisation's GSoC ideas page.
 *
 * Why this exists: GSoC difficulty is a property of the project, not of the
 * organisation. Google's programme has three project sizes (90, 175 and 350
 * hours), and any org can host any of them. Labelling an organisation
 * "beginner" or "advanced" invents a fact. This script reads the org's own
 * ideas page and records what it actually says: the project titles, the sizes
 * in hours, and any stated difficulty.
 *
 * It is deliberately conservative. If a page does not state a size, the size is
 * null rather than guessed, and an org with nothing readable is left out of the
 * output entirely. Missing data renders as nothing in the UI, never as a label.
 *
 * Usage:
 *   node scripts/extract-project-facts.js            # all orgs
 *   node scripts/extract-project-facts.js --limit 5  # first five, for a smoke test
 */

const fs = require('node:fs');
const path = require('node:path');

const ORGS_PATH = path.resolve(__dirname, '../src/js/org.js');
const OUTPUT_PATH = path.resolve(__dirname, '../data/project-facts.json');

const GSOC_SIZES = [90, 175, 350];
const SIZE_WORDS = { small: 90, medium: 175, large: 350 };
const DIFFICULTY_WORDS = ['easy', 'beginner', 'medium', 'intermediate', 'hard', 'advanced'];

/** Strips tags, scripts and styles so the text can be scanned safely. */
function toText(html) {
  return String(html)
    // Tolerate `</script >` and friends, which the naive pattern misses.
    .replace(/<script\b[\s\S]*?<\/script[^>]*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    // Entities are dropped rather than decoded: this text is only scanned for
    // sizes, never rendered, and decoding is how double-unescaping bugs start.
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Headings and bold leads, in document order, with their text. */
function headings(html) {
  const out = [];
  const re = /<(h[1-4]|strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = toText(m[2]);
    if (text && text.length <= 120) {
      out.push({ index: m.index, text });
    }
  }
  return out;
}

/**
 * True when a heading is plausibly a project title.
 *
 * Learned the hard way: scraped ideas pages are full of headings that are page
 * furniture ("Sort by:", "Replies: 18"), policy prose ("Contributor
 * Responsibility**You must understand the code you submit.**") and section
 * labels ("Background and Motivation", "Project Ideas"). A title is short, has
 * no markdown emphasis left in it, and is not a sentence.
 */
function isUsableTitle(text) {
  const t = String(text || '').trim();
  if (t.length < 4 || t.length > 90) return false;
  if (/[*_`#]/.test(t)) return false;
  if (/[.!?]$/.test(t)) return false;
  if (t.split(/\s+/).length > 12) return false;
  if (/\b(you|your|we|our|must|should|will|shall)\b/i.test(t)) return false;

  const furniture = /^(replies|sort by|all other|personal information|labels|milestone|assignee|search|issues|pull requests|projects|discussions|wiki|home|menu|contributor|mentors?|timeline|apply|about|contact|faq|news|blog|background|motivation|introduction|overview|requirements|resources|rubrics?|policy|guidelines?|ideas? list|project ideas|classic projects?|list of|tips|getting started|table of contents)\b/i;
  return !furniture.test(t);
}

/** Every size the page states, in hours. */
function extractSizes(html) {
  const text = toText(html);
  const sizes = new Set();

  const hourRe = /\b(\d{2,3})\s*(?:hours?|hrs?|h)\b/gi;
  let m;
  while ((m = hourRe.exec(text)) !== null) {
    const n = Number(m[1]);
    if (GSOC_SIZES.includes(n)) {
      sizes.add(n);
    }
  }

  // "Size: Medium" and friends, which many ideas pages use instead of hours.
  const wordRe = /\bsize\b\s*[:\-–]?\s*(small|medium|large)\b/gi;
  while ((m = wordRe.exec(text)) !== null) {
    const hours = SIZE_WORDS[m[1].toLowerCase()];
    if (hours) {
      sizes.add(hours);
    }
  }

  // A page-level statement, which some orgs use instead of a size per idea:
  // "All 2026 GSoC ideas are Large Projects". It is stated, so it counts.
  const allRe = /\ball\b[^.]{0,60}?\b(small|medium|large)\b\s*(?:projects?|ideas?|tasks?)/gi;
  while ((m = allRe.exec(text)) !== null) {
    const hours = SIZE_WORDS[m[1].toLowerCase()];
    if (hours) {
      sizes.add(hours);
    }
  }

  return Array.from(sizes).sort((a, b) => a - b);
}

/** Difficulty words the page states outright, if any. */
function extractDifficulty(html) {
  const text = toText(html).toLowerCase();
  const found = new Set();
  for (const word of DIFFICULTY_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
    if (re.test(text)) {
      found.add(word);
    }
  }
  return Array.from(found);
}

/**
 * Project entries: one per usable heading, with the size stated near it.
 *
 * Ideas pages differ in where they put the size. Some write it under the
 * heading ("175 hours"), some state it once for the whole page. So the heading
 * is the anchor and the size is looked for in the text that follows it; when
 * there is none, the entry keeps a null size rather than borrowing another
 * project's.
 */
function extractProjects(html) {
  const text = toText(html);
  const heads = headings(html);
  const projects = [];
  const seen = new Set();

  for (const head of heads) {
    if (!isUsableTitle(head.text)) continue;
    if (seen.has(head.text)) continue;
    seen.add(head.text);

    // The 600 characters after the heading, which is where a size would sit.
    const after = text.slice(0, 0);
    const idx = text.indexOf(head.text);
    const window = idx === -1 ? '' : text.slice(idx + head.text.length, idx + head.text.length + 600);
    const match = /\b(90|175|350)\s*(?:hours?|hrs?|h)\b/i.exec(window);
    const word = /\bsize\b\s*[:\-–]?\s*(small|medium|large)\b/i.exec(window);
    let hours = null;
    if (match) {
      hours = Number(match[1]);
    } else if (word) {
      hours = SIZE_WORDS[word[1].toLowerCase()] || null;
    }

    projects.push({ title: head.text, hours });
  }

  return projects.slice(0, 40);
}

/** Turns one ideas page into a facts record, or null when nothing is readable. */
function factsFromPage(html, source) {
  const sizes = extractSizes(html);
  const projects = extractProjects(html);
  const difficulty = extractDifficulty(html);

  if (!sizes.length && !projects.length) {
    return null;
  }

  return {
    source,
    fetchedAt: new Date().toISOString(),
    sizes,
    difficulty,
    projects,
  };
}

/**
 * Reads the org list from the canonical data file.
 *
 * org.js exports itself for Node, so this is a plain require: no eval, no
 * dynamic code execution, and no second parser to keep in step.
 */
function loadOrgs() {
  // eslint-disable-next-line global-require
  return require(ORGS_PATH);
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'user-agent': 'FindMyGSoC-data-bot/1.0 (+https://findmygsoc.vercel.app)' },
    });
    if (!res.ok) {
      return null;
    }
    const type = res.headers.get('content-type') || '';
    if (type && !/text\/html|text\/plain/i.test(type)) {
      return null;
    }
    return await res.text();
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

  const orgs = loadOrgs().filter((o) => o && o.name && o.ideas);
  const out = {};
  let fetched = 0;

  for (const org of orgs.slice(0, limit)) {
    const html = await fetchPage(org.ideas);
    fetched += 1;
    if (!html) {
      continue;
    }
    const facts = factsFromPage(html, org.ideas);
    if (facts) {
      out[org.name] = facts;
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');

  console.log(`checked ${fetched} ideas pages, recorded facts for ${Object.keys(out).length} orgs`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { factsFromPage, extractSizes, extractProjects, extractDifficulty, isUsableTitle, toText };
