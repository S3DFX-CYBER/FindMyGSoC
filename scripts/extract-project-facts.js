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
  // h1 is the page title and bold runs are usually prose, so neither is a
  // candidate for a project heading.
  const re = /<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/gi;
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
  if (t.length < 4 || t.length > 120) return false;
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

/**
 * Difficulty, only when the page labels it as difficulty.
 *
 * Scanning for the bare words recorded "intermediate" from a sentence about
 * C++ skills. This matches a label: "Difficulty: Hard", "Level - medium".
 */
function extractDifficulty(html) {
  const text = toText(html);
  const found = new Set();
  const labelRe = /\b(difficulty|level)\b\s*[:\-–]?\s*(easy|beginner|medium|intermediate|hard|advanced)\b/gi;
  let m;
  while ((m = labelRe.exec(text)) !== null) {
    found.add(m[2].toLowerCase());
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
    const word = /\b(?:size|length|effort|scope)\b\s*[:\-–]?\s*(small|medium|large)\b/i.exec(window);
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

  // A page can state a difficulty or list titled ideas without ever stating a
  // size; that is still information worth keeping.
  if (!sizes.length && !projects.length && !difficulty.length) {
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

/** Reads the dataset from the last run, so a failed fetch cannot erase it. */
function readPrevious() {
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  } catch (_err) {
    return {};
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf('--limit');
  const limit = limitArg > -1 ? Number(args[limitArg + 1]) : Infinity;
  const concArg = args.indexOf('--concurrency');
  const concurrency = concArg > -1 ? Math.max(1, Number(args[concArg + 1])) : 6;

  const orgs = loadOrgs().filter((o) => o && o.name && o.ideas).slice(0, Number.isFinite(limit) ? limit : undefined);
  const previous = readPrevious();
  const out = {};
  let checked = 0;
  let failed = 0;

  // Bounded concurrency: 184 serial requests at a 20 second timeout can outlast
  // the job's own timeout, and a run that is killed writes nothing at all.
  let index = 0;
  const worker = async () => {
    while (index < orgs.length) {
      const org = orgs[index++];
      const html = await fetchPage(org.ideas);
      checked += 1;
      if (!html) {
        failed += 1;
        // A page that could not be fetched is not a page that lost its facts.
        if (previous[org.name]) {
          out[org.name] = previous[org.name];
        }
        continue;
      }
      const facts = factsFromPage(html, org.ideas);
      if (facts) {
        out[org.name] = facts;
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));

  // A run that lost a large share of the dataset is a broken run, not a
  // smaller dataset. Refuse to publish it rather than open a deletion PR.
  const before = Object.keys(previous).length;
  const after = Object.keys(out).length;
  if (before > 20 && after < before * 0.7) {
    console.error(`refusing to write: coverage fell from ${before} to ${after} orgs`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf-8');

  console.log(`checked ${checked} ideas pages (${failed} unreachable), recorded facts for ${after} orgs`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { factsFromPage, extractSizes, extractProjects, extractDifficulty, isUsableTitle, toText };
