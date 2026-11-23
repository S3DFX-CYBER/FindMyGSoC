<div align="center">

<img src="docs/assets/logo-mark.png" width="76" alt="FindMyGSoC" />

# FindMyGSoC

**Find the Google Summer of Code organisation that actually fits you.**

Search 184 organisations from the 2026 cycle by stack, domain and competition.
Track their live good first issues. Shortlist, compare, and draft your proposal,
all in the browser, with no account and no build step.

[**Open the site**](https://findmygsoc.vercel.app/) ·
[Quick start](#quick-start) ·
[How it works](#how-it-works) ·
[Contributing](CONTRIBUTING.md)

[![Code Quality](https://github.com/S3DFX-CYBER/FindMyGSoC/actions/workflows/code-quality.yml/badge.svg)](https://github.com/S3DFX-CYBER/FindMyGSoC/actions/workflows/code-quality.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-211c17.svg)](LICENSE)
[![No build step](https://img.shields.io/badge/build-none-f26a1b.svg)](#quick-start)

</div>

![A walkthrough of FindMyGSoC: the landing page, the organisation grid, filtering, the organisation detail panel and the dark theme](docs/assets/demo.gif)

---

## Why this exists

> FindMyGSoC has been part of **NSoC** and **GSSoC** as a participating open
> source project. Those programmes brought the contributors who built the
> filtering, the mentor directory, the badge system and much of the polish you
> see here. Every contributor follows the same guide: [CONTRIBUTING.md](CONTRIBUTING.md).

Every GSoC season the same problem repeats: the organisation list is a wall of
names, and the things that actually decide whether you can contribute — what
language the codebase is in, how competitive the org is, whether they have issues
you can start on this week — are spread across 184 different repositories.

FindMyGSoC puts those answers on one screen. It is a static site, a daily data
job and two edge functions. Nothing to install, nothing to sign up for, and it
still works when your connection does not.

## What it does

| Feature | What it gives you |
|---|---|
| **Search and filter** | 184 organisations by category, language and published project size, with instant client-side filtering and no round trips. |
| **Good first issues** | 45 open, beginner-friendly issues pulled from the organisations' own repositories. A daily snapshot, not a live feed. Filtered by language and category. |
| **Skill matching** | Paste a GitHub username or a resume and get a ranked shortlist, with the reasoning shown rather than a black box. |
| **Compare** | Put up to three organisations side by side: years in GSoC, first year, stack, published project sizes and competition history. |
| **Watchlist and deadlines** | Save organisations locally, and follow the GSoC timeline with the dates that matter for the current cycle. |
| **Proposal workspace** | Draft your proposal against the org's ideas page, and export it as a PDF when it is ready. |
| **Works offline** | A service worker caches the shell, the dataset and the fonts after the first visit, so a flaky connection does not lose your place. The very first load still needs the network. |

## Screenshots

| Landing | App, dark theme |
|---|---|
| ![Landing page](docs/assets/landing-light.png) | ![Application page in dark mode](docs/assets/app-dark.png) |

| Organisation detail |
|---|
| ![Organisation detail panel](docs/assets/org-modal.png) |

## Quick start

There is no build step and no package to install to view the site.

```bash
git clone https://github.com/S3DFX-CYBER/FindMyGSoC.git
cd FindMyGSoC

# any static server works
npx serve . -l 3000
```

Then open <http://localhost:3000>. Use the server rather than opening
`index.html` from disk: the pages fetch their datasets and a footer component
over HTTP, and a `file://` page cannot.

The edge functions need Vercel's runtime, because `npx serve` cannot run them:

```bash
npm i -g vercel
vercel dev            # serves the pages and /api together on :3000
```

Without a `GITHUB_TOKEN` in the environment the functions still answer, but with
GitHub's unauthenticated rate limit, so the stats and issue panels may go quiet.

If you want the tooling (lint and tests):

```bash
npm ci
npm test          # 38 tests across 10 files, node:test, no framework
npm run lint      # ESLint, Stylelint, HTMLHint
npm run validate:data
```

## How it works

Three moving parts, deliberately kept small.

```mermaid
flowchart LR
    subgraph Browser
        L[landing.html] --> D[(data JSON)]
        A[index.html] --> D
        A --> E[Edge functions]
    end

    subgraph Vercel
        E1[api/github.js<br/>stats and issues]
        E2[api/gfi.js<br/>good first issues]
    end

    subgraph GitHub
        W[Daily refresh job] -->|publishes| B[(data/latest branch)]
        GH[GitHub REST API]
    end

    E --> E1
    E --> E2
    E1 --> GH
    E2 --> B
    W --> GH
```

**The pages** are plain HTML, CSS and JavaScript. No framework, no bundler. The
dataset ships as static JSON, so the first paint never waits on the network.

**The refresh job** runs every day at 03:00 UTC. It walks the organisation list,
pulls their open beginner-friendly issues from the GitHub API and publishes the
result to an unprotected `data/latest` branch. That detail matters: `main` is
protected, and a refresh that waits for a human review is a refresh that stops
happening.

**The edge functions** serve that dataset and the live GitHub stats, with caching
that differs per source so a degraded answer is never cached as though it were a
good one.

## API

Two edge functions back the live data. Both are public and cached at the edge.

Routes, as deployed, rather than the source filenames:

| Route | Query | Returns |
|---|---|---|
| `/api/github` | `repo=owner/name` | Repository stats: stars, forks, open issues, last push. |
| `/api/github` | `repo=owner/name&gfi=1` | That repository's issues, filtered to the ones labelled beginner-friendly. |
| `/api/github` | `repo=owner/name&issues=1` | That repository's open issues with their labels. |
| `/api/github` | `user=login` | Public profile and repository languages, used by skill matching. |
| `/api/gfi` | none | The whole daily good-first-issue dataset. Also served at `/data/issues.json`. |

## Project structure

```
.
├── index.html              # the app: grid, filters, watchlist, issues, mentors, guide
├── landing.html            # the marketing page
├── privacy.html            # what is stored, and where
├── src/
│   ├── styles.css          # app design system and components
│   ├── landing.css         # landing page design system
│   ├── js/                 # app logic, matching, rendering, badges
│   ├── components/         # footer and other partials
│   └── assets/             # icons and photography
├── api/
│   ├── github.js           # edge function: organisation stats and issues
│   └── gfi.js              # edge function: the daily good-first-issue dataset
├── data/                   # organisations, mentors, issues, cached summaries
├── scripts/                # data generation, validation and maintenance
├── tools/tenet-agent/      # the Python PR review agent used by CI
├── tests/                  # node:test suites
└── docs/                   # technical notes and README assets
```

More detail on any of this lives in [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Data and correctness

The organisation list is source data in `src/js/org.js` (mirrored by
`scripts/orgs.js`). Everything generated lives in `data/` and is validated:

```bash
npm run validate:data
```

The datasets are separate on purpose, because they age differently:

| File | Source | Refresh |
|---|---|---|
| `data/issues.json` | the GitHub API | daily, published from the refresh job to a `data/latest` branch rather than committed to `main` |
| `data/projects-<year>.json` | Google's project pages | weekly, opened as a pull request |
| `data/project-facts.json` | each org's ideas page | weekly, same pull request |
| `data/mentors.json` | **hand-curated** | by hand; the automated jobs must never write it |
| `data/accepted-proposals.json` | the community proposals archive | by hand, when that archive changes |

## Security notes

- Untrusted text from GitHub, resumes and search input is escaped before it
  reaches the DOM; the renderer uses a tagged template that escapes by default.
- Outbound links are validated against an allowlist of schemes before they are
  rendered as `href`.
- The watchlist, badges, drafts and theme live in `localStorage`; there is no
  account and no server-side profile. What does leave the browser: the GitHub
  username you choose to analyse, repository identifiers when stats or issues are
  fetched, and aggregate performance data on the deployed site. [privacy.html](privacy.html)
  lists every field.
- Values from the GitHub API (issue titles, organisation names, mentor handles)
  are escaped and inserted as text. The app does not fetch or render Markdown or
  HTML bodies from GitHub. The one place DOMPurify runs is the proposal editor's
  preview, which sanitises what you typed before rendering it.
- The jsDelivr libraries are pinned to exact versions, and the PDF exporter
  carries a subresource integrity hash. Tailwind is the exception: the app page
  loads it from the unversioned CDN, which is a known gap rather than a claim.

## Testing

```bash
npm test
```

38 tests covering filtering, recommendation scoring, skill extraction,
sanitisation, issue parsing, the modal flow, cache behaviour and the service
worker, using `node:test` and no test framework.

## Deploy your own

1. Fork the repository.
2. Import it into Vercel. The framework preset is *Other*; `vercel.json` already
   maps `/` to the landing page, `/app` to the application and `/data/issues.json`
   to the edge function.
3. Optional: set `GITHUB_TOKEN` in the project environment to raise the API rate
   limit for live organisation stats.
4. Deploy. There is nothing to build.

## Contributing

Contributions are welcome, and the repository is set up to make them easy to land:
issue templates, a pull request template, DCO sign-off, and a review workflow.

One guide covers every contributor, whether you arrived through NSoC, GSSoC or
found the repository on your own: [CONTRIBUTING.md](CONTRIBUTING.md). Pick up an
issue labelled `good first issue`, and read the
[Code of Conduct](CODE_OF_CONDUCT.md) and the [AI policy](AI_POLICY.md) before you
open a pull request. If you are an AI agent, start with [AGENTS.md](AGENTS.md).

## Sponsoring

FindMyGSoC is maintained in spare time and stays free, without accounts, ads or
tracking. If it saved you an evening of reading 184 repositories, you can support
it through **GitHub Sponsors**:

[**Sponsor this project**](https://github.com/sponsors/S3DFX-CYBER)

Sponsorship pays for the domain, the API rate limits and the time it takes to
review contributions. Sponsors are not credited by name anywhere yet; that is
still to build.

## Contributors

Everyone whose pull request has been merged, plus commit authors on `main`, in
the order this block was generated rather than chronological order. The
[backfill workflow](.github/workflows/add-contributor.yml) rebuilds it from
merged pull-request authors only, so a hand-added commit author is dropped the
next time it runs. Excludes bots.

<!-- CONTRIBUTORS_START -->
<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="50px" alt="S3DFX-CYBER" /></a>
<a href="https://github.com/aryangetsreal"><img src="https://github.com/aryangetsreal.png" width="50px" alt="aryangetsreal" /></a>
<a href="https://github.com/ayushi2577"><img src="https://github.com/ayushi2577.png" width="50px" alt="ayushi2577" /></a>
<a href="https://github.com/amrita-a-menon"><img src="https://github.com/amrita-a-menon.png" width="50px" alt="amrita-a-menon" /></a>
<a href="https://github.com/imayuss"><img src="https://github.com/imayuss.png" width="50px" alt="imayuss" /></a>
<a href="https://github.com/deepak0x"><img src="https://github.com/deepak0x.png" width="50px" alt="deepak0x" /></a>
<a href="https://github.com/Nirula23"><img src="https://github.com/Nirula23.png" width="50px" alt="Nirula23" /></a>
<a href="https://github.com/arghya29"><img src="https://github.com/arghya29.png" width="50px" alt="arghya29" /></a>
<a href="https://github.com/shrutisd739"><img src="https://github.com/shrutisd739.png" width="50px" alt="shrutisd739" /></a>
<a href="https://github.com/Manav5234"><img src="https://github.com/Manav5234.png" width="50px" alt="Manav5234" /></a>
<a href="https://github.com/D4rk-Pho3nix"><img src="https://github.com/D4rk-Pho3nix.png" width="50px" alt="D4rk-Pho3nix" /></a>
<a href="https://github.com/janhaviborade05"><img src="https://github.com/janhaviborade05.png" width="50px" alt="janhaviborade05" /></a>
<a href="https://github.com/KumarNirupam1"><img src="https://github.com/KumarNirupam1.png" width="50px" alt="KumarNirupam1" /></a>
<a href="https://github.com/palak-paliwal11"><img src="https://github.com/palak-paliwal11.png" width="50px" alt="palak-paliwal11" /></a>
<a href="https://github.com/ANKITDANDOTIYA"><img src="https://github.com/ANKITDANDOTIYA.png" width="50px" alt="ANKITDANDOTIYA" /></a>
<a href="https://github.com/Shan7Usmani"><img src="https://github.com/Shan7Usmani.png" width="50px" alt="Shan7Usmani" /></a>
<a href="https://github.com/arpit2006"><img src="https://github.com/arpit2006.png" width="50px" alt="arpit2006" /></a>
<a href="https://github.com/Soquixx"><img src="https://github.com/Soquixx.png" width="50px" alt="Soquixx" /></a>
<a href="https://github.com/meghna-cs"><img src="https://github.com/meghna-cs.png" width="50px" alt="meghna-cs" /></a>
<a href="https://github.com/kabirumarkhan-stack"><img src="https://github.com/kabirumarkhan-stack.png" width="50px" alt="kabirumarkhan-stack" /></a>
<a href="https://github.com/AbhishekVinod-dev"><img src="https://github.com/AbhishekVinod-dev.png" width="50px" alt="AbhishekVinod-dev" /></a>
<a href="https://github.com/Ayushia5"><img src="https://github.com/Ayushia5.png" width="50px" alt="Ayushia5" /></a>
<a href="https://github.com/TarunyaProgrammer"><img src="https://github.com/TarunyaProgrammer.png" width="50px" alt="TarunyaProgrammer" /></a>
<a href="https://github.com/v4rshh"><img src="https://github.com/v4rshh.png" width="50px" alt="v4rshh" /></a>
<a href="https://github.com/Namish06"><img src="https://github.com/Namish06.png" width="50px" alt="Namish06" /></a>
<a href="https://github.com/Codewith-Yogita"><img src="https://github.com/Codewith-Yogita.png" width="50px" alt="Codewith-Yogita" /></a>
<a href="https://github.com/basantnema31"><img src="https://github.com/basantnema31.png" width="50px" alt="basantnema31" /></a>
<a href="https://github.com/Jay-Jay-Tee"><img src="https://github.com/Jay-Jay-Tee.png" width="50px" alt="Jay-Jay-Tee" /></a>
<a href="https://github.com/AdityaM-IITH"><img src="https://github.com/AdityaM-IITH.png" width="50px" alt="AdityaM-IITH" /></a>
<a href="https://github.com/Sarvesh-Sarz"><img src="https://github.com/Sarvesh-Sarz.png" width="50px" alt="Sarvesh-Sarz" /></a>
<a href="https://github.com/Yashvijain1234"><img src="https://github.com/Yashvijain1234.png" width="50px" alt="Yashvijain1234" /></a>
<a href="https://github.com/kejriwalkaushal04"><img src="https://github.com/kejriwalkaushal04.png" width="50px" alt="kejriwalkaushal04" /></a>
<a href="https://github.com/shrutssss"><img src="https://github.com/shrutssss.png" width="50px" alt="shrutssss" /></a>
<a href="https://github.com/PriyaanshPandey"><img src="https://github.com/PriyaanshPandey.png" width="50px" alt="PriyaanshPandey" /></a>
<a href="https://github.com/Ashvin-KS"><img src="https://github.com/Ashvin-KS.png" width="50px" alt="Ashvin-KS" /></a>
<a href="https://github.com/Sha-lini3"><img src="https://github.com/Sha-lini3.png" width="50px" alt="Sha-lini3" /></a>
<a href="https://github.com/parneetbrar234-svg"><img src="https://github.com/parneetbrar234-svg.png" width="50px" alt="parneetbrar234-svg" /></a>
<a href="https://github.com/theRkakkad"><img src="https://github.com/theRkakkad.png" width="50px" alt="theRkakkad" /></a>
<a href="https://github.com/anshul23102"><img src="https://github.com/anshul23102.png" width="50px" alt="anshul23102" /></a>
<a href="https://github.com/gauriii10"><img src="https://github.com/gauriii10.png" width="50px" alt="gauriii10" /></a>
<a href="https://github.com/Purohit-Yogeshraj"><img src="https://github.com/Purohit-Yogeshraj.png" width="50px" alt="Purohit-Yogeshraj" /></a>
<a href="https://github.com/UjsGit"><img src="https://github.com/UjsGit.png" width="50px" alt="UjsGit" /></a>
<a href="https://github.com/AAKASH22269796"><img src="https://github.com/AAKASH22269796.png" width="50px" alt="AAKASH22269796" /></a>
<a href="https://github.com/arushiranjan"><img src="https://github.com/arushiranjan.png" width="50px" alt="arushiranjan" /></a>
<a href="https://github.com/Ayushi-hi"><img src="https://github.com/Ayushi-hi.png" width="50px" alt="Ayushi-hi" /></a>
<a href="https://github.com/Harshith1702"><img src="https://github.com/Harshith1702.png" width="50px" alt="Harshith1702" /></a>
<a href="https://github.com/G-Ganesh83"><img src="https://github.com/G-Ganesh83.png" width="50px" alt="G-Ganesh83" /></a>
<a href="https://github.com/nimkarprachi17"><img src="https://github.com/nimkarprachi17.png" width="50px" alt="nimkarprachi17" /></a>
<a href="https://github.com/charu2210"><img src="https://github.com/charu2210.png" width="50px" alt="charu2210" /></a>
<a href="https://github.com/saiprasad578"><img src="https://github.com/saiprasad578.png" width="50px" alt="saiprasad578" /></a>
<a href="https://github.com/shreyjoshi73"><img src="https://github.com/shreyjoshi73.png" width="50px" alt="shreyjoshi73" /></a>
<a href="https://github.com/mudit-codez"><img src="https://github.com/mudit-codez.png" width="50px" alt="mudit-codez" /></a>
<a href="https://github.com/YLaxmikanth"><img src="https://github.com/YLaxmikanth.png" width="50px" alt="YLaxmikanth" /></a>
<a href="https://github.com/srishav3"><img src="https://github.com/srishav3.png" width="50px" alt="srishav3" /></a>
<a href="https://github.com/NayansiDupare"><img src="https://github.com/NayansiDupare.png" width="50px" alt="NayansiDupare" /></a>
<a href="https://github.com/Vedhant26"><img src="https://github.com/Vedhant26.png" width="50px" alt="Vedhant26" /></a>
<a href="https://github.com/Jagriti-yadav"><img src="https://github.com/Jagriti-yadav.png" width="50px" alt="Jagriti-yadav" /></a>
<a href="https://github.com/chavanGaneshDatta"><img src="https://github.com/chavanGaneshDatta.png" width="50px" alt="chavanGaneshDatta" /></a>
<a href="https://github.com/angelina-2206"><img src="https://github.com/angelina-2206.png" width="50px" alt="angelina-2206" /></a>
<a href="https://github.com/Deepakvarna02"><img src="https://github.com/Deepakvarna02.png" width="50px" alt="Deepakvarna02" /></a>
<a href="https://github.com/Nightkilller"><img src="https://github.com/Nightkilller.png" width="50px" alt="Nightkilller" /></a>
<a href="https://github.com/Itzzavdheshh"><img src="https://github.com/Itzzavdheshh.png" width="50px" alt="Itzzavdheshh" /></a>
<a href="https://github.com/Dhruvil20060"><img src="https://github.com/Dhruvil20060.png" width="50px" alt="Dhruvil20060" /></a>
<a href="https://github.com/Vrinda-28"><img src="https://github.com/Vrinda-28.png" width="50px" alt="Vrinda-28" /></a>
<a href="https://github.com/Nilamma19"><img src="https://github.com/Nilamma19.png" width="50px" alt="Nilamma19" /></a>
<a href="https://github.com/ash1shkumar"><img src="https://github.com/ash1shkumar.png" width="50px" alt="ash1shkumar" /></a>
<a href="https://github.com/Harxhit"><img src="https://github.com/Harxhit.png" width="50px" alt="Harxhit" /></a>
<a href="https://github.com/riyanshigupta890-cloud"><img src="https://github.com/riyanshigupta890-cloud.png" width="50px" alt="riyanshigupta890-cloud" /></a>
<a href="https://github.com/riddhimagupta2"><img src="https://github.com/riddhimagupta2.png" width="50px" alt="riddhimagupta2" /></a>
<a href="https://github.com/ckprojects77"><img src="https://github.com/ckprojects77.png" width="50px" alt="ckprojects77" /></a>
<a href="https://github.com/Dhruvil135"><img src="https://github.com/Dhruvil135.png" width="50px" alt="Dhruvil135" /></a>
<a href="https://github.com/neeraj477"><img src="https://github.com/neeraj477.png" width="50px" alt="neeraj477" /></a>
<a href="https://github.com/Pranathi-Kunjeti"><img src="https://github.com/Pranathi-Kunjeti.png" width="50px" alt="Pranathi-Kunjeti" /></a>
<a href="https://github.com/ajitkumarsaini02"><img src="https://github.com/ajitkumarsaini02.png" width="50px" alt="ajitkumarsaini02" /></a>
<a href="https://github.com/bhavyanjain3004"><img src="https://github.com/bhavyanjain3004.png" width="50px" alt="bhavyanjain3004" /></a>
<a href="https://github.com/MehtabSandhu11"><img src="https://github.com/MehtabSandhu11.png" width="50px" alt="MehtabSandhu11" /></a>
<a href="https://github.com/mramansayyad"><img src="https://github.com/mramansayyad.png" width="50px" alt="mramansayyad" /></a>
<a href="https://github.com/4f4d"><img src="https://github.com/4f4d.png" width="50px" alt="4f4d" /></a>
<a href="https://github.com/yuvraj-k-singh"><img src="https://github.com/yuvraj-k-singh.png" width="50px" alt="yuvraj-k-singh" /></a>
<a href="https://github.com/aasthakhatri11"><img src="https://github.com/aasthakhatri11.png" width="50px" alt="aasthakhatri11" /></a>
<a href="https://github.com/Pallavi-vi-1234"><img src="https://github.com/Pallavi-vi-1234.png" width="50px" alt="Pallavi-vi-1234" /></a>
<a href="https://github.com/saumyasargam"><img src="https://github.com/saumyasargam.png" width="50px" alt="saumyasargam" /></a>
<a href="https://github.com/rudra1337-dev"><img src="https://github.com/rudra1337-dev.png" width="50px" alt="rudra1337-dev" /></a>
<a href="https://github.com/maitrak18"><img src="https://github.com/maitrak18.png" width="50px" alt="maitrak18" /></a>
<a href="https://github.com/Vishee02"><img src="https://github.com/Vishee02.png" width="50px" alt="Vishee02" /></a>
<a href="https://github.com/ThePrabhu"><img src="https://github.com/ThePrabhu.png" width="50px" alt="ThePrabhu" /></a>
<a href="https://github.com/riddhima25bet10005-a11y"><img src="https://github.com/riddhima25bet10005-a11y.png" width="50px" alt="riddhima25bet10005-a11y" /></a>
<a href="https://github.com/deekshithayadav-16"><img src="https://github.com/deekshithayadav-16.png" width="50px" alt="deekshithayadav-16" /></a>
<a href="https://github.com/poorvasingh1610"><img src="https://github.com/poorvasingh1610.png" width="50px" alt="poorvasingh1610" /></a>
<a href="https://github.com/Pranav-IIITM"><img src="https://github.com/Pranav-IIITM.png" width="50px" alt="Pranav-IIITM" /></a>
<a href="https://github.com/IshitaSingh0822"><img src="https://github.com/IshitaSingh0822.png" width="50px" alt="IshitaSingh0822" /></a>
<a href="https://github.com/PrincePundir123"><img src="https://github.com/PrincePundir123.png" width="50px" alt="PrincePundir123" /></a>
<a href="https://github.com/Ashish241"><img src="https://github.com/Ashish241.png" width="50px" alt="Ashish241" /></a>
<a href="https://github.com/Taru-Sharma0503"><img src="https://github.com/Taru-Sharma0503.png" width="50px" alt="Taru-Sharma0503" /></a>
<a href="https://github.com/rajdeep-yadav"><img src="https://github.com/rajdeep-yadav.png" width="50px" alt="rajdeep-yadav" /></a>
<a href="https://github.com/dishamaurya081-create"><img src="https://github.com/dishamaurya081-create.png" width="50px" alt="dishamaurya081-create" /></a>
<a href="https://github.com/shravanithouta108"><img src="https://github.com/shravanithouta108.png" width="50px" alt="shravanithouta108" /></a>
<a href="https://github.com/mohanteja781112"><img src="https://github.com/mohanteja781112.png" width="50px" alt="mohanteja781112" /></a>
<a href="https://github.com/garimatiwari1912-alt"><img src="https://github.com/garimatiwari1912-alt.png" width="50px" alt="garimatiwari1912-alt" /></a>
<a href="https://github.com/Lathika11"><img src="https://github.com/Lathika11.png" width="50px" alt="Lathika11" /></a>
<a href="https://github.com/opinder8699"><img src="https://github.com/opinder8699.png" width="50px" alt="opinder8699" /></a>
<a href="https://github.com/Konarksharma13"><img src="https://github.com/Konarksharma13.png" width="50px" alt="Konarksharma13" /></a>
<a href="https://github.com/OmkarAKadam"><img src="https://github.com/OmkarAKadam.png" width="50px" alt="OmkarAKadam" /></a>
<a href="https://github.com/Trrr10"><img src="https://github.com/Trrr10.png" width="50px" alt="Trrr10" /></a>
<a href="https://github.com/0000001abhishek-debug"><img src="https://github.com/0000001abhishek-debug.png" width="50px" alt="0000001abhishek-debug" /></a>
<a href="https://github.com/jatinrwt01"><img src="https://github.com/jatinrwt01.png" width="50px" alt="jatinrwt01" /></a>
<a href="https://github.com/syedrazamd"><img src="https://github.com/syedrazamd.png" width="50px" alt="syedrazamd" /></a>
<a href="https://github.com/mdudhe2007"><img src="https://github.com/mdudhe2007.png" width="50px" alt="mdudhe2007" /></a>
<a href="https://github.com/anushka146"><img src="https://github.com/anushka146.png" width="50px" alt="anushka146" /></a>
<a href="https://github.com/HarshaVardhan31012007"><img src="https://github.com/HarshaVardhan31012007.png" width="50px" alt="HarshaVardhan31012007" /></a>
<a href="https://github.com/omkartike"><img src="https://github.com/omkartike.png" width="50px" alt="omkartike" /></a>
<a href="https://github.com/Shivansh181003"><img src="https://github.com/Shivansh181003.png" width="50px" alt="Shivansh181003" /></a>
<a href="https://github.com/gloooomed"><img src="https://github.com/gloooomed.png" width="50px" alt="gloooomed" /></a>
<a href="https://github.com/DAYHARIKA"><img src="https://github.com/DAYHARIKA.png" width="50px" alt="DAYHARIKA" /></a>
<a href="https://github.com/diksha78dev"><img src="https://github.com/diksha78dev.png" width="50px" alt="diksha78dev" /></a>
<a href="https://github.com/Bushra-gh"><img src="https://github.com/Bushra-gh.png" width="50px" alt="Bushra-gh" /></a>
<a href="https://github.com/pranav-pachn"><img src="https://github.com/pranav-pachn.png" width="50px" alt="pranav-pachn" /></a>
<a href="https://github.com/maanyadanayak"><img src="https://github.com/maanyadanayak.png" width="50px" alt="maanyadanayak" /></a>
<a href="https://github.com/Aditya8369"><img src="https://github.com/Aditya8369.png" width="50px" alt="Aditya8369" /></a>
<a href="https://github.com/ShailiBoddula"><img src="https://github.com/ShailiBoddula.png" width="50px" alt="ShailiBoddula" /></a>
<a href="https://github.com/vaibhavi-vaishnav"><img src="https://github.com/vaibhavi-vaishnav.png" width="50px" alt="vaibhavi-vaishnav" /></a>
<a href="https://github.com/prisha-sh"><img src="https://github.com/prisha-sh.png" width="50px" alt="prisha-sh" /></a>
<a href="https://github.com/VaibhavMP"><img src="https://github.com/VaibhavMP.png" width="50px" alt="VaibhavMP" /></a>
<a href="https://github.com/Akshaya-codes13"><img src="https://github.com/Akshaya-codes13.png" width="50px" alt="Akshaya-codes13" /></a>
<a href="https://github.com/Dj-Shortcut"><img src="https://github.com/Dj-Shortcut.png" width="50px" alt="Dj-Shortcut" /></a>
<a href="https://github.com/SHUBHAM2775"><img src="https://github.com/SHUBHAM2775.png" width="50px" alt="SHUBHAM2775" /></a>
<a href="https://github.com/Kuldeeps1505"><img src="https://github.com/Kuldeeps1505.png" width="50px" alt="Kuldeeps1505" /></a>
<a href="https://github.com/bipinchaudhary28899"><img src="https://github.com/bipinchaudhary28899.png" width="50px" alt="bipinchaudhary28899" /></a>
<a href="https://github.com/kiranShamsHere"><img src="https://github.com/kiranShamsHere.png" width="50px" alt="kiranShamsHere" /></a>
<a href="https://github.com/Ashusf90"><img src="https://github.com/Ashusf90.png" width="50px" alt="Ashusf90" /></a>
<a href="https://github.com/Aditya-debugs141"><img src="https://github.com/Aditya-debugs141.png" width="50px" alt="Aditya-debugs141" /></a>
<a href="https://github.com/Itheshjs"><img src="https://github.com/Itheshjs.png" width="50px" alt="Itheshjs" /></a>
<a href="https://github.com/Chizaram-Igolo"><img src="https://github.com/Chizaram-Igolo.png" width="50px" alt="Chizaram-Igolo" /></a>
<a href="https://github.com/Manasa-2303"><img src="https://github.com/Manasa-2303.png" width="50px" alt="Manasa-2303" /></a>
<a href="https://github.com/shivam-kakkar"><img src="https://github.com/shivam-kakkar.png" width="50px" alt="shivam-kakkar" /></a>
<a href="https://github.com/bhaktiyadav08"><img src="https://github.com/bhaktiyadav08.png" width="50px" alt="bhaktiyadav08" /></a>
<a href="https://github.com/a638011"><img src="https://github.com/a638011.png" width="50px" alt="a638011" /></a>
<a href="https://github.com/anirudh645"><img src="https://github.com/anirudh645.png" width="50px" alt="anirudh645" /></a>
<a href="https://github.com/abdussamad567"><img src="https://github.com/abdussamad567.png" width="50px" alt="abdussamad567" /></a>
<a href="https://github.com/PranavJogdand"><img src="https://github.com/PranavJogdand.png" width="50px" alt="PranavJogdand" /></a>
<a href="https://github.com/nirula23-v"><img src="https://github.com/nirula23-v.png" width="50px" alt="nirula23-v" /></a>
<a href="https://github.com/nitinog10"><img src="https://github.com/nitinog10.png" width="50px" alt="nitinog10" /></a>
<!-- CONTRIBUTORS_END -->

## License

[Apache License 2.0](LICENSE).

## Photography

The photographs on the landing and application pages were taken by the project
maintainer at Google Summer of Code Alumni Camp India 2026 (24 July 2026) and are
published with the consent of the people shown.
