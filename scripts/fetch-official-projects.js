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

const DATA_DIR = path.resolve(__dirname, '../data');
const CURRENT_YEAR = 2026;

/** One file per year, so fetching another year never overwrites this one. */
function outputPathFor(year) {
  return path.join(DATA_DIR, `projects-${year}.json`);
}
const SITE = 'https://summerofcode.withgoogle.com';
const GSOC_SIZES = [90, 175, 350];

/** Candidate JSON endpoints, in the order they are tried. */
function endpoints(year) {
  return [
    // The endpoint the site's own project list calls. The /api/programs/ shapes
    // below are kept as fallbacks for other years and for the current programme
    // before it is archived.
    `${SITE}/api/archive/programs/${year}/projects/`,
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

/**
 * Reads a project detail page.
 *
 * The list payload gives organisation, title, mentors and a short description.
 * Technologies, topics and the size live on the project's own page, which is
 * the one behind "View project details" in the UI. The page renders them as a
 * label followed by a comma-separated line, so that is what this reads, and it
 * returns nulls rather than guesses when a section is absent.
 */
function parseDetailHtml(html) {
  const text = String(html || '')
    .replace(/<script[\s\S]*?<\/script[^>]*>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    // No entity decoding: decoding &amp; and then other entities is how
    // double-unescaping bugs start, and this text is only scanned for labels
    // and a size, never rendered.
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const sectionAfter = (label) => {
    const i = lines.findIndex((l) => l.toLowerCase() === label.toLowerCase());
    if (i === -1 || i + 1 >= lines.length) return [];
    return lines[i + 1]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const technologies = sectionAfter('Technologies');
  const topics = sectionAfter('Topics');
  const hours = hoursFromText(text);

  return { technologies, topics, hours };
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
    (item.organization_name || item.organization || item.organizationName || item.org));
}

/**
 * Normalises one API project into the shape the app reads.
 *
 * Field names come from the payload the archive endpoint actually returns:
 * organization_name, tech_tags, topic_tags, mentor_names,
 * contributor_display_name, abstract_html and project_code_url. The earlier
 * aliases are kept so a shape change does not silently empty the dataset.
 */
function normaliseProject(item, year) {
  const description = String(
    item.abstract_html || item.abstract || item.abstract_short || item.description || ''
  );
  const org = nameOf(item.organization_name) || nameOf(item.organization) ||
    nameOf(item.organizationName) || nameOf(item.org);
  const id = item.id || item.projectId || null;

  return {
    org,
    title: String(item.title || '').trim(),
    url: id ? `${SITE}/programs/${year}/projects/${id}` : '',
    codeUrl: typeof item.project_code_url === 'string' ? item.project_code_url : '',
    hours: hoursFromText(description),
    status: typeof item.status === 'string' ? item.status : '',
    mentors: listOf(item.mentor_names || item.mentors || item.mentor),
    technologies: listOf(item.tech_tags || item.projectTechnologies || item.technologies || item.tech),
    topics: listOf(item.topic_tags || item.projectTopics || item.topics),
    contributor: nameOf(item.contributor_display_name) || nameOf(item.contributor || item.student),
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

/**
 * Fills in technologies, topics and size from each project's own page, for the
 * projects the list payload left incomplete. Bounded on purpose: this is one
 * request per project, and the whole dataset is around 1,100 of them.
 */
async function enrichProjects(projects, year, { limit = 5, cap = 1200 } = {}) {
  const targets = projects
    .filter((p) => p.url && (!p.technologies.length || !p.topics.length || p.hours === null))
    .slice(0, cap);

  let done = 0;
  let index = 0;

  const worker = async () => {
    while (index < targets.length) {
      const project = targets[index++];
      const id = project.url.split('/').pop();
      const html = await fetchText(`${SITE}/programs/${year}/projects/${id}`);
      if (html) {
        const detail = parseDetailHtml(html);
        if (!project.technologies.length) project.technologies = detail.technologies;
        if (!project.topics.length) project.topics = detail.topics;
        if (project.hours === null) project.hours = detail.hours;
        done += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, limit) }, worker));
  return { attempted: targets.length, enriched: done };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'FindMyGSoC-data-bot/1.0 (+https://findmygsoc.vercel.app)' },
    });
    if (!res.ok) return null;
    return await res.text();
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
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx > -1 ? Number(args[limitIdx + 1]) : Infinity;

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

  const items = projectArray(payload)
    .filter(looksLikeProject)
    .slice(0, Number.isFinite(limit) ? limit : undefined)
    .map((i) => normaliseProject(i, year));
  if (!args.includes('--no-enrich')) {
    const concIdx = args.indexOf('--enrich-concurrency');
    const concurrency = concIdx > -1 ? Number(args[concIdx + 1]) : 5;
    const { attempted, enriched } = await enrichProjects(items, year, { limit: concurrency });
    console.log(`enriched ${enriched} of ${attempted} projects from their detail pages`);
  }
  const dataset = buildDataset({ results: items }, year);
  const outputPath = outputPathFor(year);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(dataset, null, 1)}\n`, 'utf-8');
  const m = dataset._meta;
  console.log(`wrote ${m.projects} projects across ${m.organisations} orgs, ${m.withHours} with a stated size`);
  console.log(`  -> ${path.relative(process.cwd(), outputPath)}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  hoursFromText,
  outputPathFor,
  parseDetailHtml,
  enrichProjects,
  normaliseProject,
  buildDataset,
  projectArray,
  looksLikeProject,
  GSOC_SIZES,
};
