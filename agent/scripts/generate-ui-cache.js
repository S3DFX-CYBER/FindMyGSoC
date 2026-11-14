const fs = require('fs');

const issuesData = JSON.parse(
  fs.readFileSync('./data/issues.json', 'utf8')
);

const issues = issuesData.issues || [];

const orgs = new Set();
const labels = new Set();

for (const issue of issues) {
  if (issue.org) orgs.add(issue.org);

  if (Array.isArray(issue.labels)) {
    issue.labels.forEach(label => labels.add(label));
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalIssues: issues.length,
  totalOrgs: orgs.size,
  totalLabels: labels.size,
  topOrganizations: [...orgs].slice(0, 10)
};

if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

fs.writeFileSync(
  './data/ui-summary.json',
  JSON.stringify(summary, null, 2)
);

console.log('Generated UI cache');
console.log(summary);
