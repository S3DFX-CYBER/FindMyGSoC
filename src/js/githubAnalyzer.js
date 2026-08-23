// src/js/githubAnalyzer.js

/**
 * githubAnalyzer.js
 * 
 * Fetches and analyzes a user's GitHub profile to extract dominant languages, 
 * topics, and activity levels. Uses the Vercel edge proxy to avoid CORS/rate limits
 * where possible, and falls back to local cache.
 */

const GITHUB_ANALYZER_CACHE_KEY = 'gaf_user_cache';
const USER_API_ENDPOINT = '/api/github';

const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getLocalCache() {
  try {
    const raw = localStorage.getItem(GITHUB_ANALYZER_CACHE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw);
    if (cache && typeof cache === 'object' && !Array.isArray(cache)) {
      return cache;
    }
    return {};
  } catch {
    return {};
  }
}

function setLocalCache(cache) {
  try {
    localStorage.setItem(GITHUB_ANALYZER_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Could not write to localStorage for githubAnalyzer', err);
  }
}

/**
 * Directly queries the public GitHub REST API from the client browser.
 * Used as a fallback when the edge proxy is unavailable or unauthenticated.
 * Subject to GitHub's unauthenticated rate limit (60 req/hr per IP).
 *
 * @param {string} normalizedUsername - Lowercase GitHub username
 * @returns {Promise<Object>} - Profile data in the same shape as the edge proxy response
 */
async function fetchUserProfileDirect(normalizedUsername) {
  const response = await fetch(
    // Fetch up to 100 most recently updated repos (GitHub API max per_page).
    // Note: Users with >100 repos will have incomplete profile data.
    `https://api.github.com/users/${encodeURIComponent(normalizedUsername)}/repos?per_page=100&sort=updated`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'gsoc-org-finder',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub ${response.status}`);
  }

  const repos = await response.json();

  if (!Array.isArray(repos)) {
    throw new Error('GitHub API returned invalid response format');
  }

  let totalStars = 0;
  const languageCounts = {};
  const topicCounts = {};
  let activeDays = 9999;

  repos.forEach(r => {
    if (r.fork) return;
    totalStars += r.stargazers_count || 0;
    if (r.language) {
      languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
    }
    if (Array.isArray(r.topics)) {
      r.topics.forEach(t => { topicCounts[t] = (topicCounts[t] || 0) + 1; });
    }
    if (r.pushed_at) {
      const days = Math.floor((Date.now() - new Date(r.pushed_at)) / 86400000);
      if (days < activeDays) activeDays = days;
    }
  });

  const languages = Object.entries(languageCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(x => x[0]);

  let activity = 'low';
  if (activeDays < 30) activity = 'high';
  else if (activeDays < 90) activity = 'medium';

  return { languages, topics, stars: totalStars, activity };
}

async function fetchUserProfileFromAPI(normalizedUsername, signal) {
  let response;
  let data;

  try {
    response = await fetch(`${USER_API_ENDPOINT}?user=${encodeURIComponent(normalizedUsername)}`, { signal });
    try {
      data = await response.json();
    } catch {
      // Response body is not valid JSON
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    // Edge proxy is unreachable (network error, no GITHUB_TOKEN configured, etc.)
    // Fall back to the public GitHub API directly from the browser.
    return await fetchUserProfileDirect(normalizedUsername);
  }

  if (!response.ok) {
    // Edge proxy returned an error status. Fall back to the public GitHub API
    // so the recommender remains usable in local forks and unauthenticated deploys.
    return await fetchUserProfileDirect(normalizedUsername);
  }

  if (!data) {
    throw new Error("No response data returned from server");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

function handleAnalyzerError(err, username) {
  if (err.name === 'AbortError') {
    throw err; // Re-throw AbortError so it can be handled by the UI layer
  }
  console.error("GitHub Analyzer Error:", err);

  const message = err.message || "";
  if (message.includes("GitHub 404")) {
    throw new Error(`GitHub user '${username}' not found. Please ensure the username is correct.`);
  }
  if (message.includes("GitHub 403")) {
    throw new Error("GitHub API rate limit reached. Please try again later.");
  }
  if (message.includes("GitHub 401") || message.includes("Failed to fetch user data: 401") || message.includes("401 Unauthorized")) {
    throw new Error("GitHub API authorization failed. Please check the API token configuration or try again.");
  }
  if (message === "Invalid user") {
    throw new Error(`The username '${username}' is not in a valid GitHub format.`);
  }

  // Propagate operational errors directly instead of masking them
  throw new Error(message || `Could not analyze GitHub profile for '${username}'.`);
}

/**
 * Analyzes a GitHub username and returns a standardized UserProfile object.
 * 
 * @param {string} username - The GitHub username to analyze
 * @param {Object} [options] - Optional settings
 * @param {AbortSignal} [options.signal] - Signal to abort the request
 * @returns {Promise<Object>} - The UserProfile containing languages, topics, stars, and activity
 */
async function analyzeGitHubUser(username, options = {}) {
  const { signal } = options;
  if (!username || username.trim() === '') {
    throw new Error("Username cannot be empty");
  }

  const normalizedUsername = username.trim().toLowerCase();
  const cache = getLocalCache();

  const cachedUser = cache[normalizedUsername];
  if (cachedUser && Date.now() - cachedUser.ts < CACHE_EXPIRY_MS) {
    return cachedUser.data;
  }

  try {
    const data = await fetchUserProfileFromAPI(normalizedUsername, signal);

    // Structure the result
    const userProfile = {
      languages: data.languages || [],
      topics: data.topics || [],
      stars: data.stars || 0,
      activity: data.activity || 'low'
    };

    // Save to cache
    cache[normalizedUsername] = {
      ts: Date.now(),
      data: userProfile
    };
    setLocalCache(cache);

    return userProfile;
  } catch (err) {
    handleAnalyzerError(err, username);
  }
}

// Export for global usage
globalThis.analyzeGitHubUser = analyzeGitHubUser;
