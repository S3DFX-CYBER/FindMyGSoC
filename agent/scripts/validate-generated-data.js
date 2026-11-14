#!/usr/bin/env node
/* eslint-env node */

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../..');

const errors = [];

function addError(filePath, fieldPath, message) {
  const fieldSuffix = fieldPath ? ':' + fieldPath : '';
  const errorPath = filePath + fieldSuffix;
  errors.push(`${errorPath} - ${message}`);
}

function loadJson(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);

  let raw;
  try {
    raw = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    addError(relativePath, '', `could not read file (${error.message})`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    addError(relativePath, '', `invalid JSON (${error.message})`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isValidDateString(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isBareEmailAddress(value) {
  if (!isNonEmptyString(value)) return false;
  if (value.includes(' ')) return false;

  const atIndex = value.indexOf('@');
  const dotIndex = value.indexOf('.', atIndex + 1);
  return atIndex > 0 &&
    dotIndex > atIndex + 1 &&
    dotIndex < value.length - 1 &&
    !value.includes('@', atIndex + 1);
}

function isContactUrl(value) {
  if (typeof value !== 'string') return false;
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:';
  } catch {
    return isBareEmailAddress(value);
  }
}

function expectPlainObject(filePath, fieldPath, value) {
  if (!isPlainObject(value)) {
    addError(filePath, fieldPath, 'expected an object');
    return false;
  }
  return true;
}

function expectArray(filePath, fieldPath, value) {
  if (!Array.isArray(value)) {
    addError(filePath, fieldPath, 'expected an array');
    return false;
  }
  return true;
}

function expectNonEmptyString(filePath, fieldPath, value) {
  if (!isNonEmptyString(value)) {
    addError(filePath, fieldPath, 'expected a non-empty string');
    return false;
  }
  return true;
}

function expectNonNegativeInteger(filePath, fieldPath, value) {
  if (!isNonNegativeInteger(value)) {
    addError(filePath, fieldPath, 'expected a non-negative integer');
    return false;
  }
  return true;
}

function expectDateString(filePath, fieldPath, value) {
  if (!isValidDateString(value)) {
    addError(filePath, fieldPath, 'expected a valid date string');
    return false;
  }
  return true;
}

function expectHttpUrl(filePath, fieldPath, value) {
  if (!isHttpUrl(value)) {
    addError(filePath, fieldPath, 'expected an http(s) URL');
    return false;
  }
  return true;
}

function expectOptionalHttpUrl(filePath, fieldPath, value) {
  // The generator writes "" when a URL is unavailable; that is valid data.
  if (value === '') return true;
  return expectHttpUrl(filePath, fieldPath, value);
}

function expectContactUrl(filePath, fieldPath, value) {
  if (!isContactUrl(value)) {
    addError(filePath, fieldPath, 'expected an http(s) URL, mailto URL, email address, or empty string');
    return false;
  }
  return true;
}

function validateIssue(filePath, issue, index) {
  const basePath = `issues[${index}]`;
  if (!expectPlainObject(filePath, basePath, issue)) return;

  expectNonEmptyString(filePath, `${basePath}.org`, issue.org);
  expectNonEmptyString(filePath, `${basePath}.github`, issue.github);
  expectHttpUrl(filePath, `${basePath}.logo`, issue.logo);
  expectNonEmptyString(filePath, `${basePath}.title`, issue.title);
  expectHttpUrl(filePath, `${basePath}.url`, issue.url);
  expectNonEmptyString(filePath, `${basePath}.repo`, issue.repo);
  expectNonNegativeInteger(filePath, `${basePath}.comments`, issue.comments);
  expectDateString(filePath, `${basePath}.created_at`, issue.created_at);
  expectDateString(filePath, `${basePath}.updated_at`, issue.updated_at);

  if (issue.language !== null && typeof issue.language !== 'string') {
    addError(filePath, `${basePath}.language`, 'expected null or string');
  }

  if (expectArray(filePath, `${basePath}.labels`, issue.labels)) {
    issue.labels.forEach((label, labelIndex) => {
      expectNonEmptyString(filePath, `${basePath}.labels[${labelIndex}]`, label);
    });
  }
}

function validateIssuesJson() {
  const filePath = 'data/issues.json';
  const data = loadJson(filePath);
  if (!data || !expectPlainObject(filePath, '', data)) return;

  expectDateString(filePath, 'updated_at', data.updated_at);
  expectNonNegativeInteger(filePath, 'source_org_count', data.source_org_count);
  expectNonNegativeInteger(filePath, 'total_issues', data.total_issues);

  if (!expectArray(filePath, 'issues', data.issues)) return;

  if (data.total_issues !== data.issues.length) {
    addError(
      filePath,
      'total_issues',
      `expected ${data.issues.length} to match issues.length`
    );
  }

  data.issues.forEach((issue, index) => validateIssue(filePath, issue, index));
  return data;
}

function validateLastUpdatedJson() {
  const filePath = 'data/last-updated.json';
  const data = loadJson(filePath);
  if (!data || !expectPlainObject(filePath, '', data)) return;

  expectDateString(filePath, 'updatedAt', data.updatedAt);
}

function validateContact(filePath, contact, fieldPath) {
  if (!expectPlainObject(filePath, fieldPath, contact)) return;

  expectNonEmptyString(filePath, `${fieldPath}.type`, contact.type);
  expectContactUrl(filePath, `${fieldPath}.url`, contact.url);
  expectNonEmptyString(filePath, `${fieldPath}.label`, contact.label);
}

function validateMentor(filePath, mentor, fieldPath) {
  if (!expectPlainObject(filePath, fieldPath, mentor)) return;

  if (typeof mentor.name !== 'string') {
    addError(filePath, `${fieldPath}.name`, 'expected a string');
  }
  // Generated mentor data may omit GitHub details; empty strings are valid.
  if (typeof mentor.github !== 'string') {
    addError(filePath, `${fieldPath}.github`, 'expected a string');
  }
  if (typeof mentor.githubUrl !== 'string') {
    addError(filePath, `${fieldPath}.githubUrl`, 'expected a string');
  } else if (mentor.githubUrl && !isHttpUrl(mentor.githubUrl)) {
    addError(filePath, `${fieldPath}.githubUrl`, 'expected an http(s) URL or empty string');
  }
}

function validateMentorEntry(filePath, entry, orgName) {
  if (!expectPlainObject(filePath, orgName, entry)) return;

  expectNonEmptyString(filePath, `${orgName}.org`, entry.org);
  expectOptionalHttpUrl(filePath, `${orgName}.ideasUrl`, entry.ideasUrl);
  const hasChannels = expectArray(filePath, `${orgName}.channels`, entry.channels);
  const hasMentors = expectArray(filePath, `${orgName}.mentors`, entry.mentors);
  expectDateString(filePath, `${orgName}.lastFetched`, entry.lastFetched);

  if (typeof entry.tip !== 'string') {
    addError(filePath, `${orgName}.tip`, 'expected a string');
  }

  if (!['ok', 'no-contact-found', 'fetch-failed'].includes(entry.status)) {
    addError(filePath, `${orgName}.status`, 'expected ok, no-contact-found, or fetch-failed');
  }

  if (hasChannels) {
    entry.channels.forEach((contact, index) => {
      validateContact(filePath, contact, `${orgName}.channels[${index}]`);
    });
  }

  if (hasMentors) {
    entry.mentors.forEach((mentor, index) => {
      validateMentor(filePath, mentor, `${orgName}.mentors[${index}]`);
    });
  }

  if (entry.mailingLists !== undefined) {
    if (expectArray(filePath, `${orgName}.mailingLists`, entry.mailingLists)) {
      entry.mailingLists.forEach((contact, index) => {
        validateContact(filePath, contact, `${orgName}.mailingLists[${index}]`);
      });
    }
  }
}

function validateMentorsJson() {
  const filePath = 'data/mentors.json';
  const data = loadJson(filePath);
  if (!data || !expectPlainObject(filePath, '', data)) return;

  Object.entries(data).forEach(([orgName, entry]) => {
    validateMentorEntry(filePath, entry, orgName);
  });
}

function validateUiSummaryJson(issuesData) {
  const filePath = 'data/ui-summary.json';
  const data = loadJson(filePath);
  if (!data || !expectPlainObject(filePath, '', data)) return;

  expectDateString(filePath, 'generatedAt', data.generatedAt);
  expectNonNegativeInteger(filePath, 'totalIssues', data.totalIssues);
  expectNonNegativeInteger(filePath, 'totalOrgs', data.totalOrgs);
  expectNonNegativeInteger(filePath, 'totalLabels', data.totalLabels);

  if (expectArray(filePath, 'topOrganizations', data.topOrganizations)) {
    data.topOrganizations.forEach((orgName, index) => {
      expectNonEmptyString(filePath, `topOrganizations[${index}]`, orgName);
    });
  }

  if (!issuesData || !Array.isArray(issuesData.issues)) return;

  const uniqueOrgs = new Set();
  const uniqueLabels = new Set();
  issuesData.issues.forEach((issue) => {
    if (issue.org) uniqueOrgs.add(issue.org);
    if (Array.isArray(issue.labels)) {
      issue.labels.forEach((label) => uniqueLabels.add(label));
    }
  });

  if (data.totalIssues !== issuesData.issues.length) {
    addError(filePath, 'totalIssues', `expected ${issuesData.issues.length} from issues.json`);
  }
  if (data.totalOrgs !== uniqueOrgs.size) {
    addError(filePath, 'totalOrgs', `expected ${uniqueOrgs.size} unique issue orgs`);
  }
  if (data.totalLabels !== uniqueLabels.size) {
    addError(filePath, 'totalLabels', `expected ${uniqueLabels.size} unique issue labels`);
  }
}

function validateOrgStatsJson() {
  const filePath = 'data/org-stats.json';
  const data = loadJson(filePath);
  if (!data) return;

  // Current generated data is {}; no field schema is defined yet.
  expectPlainObject(filePath, '', data);
}

function main() {
  const issuesData = validateIssuesJson();
  validateLastUpdatedJson();
  validateMentorsJson();
  validateUiSummaryJson(issuesData);
  validateOrgStatsJson();

  if (errors.length > 0) {
    console.error('Generated data validation failed:\n');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Generated data validation passed.');
}

main();
