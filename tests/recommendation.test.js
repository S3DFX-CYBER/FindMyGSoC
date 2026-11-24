const test = require('node:test');
const assert = require('node:assert');

// Mock browser globals for Node.js test environment
globalThis.window = {};

// Set up globals needed by recommender.js
globalThis.ORGS = require('../src/js/org.js');

// Import skillExtractor first to populate globalThis.normalizeSkill
require('../src/js/skillExtractor.js');

// Import recommender
const { getRecommendations, calculateActivityScore } = require('../src/js/recommender.js');

test('getRecommendations returns top 6 recommendations sorted by score', () => {
  const resumeSkills = ['Python', 'Docker', 'Machine Learning'];
  const recommendations = getRecommendations(resumeSkills, null);

  assert.strictEqual(recommendations.length, 6);
  
  // Verify they are sorted in descending order of score
  for (let i = 0; i < recommendations.length - 1; i++) {
    assert.ok(recommendations[i].score >= recommendations[i + 1].score);
  }

  // Each recommendation object must have required properties and must not expose internal rawScore
  recommendations.forEach(rec => {
    assert.ok('org' in rec);
    assert.ok('score' in rec);
    assert.strictEqual('rawScore' in rec, false, 'rawScore must not be exposed in recommendation results');
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

test('unknown organisation activity is neutral, not low', () => {
  const reasons = [];
  const score = calculateActivityScore({ activity: 'low' }, { name: 'X' }, reasons);
  assert.strictEqual(score, 10, 'an org with no activity data must not be scored as low');
  assert.ok(
    !reasons.some((r) => /manageable pacing/i.test(r)),
    'and must not be given the low-activity reason'
  );
});

test('known organisation activity still scores and explains itself', () => {
  const reasons = [];
  const high = calculateActivityScore({ activity: 'high' }, { _gh: { activity: 'active' } }, reasons);
  assert.ok(high > 10, 'a known active org scores above the neutral baseline');
  assert.ok(reasons.length > 0, 'and the match is explained');

  const reasons2 = [];
  const low = calculateActivityScore({ activity: 'low' }, { _gh: { activity: 'low' } }, reasons2);
  assert.ok(low >= 10, 'a known low-activity org still scores');
});

test('getRecommendations sorts ties deterministically using internal tiebreaker without exposing rawScore', () => {
  const originalOrgs = globalThis.ORGS;
  try {
    globalThis.ORGS = [
      { name: 'OrgA', tags: ['python'], cat: 'python', years: 0 },
      { name: 'OrgWithLongerName', tags: ['python'], cat: 'python', years: 0 },
    ];
    const recs = getRecommendations(['python'], null, 2);
    assert.strictEqual(recs.length, 2);
    // Both orgs have the exact same base score
    assert.strictEqual(recs[0].score, recs[1].score);
    // OrgWithLongerName has higher tiebreaker ((17 % 10)/100 = 0.07 vs (4 % 10)/100 = 0.04)
    // so it must be ranked first deterministically
    assert.strictEqual(recs[0].org.name, 'OrgWithLongerName');
    assert.strictEqual(recs[1].org.name, 'OrgA');
    // rawScore must not be exposed on either object
    assert.strictEqual('rawScore' in recs[0], false);
    assert.strictEqual('rawScore' in recs[1], false);
  } finally {
    globalThis.ORGS = originalOrgs;
  }
});
