# Contributing Guide

## Program-Specific Guides

If you are contributing under a specific program, refer to the dedicated guide for your track:

| Track | Guide | 
 |-------|-------| 
 | GSSoC'26 Contributors | [GSSoC Contributor Guide](docs/GSSOC_CONTRIBUTOR_GUIDE.md) | 
 | GSSoC'26 Mentors | [GSSoC Mentor Guide](docs/GSSOC_MENTOR_GUIDE.md) | 
 | NSoC'26 Contributors | [NSoC Guide](docs/NSOC_GUIDE.md) | 
 | General Contributors | [General Contributor Guide](docs/GENERAL_CONTRIBUTOR_GUIDE.md) |


The rest of this document covers the shared rules, architecture, workflows, automation systems, and contribution policies that apply to all contributors.

---

## Project Philosophy

This repository follows a:

- Zero-build philosophy
- Minimal dependency philosophy
- Static-first architecture
- Edge-runtime compatible workflow

### Core Principles

- No unnecessary dependencies
- No heavy frameworks
- No bundlers unless absolutely required
- Simple and maintainable code
- Fast runtime performance
- Lightweight APIs
- Edge-compatible architecture
- Human-reviewed contributions over AI-generated spam

Contributors should avoid introducing:

- unnecessary npm packages
- client-side frameworks
- large runtime abstractions
- unnecessary build pipelines
- dependency-heavy tooling

unless clearly justified.

---

## Architecture

The project is built using:

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML/CSS/JS |
| Backend | Vercel Edge Functions |
| Hosting | Vercel |
| Data | Static JSON + GitHub API |
| Analytics | localStorage |

### Architecture Goals

- Fully static-first deployment
- Fast initial page load
- Minimal API overhead
- Edge-compatible runtime
- No hydration complexity
- Maintainable repository structure

> [!IMPORTANT]
> **JavaScript Logic Duplication Warning**
> This repository runs a static frontend. To enable Node.js unit testing without running a headless browser, we maintain a copy of the application logic in both the inline scripts inside [index.html](./index.html) (production runtime) and [app.js](./src/js/app.js) (test environment).
> 
> If you are modifying the core frontend behavior (filters, sorting, search, modals, bookmarks, etc.), you **MUST** apply your changes to **both** files in sync. Run `npm test` locally to ensure they are properly aligned.

---

## Local Development

**1. Clone the Repository**

```bash
git clone https://github.com/S3DFX-CYBER/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

**2. Start a Local Server**

You can run the static site locally using any of the following methods:

*   **Option A: Vercel CLI (Simulates edge routing)**
    ```bash
    npm install -g vercel
    vercel dev
    ```
*   **Option B: Python HTTP Server (Zero setup)**
    ```bash
    python3 -m http.server 8000
    ```
*   **Option C: Node.js static server (npx)**
    ```bash
    npx serve .
    ```
*   **Option D: VS Code Live Server Extension**
    Right-click [index.html](./index.html) and select **Open with Live Server**.

**3. Run Unit Tests locally**

To ensure your code changes pass CI validations, run the test suite locally:

```bash
npm install
npm test
```

---

## Repository Structure

```
GSoC-Org-Finder-
├── .github/
│   ├── workflows/
│   ├── reviewers/
│   ├── scripts/
│   └── ISSUE_TEMPLATE/
├── api/
├── data/
├── docs/
├── src/
│   ├── js/
│   ├── assets/
│   └── styles.css
├── index.html
├── sw.js
└── README.md
```

---

## How To Start Contributing

### Step 1 — Find an Issue

Go to the **Issues** tab and filter by labels:

- `level:beginner`
- `level:intermediate`
- `level:advanced`
- `type:bug`
- `type:docs`
- `type:ui`
- `type:enhancement`
- `type:api`
- `gssoc26`
- `nsoc26`

Issues are automatically analyzed using repository automation.

The triage system:

- categorizes difficulty
- detects duplicates
- identifies spam
- labels issue type
- flags low-quality reports

---

## Assignment Workflow

This repository uses a **mentor-assisted assignment pipeline**.

> Assignments are **NOT** handled manually through the GitHub UI.  
> All issue assignment requests are processed through repository automation.

### Requesting Assignment

To request an issue, comment:

```
/assign
```

> Do **NOT** self-assign using the GitHub interface.

---

### Mentor-Based Assignment Queue

When a contributor requests assignment:

1. The request is queued automatically
2. Two active mentors are randomly selected from the mentor activity pool
3. The mentors are notified on the issue
4. Mentors have **24 hours** to approve the assignment
5. If mentors do not respond within 24 hours:
   - Mentors are rotated automatically
   - New active mentors are selected
6. If no mentor approves after timeout:
   - The Project Admin (PA) is notified automatically
   - Manual assignment review begins

#### Mentor Selection System

Mentor selection is:

- Randomized
- Activity-aware
- Weighted toward active mentors
- Dynamically rotated
- Workload balanced

The system avoids repeatedly selecting the same mentors for every issue. Mentors are selected from the active mentor leaderboard and review activity data. Inactive mentors are deprioritized automatically.

---

### Assignment Approval Commands

**Contributors**

| Command | Description |
|---------|-------------|
| `/assign` | Request issue assignment |
| `/unassign` | Remove your current assignment |

**Mentors**

| Command | Description |
|---------|-------------|
| `/approve-assignment @username` | Approve and assign a contributor |

> Only currently pinged mentors may approve.

---

### Assignment Eligibility

#### Beginner Issues

Anyone may request assignment.

Examples: documentation fixes, UI tweaks, accessibility fixes, simple bug fixes

#### Intermediate Issues

**Requirements:** GitHub account at least 30 days old

Examples: filtering improvements, caching changes, API improvements, search improvements

#### Advanced Issues

**Requirements:** At least 1 merged PR in this repository

Examples: architecture changes, security-sensitive logic, performance optimization, workflow redesign

---

### Maximum Active Assignments

To ensure fairness:

| Program | Maximum Active Issues |
|---------|-----------------------|
| GSSoC | 3 |
| NSoC | 3 |
| General Contributors | 3 |

Requests above the limit are automatically rejected.

---

## Duplicate Issue Detection

The repository includes an **AI-assisted duplicate detection system**.

### How Duplicate Detection Works

The detector compares:

- Normalized issue titles
- Semantic keyword overlap
- Important technical keywords
- Issue intent similarity
- Token overlap scoring

The system intentionally avoids:

- Aggressive exact-title matching
- Weak substring matching
- Low-confidence duplicate flags

The duplicate detector uses:

- Weighted similarity scoring
- Keyword extraction
- Overlap thresholds
- Confidence filtering
- Technical term matching

This significantly reduces false positives.

> Issues are **NOT** auto-closed solely because they are flagged as possible duplicates.

---

## Smart Review Pipeline

Pull requests go through a **3-stage review pipeline**:

| Stage | Reviewer | Purpose |
|-------|----------|---------|
| Stage 1 | Automation | Validation + anti-spam |
| Stage 2 | Mentors | Code review |
| Stage 3 | Project Admin | Final merge gate |

### Stage 1 — Automated Validation

Automation checks:

- DCO sign-off
- PR formatting
- Issue linking
- Duplicate PR detection
- AI slop detection
- Context validation
- Diff quality
- Repository policy compliance

The repository also uses:

- LLM-assisted PR analysis
- Spam heuristics
- Low-effort detection
- Context validation against linked issues

### Stage 2 — Mentor Review

Once Stage 1 passes:

1. Active mentors are selected automatically
2. Mentors are requested dynamically
3. Review activity is tracked in the mentor leaderboard
4. Review quality scoring is calculated
5. Mentors have **24 hours** to respond
6. Inactive mentors are replaced automatically

#### Mentor Review Quality System

| Review Type | Score |
|-------------|-------|
| Low-effort approval | Low points |
| Detailed review with feedback | Higher points |
| Helpful requested changes | Higher points |
| Merge-quality approval | Highest points |

The mentor leaderboard tracks:

- Reviews completed
- Review quality
- Approvals
- Merged-review count
- Assignment approvals
- Priority review activity

### Mentor Review Leaderboard

The mentor leaderboard:

- Updates automatically
- Tracks all-time review activity
- Includes mentor profile avatars
- Generates visual leaderboard comments
- Updates after PR merges
- Powers mentor assignment weighting

The leaderboard prioritizes: active mentors, high-quality reviewers, and consistent participation.

---

## Contributor Leaderboard

The contributor leaderboard updates automatically after PR merges.

It includes:

- GitHub avatars
- Contributor rankings
- Merged PR counts
- Contribution scores
- Contextual leaderboard comments

Leaderboard comments are posted automatically on merged PRs.

---

## Pull Request Workflow

### Before Opening a PR

Ensure:

- The issue is assigned to you
- The work is complete
- Changes are tested locally
- Your PR follows repository conventions

### Linking Issues is Mandatory

Every PR **MUST** contain:

```
Closes #issue-number
```

> PRs without linked issues may be closed automatically.

### Required PR Standards

Your PR should:

- Remain focused
- Avoid unnecessary files
- Avoid unrelated changes
- Avoid dependency bloat
- Preserve architecture consistency
- Follow conventional commits

---

## Conventional Commit Format

**Format**

```
type: short description
```

**Examples**

```
feat: improve issue filtering
fix: resolve assignment queue race condition
ci: improve mentor rotation workflow
docs: update contribution guide
```

### Common Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | UI/styling |
| `refactor` | Internal cleanup |
| `perf` | Performance |
| `ci` | Workflow/configuration |
| `chore` | Maintenance |

---

## PR Checklist

Before submitting:

- [ ] Issue is assigned to me
- [ ] PR links an issue
- [ ] Changes are focused and minimal
- [ ] No unnecessary dependencies added
- [ ] Code follows repository architecture
- [ ] I tested changes locally
- [ ] I understand the code submitted

For UI changes:

- [ ] Screenshots attached

---

## PR Validation & Review Gates

When you open a Pull Request, automated bots immediately perform Stage 1 checks. Make sure:
1.  **Linked Issue:** The description contains `Closes #N` where `N` is your assigned issue. PRs without a linked issue may be closed automatically.
2.  **Conventional Title:** The PR title starts with a conventional commit prefix (e.g. `feat: ...`, `fix: ...`, `style: ...`).
3.  **DCO Sign-off:** All commits in your PR are signed off (`git commit -s`).

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

## AI-Generated Contributions Policy

AI assistance is **allowed**. However:

- Blindly generated PRs are prohibited
- Contributors must understand submitted code
- Low-quality AI spam is rejected
- Fake complexity is prohibited
- Meaningless documentation spam is prohibited

All PRs are reviewed for:

- Code quality
- Context accuracy
- Implementation understanding
- Contribution relevance

---

## Strictly Prohibited

The following may result in rejection:

- Fake complexity
- Spam PRs
- Duplicate PRs
- Copied code without attribution
- Low-effort documentation spam
- Meaningless formatting-only PRs
- Unnecessary dependency additions
- Claiming issues without intent to work
- Excessive maintainer pinging

---

## Maintainer Ping Policy

Avoid repeatedly pinging maintainers for issue assignment, mentor review, merge requests, labels, or review escalation.

**Recommended waiting periods:**

| Action | Recommended Wait |
|--------|-----------------|
| Mentor approval | 24 hours |
| Maintainer review | 24–72 hours |
| Assignment review | Up to 24 hours |

Mentor review rotation is automated. Repeated spam pings may result in comment cleanup, assignment removal, or spam labeling.

---

## Inactivity Policy

Assigned issues with no meaningful progress for **7 days** may be automatically unassigned.

Meaningful progress includes:

- Issue updates
- Linked PR creation
- Implementation discussion
- Active development progress

Contributors may need to wait before reclaiming inactive issues.

---

## Automation Features

The repository includes:

- AI issue triage
- Duplicate issue detection
- Mentor auto-rotation
- Smart assignment queueing
- Weighted mentor selection
- Contributor leaderboard automation
- Mentor leaderboard automation
- Review quality scoring
- Stale PR cleanup
- DCO enforcement
- PR size labeling
- AI-slop detection
- LLM PR validation
- Workflow-based review gates

---

## Testing

Before submitting:

```bash
vercel dev
```

Verify:

- Edge functions work correctly
- No build tooling was introduced
- No existing functionality breaks
- Responsive layout remains functional
- APIs behave correctly

---

## Need Help?

If you need help:

- Open a [GitHub Issue](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/issues)
- Use [GitHub Discussions](https://github.com/S3DFX-CYBER/GSoC-Org-Finder-/discussions)
- Ask in the community server

---

## Final Notes

This repository prioritizes:

- Quality over quantity
- Maintainable contributions
- Fair contributor practices
- Meaningful improvements
- Human-reviewed code quality

Not all PRs are guaranteed to be merged.

Thank you for contributing to FindMyGSoC 🚀
