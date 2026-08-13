// src/js/recommender.js

/* global ORGS */

/**
 * Retrieves recommended organizations based on skills and profile.
 * 
 * @param {Array<string>} resumeSkills - Unique set of extracted resume skills
 * @param {Object|null} githubProfile - Optional GitHub profile metrics
 * @param {number} [count=6] - Maximum number of organizations to return.
 *   Pass Infinity to return all scored orgs. Negative numbers, NaN, null and non numeric values fall back to the default of 6.
 * @returns {Array<Object>} - Recommended organizations sorted by score
 */
function getRecommendations(resumeSkills = [], githubProfile = null, count = 6) {
  if (typeof ORGS === 'undefined' || !Array.isArray(ORGS)) {
    console.error("ORGS is not defined.");
    return [];
  }
  
  const parsed = Number(count);
  const safeCount = ( !Number.isNaN(parsed) && parsed > 0) ? Math.floor(parsed) : 6;

  const normalize = globalThis.normalizeSkill || (s => s);
  const userLanguages = new Set();
  const userTopics = new Set();

  if (githubProfile) {
    (githubProfile.languages || []).forEach(l => userLanguages.add(normalize(l.toLowerCase())));
    (githubProfile.topics || []).forEach(t => userTopics.add(normalize(t.toLowerCase())));
  }

  resumeSkills.forEach(s => {
    const skill = normalize(s.toLowerCase());
    userLanguages.add(skill);
    userTopics.add(skill);
  });

  const scoredOrgs = ORGS.map((org, index) => 
    calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile)
  );
  
  scoredOrgs.sort((a, b) => b.rawScore - a.rawScore);
  return scoredOrgs.slice(0, safeCount);
}

function calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons) {
  const primaryLangs = [];
  userLanguages.forEach(lang => {
    if (orgTags.has(lang) || orgCat === lang) {
      matchedSkills.push(lang);
      primaryLangs.push(lang);
    }
  });

  const langMatches = primaryLangs.length;
  if (langMatches === 0) return 0;

  let langDelta = 0;
  if (langMatches >= 1) langDelta += 15;
  if (langMatches >= 2) langDelta += 12;
  if (langMatches >= 3) langDelta += 8;
  if (langMatches >= 4) langDelta += 5;

  const displayLangs = primaryLangs.slice(0, 2).join(", ");
  matchReasons.push(`Strong stack match: ${displayLangs}${primaryLangs.length > 2 ? '...' : ''}`);
  return Math.min(langDelta, 40);
}

function calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons) {
  const matchedTopics = [];
  userTopics.forEach(topic => {
    if (!matchedSkills.includes(topic) && (orgTags.has(topic) || orgCat === topic)) {
      matchedTopics.push(topic);
      matchedSkills.push(topic);
    }
  });

  const topicMatches = matchedTopics.length;
  if (topicMatches === 0) return 0;

  let topicDelta = 0;
  if (topicMatches >= 1) topicDelta += 12;
  if (topicMatches >= 2) topicDelta += 10;
  if (topicMatches >= 3) topicDelta += 8;

  matchReasons.push(`Fits your interests in ${matchedTopics[0]}`);
  return Math.min(topicDelta, 30);
}

function calculateActivityScore(githubProfile, org, matchReasons) {
  if (!githubProfile) return 8;

  const userAct = (githubProfile.activity || 'low').toLowerCase();
  const orgAct = (org._gh?.activity || org.activity || org.competition || 'low').toLowerCase();
  const isHigh = orgAct === 'active' || orgAct === 'high' || orgAct === 'hot';
  const isMed = orgAct === 'moderate' || orgAct === 'medium';
  const isLow = orgAct === 'low' || orgAct === 'chill';

  if (userAct === 'high' && isHigh) {
    matchReasons.push("Matches your high activity pace");
    return 15;
  }
  if (userAct === 'medium' && (isMed || isHigh)) {
    matchReasons.push("Sustainable pace for your activity level");
    return 12;
  }
  if (userAct === 'low' && isLow) {
    matchReasons.push("Good entry point with manageable pacing");
    return 15;
  }
  return 5;
}

function calculateExperienceScore(githubProfile, org, matchReasons) {
  const userStars = githubProfile?.stars || 0;
  const userLangCount = githubProfile?.languages?.length || 0;
  const isExperienced = userStars > 50 || userLangCount > 5;
  const isBeginner = !githubProfile || (userStars < 10 && userLangCount < 3);
  const orgCodebase = (org.codebase || 'intermediate').toLowerCase();

  if (isBeginner && orgCodebase === 'beginner') {
    matchReasons.push("Very beginner-friendly codebase");
    return 25;
  }
  if (isExperienced && orgCodebase === 'advanced') {
    matchReasons.push("Challenging project for your experience");
    return 20;
  }
  if (orgCodebase === 'intermediate') {
    return 15;
  }
  return 10;
}

function calculateStabilityBonus(org, matchReasons) {
  const years = org.years || 0;
  if (years >= 10) {
    matchReasons.push(`GSoC Veteran (${years} years)`);
    return 10;
  }
  if (years >= 5) {
    return 5;
  }
  return 0;
}

function calculateScoreForOrg(org, index, userLanguages, userTopics, githubProfile) {
  const matchReasons = [];
  const matchedSkills = [];
  const orgNormalize = globalThis.normalizeSkill || (s => s);
  const orgTags = new Set((org.tags || []).map(t => orgNormalize(t.toLowerCase())));
  const orgCat = org.cat ? orgNormalize(org.cat.toLowerCase()) : '';

  let score = 0;
  
  score += calculateLanguageScore(userLanguages, orgTags, orgCat, matchedSkills, matchReasons);
  score += calculateTopicScore(userTopics, orgTags, orgCat, matchedSkills, matchReasons);
  score += calculateActivityScore(githubProfile, org, matchReasons);
  score += calculateExperienceScore(githubProfile, org, matchReasons);
  score += calculateStabilityBonus(org, matchReasons);

  const cappedScore = Math.min(Math.round(score), 99);
  const tieBreaker = (org.name.length % 10) / 100 + (index % 100) / 10000;
  const finalRawScore = score + tieBreaker;

  if (matchReasons.length === 0) {
    matchReasons.push("Matches your general developer profile");
  }

  return {
    org: org,
    score: cappedScore, 
    rawScore: finalRawScore,
    matchedSkills: [...new Set(matchedSkills)],
    reasons: matchReasons
  };
}

globalThis.getRecommendations = getRecommendations;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getRecommendations };
}
