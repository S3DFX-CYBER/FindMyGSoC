# Technical notes

How the site is put together, why it is built this way, and what to watch out
for when changing it. If you are looking for the short version, the
[README](../README.md) has it.

- [Architecture](#architecture)
- [The two copies of the app script](#the-two-copies-of-the-app-script)
- [Rendering and escaping](#rendering-and-escaping)
- [URL validation](#url-validation)
- [The data pipeline](#the-data-pipeline)
- [The edge functions](#the-edge-functions)
- [Caching and offline](#caching-and-offline)
- [Theming](#theming)
- [Accessibility contract](#accessibility-contract)
- [Testing](#testing)

---

## Architecture

Three layers, each with one job.

| Layer | What lives there | Why |
|---|---|---|
| Static pages | `index.html`, `landing.html`, `src/*.css`, `src/js/*` | Everything that can be computed in the browser is. First paint does not wait on application data or API calls. |
| Edge functions | `api/github.js`, `api/gfi.js` | Only for data that must be live, and to keep API tokens off the client. |
| Data job | `.github/workflows/refresh-good-first-issues.yml`, `scripts/` | Anything that changes weekly is generated, not hand-edited. |

There is no build step. `index.html` opened from disk is the same file Vercel
serves.

## The two copies of the app script

`index.html` carries a large inline `<script>`, and `src/js/app.js` mirrors most
of it. The inline copy is what runs in the browser; the module is what the tests
import.

This is a deliberate compromise, and it has a cost: **logic changes must be made
in both places**. When they drift, behaviour differs between what the tests check
and what users see. If you change a renderer, a filter or a state helper, grep for
the same function in both files.

Before editing either, check which one is authoritative for what you are touching.
Rendering tends to live in the inline script; scoring and data helpers live in the
module.

## Rendering and escaping

Organisation names, issue titles, mentor names, resume text and search input all
arrive from outside the application. Treat every one of them as hostile.

- `safeHTML` is a tagged template that escapes interpolated values. Use it, or the
  `escapeHtml` helper, for anything going into markup.
- Never build markup by concatenating unescaped values into `innerHTML`.
- HTML returned by the GitHub API is sanitised with DOMPurify before insertion.
- `textContent` is the right tool when you only need text.

The rule of thumb: if the value came from `fetch`, from `localStorage`, from a
URL parameter, or from a user's keyboard, it is untrusted.

## URL validation

Every outbound link built from data goes through the URL validator first. It
accepts absolute `http:` and `https:` URLs only, and rejects everything else,
including relative paths, `javascript:` and `data:` URLs.

Two places this matters and has been got wrong before:

- Issue links rendered from `data/issues.json`.
- Ideas pages and contact links rendered from the organisation dataset.

A link that fails validation should render as plain text or not at all. It must
never become an `href`.

## Project facts, and why there are no difficulty labels

The app used to show a `codebase` label (beginner, intermediate, advanced) and a
`competition` label (chill, moderate, hot) per organisation. Both were guesses
about an organisation, and the first one was wrong in principle: difficulty in
GSoC is a property of the **project**, not of the org. Google's programme has
three project sizes (90, 175 and 350 hours), and any org can host any of them. A
large, complex org routinely lists a 90 hour project, which is exactly what the
small tier is for.

So the labels are gone from the UI, and what replaces them is read from the
org's own ideas page:

```
scripts/extract-project-facts.js   (weekly, in CI)
        │  reads each org's ideas page
        ▼
data/project-facts.json            { org: { sizes: [90,175], projects: [...] } }
        │
        ▼
index.html  →  card badge, detail panel, compare, filter, sort, analytics
```

Rules the extractor follows, and the UI inherits:

- A size is recorded only when the page states it, in hours or as
  small/medium/large. Nothing is inferred from the org's size or reputation.
- An org whose page states nothing is **absent** from the dataset, and the UI
  renders no size for it rather than a placeholder guess.
- The filter, the sort and the recommender all treat "no stated size" as
  unknown, and unknowns sort last.

The extractor runs in CI because it makes ~184 outbound requests to arbitrary
org websites; the sandbox and the browser cannot do that.

## The data pipeline

```
GitHub REST API
      │
      ▼
refresh workflow (daily, 03:00 UTC)
      │  scripts/fetch-issues.js, scripts/extract-mentors.js
      ▼
data/latest branch  ──►  api/gfi.js  ──►  /data/issues.json
      │
      ▼
data/*.json in main (for everything that does not change daily)
```

The refresh job publishes to an unprotected branch on purpose. `main` requires a
reviewed pull request, and a refresh that waits for a human is a refresh that
stops happening. `api/gfi.js` reads `data/latest` first and falls back to `main`.

Do not hand-edit generated files. Change the script in `scripts/` and regenerate,
then run `npm run validate:data`.

## The edge functions

`api/github.js` proxies the GitHub API so the token never reaches the browser and
responses can be cached at the edge. It answers four shapes:

| Query | Returns |
|---|---|
| `repo=owner/name` | Repository stats |
| `repo=owner/name&gfi=1` | Beginner-friendly issues |
| `repo=owner/name&issues=1` | Open issues with labels |
| `user=login` | Public profile and languages, for skill matching |

`api/gfi.js` serves the daily good-first-issue dataset. Its cache policy differs
per source: a degraded answer from the fallback branch is never cached as though
it were a good one.

Both run on the edge runtime: no Node APIs, no filesystem, Web APIs only.

## Caching and offline

`sw.js` precaches the shell, both stylesheets, the app modules, the landing
scripts and the dataset. Two rules:

- Anything the landing page needs to render and behave must be in the precache.
  A missing script means a page that renders but does not work offline.
- Bump `CACHE_NAME` whenever a cached file changes, or returning visitors keep
  the old copy.

## Theming

Two token systems coexist, and they are not the same thing:

- `--rd-*` tokens in `src/styles.css` drive the redesign: app bar, cards, panels.
- Legacy tokens (`--bg`, `--ink`, `--orange`, …) drive the older components:
  modals, analytics, the footer.

Both flip under `html.dark`. The dark blocks use `html.dark` rather than `.dark`
on purpose: `:root` and `.dark` have equal specificity, so a `.dark` block that
appears before a later `:root` block loses, which is exactly how the analytics
tiles stayed white on a dark panel for a while.

`landing.html` is light and dark aware through `src/landing.css` alone; it does
not load `src/styles.css` and does not use Tailwind.

## Accessibility contract

- Modals and the drawer trap focus while open, and return focus to the trigger on
  close.
- The skip link uses native fragment navigation to a focusable target. Do not
  swallow it with a smooth-scroll handler.
- Reveal animations are opt-in: content renders visible, and JavaScript adds
  `.js-reveal` before observing. A blocked script must never leave the page blank.
- Every icon-only control has an `aria-label`. Decorative images have `alt=""`.

## Testing

```bash
npm test              # node:test, 38 tests, no framework
npm run lint          # ESLint, Stylelint, HTMLHint
npm run validate:data # generated datasets
```

The suites cover filtering, recommendation scoring, skill extraction,
sanitisation, issue parsing, the modal flow, cache behaviour and the service
worker. They run against the modules in `src/js/`, which is one more reason the
inline copy in `index.html` has to stay in step.
