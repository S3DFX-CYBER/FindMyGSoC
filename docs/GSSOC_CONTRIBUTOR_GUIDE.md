# GSSoC'26 Contributor Guide

Welcome to the **GirlScript Summer of Code 2026** contribution track for FindMyGSoC!

GirlScript Summer of Code (GSSoC) is a 3-month open-source program conducted by the GirlScript Foundation. This repository focuses on meaningful open-source contributions, fair assignment workflows, and maintainable code quality.

---

## Getting Started

### Prerequisites

- A GitHub account
- Basic understanding of Git (fork, clone, branch, commit, push)
- Familiarity with HTML/CSS/JavaScript

---

## Step 1 — Find an Issue

Browse the repository **Issues** tab and filter using labels:

- `gssoc26`
- `level:beginner`
- `level:intermediate`
- `level:advanced`
- `type:bug`
- `type:ui`
- `type:api`
- `type:docs`
- `type:enhancement`

Issues are manually categorized using difficulty and type labels to help contributors choose tasks matching their experience level.

---

## Step 2 — Request Assignment

Comment on the issue with:

```
/assign gssoc
```

> You **must** include `gssoc` in the command.

**Example:**

```
/assign gssoc
```

> Do **NOT** self-assign issues using the GitHub UI.  
> Assignments are handled only through repository automation.

---

## Step 3 — Assignment Processing

The assignment system validates:

- The issue is unassigned
- You are under the active assignment limit
- GSSoC assignments are currently open
- Difficulty eligibility requirements are satisfied

### Assignment Eligibility Rules

| Issue Level | Requirement |
|-------------|-------------|
| `level:beginner` | No restrictions |
| `level:intermediate` | GitHub account must be at least 30 days old |
| `level:advanced` | At least 1 previously merged PR in this repository |

If requirements are not met, your request may remain queued and mentors or maintainers may manually approve.

> Do **NOT** start working until assignment confirmation appears on the issue.

---

## Mentor-Based Assignment Queue

For issues requiring approval:

1. Your assignment request is queued
2. Two active mentors are randomly selected
3. Selected mentors are notified automatically
4. Mentors have **24 hours** to approve
5. If mentors do not respond:
   - Inactive mentors are rotated
   - New active mentors are selected
   - The Project Admin may intervene manually

Mentors approve assignments using:

```
/approve-assignment @username
```

---

## GSSoC Assignment Timeline

| Date | Status |
|------|--------|
| Before 15 May 2026 | Assignments blocked |
| 15 May 2026 onwards | Assignments open |

> NSoC contributors are unaffected by this restriction.

---

## Contribution Levels & Points

| Level | Label | Points | Examples |
|-------|-------|--------|----------|
| Beginner | `level:beginner` | 10 pts | Docs, UI fixes, small bugs |
| Intermediate | `level:intermediate` | 25 pts | API fixes, filters, caching |
| Advanced | `level:advanced` | 45 pts | Performance, architecture, security |

Leaderboards update only after PRs are merged.

---

## Repository Philosophy

This project follows a zero-build, minimal-dependency, lightweight frontend, static-first architecture philosophy.

Avoid:

- Unnecessary frameworks
- Heavy dependencies
- Overengineering
- Large unrelated refactors

> [!IMPORTANT]
> **JavaScript Logic Duplication Warning**
> This repository runs a static frontend. To enable Node.js unit testing without running a headless browser, we maintain a copy of the application logic in both the inline scripts inside [index.html](../index.html) (production runtime) and [app.js](../src/js/app.js) (test environment).
> 
> If you are modifying the core frontend behavior (filters, sorting, search, modals, bookmarks, etc.), you **MUST** apply your changes to **both** files in sync. Run `npm test` locally to ensure they are properly aligned.

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

### 3. Make Changes

Keep changes focused, minimal, and maintainable. Avoid unrelated modifications.

### 4. Commit with Sign-Off

```bash
git commit -s -m "feat: improve issue filtering"
```

### 5. Push Changes

```bash
git push origin feat/your-feature-name
```

### 6. Open Pull Request

Use the GSSoC PR template. Your PR **must** include:

```
Closes #issue-number
```

**Example:**

```
Closes #142
```

> PRs without linked issues may be closed.

---

## Conventional Commit Format

**Format:**

```
type: short description
```

**Examples:**

```
feat: add dark mode toggle
fix: resolve navbar overflow
docs: update setup instructions
style: improve mobile spacing
refactor: simplify search logic
```

### Allowed Commit Types

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | UI/styling |
| `refactor` | Internal cleanup |
| `perf` | Performance |
| `ci` | Workflow/config |
| `chore` | Maintenance |

---

## Rules & Guidelines

### Do

- Write clean code
- Test changes locally
- Keep PRs focused
- Follow repository architecture
- Respond to review feedback
- Be respectful to contributors and mentors

### Do NOT

- Self-assign through GitHub UI
- Submit copied code
- Spam maintainers
- Open multiple tiny PRs
- Add unnecessary dependencies
- Submit code you do not understand
- Claim issues without intention to work

---

## Review Pipeline

All PRs go through a **3-stage review process**:

| Stage | Reviewer | Purpose |
|-------|----------|---------|
| Stage 1 | Automation | DCO, formatting, PR validation |
| Stage 2 | Mentor Review | Code quality & correctness |
| Stage 3 | Project Admin | Final approval & merge |

### Stage 1 — Automated Validation

Automation checks:

- DCO sign-off
- PR formatting
- Linked issue presence
- Repository rule compliance
- Duplicate PR detection
- PR size validation

Labels may be automatically applied during validation.

### Stage 2 — Mentor Review

After Stage 1 passes:

1. Active mentors are selected automatically
2. Mentors are assigned dynamically
3. Mentors have **24 hours** to review
4. Inactive mentors are rotated automatically

Mentors may approve using `/approve-pr` or `/lgtm`.

Successful mentor review applies: `mentor-approved`, `pa-review-required`.

### Stage 3 — Maintainer Review

The Project Admin performs final review before merge. Maintainers may:

- Request changes
- Reject low-quality PRs
- Relabel PRs/issues
- Close spam contributions

---

## Review Timelines

| Review Type | Typical Time |
|-------------|--------------|
| Assignment Approval | Instant → 24 hours |
| Mentor Review | ~24 hours |
| Maintainer Review | 24–72 hours |

> Please avoid excessive pings.

---

## Inactivity Policy

Assignments may be removed after **7 days** of inactivity.

Progress includes: issue comments, linked PR creation, or meaningful updates.

After unassignment, wait **24 hours** before reclaiming.

To release an issue manually:

```
/unassign
```

---

## Duplicate & Spam Protection

The repository includes automation for:

- Duplicate issue detection
- Duplicate PR detection
- Spam filtering
- Low-effort contribution detection

Repeated spam or abuse may result in assignment restrictions, PR rejection, or label restrictions.

---

## Leaderboards

Automated leaderboards track contributor merges, mentor reviews, and review activity.

Leaderboard comments may include GitHub avatars, contribution scores, rankings, and merged PR counts. Leaderboards update automatically after merges and reviews.

---

## Pull Request Checklist

Before submitting:

- [ ] Issue assigned to me
- [ ] PR links issue using `Closes #N`
- [ ] Changes are tested
- [ ] No unnecessary dependencies added
- [ ] Changes are focused
- [ ] Screenshots attached (if UI changes)
- [ ] Commit messages follow conventional commits
- [ ] DCO sign-off included

---

## PR Validation & Review Gates

When you open a Pull Request, automated bots immediately perform Stage 1 checks. Make sure:
1.  **Linked Issue:** The description contains `Closes #N` where `N` is your assigned issue. PRs without a linked issue may be closed automatically.
2.  **Conventional Title:** The PR title starts with a conventional commit prefix (e.g. `feat: ...`, `fix: ...`, `style: ...`).
3.  **DCO Sign-off:** All commits in your PR must be signed off (`git commit -s`).

### 🔑 Fixing DCO (Sign-off) Failures

If the DCO check flags your PR, you can sign off your existing commits using the terminal:

**To sign off your last commit:**
```bash
git commit --amend --no-edit -s
git push --force-with-lease origin <your-branch-name>
```

**To sign off multiple commits:**
```bash
git rebase -i HEAD~N -x "git commit --amend --no-edit -s"
git push --force-with-lease origin <your-branch-name>
```

---

## Code of Conduct

All contributors must follow repository rules, GitHub Community Guidelines, and GSSoC program guidelines. Violations may result in assignment removal or disqualification.

---

## Resources

- [GSSoC Official Website](https://gssoc.girlscript.tech)
- [GSSoC Contributor Guidelines](https://gssoc.girlscript.tech/guidelines)
- Project Discord
- [Main CONTRIBUTING.md](./CONTRIBUTING.md)

---

## Need Help?

- Open a GitHub Discussion
- Ask on Discord
- Comment on issues politely

> Please avoid DM-spamming maintainers or mentors.

---

## Final Notes

This repository prioritizes quality over quantity, meaningful contributions, maintainable code, and fair contribution workflows.

Not all PRs are guaranteed to be merged.

Happy contributing 🚀
