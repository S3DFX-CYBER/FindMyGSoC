const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment
globalThis.window = {};

// Set up globals needed by recommender.js
globalThis.ORGS = require('../src/js/org.js');

// Import skillExtractor first to populate globalThis.normalizeSkill
require('../src/js/skillExtractor.js');

// Import recommender
const { getRecommendations } = require('../src/js/recommender.js');

test('getRecommendations returns top 6 recommendations sorted by score', () => {
  const resumeSkills = ['Python', 'Docker', 'Machine Learning'];
  const recommendations = getRecommendations(resumeSkills, null);

  assert.strictEqual(recommendations.length, 6);
  
  // Verify they are sorted in descending order of rawScore
  for (let i = 0; i < recommendations.length - 1; i++) {
    assert.ok(recommendations[i].rawScore >= recommendations[i + 1].rawScore);
  }

  // Each recommendation object must have required properties
  recommendations.forEach(rec => {
    assert.ok('org' in rec);
    assert.ok('score' in rec);
    assert.ok('rawScore' in rec);
    assert.ok(Array.isArray(rec.matchedSkills));
    assert.ok(Array.isArray(rec.reasons));
  });
});

test('getRecommendations calculates matching scores and yields logical match reasons', () => {
  // Test with highly specialized skills (e.g. Kotlin / Android)
  const resumeSkills = ['Kotlin', 'Android'];
  const recommendations = getRecommendations(resumeSkills, null);

  // FOSSASIA is a known android/java org, so it should be recommended
  const fossasiaRec = recommendations.find(r => r.org.name === 'FOSSASIA');
  assert.ok(fossasiaRec, 'FOSSASIA should be recommended');
  assert.ok(fossasiaRec.score > 0, 'FOSSASIA score should be positive with Kotlin/Android skills');
});

test('getRecommendations includes stability bonus for veteran organizations', () => {
  const recommendations = getRecommendations(['C', 'Linux'], null);
  
  // The Linux Foundation has 11 years, so it's a veteran and should have a stability bonus
  const lfRec = recommendations.find(r => r.org.name === 'The Linux Foundation');
  assert.ok(lfRec, 'The Linux Foundation should be recommended');
  const hasVeteranReason = lfRec.reasons.some(r => r.includes('GSoC Veteran'));
  assert.ok(hasVeteranReason, 'Should have GSoC Veteran stability bonus reason');
});
