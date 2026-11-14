# GSSoC'26 Mentor Guide

Welcome to the **GirlScript Summer of Code 2026** mentor guide for FindMyGSoC!

As a mentor, you help maintain contribution quality, review pull requests, guide contributors, and ensure repository standards are followed throughout the program.

---

## Mentor Responsibilities

Mentors are expected to:

- Review pull requests within 24 hours whenever possible
- Provide clear and actionable review feedback
- Help contributors improve code quality
- Maintain repository standards and architecture consistency
- Detect low-quality, spammy, or meaningless submissions
- Assist contributors respectfully and professionally
- Ensure contributors follow repository contribution rules

---

## Repository Philosophy

This project follows a zero-build, minimal-dependency, static-first, lightweight frontend architecture philosophy.

Mentors should ensure contributions:

- Do not introduce unnecessary dependencies
- Avoid overengineering
- Remain maintainable
- Follow existing repository patterns

---

## Mentor Setup

### How Mentor Assignment Works

Mentors are registered inside:

```
.github/reviewers/gssoc-mentors.json
```

The review rotation system dynamically selects active mentors based on review activity, responsiveness, mentor availability, mentor leaderboard activity, and inactivity timeout handling.

Mentor assignments rotate automatically to avoid bottlenecks.

### Repository Familiarity

Before reviewing PRs, mentors should understand:

- Vanilla HTML/CSS/JS architecture
- Vercel Edge Functions
- Repository workflow system
- Assignment automation
- PR review pipeline
- Issue labeling system
- Difficulty levels

---

## PR Review Pipeline

All PRs follow a **3-stage review system**:

| Stage | Reviewer | Purpose |
|-------|----------|---------|
| Stage 1 | Automation | PR validation |
| Stage 2 | Mentor Review | Code review |
| Stage 3 | Project Admin | Final approval & merge |

### Stage 1 — Automated Validation

Before a PR reaches mentors, automation checks:

| Check | Purpose |
|-------|---------|
| DCO Validation | Commit sign-off verification |
| PR Format Validation | PR template & linked issue |
| Duplicate PR Detection | Detects overlapping PRs |
| PR Size Classification | Labels PR size |
| Assignment Validation | Ensures contributor assignment compliance |
| Workflow Validation | CI/workflow compliance |

PRs failing validation may receive labels such as `needs-stage-1-fixes`, `invalid-pr`, or `missing-linked-issue`.

> Mentors should avoid reviewing PRs still failing Stage 1.

### Stage 2 — Mentor Review

After Stage 1 passes:

1. Active mentors are selected automatically
2. Mentors are assigned dynamically
3. Mentors receive review notifications
4. Review rotation begins

Mentors are expected to respond within **24 hours**. Inactive reviewers are automatically rotated out and replaced with other active mentors.

### Stage 3 — Project Admin Review

After mentor approval:

- `pa-review-required` is applied
- The Project Admin performs final review
- Merge decision is made

Project Admin may request additional changes, reject low-quality work, or escalate security concerns. Final merges are handled by **@S3DFX-CYBER**.

---

## Mentor Review Workflow

### When You Receive a PR

1. Read the linked issue
2. Verify the PR actually solves the issue
3. Review implementation quality
4. Check repository consistency
5. Approve or request changes

### Mentor Approval Commands

```
/approve-pr
```

or

```
/lgtm
```

GitHub Review Approval also works normally.

### Labels Used During Review

| Label | Meaning |
|-------|---------|
| `needs-mentor-review` | Waiting for mentor review |
| `mentor-review-requested` | Assigned to mentor |
| `mentor-approved` | Mentor approved |
| `gssoc-mentor-approved` | GSSoC mentor approval completed |
| `pa-review-required` | Ready for Project Admin review |
| `needs-stage-1-fixes` | Validation failed |

---

## 24-Hour Review Rotation

Mentors are automatically rotated if inactive. If a mentor does not review, comment, or respond within 24 hours:

- The mentor may be removed
- Another active mentor is assigned automatically
- Review flow continues

This prevents PR stagnation.

---

## What Mentors Should Review

| Area | What to Verify |
|------|----------------|
| Functionality | Does it work correctly? |
| Code Quality | Is code readable & maintainable? |
| Repository Consistency | Matches existing architecture |
| Dependencies | No unnecessary additions |
| Performance | No regressions |
| Accessibility | UI remains accessible |
| Responsiveness | Mobile compatibility |
| Security | No obvious vulnerabilities |

---

## Review Actions

### Approve

Use when:

- Implementation is correct
- Repository standards are met
- Changes are production-safe

### Request Changes

Use when:

- Implementation is incomplete
- Code quality is poor
- Repository rules are violated
- Architecture consistency is broken

Always provide actionable feedback.

### Comment

Use for suggestions, clarifications, or non-blocking improvements.

---

## Handling Low-Quality Contributions

### Watch For

- Meaningless changes
- Formatting-only spam
- Unnecessary refactors
- Copied code
- PR farming
- Duplicate work
- Dependency bloat

### AI-Generated or Low-Effort Code

Mentors should watch for:

- Inconsistent coding style
- Generic implementations
- Unexplained architecture changes
- Code the contributor cannot explain
- Large autogenerated blobs

If suspicious: request an explanation, ask the contributor to justify the implementation, and escalate repeated abuse.

> Do not accuse contributors aggressively. Focus on code quality and contributor understanding.

### Duplicate Work

If a PR duplicates existing work, close it politely, reference the original PR or issue, and explain the duplication clearly.

---

## Contribution Levels

### Beginner — `level:beginner`

Typical work: UI fixes, docs, accessibility, small bugs.

Mentor approach: educational, supportive, guidance-focused. No assignment restrictions.

### Intermediate — `level:intermediate`

Typical work: logic improvements, filtering, APIs, caching.

Mentor approach: stricter review, validate correctness, review edge cases carefully.

Requires: GitHub account age ≥ 30 days for auto-assignment.

### Advanced — `level:advanced`

Typical work: architecture, security, performance, backend systems.

Mentor approach: strict review, security-aware, architecture-focused.

Requires: at least 1 merged PR in the repository.

---

## Mentor Best Practices

### Do

- Review within 24 hours
- Be constructive
- Explain requested changes
- Encourage contributors
- Escalate serious concerns
- Maintain consistent standards

### Do NOT

- Ignore review requests
- Approve low-quality work
- Merge dependency-heavy PRs
- Be disrespectful
- Encourage PR farming
- Bypass repository workflows

---

## Escalation

Escalate to the Project Admin when:

- Security issues are discovered
- Contributors become abusive
- Spam patterns emerge
- Architectural decisions are unclear
- Suspicious activity is repeated

**Project Admin:** @S3DFX-CYBER

---

## Automation Systems

| System | Purpose |
|--------|---------|
| Assignment Queue | Contributor assignment handling |
| Mentor Rotation | Dynamic reviewer reassignment |
| Duplicate Detection | Duplicate issue/PR detection |
| Leaderboards | Contributor & mentor activity |
| Review Pipeline | PR stage tracking |
| Label Sync | Automatic label management |
| Timeout Handling | Reassign inactive reviews |

---

## Mentor Leaderboard

Mentor activity contributes to the mentor leaderboard. Metrics include:

- Completed reviews
- Approvals
- Merged-review approvals
- Review responsiveness
- Review activity score

Leaderboard updates automatically.

---

## Review Timeline Expectations

| Action | Expected Time |
|--------|---------------|
| Initial Mentor Response | ~24 hours |
| Re-review After Changes | ~24 hours |
| Maintainer Review | 24–72 hours |

---

## Resources

- [GSSoC Official Website](https://gssoc.girlscript.tech)
- [GSSoC Mentor Guidelines](https://gssoc.girlscript.tech/guidelines)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- Project Discord

---

## Contact

**Project Admin:** @S3DFX-CYBER

---

## Final Notes

This repository prioritizes quality over quantity, meaningful contributions, maintainable code, and fair review practices.

Mentors play a major role in maintaining these standards.

Thank you for mentoring with GSSoC 🚀
