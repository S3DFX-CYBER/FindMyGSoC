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

  // FOSSASIA is a known android/java org, so it should rank on the skill match.
  // It used to be pushed into the top 6 by an "intermediate codebase" label that
  // no longer exists: difficulty is a property of a project, not of an org, and
  // the recommender now scores on the project sizes an org actually publishes.
  // What matters is that the match is real and explained, not its exact rank.
  const ranked = getRecommendations(resumeSkills, null, 15);
  const fossasiaRec = ranked.find(r => r.org.name === 'FOSSASIA');
  assert.ok(fossasiaRec, 'FOSSASIA should appear for Kotlin/Android skills');
  assert.ok(fossasiaRec.score > 0, 'FOSSASIA score should be positive with Kotlin/Android skills');
  assert.ok(
    fossasiaRec.reasons.some((r) => /android|kotlin|stack/i.test(r)),
    'the reason should name the stack that matched'
  );
});

test('getRecommendations includes stability bonus for veteran organizations', () => {
  const recommendations = getRecommendations(['C', 'Linux'], null);
  
  // The Linux Foundation has 11 years, so it's a veteran and should have a stability bonus
  const lfRec = recommendations.find(r => r.org.name === 'The Linux Foundation');
  assert.ok(lfRec, 'The Linux Foundation should be recommended');
  const hasVeteranReason = lfRec.reasons.some(r => r.includes('GSoC Veteran'));
  assert.ok(hasVeteranReason, 'Should have GSoC Veteran stability bonus reason');
});
