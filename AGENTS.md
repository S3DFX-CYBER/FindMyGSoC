# AGENTS.md

Instructions for AI coding agents working in this repository. Humans are welcome
to read it too: it is the shortest accurate description of how this codebase is
put together and what will get a change rejected.

Read this before touching anything. Read [AI_POLICY.md](AI_POLICY.md) before
opening a pull request.

## What this project is

FindMyGSoC is a static site that helps people find a Google Summer of Code
organisation that fits them. It has no framework, no bundler and no build step.
Four HTML pages (the app, the landing page, privacy and the 404), two
stylesheets, a set of vanilla JavaScript modules, JSON datasets, and two Vercel
edge functions.

## Hard constraints

These are architectural, not stylistic. A change that breaks one of them will not
be merged, however good it looks.

1. **No build step.** `index.html` must work when opened directly. Do not add a
   bundler, a transpiler, a framework, or a CSS preprocessor.
2. **No new runtime dependencies.** The browser side is vanilla. `package.json`
   dependencies stay at what is already there. Dev dependencies for lint and
   tests are acceptable.
3. **Static first.** Compute from `data/` in the browser. Use an edge function
   only for data that must be live.
4. **Two copies of the app script.** `index.html` holds an inline script;
   `src/js/app.js` mirrors it. Change both or neither. Behaviour drift between
   them is the single most common source of bugs here.
5. **Escape everything external.** Names, titles, resumes and search input are
   untrusted. Use the existing escaping helpers. Never interpolate raw data into
   `innerHTML`.
6. **Validate outbound URLs.** Run API and dataset URLs through the URL
   validator before assigning them to `href`.

## File map

```
index.html               the app page; inline script mirrors src/js/app.js
landing.html             the marketing page; no framework, no Tailwind
privacy.html             what is stored and where
src/styles.css           app design system and component styles
src/landing.css          landing design system (self-contained)
src/js/app.js            app logic: filtering, cards, modals, watchlist, compare
src/js/org.js            canonical organisation dataset used by tests and scripts
src/js/recommender.js    skill matching
src/js/recommendation-ui.js  rendering for the recommender
src/js/landing.js        landing behaviour: FAQ, comparison, drawer, reveals
src/js/badges-mvp.js     local badge state
src/js/footer.js         injects src/components/footer.html
src/components/          shared HTML partials
data/                    generated datasets (issues, mentors, cached summaries)
scripts/                 data generation, validation and maintenance
tools/tenet-agent/       the Python PR review agent used by CI
api/github.js            edge function: live org stats and issues
api/gfi.js               edge function: the daily good-first-issue dataset
tests/                   node:test suites
docs/                    technical notes and README assets
```

## Before you open a pull request

Run all three, and fix what they report:

```bash
npm run lint          # ESLint, Stylelint, HTMLHint
npm test              # node:test, 38 tests
npm run validate:data # the generated datasets
```

Then check the things tests cannot:

- Does the page still render at 1280px and at 390px?
- Does it work in dark mode? Both themes are first-class.
- Can you reach every new control with the keyboard?
- If you touched a modal or the drawer, does focus stay inside it and come back?

## Style

- Match the file you are editing. The code is deliberately plain: `const`,
  template literals, small functions, no classes.
- Comments explain *why*, not *what*. Do not narrate the diff.
- No emoji in UI copy or documentation, and no em dashes in user-facing strings.
- Prefer editing an existing file over adding a new one.

## Commits and sign-off

Conventional Commits, and every commit signed off:

```bash
git commit -s -m "fix: keep the drawer focus inside the panel"
```

The DCO check fails the pull request without the sign-off trailer.

## What reviewers will push back on

- A diff that includes unrelated formatting or renames.
- Generated files edited by hand instead of regenerating them.
- A fix applied to `index.html` but not `src/js/app.js`, or the reverse.
- New global state, new event listeners without cleanup, or a new `setInterval`.
- "Improvements" to copy or layout that were not asked for.
- Claims in the PR description that the code does not support. Describe what you
  verified, and say what you could not.

## When you cannot verify something

Say so. "I could not reproduce this locally because the fetch is blocked in my
environment" is a useful sentence. Guessing is not.
