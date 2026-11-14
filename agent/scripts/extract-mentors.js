/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');
const ORGS = require('../../src/js/org.js');

const CONTACT_TIPS = {
  Slack: 'Join and say hi in the GSoC channel before DMing mentors.',
  Discord: 'Introduce yourself in the public channel before asking project-specific questions.',
  Zulip: 'Post a new topic in the GSoC stream with your background and interest.',
  Matrix: "Say hello in the public room and mention the project area you're exploring.",
  IRC: 'Stay in the channel for a while; replies are often asynchronous.',
  'Mailing list': "Send a short intro email with your background and the idea you're interested in."
};

const CHANNEL_MATCHERS = [
  { type: 'Slack', match: (hostname) => hostname === 'slack.com' || hostname.endsWith('.slack.com') || hostname === 'slack.gg' || hostname.endsWith('.slack.gg') },
  { type: 'Zulip', match: (hostname) => hostname === 'zulip.com' || hostname.endsWith('.zulip.com') || hostname.endsWith('.zulipchat.com') || hostname === 'chat.zulip.org' },
  { type: 'Matrix', match: (hostname) => hostname === 'matrix.to' || hostname.endsWith('.matrix.to') || hostname === 'app.element.io' || hostname.endsWith('.element.io') },
  { type: 'IRC', match: (hostname) => hostname === 'irc.libera.chat' || hostname.endsWith('.irc.libera.chat') || hostname === 'irc.freenode.net' || hostname.endsWith('.irc.freenode.net') || /(^|\.)irc\.o.*\.net$/i.test(hostname) },
  { type: 'Discord', match: (hostname) => hostname === 'discord.gg' || hostname.endsWith('.discord.gg') || hostname === 'discord.com' || hostname.endsWith('.discord.com') },
  { type: 'Mailing list', match: (hostname) => hostname === 'groups.google.com' || hostname.includes('lists.') || hostname.includes('mailman') || hostname.includes('pipermail') },
];

const REQUEST_TIMEOUT_MS = 15000;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1200;
const OUTPUT_PATH = path.resolve(__dirname, '../../data/mentors.json');
const DEFAULT_HEADERS = {
  Accept: 'text/html,application/xhtml+xml',
  'User-Agent': 'gsoc-org-finder-mentor-refresh'
};
const CHANNEL_CONFIDENCE_REGEX = /\b(join|chat|channel|community|stream|forum|discussion|mailing|list|gsoc|mentor)\b/i;
const MENTOR_WORDS = ['mentor', 'contact', 'maintainer', 'reach out', 'gsoc'];
const STOPWORD_NAMES = new Set(['improve', 'update', 'other', 'vulkan', 'skins', 'project', 'lua', 'declarative', 'choose', 'co', 'mentor', 'mentors', 'contact', 'contacts', 'maintainer', 'maintainers', 'gsoc', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'be', 'been', 'being', 'have', 'has', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'us', 'we', 'you', 'he', 'she', 'it', 'they']);
const GENERIC_GITHUB_HANDLES = new Set(['mentor', 'mentors', 'contact', 'gsoc', 'ta', 'am', 'pm', 'io', 'org', 'com', 'net', 'google', 'github', 'heroku', 'aws', 'mdanalysis', 'xaos']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const options = {
    limit: null,
    orgs: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit' && argv[i + 1]) {
      options.limit = Number(argv[i + 1]);
      i += 1;
    } else if (arg.startsWith('--limit=')) {
      options.limit = Number(arg.split('=')[1]);
    } else if (arg === '--org' && argv[i + 1]) {
      options.orgs = argv[i + 1].split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
      i += 1;
    } else if (arg.startsWith('--org=')) {
      options.orgs = arg.split('=')[1].split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
    }
  }

  return options;
}

function buildBaseEntry(org, fetchedAt) {
  return {
    org: org.name,
    ideasUrl: typeof org.ideas === 'string' ? org.ideas : '',
    channels: [],
    mentors: [],
    mailingLists: [],
    tip: '',
    status: 'fetch-failed',
    lastFetched: fetchedAt
  };
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');
}

function stripHtml(value) {
  let text = String(value || '');

  for (const tagName of ['script', 'style']) {
    let start = 0;
    while (start < text.length) {
      const openIndex = text.toLowerCase().indexOf(`<${tagName}`, start);
      if (openIndex === -1) break;

      const openEnd = text.indexOf('>', openIndex);
      if (openEnd === -1) {
        text = text.slice(0, openIndex);
        break;
      }

      const closeIndex = text.toLowerCase().indexOf(`</${tagName}>`, openEnd + 1);
      if (closeIndex === -1) {
        text = `${text.slice(0, openIndex)} ${text.slice(openEnd + 1)}`;
        break;
      }

      text = `${text.slice(0, openIndex)} ${text.slice(closeIndex + tagName.length + 3)}`;
      start = openIndex + 1;
    }
  }

  // Linear-time HTML tag stripper to avoid super-linear regex backtracking
  function removeTagsLinear(s) {
    const parts = [];
    let last = 0;
    const len = s.length;
    while (last < len) {
      const open = s.indexOf('<', last);
      if (open === -1) {
        parts.push(s.slice(last));
        break;
      }
      // push text before tag
      parts.push(s.slice(last, open));
      const close = s.indexOf('>', open + 1);
      if (close === -1) {
        // no closing tag found; append rest after '<' and stop
        parts.push(s.slice(open + 1));
        break;
      }
      // replace tag content with a single space to preserve spacing
      parts.push(' ');
      last = close + 1;
    }
    return parts.join('');
  }

  const withoutTags = removeTagsLinear(text);
  return decodeHtmlEntities(withoutTags.replace(/\s+/g, ' ')).trim();
}

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timeout);
  });
}

function extractAnchorCandidates(html) {
  const anchors = [];
  const lowerHtml = html.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < html.length) {
    const anchorStart = lowerHtml.indexOf('<a', searchIndex);
    if (anchorStart === -1) break;

    const tagEnd = html.indexOf('>', anchorStart);
    if (tagEnd === -1) break;

    const anchorClose = lowerHtml.indexOf('</a>', tagEnd + 1);
    if (anchorClose === -1) break;

    const anchorHtml = html.slice(anchorStart, anchorClose + 4);
    const tagText = html.slice(anchorStart, tagEnd + 1);
    const hrefMatch = tagText.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || '') : '';
    const label = stripHtml(html.slice(tagEnd + 1, anchorClose));
    const before = html.slice(Math.max(0, anchorStart - 180), anchorStart);
    const after = html.slice(anchorClose + 4, anchorClose + 184);
    anchors.push({
      href,
      label,
      anchorHtml,
      context: stripHtml(`${before} ${anchorHtml} ${after}`)
    });

    searchIndex = anchorClose + 4;
  }

  return anchors;
}

function normalizeHttpUrl(rawHref, baseUrl) {
  try {
    const url = new URL(rawHref, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (url.hostname.toLowerCase() !== 'matrix.to') {
      url.hash = '';
    }
    return url.toString();
  } catch {
    return null;
  }
}

function detectChannelType(urlString) {
  try {
    const hostname = new URL(urlString).hostname.toLowerCase();
    const matched = CHANNEL_MATCHERS.find((matcher) => matcher.match(hostname));
    return matched ? matched.type : null;
  } catch {
    return null;
  }
}

function isLikelyMentor(text, handle = '') {
  const lowerText = String(text || '').toLowerCase();
  const lowerHandle = String(handle || '').toLowerCase();
  return MENTOR_WORDS.some((word) => lowerText.includes(word) || lowerHandle?.includes(word));
}

function isMeaningfulLabel(label) {
  if (!label) return false;
  const normalized = label.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('www.')) {
    return false;
  }
  const genericLabels = new Set([
    'here',
    'link',
    'click here',
    'more',
    'details',
    'join',
    'chat',
    'server',
    'group'
  ]);
  return !genericLabels.has(normalized);
}

function createChannelRecord(orgName, type, normalizedUrl, label) {
  return {
    type,
    url: normalizedUrl,
    label: isMeaningfulLabel(label) ? label.trim() : `${orgName} ${type}`
  };
}

function isHighConfidenceChannel(type, normalizedUrl, anchor) {
  const context = `${anchor.label || ''} ${anchor.context || ''}`.trim();
  const lowerContext = context.toLowerCase();
  const hostname = new URL(normalizedUrl).hostname.toLowerCase();

  if (type === 'Mailing list' || type === 'Discord' || type === 'IRC') {
    return true;
  }

  if (type === 'Slack') {
    return hostname.endsWith('.slack.com') || CHANNEL_CONFIDENCE_REGEX.test(lowerContext);
  }

  if (type === 'Matrix') {
    return normalizedUrl.includes('/#/') || normalizedUrl.includes('#/') || normalizedUrl.includes('/room/') || CHANNEL_CONFIDENCE_REGEX.test(lowerContext);
  }

  if (type === 'Zulip') {
    const lowerUrl = normalizedUrl.toLowerCase();
    return hostname.endsWith('.zulipchat.com')
      || lowerUrl.includes('/development-community')
      || lowerUrl.includes('/#narrow/')
      || /\b(join|stream|zulipchat)\b/i.test(lowerContext);
  }

  return CHANNEL_CONFIDENCE_REGEX.test(lowerContext);
}

function isGitHubProfileUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.hostname.toLowerCase() !== 'github.com') return null;
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length !== 1) return null;
    const username = segments[0];
    if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(username)) return null;
    return {
      github: username,
      githubUrl: `https://github.com/${username}`
    };
  } catch {
    return null;
  }
}

function extractMentorMentions(text) {
  const results = [];
  const lowered = text.toLowerCase();
  const confidenceWords = MENTOR_WORDS;

  confidenceWords.forEach((word) => {
    let fromIndex = 0;
    while (fromIndex < lowered.length) {
      const wordIndex = lowered.indexOf(word, fromIndex);
      if (wordIndex === -1) break;
      const snippet = text.slice(Math.max(0, wordIndex - 80), Math.min(text.length, wordIndex + 140));

      const handleRegex = /(^|[\s(])@([a-z\d](?:[a-z\d-]{0,38}))/gi;
      let handleMatch;
      while ((handleMatch = handleRegex.exec(snippet)) !== null) {
        const github = handleMatch[2];
        if (!isMeaningfulGitHubHandle(github)) continue;
        results.push({
          github,
          githubUrl: `https://github.com/${github}`
        });
      }

      const namePattern = new RegExp(String.raw`${word}\s*[:-]\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\b`);
      const nameMatch = snippet.match(namePattern);
      if (nameMatch) {
        const candidateName = nameMatch[1].trim();
        if (isMeaningfulMentorName(candidateName)) {
          results.push({ name: candidateName });
        }
      }

      fromIndex = wordIndex + word.length;
    }
  });

  return results;
}

function dedupeMentors(mentors) {
  const seen = new Set();
  return mentors.filter((mentor) => {
    let key = null;
    if (mentor.github) {
      key = `github:${mentor.github.toLowerCase()}`;
    } else if (mentor.githubUrl) {
      key = `url:${mentor.githubUrl.toLowerCase()}`;
    } else if (mentor.name) {
      key = `name:${mentor.name.toLowerCase()}`;
    }

    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isHighConfidenceGitHubAnchor(anchor, githubProfile) {
  const context = (anchor.context || '').trim();
  return isLikelyMentor(context, githubProfile.github);
}

function isMeaningfulMentorName(name) {
  const value = String(name || '').trim();
  if (!value) return false;
  if (value.length < 3) return false;
  const normalized = value.toLowerCase();
  if (STOPWORD_NAMES.has(normalized)) return false;
  // Check all tokens (including hyphenated) for stopwords
  const allTokens = value.toLowerCase().split(/[\s-]+/);
  for (const token of allTokens) {
    if (STOPWORD_NAMES.has(token)) return false;
  }
  return true;
}

function isMeaningfulGitHubHandle(handle) {
  if (!handle) return false;
  if (handle.length < 4) return false;
  const normalized = handle.toLowerCase();
  if (GENERIC_GITHUB_HANDLES.has(normalized)) return false;
  // Reject handles that look like org names (contain org suffixes or common library prefixes)
  if (/(project|org|lib|tool|libs|framework|sdk)([-_]|$)/i.test(handle)) return false;
  // Reject handles that start with 'lib' (common library naming convention)
  if (/^lib[a-z0-9]/i.test(handle)) return false;
  return true;
}

function applyTip(entry) {
  if (entry.channels.length > 0) {
    entry.tip = CONTACT_TIPS[entry.channels[0].type] || '';
    return;
  }

  if (entry.mailingLists.length > 0) {
    entry.tip = CONTACT_TIPS['Mailing list'] || '';
    return;
  }

  entry.tip = '';
}

function finalizeStatus(entry) {
  if (entry.channels.length > 0 || entry.mailingLists.length > 0 || entry.mentors.length > 0) {
    entry.status = 'ok';
  } else if (entry.status !== 'fetch-failed') {
    entry.status = 'no-contact-found';
  }
}

function extractMentors(html, orgInput, options = {}) {
  const fetchedAt = options.fetchedAt || new Date().toISOString();
  const org = typeof orgInput === 'string'
    ? { name: orgInput, ideas: options.ideasUrl || '' }
    : orgInput;

  const entry = buildBaseEntry(org, fetchedAt);
  const ideasUrl = typeof options.ideasUrl === 'string'
    ? options.ideasUrl
    : entry.ideasUrl;
  const baseUrl = ideasUrl || 'https://example.test/';
  const anchors = extractAnchorCandidates(html);
  const seenUrls = new Set();
  const mentors = [];

  anchors.forEach((anchor) => {
    const normalizedUrl = normalizeHttpUrl(anchor.href, baseUrl);
    if (!normalizedUrl) return;

    const channelType = detectChannelType(normalizedUrl);
    if (channelType) {
      if (!seenUrls.has(normalizedUrl) && isHighConfidenceChannel(channelType, normalizedUrl, anchor)) {
        seenUrls.add(normalizedUrl);
        const record = createChannelRecord(org.name, channelType, normalizedUrl, anchor.label);
        if (channelType === 'Mailing list') {
          entry.mailingLists.push(record);
        } else {
          entry.channels.push(record);
        }
      }
    }

    const githubProfile = isGitHubProfileUrl(normalizedUrl);
    if (githubProfile && isHighConfidenceGitHubAnchor(anchor, githubProfile)) {
      mentors.push(githubProfile);
    }

      if (isLikelyMentor(anchor.context)) {
        mentors.push(...extractMentorMentions(anchor.context));
      }
  });

  const pageText = stripHtml(html);
  if (isLikelyMentor(pageText)) {
    mentors.push(...extractMentorMentions(pageText));
  }
  entry.mentors = dedupeMentors(mentors)
    .filter((mentor) => (mentor.github && isMeaningfulGitHubHandle(mentor.github)) || isMeaningfulMentorName(mentor.name))
    .map((mentor) => ({
      name: mentor.name || '',
      github: mentor.github || '',
      githubUrl: mentor.githubUrl || ''
    }));

  entry.status = 'no-contact-found';
  applyTip(entry);
  finalizeStatus(entry);
  return entry;
}

function loadExistingMentorsData() {
  try {
    if (fs.existsSync(OUTPUT_PATH)) {
      const data = fs.readFileSync(OUTPUT_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`⚠️  Could not load existing mentors data: ${error.message}`);
  }
  return {};
}

async function extractForOrg(org, fetchedAt) {
  const entry = buildBaseEntry(org, fetchedAt);
  const ideasUrl = typeof org.ideas === 'string' ? org.ideas.trim() : '';

  if (!ideasUrl) {
    return entry;
  }

  try {
    const response = await fetchWithTimeout(ideasUrl, { headers: DEFAULT_HEADERS });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return extractMentors(html, org, { fetchedAt, ideasUrl });
  } catch (error) {
    console.error(`❌ Failed mentor extraction for ${org.name}: ${error.message}`);
    return entry;
  }
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const { limit, orgs } = parseArgs(process.argv.slice(2));

  let targets = [...ORGS];
  if (Array.isArray(orgs) && orgs.length > 0) {
    targets = targets.filter((org) => orgs.includes(org.name.toLowerCase()));
  }
  if (Number.isFinite(limit) && limit > 0) {
    targets = targets.slice(0, limit);
  }

  console.log(`🚀 Extracting mentor contact data for ${targets.length} orgs`);

  // Load existing data to preserve non-target orgs during partial runs
  const results = loadExistingMentorsData();
  
  // Initialize only target orgs (new ones won't be in existing data)
  for (const org of targets) {
    if (!results[org.name]) {
      results[org.name] = buildBaseEntry(org, fetchedAt);
    }
  }

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const extracted = await Promise.all(batch.map((org) => extractForOrg(org, fetchedAt)));

    extracted.forEach((entry) => {
      results[entry.org] = entry;
      console.log(`✅ ${entry.org} → ${entry.status} (${entry.channels.length} channels, ${entry.mailingLists.length} lists, ${entry.mentors.length} mentors)`);
    });

    if (i + BATCH_SIZE < targets.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`🎉 Saved mentor data to ${OUTPUT_PATH}`);
}

module.exports = {
  extractMentors
};

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal mentor extraction error:', error);
    process.exit(1);
  });
}
