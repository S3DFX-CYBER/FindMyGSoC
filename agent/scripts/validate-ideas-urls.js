#!/usr/bin/env node
/**
 * URL Validation Script for GSoC Org Finder
 * 
 * Validates all organization ideas URLs in src/js/org.js to ensure:
 * - URLs are properly formatted
 * - URLs use http or https protocols only
 * - No malicious or suspicious URLs are present
 * 
 * Usage: node agent/scripts/validate-ideas-urls.js
 */

const ORGS = require('../../src/js/org.js');

console.log('Validating Ideas URLs for GSoC Organizations\n');
console.log('═'.repeat(60));

let validCount = 0;
let invalidCount = 0;
let missingCount = 0;
let httpCount = 0;
let httpsCount = 0;
let placeholderCount = 0;

// Common patterns for placeholder/generic URLs
const PLACEHOLDER_PATTERNS = [
  /summerofcode\.withgoogle\.com\/programs\/\d{4}\/organizations\//i,
  /ideas\.md$/i,
  /TODO/i,
  /TBA/i,
  /pending/i
];

function isPlaceholderUrl(url) {
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(url));
}

function validateUrl(url) {
  try {
    let testUrl = url.trim();
    
    // Add https:// only if no protocol scheme is present
    // This prevents converting malicious URLs like javascript:alert(1) to https://javascript:alert(1)
    if (!testUrl.includes('://')) {
      testUrl = 'https://' + testUrl;
    }
    
    const urlObj = new URL(testUrl);
    
    // Check protocol
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return { valid: false, reason: `Invalid protocol: ${urlObj.protocol}` };
    }
    
    // Track protocol usage
    if (urlObj.protocol === 'http:') {
      httpCount++;
    } else {
      httpsCount++;
    }
    
    // Check for placeholder URLs
    if (isPlaceholderUrl(url)) {
      placeholderCount++;
      return { valid: true, warning: 'Placeholder/Generic URL' };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, reason: e.message };
  }
}

// Process each organization
ORGS.forEach((org) => {
  if (!org.ideas) {
    missingCount++;
    console.log(`⚠️  ${org.name}`);
    console.log(`    Missing ideas URL\n`);
    return;
  }
  
  const result = validateUrl(org.ideas);
  
  if (result.valid) {
    validCount++;
    if (result.warning) {
      console.log(`📋 ${org.name}`);
      console.log(`    ${org.ideas}`);
      console.log(`    ⚠️  Warning: ${result.warning}\n`);
    } else {
      console.log(`✓  ${org.name}`);
      console.log(`    ${org.ideas}\n`);
    }
  } else {
    invalidCount++;
    console.log(`✗  ${org.name}`);
    console.log(`    ${org.ideas}`);
    console.log(`    ❌ Error: ${result.reason}\n`);
  }
});

// Print summary
console.log('═'.repeat(60));
console.log('\n📊 Validation Summary\n');
console.log(`Total Organizations: ${ORGS.length}`);
console.log(`✅ Valid URLs:        ${validCount}`);
console.log(`❌ Invalid URLs:      ${invalidCount}`);
console.log(`⚠️  Missing URLs:      ${missingCount}`);
console.log(`📋 Placeholder URLs:  ${placeholderCount}`);
console.log(`\nProtocol Distribution:`);
console.log(`  🔒 HTTPS: ${httpsCount}`);
console.log(`  🔓 HTTP:  ${httpCount}`);

// Exit with error code if there are invalid URLs
if (invalidCount > 0) {
  console.log('\n⚠️  Some URLs failed validation. Please review and fix them.');
  process.exit(1);
} else {
  console.log('\n🎉 All URLs passed validation!');
  if (placeholderCount > 0) {
    console.log(`\nℹ️  Note: ${placeholderCount} placeholder/generic URLs detected.`);
    console.log('   Consider updating these with actual project ideas pages.');
  }
  process.exit(0);
}
