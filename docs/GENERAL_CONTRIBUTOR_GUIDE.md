# General Contributor Guide

Welcome! This guide is for contributors who want to contribute to FindMyGSoC **outside** of any formal program (GSSoC or NSoC).

Whether you found a bug, want to add a feature, or simply want to improve the project — you're welcome here.

---

## Getting Started

### Prerequisites

- A GitHub account
- Basic understanding of Git (fork, clone, branch, commit, push)
- Familiarity with HTML/CSS/JavaScript (our core stack)

### Step 1 — Find an Issue

Browse the [Issues tab](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues) for open issues. Look for:

- Issues **without** `gssoc26` or `nsoc26` labels (these are program-reserved)
- `good first issue` label for beginner-friendly tasks
- `help wanted` label for tasks needing contributors
- Issues labeled `level:beginner`, `level:intermediate`, or `level:advanced` without program restrictions

**Assignment eligibility by level:**
- `level:beginner` — Anyone can self-assign (no restrictions)
- `level:intermediate` — Account must be at least 30 days old for auto-assignment
- `level:advanced` — Requires at least 1 merged PR in this repository

You can also **create your own issue** if you've found a bug or have a feature idea.

### Step 2 — Request Assignment

Comment on the issue with:

```
/assign
```

Since you are not part of a specific program, you can simply state:

> I would like to work on this issue as a general contributor.

### Step 3 — Wait for Confirmation

The assignment bot will process your request. Once confirmed, you can start working.

---

## No Program Restrictions

As a general contributor:

- No date restrictions on assignments
- No program-specific requirements
- No points tracking (contributions are recognized in the Contributors section)
- Standard open-source workflow applies

---

## PR Submission Process

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

### 2. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

Use descriptive branch names:
- `feat/add-search-filter` for features
- `fix/modal-overflow` for bug fixes
- `docs/update-readme` for documentation

### 3. Make Your Changes

Follow the project's zero-build, zero-dependency philosophy:
- No frameworks or build tools
- Vanilla HTML/CSS/JS only
- Keep it simple and maintainable

### 4. Commit with Sign-Off

```bash
git commit -s -m "feat: your descriptive message"
```

Use [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for UI/styling
- `refactor:` for code cleanup
- `perf:` for performance improvements

### 5. Push and Open a PR

```bash
git push origin feat/your-feature-name
```

When opening your PR, select the **General PR Template** and fill in all sections.

### 6. Link Your Issue

Your PR body **must** include:

```
Closes #issue-number
```

---

## General PR Template

Use the template at `.github/PULL_REQUEST_TEMPLATE/general.md`. It requires:

- Description of changes
- Related issue link
- Type of change
- Testing steps
- Screenshots (for UI changes)
- Checklist confirmation

---

## What Makes a Good Contribution

Strong contributions include:

- Meaningful bug fixes
- Useful features that improve the user experience
- Performance improvements
- Accessibility improvements
- Clean, maintainable refactors
- Quality documentation improvements
- Responsive/mobile improvements

Before opening a PR, ask yourself:

> Does this meaningfully improve the project?

---

## Rules & Guidelines

### Do

- Write clean, readable code
- Test changes locally before submitting
- Keep PRs focused and minimal
- Follow the existing code style
- Respond to review feedback promptly
- Be respectful to maintainers and other contributors

### Don't

- Self-assign issues via GitHub UI (use the bot)
- Start working before assignment is confirmed
- Submit AI-generated code without understanding it
- Add unnecessary dependencies or build tools
- Open PRs without linked issues
- Make changes unrelated to the linked issue

---

## Review Process (3-Stage Pipeline)

Your PR goes through an automated 3-stage pipeline:

| Stage | What Happens | Labels Applied |
|-------|-------------|----------------|
| **Stage 1** — Automated Checks | DCO sign-off, format validation, AI/slop detection, duplicate check, **LLM context analysis** | `stage-1-approved` on pass |
| **Stage 2** — Human Review | Maintainer or reviewer checks code quality | `mentor-approved` + `pa-review-required` |
| **Stage 3** — Maintainer Gate | Final approval and merge | `pa-approved` |

The **LLM PR Analysis** bot will automatically verify that your PR:
- Links to a valid issue
- Actually addresses the linked issue
- Does not include out-of-scope changes

Once merged, you're added to the Contributors section in the README.

### Expected Review Times

- PR review: 24–72 hours
- Please allow reasonable time before following up

---

## Reporting Bugs

If you find a bug:

1. Check existing issues to avoid duplicates
2. Open a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser/OS information
   - Screenshots if applicable

---

## Suggesting Features

If you have a feature idea:

1. Check existing issues for similar suggestions
2. Open a new issue describing:
   - What the feature does
   - Why it would be useful
   - How it fits the project's architecture
   - Any implementation ideas (optional)

---

## Local Development

### Quick Start

```bash
# Clone
git clone https://github.com/your-username/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-

# Open directly (no API features)
open index.html

# Full local development with API
npm install -g vercel
vercel dev
```

### Environment Setup

For full API functionality, set up a GitHub token:

1. Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) (only `public_repo` scope needed)
2. Set it in your Vercel project or local environment

---

## Code of Conduct

All contributors must follow the project's [Code of Conduct](../CODE_OF_CONDUCT.md). Be respectful, constructive, and collaborative.

---

## Resources

- [Project README](../README.md)
- [Main Contributing Guide](../CONTRIBUTING.md)
- [Project Discord](https://discord.gg/mgWV3xSV7)

---

## Need Help?

- Open a GitHub Issue with your question
- Use GitHub Discussions for general topics
- Join our [Discord server](https://discord.gg/mgWV3xSV7)

Thank you for contributing to FindMyGSoC!
