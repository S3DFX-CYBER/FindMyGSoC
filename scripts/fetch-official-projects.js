/* eslint-env node */
/**
 * Builds the accepted-project dataset from Google's own GSoC pages.
 *
 * This is the authoritative source for what a project is: organisation, title,
 * mentors, technologies, topics and size. The org ideas pages say what a project
 * might be; this says what was actually accepted.
 *
 * The size is not a field. Google writes it in the description prose, as
 * "Medium 175 hours" or "Total effort is 350 hours", so it is parsed from there
 * and left null when the text does not state one. Nothing is inferred.
 *
 * The page is a single-page app, so the data comes from its JSON endpoint. The
 * candidate list below is tried in order and the first payload that looks like a
 * project list wins; `--from-file` parses a saved payload instead, which is how
 * the normaliser is tested and how a CI failure gets debugged.
 *
 * Usage:
 *   node scripts/fetch-official-projects.js
 *   node scripts/fetch-official-projects.js --from-file payload.json
 *   node scripts/fetch-official-projects.js --year 2026 --limit 50
 */

const fs = require('node:fs');
const path = require('node:path');

const OUTPUT_PATH = path.resolve(__dirname, '../data/projects-2026.json');
const SITE = 'https://summerofcode.withgoogle.com';
const GSOC_SIZES = [90, 175, 350];

/** Candidate JSON endpoints, in the order they are tried. */
function endpoints(year) {
  return [
    `${SITE}/api/programs/${year}/projects/`,
    `${SITE}/api/programs/${year}/projects`,
    `${SITE}/api/projects/${year}`,
    `${SITE}/api/v1/programs/${year}/projects/`,
  ];
}

/** Size in hours, read from prose. Returns null when the text does not say. */
function hoursFromText(text) {
  const flat = String(text || '');
  const re = /\b(90|175|350)\s*(?:hours?|hrs?)\b/i;
  const m = re.exec(flat);
  if (m) {
    return Number(m[1]);
  }
  // "Size: Medium" style, which appears on some project pages.
  const word = /\b(?:size|effort)\b[^a-z]{0,12}(small|medium|large)\b/i.exec(flat);
  if (word) {
    const map = { small: 90, medium: 175, large: 350 };
    return map[word[1].toLowerCase()] || null;
  }
  return null;
}

/** Pulls a name out of whichever shape the API uses. */
function nameOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') return String(value.name || value.login || value.title || '').trim();
  return '';
}

function listOf(value) {
  if (!Array.isArray(value)) return [];
  return value.map(nameOf).filter(Boolean);
}

/** Finds the project array inside an unknown payload shape. */
function projectArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  for (const key of ['results', 'projects', 'items', 'data']) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return null;
}

/** True when an item carries the two fields we cannot do without. */
function looksLikeProject(item) {
  return Boolean(item && typeof item === 'object' && item.title &&
    (item.organization || item.organizationName || item.org));
}

/** Normalises one API project into the shape the app reads. */
function normaliseProject(item, year) {
  const description = String(item.description || item.abstract || '');
  const org = nameOf(item.organization) || nameOf(item.organizationName) || nameOf(item.org);
  const id = item.id || item.projectId || null;
  return {
    org,
    title: String(item.title || '').trim(),
    url: id ? `${SITE}/programs/${year}/projects/${id}` : '',
    hours: hoursFromText(description),
    mentors: listOf(item.mentors || item.mentor),
    technologies: listOf(item.projectTechnologies || item.technologies || item.tech),
    topics: listOf(item.projectTopics || item.topics),
    contributor: nameOf(item.contributor || item.student),
    description: description.slice(0, 600),
  };
}

/** Groups normalised projects by organisation name. */
function groupByOrg(projects) {
  const out = {};
  for (const p of projects) {
    if (!p.org || !p.title) continue;
    if (!out[p.org]) out[p.org] = [];
    out[p.org].push(p);
  }
  for (const org of Object.keys(out)) {
    out[org].sort((a, b) => a.title.localeCompare(b.title));
  }
  return out;
}

/** Builds the whole dataset from a payload. */
function buildDataset(payload, year = 2026) {
  const items = projectArray(payload);
  if (!items) {
    throw new Error('payload does not contain a project array');
  }
  const projects = items.filter(looksLikeProject).map((i) => normaliseProject(i, year));
  const grouped = groupByOrg(projects);
  const withHours = projects.filter((p) => p.hours !== null).length;

  return {
    _meta: {
      source: `${SITE}/programs/${year}/projects`,
      fetchedAt: new Date().toISOString(),
      year,
      projects: projects.length,
      organisations: Object.keys(grouped).length,
      withHours,
    },
    ...grouped,
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'FindMyGSoC-data-bot/1.0 (+https://findmygsoc.vercel.app)',
      },
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') || '';
    if (!/json/i.test(type)) return null;
    return await res.json();
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const yearIdx = args.indexOf('--year');
  const year = yearIdx > -1 ? Number(args[yearIdx + 1]) : 2026;
  const fileIdx = args.indexOf('--from-file');

  let payload = null;
  if (fileIdx > -1) {
    payload = JSON.parse(fs.readFileSync(args[fileIdx + 1], 'utf-8'));
  } else {
    for (const url of endpoints(year)) {
      const candidate = await fetchJson(url);
      if (candidate && projectArray(candidate)) {
        payload = candidate;
        console.log(`using ${url}`);
        break;
      }
    }
  }

  if (!payload) {
    // Leave the existing dataset untouched rather than writing an empty one.
    console.error('no usable payload from any endpoint; keeping the current dataset');
    process.exitCode = 1;
    return;
  }

  const dataset = buildDataset(payload, year);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(dataset, null, 1)}\n`, 'utf-8');
  const m = dataset._meta;
  console.log(`wrote ${m.projects} projects across ${m.organisations} orgs, ${m.withHours} with a stated size`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  hoursFromText,
  normaliseProject,
  buildDataset,
  projectArray,
  looksLikeProject,
  GSOC_SIZES,
};
