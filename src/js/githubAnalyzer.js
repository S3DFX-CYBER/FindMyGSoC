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

async function fetchUserProfileFromAPI(normalizedUsername, signal) {
  const response = await fetch(`${USER_API_ENDPOINT}?user=${encodeURIComponent(normalizedUsername)}`, { signal });
  let data;
  try {
    data = await response.json();
  } catch {
    // Handle case where response is not valid JSON
  }

  if (!response.ok) {
    throw new Error(data?.error || `Failed to fetch user data: ${response.status}`);
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyzeGitHubUser };
}
