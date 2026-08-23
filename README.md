<div align="center">

# 🚀 GSoC 2026 Org Finder

## Find your perfect Google Summer of Code 2026 organization

Discover organizations based on **tech stack, domains, competition level, GitHub activity, and beginner-friendly issues** — all in one place.

<p align="center">
  <a href="https://findmygsoc.vercel.app/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Visit_Project-blue?style=for-the-badge" alt="Live Demo badge">
  </a>
  
  <a href="https://discord.gg/jYrbHKtn8t">
    <img src="https://img.shields.io/badge/💬_Discord-Join_Community-5865F2?style=for-the-badge" alt = "Discord badge">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/S3DFX-CYBER/GSoC-Org-Finder-?style=flat-square" alt = "GitHub Stars"/>
  <img src="https://img.shields.io/github/forks/S3DFX-CYBER/GSoC-Org-Finder-?style=flat-square" alt = "GitHub Forks"/>
  <img src="https://img.shields.io/github/issues/S3DFX-CYBER/GSoC-Org-Finder-?style=flat-square" alt = "GitHub Issues"/>
  <img src="https://img.shields.io/github/license/S3DFX-CYBER/GSoC-Org-Finder-?style=flat-square" alt = "GitHub License"/>

</p>

<img width="100%" alt="Project Banner" src="https://github.com/user-attachments/assets/414e4b55-ec50-4290-97a6-678f23e7c96e" />

</div>

---

## 🌱 Beginner Quick Start

New to open source? Here's how to get started in 3 steps:

**1. Fork & Clone**
```bash
git clone https://github.com/your-username/GSoC-Org-Finder-.git
cd GSoC-Org-Finder-
```

**2. Open the project**
```bash
# No build step needed! Just open:
open index.html   # macOS
# OR double-click index.html on Windows
```

**3. Make your change & open a PR**
- Edit files, save, refresh `index.html` in your browser to see changes
- Follow the [GSSoC Contributor Guide](docs/GSSOC_CONTRIBUTOR_GUIDE.md) for PR rules

> 💡 No Node.js, no npm, no build tools needed. This is a pure HTML/CSS/JS project.

**Helpful links for new contributors:**
**Helpful links for new contributors:**

| Guide | Link |
|-------|------|
| GSSoC'26 Contributors | [GSSoC Contributor Guide](docs/GSSOC_CONTRIBUTOR_GUIDE.md) |
| NSoC'26 Contributors | [NSoC Guide](docs/NSOC_GUIDE.md) |
| General Contributors | [General Contributor Guide](docs/GENERAL_CONTRIBUTOR_GUIDE.md) |
## ✨ What is this?

GSoC 2026 Org Finder is a fast, modern, and beginner-friendly platform for exploring Google Summer of Code organizations based on tech stack, domains, interests, and contribution goals.

Instead of manually browsing through **184+ organizations**, users can:

- 🔍 Search by technology, domain, or keyword  
- 🏷️ Filter by languages, categories, and competition level  
- ⚖️ Compare organizations side-by-side  
- 🟢 Discover beginner-friendly Good First Issues  
- 📈 Track live GitHub activity and project insights  

Built with a responsive and lightweight architecture, the platform delivers a seamless experience across desktop and mobile devices.

> No sign-up. No setup. Just explore, compare, and begin your open-source journey 🚀

---

<div align="center">

## 📖 Table of Contents

| Section | Description |
|----------|-------------|
| [✨ What is this?](#-what-is-this) | Overview of the project |
| [🎯 Features](#-features) | Core functionalities and highlights |
| [📈 Flowchart](#-flowchart) | Visual representation of project workflow |
| [📁 Project Structure](#-project-structure) | Repository folder structure |
| [🔍 URL Validation](#-url-validation) | URL validation system and checks |
| [🚀 Deploy Your Own](#-deploy-your-own) | Deployment and setup guide |
| [🐛 Troubleshooting](#-troubleshooting) | Common issues and fixes |
| [🤝 Contributing](#-contributing) | Contribution guidelines and workflow |
| [👥 GSSoC Mentors](#-gssoc-mentors) | Mentors supporting the project |
| [📅 Key Dates](#-gsoc-2026-key-dates) | Important GSoC 2026 timeline |
| [💡 Tips for Users](#-tips-for-users) | Helpful usage tips and shortcuts |
| [🔌 API Reference](#-api-reference-apigithubjs) | GitHub API proxy endpoints |
| [🌱 Beginner Quick Start](#-beginner-quick-start) | New contributor onboarding |
| [🔒 Hardened Architecture](#-hardened-frontend-architecture) | Security and resilience details |
| [📄 License](#-license) | Project license information |

</div>

---

## 📈 Flowchart

<img width="8192" height="1328" alt="Flowchart showing the user action flow for discovering and filtering GSoC organizations" src="https://github.com/user-attachments/assets/a56902d0-e172-42e9-b0d5-8a8ee2c7d156" />

---

# 🎯 Features

<div align="center">

## 🎯 Features at a Glance

| ✨ Feature | 📖 Description |
|-----------|----------------|
| 🔍 Smart Search | Search across 184+ organizations |
| 🏷️ Advanced Filters | Filter by domains and languages |
| ⚖️ Organization Compare | Compare up to 3 organizations |
| 🟢 Good First Issues | Find beginner-friendly issues |
| ⌨️ Keyboard Navigation | Full accessibility support |
| 🌙 Dark Mode | Clean dark/light interface |
| 📱 Fully Responsive | Works on all screen sizes |

</div>

---

## 🔎 Discovery & Filtering

Easily explore organizations using powerful and beginner-friendly filtering tools designed to simplify the GSoC organization discovery process.

| Feature | Description |
|---------|-------------|
| 🔍 Full-text Search | Search organizations by name, tech stack, or topic |
| 🏷️ Language Filters | Filter using multiple programming languages |
| 📊 Competition Filter | Explore high, medium, or low competition orgs |
| 🟢 Activity Badges | Identify actively maintained organizations |
| ⚡ Quick Category Chips | Instantly filter by domains and interests |
| 🌱 Beginner Recommendations | Discover newcomer-friendly organizations |

---

## 📊 Live GitHub Integration

| Feature | Description |
|----------|-------------|
| 🌟 **Live GitHub Stats** | View Stars, Forks, Issues, and Last Commit data |
| 🟢 **Good First Issues** | Track beginner-friendly issues on every org card |
| 🎖️ **Activity Badge** | Shows Active, Moderate, or Low repository activity |
| 🔗 **Smart Repo Links** | Redirects to project repos or GitHub org pages |
| 📈 **Project Insights** | Analyze repository health and activity |
| ⚡ **Fast Fetching** | Lightweight and optimized GitHub integration |

---

```mermaid
flowchart TD
    A([🏢 Organization Card])

    A --> B[📖 Tech Stack]
    A --> C[📅 GSoC Timeline]
    A --> D[📈 Competition Metrics]
    A --> E[🟢 Good First Issues]
    A --> F[💡 Ideas Page]
    A --> G[⚖️ Compare System]

    D --> H[⭐ Stars & Forks]
    D --> I[🔥 Activity Badge]

    style A fill:#d4af37,color:#000,stroke:#2c2420,stroke-width:3px
    style B fill:#1f2937,color:#fff
    style C fill:#5d4037,color:#fff
    style D fill:#0f766e,color:#fff
    style E fill:#166534,color:#fff
    style F fill:#7c3aed,color:#fff
    style G fill:#b45309,color:#fff
    style H fill:#374151,color:#fff
    style I fill:#991b1b,color:#fff
```
---

## ⚖️ Comparison System

Easily compare up to **3 organizations side-by-side** to identify the best fit for your skills and contribution goals.

| Metric | Comparison |
|--------|-------------|
| 📊 Competition | High, medium, or low competition |
| 📅 GSoC Experience | Years participating in GSoC |
| ⭐ GitHub Stats | Stars, forks, and activity |
| 🟢 Good First Issues | Beginner-friendly opportunities |
| 💻 Tech Stack | Languages and domains |
| 🔥 Repository Health | Activity and maintenance status |

---

# ✨ User Experience Features

<table>
<tr>

<td align="center" width="25%">

### ⌨️ Smart Navigation

```text
┌─────────────────┐
│ ↑ ↓ ← → Navigate│
│ Enter → Open    │
│ C → Compare     │
│ Esc → Close     │
└─────────────────┘
```

⚡ Fast keyboard-first browsing

</td>

<td align="center" width="25%">

### 📊 Local Analytics

```text
┌─────────────────┐
│ 👀 Org Views    │
│ 🔎 Searches     │
│ ⏱ Session Time  │
│ 📈 Trends       │
└─────────────────┘
```

🔒 100% private browser storage

</td>

<td align="center" width="25%">

### 🌙 Theme Engine

```text
┌─────────────────┐
│ ☀️ Light Mode   │
│        ⇅        │
│ 🌙 Dark Mode    │
└─────────────────┘
```

💾 Preferences saved automatically

</td>

<td align="center" width="25%">

### 📱 Responsive UI

```text
┌─────────────────┐
│ 💻 Desktop      │
│ 📟 Tablet       │
│ 📱 Mobile       │
└─────────────────┘
```

⚡ Optimized for all screen sizes

</td>

</tr>
</table>

---

## 🗂️ All 184 GSoC 2026 Organizations

| Domain | Examples |
|---|---|
| Science & Medicine | OpenAstronomy, DeepChem, MDAnalysis, ArduPilot, CERN-HSF |
| Programming Languages | LLVM, GCC, Haskell.org, The Rust Foundation, Swift, Python SF |
| Data | MariaDB, PostgreSQL, DBpedia, OpenStreetMap, MetaBrainz |
| Web | Django, Drupal, Wagtail, Wikimedia, webpack |
| Security | Metasploit, OWASP, Rizin, AFLplusplus, The Honeynet Project |
| Operating Systems | Debian, FreeBSD, GNOME, NetBSD, Haiku, KDE |
| Media | FFmpeg, Blender, Synfig, Jitsi, VideoLAN |
| Infrastructure | Kubeflow, KubeVirt, QEMU, Meshery, CNCF |
| Dev Tools | MIT App Inventor, OpenVINO, Gemini CLI, API Dash |
| Other | AnkiDroid, Joplin, Zulip, CCExtractor, Neovim |

---

## 🛠️ Tech Stack

| Layer | What |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — zero frameworks, zero build step |
| Hosting | Vercel (static) |
| API | Vercel Edge Function (`/api/github.js`) |
| Data source | Manually curated from [summerofcode.withgoogle.com](https://summerofcode.withgoogle.com/programs/2026/organizations) |
| Analytics | Browser `localStorage` only — no external tracking |

---

## 📁 Project Structure

```
gsoc-2026-org-finder/
├── index.html                    # Main frontend HTML
├── api/github.js                 # Vercel Edge Function — GitHub API proxy
├── src/
│   ├── assets/og-image.jpeg      # Social preview image
│   ├── js/app.js                 # Application logic
│   ├── js/org.js                 # Organization data source
│   └── styles.css                # Styling
├── agent/
│   ├── scripts/                  # Automation and helper scripts
│   └── tenet_agent/              # TENET PR review agent
├── data/issues.json
└── README.md
```

No `node_modules`. No build step. No bundler. Just deploy.

---

## 🔍 URL Validation

The project includes a validation script to ensure all organization ideas URLs are safe and properly formatted:

```bash
node agent/scripts/validate-ideas-urls.js
```

This script checks:
- ✅ URL format validity
- ✅ Protocol restrictions (http/https only)
- ⚠️ Placeholder/generic URLs that need updating
- 📊 Summary statistics and protocol distribution

Run this before committing changes to `src/js/org.js` to catch invalid URLs early.

## 🔒 Hardened Frontend Architecture

To ensure the GSoC Org Finder is extremely secure, accessible, resilient, and maintainable, the codebase has been hardened with a robust vanilla architecture:

### 1. Unified Event-Driven Flow & Delegation (100% Programmatic & CSP-Compliant)
All frontend scripting, bookmarking, complexity filtering, modal controls, and dynamic templates have been migrated to a 100% programmatic model:
* **Zero Inline Handlers:** All scattered `onclick` and `onerror` attributes in both static HTML (`index.html`) and dynamic template strings (`app.js`, `recommendation-ui.js`) are completely eliminated.
* **Global Capturing Image Error Interceptor:** A centralized recapturing `error` listener registered on `document` seamlessly intercepts failed image load events and triggers styled initial-based fallbacks.
* **Centralized Event Delegation:** Dynamic interactive collections (like trending cards, selected language badges, and mentor contact cards) cleanly route clicks via unified delegated listeners on their parent elements (`#trendingScroll`, `#selectedLangsStrip`, `#mentorsContainer`).

### 2. 🛡️ Safe Rendering & Sanitization (XSS Mitigation)
* **HTML Escaping:** All dynamic insertions of user-supplied or external API content are safely wrapped via a rigid `escapeHtml()` text filter to block HTML markup injections.
* **Protocol-Restricted Hrefs:** External anchor elements (like organization repository pages or ideas boards) are strictly validated via `sanitizeHrefUrl()` and `validateIdeasUrl()` to enforce only safe absolute protocols (`http:` and `https:`), explicitly rejecting active protocol wrappers (`javascript:`, `data:`, `vbscript:`).

### 3. ♿ Accessible Modal Management
All overlays (`orgModal`, `compareModal`, and `helpModal`) implement full semantic accessibility matching the WAI-ARIA standard:
* Modals are marked up using `role="dialog"`, `aria-modal="true"`, and mapped with specific label headers via `aria-labelledby`.
* Open/close interactions trigger strict **focus restoration** (returning focus to the activating button upon closing).
* Modals implement dynamic **focus trapping** ensuring `Tab`/`Shift+Tab` operations cycle exclusively within dialog controls.

### 4. 🛜 Offline Resilience (Service Worker Caching)
* **Static Manifest:** A robust cache list (`sw.js`) collects and version-controls all essential UI assets, scripts, stylesheets, and custom Google Fonts.
* **Dual Caching Interceptors:** Intercepted requests deploy **Stale-While-Revalidate** patterns for static assets (for zero-latency responsiveness) and **Network-First** strategies for Edge proxy stats and JSON issue lists (for high data reliability).

### 5. 🧪 Zero-Dependency Testing Suite
A modular test bed under `/tests` utilizes Node.js's built-in `node:test` framework and mock DOM stubs, covering:
* `tests/sanitization.test.js`: Validates escaping and URL sanitizers.
* `tests/skills.test.js`: Validates language aliases and technical context matching for single-letter tags.
* `tests/recommendation.test.js`: Validates recommender scores and veteran status bonuses.
* `tests/filtering.test.js`: Validates tag matching.
* `tests/modal.test.js`: Upgraded interactive test suite validating focus traps, focus restorations, and API fetching.
* `tests/browser.test.js`: Simulated browser DOM smoke test dry-running page load event bindings.
* `tests/cache.test.js`: Service Worker offline caching strategy fetch intercept test.

Run the test suite locally:
```bash
npm test
```

## 🚀 Deploy Your Own

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/gsoc-2026-org-finder.git
cd gsoc-2026-org-finder
```

### 2. Add GitHub Token (for live stats + Good First Issues)
In your Vercel dashboard → Project Settings → Environment Variables:
```
GITHUB_TOKEN = ghp_your_token_here
```
Generate a token at [github.com/settings/tokens](https://github.com/settings/tokens) — only `public_repo` scope needed.

### 3. Deploy
```bash
vercel --prod
```
Or connect the repo to Vercel and it deploys automatically on every push.

### 4. Run Locally
```bash
open index.html   # macOS — works without API (GitHub stats won't load)
```
For full functionality locally, run `vercel dev` to start the Edge Function.

---

## 🐛 Troubleshooting

**GitHub stats not loading?**
- Set `GITHUB_TOKEN` environment variable
- Check rate limits: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit`

**Ideas link not working?**
- Run `node agent/scripts/validate-ideas-urls.js` to check all URLs

**Issues page empty?**
- GitHub API might be rate-limited; wait 1 hour and refresh

---

## 🤝 Contributing

Found a missing org, wrong category, or incorrect tags? PRs are very welcome!

**Read the guide for your contribution track before getting started:**

| Track | Guide |
|-------|-------|
| GSSoC'26 Contributors | [GSSoC Contributor Guide](docs/GSSOC_CONTRIBUTOR_GUIDE.md) |
| GSSoC'26 Mentors | [GSSoC Mentor Guide](docs/GSSOC_MENTOR_GUIDE.md) |
| NSoC'26 Contributors | [NSoC Guide](docs/NSOC_GUIDE.md) |
| General Contributors | [General Contributor Guide](docs/GENERAL_CONTRIBUTOR_GUIDE.md) |

For the full contributing reference (architecture, rules, PR workflow), see [CONTRIBUTING.md](CONTRIBUTING.md).

### Assignment Process

This repo uses a **maintainer-verified** assignment system:

1. Find an issue and comment `/assign gssoc` or `/assign nsoc`
2. Your request is **queued** (not immediately assigned)
3. A maintainer verifies the issue and runs `/approve-assignment`
4. You get notified and can begin work

**Do not start working before you are assigned.**

### Quick Start

1. Fork the repo
2. Edit the `ORGS` array in `index.html`
3. Open a pull request using the appropriate template

Each org entry looks like this:

```js
{
  name: "Organization Name",
  cat: "science",           // science | programming | data | web | os | security | media | infra | dev | other
  years: 5,                 // number of GSoC years participated
  firstYear: 2021,          // first year they participated
  competition: "moderate",  // hot | moderate | chill
  github: "owner/repo",     // main repo (or just "owner" for umbrella orgs)
  ideas: "https://github.com/org/repo/wiki/Ideas",  // project ideas page URL (optional)
  tags: ["python", "c++", "machine learning"],
  desc: "Short description of what the org does.",
  fit: ["Python devs", "ML researchers"]
}
```

**Ideas URL Requirements**:
- Must use `http://` or `https://` protocol (or protocol will be added automatically)
- Should link to the organization's specific project ideas page
- Generic GSoC organization pages are acceptable as placeholders but should be updated when possible
- Run `node agent/scripts/validate-ideas-urls.js` to check all URLs before submitting

**Competition levels** (subjective, based on org popularity + slot count):
- `hot` — high applicant volume, very competitive (Django, LLVM, Git, KDE…)
- `moderate` — good balance of applicants and slots
- `chill` — fewer applicants, easier to stand out

### PR Review Pipeline

All PRs pass through a 3-stage pipeline:

| Stage | What | Who |
|-------|------|-----|
| Stage 1 | DCO, format, AI/slop, diff size | Automated |
| Stage 2 | Code review, quality | Mentor |
| Stage 3 | Final merge decision | Project Admin |

Stage 2 unlocks only after Stage 1 passes. The pipeline status comment on your PR updates only when the stage actually changes (no spam).

---

## 📅 GSoC 2026 Key Dates

| Date | Milestone |
|---|---|
| February 2026 | Organizations announced |
| **March 16, 2026** | **Student applications open** |
| **March 31, 2026** | **Application deadline** |
| April 30 2026 | Accepted students announced |
| May – November 2026 | Coding period |

---

## 🔌 API Reference (`/api/github.js`)

The Edge Function proxies GitHub API calls so your token never hits the client.

| Endpoint | Description |
|---|---|
| `GET /api/github?repo=owner/repo` | Repo stats: stars, forks, issues, last commit, activity, GFI count |
| `GET /api/github?repo=owner/repo&gfi=1` | Good First Issue count only (faster, cached separately) |
| `GET /api/github?repo=owner/repo&gfi=1&issues=1` | Full list of up to 30 open Good First Issues |

All responses are cached in-memory for **1 hour** on the Edge runtime.
# 🚀 Official Open Source Program Project

<div align="center">

## 🌟 Proudly Participating In

## Nexus Spring of Code 2026 (NSoC'26)  
## GirlScript Summer of Code 2026 (GSSoC'26)

<img 
  width="420"
  alt="GSSoC & NSoC Banner"
  src="https://github.com/user-attachments/assets/0cfe15fe-2d4a-4389-9a0b-8cf8d0cfd8cd"
  style="border:4px solid #d4af37; border-radius:18px; padding:6px;"
/>

--- 

</div>

## 🔑 Project Admin

<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="80px" alt="S3DFX-CYBER" /></a>

**[@S3DFX-CYBER](https://github.com/S3DFX-CYBER)** — Project Admin (PA) for GSSoC'26 and NSoC'26. Responsible for final merge decisions, mentor coordination, repository maintenance, and ensuring contribution quality across all programs.

---

## 👥 GSSoC Mentors

These mentors help guide and review contributions for the GSSoC program:

<!-- GSSOC_MENTORS_START -->
<a href="https://github.com/12fahed"><img src="https://github.com/12fahed.png" width="50px" alt="12fahed" /></a>
<a href="https://github.com/4f4d"><img src="https://github.com/4f4d.png" width="50px" alt="4f4d" /></a>
<a href="https://github.com/aanjalii01"><img src="https://github.com/aanjalii01.png" width="50px" alt="aanjalii01" /></a>
<a href="https://github.com/adithyan-css"><img src="https://github.com/adithyan-css.png" width="50px" alt="adithyan-css" /></a>
<a href="https://github.com/AditthyaSS"><img src="https://github.com/AditthyaSS.png" width="50px" alt="AditthyaSS" /></a>
<a href="https://github.com/AnirbansarkarS"><img src="https://github.com/AnirbansarkarS.png" width="50px" alt="AnirbansarkarS" /></a>
<a href="https://github.com/AnirudhPhophalia"><img src="https://github.com/AnirudhPhophalia.png" width="50px" alt="AnirudhPhophalia" /></a>
<a href="https://github.com/anubhavxdev"><img src="https://github.com/anubhavxdev.png" width="50px" alt="anubhavxdev" /></a>
<a href="https://github.com/Anushreebasics"><img src="https://github.com/Anushreebasics.png" width="50px" alt="Anushreebasics" /></a>
<a href="https://github.com/aryanbhutani26"><img src="https://github.com/aryanbhutani26.png" width="50px" alt="aryanbhutani26" /></a>
<a href="https://github.com/ayu-yishu13"><img src="https://github.com/ayu-yishu13.png" width="50px" alt="ayu-yishu13" /></a>
<a href="https://github.com/Ayush-Patel-56"><img src="https://github.com/Ayush-Patel-56.png" width="50px" alt="Ayush-Patel-56" /></a>
<a href="https://github.com/Ayushh-Sharmaa"><img src="https://github.com/Ayushh-Sharmaa.png" width="50px" alt="Ayushh-Sharmaa" /></a>
<a href="https://github.com/Balaji91221"><img src="https://github.com/Balaji91221.png" width="50px" alt="Balaji91221" /></a>
<a href="https://github.com/BandhiyaHardik"><img src="https://github.com/BandhiyaHardik.png" width="50px" alt="BandhiyaHardik" /></a>
<a href="https://github.com/coder-zs-cse"><img src="https://github.com/coder-zs-cse.png" width="50px" alt="coder-zs-cse" /></a>
<a href="https://github.com/CoderOggy78"><img src="https://github.com/CoderOggy78.png" width="50px" alt="CoderOggy78" /></a>
<a href="https://github.com/deepak0x"><img src="https://github.com/deepak0x.png" width="50px" alt="deepak0x" /></a>
<a href="https://github.com/deepaksinghh12"><img src="https://github.com/deepaksinghh12.png" width="50px" alt="deepaksinghh12" /></a>
<a href="https://github.com/DevROHIT11"><img src="https://github.com/DevROHIT11.png" width="50px" alt="DevROHIT11" /></a>
<a href="https://github.com/Haile-12"><img src="https://github.com/Haile-12.png" width="50px" alt="Haile-12" /></a>
<a href="https://github.com/itsdakshjain"><img src="https://github.com/itsdakshjain.png" width="50px" alt="itsdakshjain" /></a>
<a href="https://github.com/JoeCelaster"><img src="https://github.com/JoeCelaster.png" width="50px" alt="JoeCelaster" /></a>
<a href="https://github.com/kallal79"><img src="https://github.com/kallal79.png" width="50px" alt="kallal79" /></a>
<a href="https://github.com/KaranGupta2005"><img src="https://github.com/KaranGupta2005.png" width="50px" alt="KaranGupta2005" /></a>
<a href="https://github.com/knoxiboy"><img src="https://github.com/knoxiboy.png" width="50px" alt="knoxiboy" /></a>
<a href="https://github.com/Kota-Jagadeesh"><img src="https://github.com/Kota-Jagadeesh.png" width="50px" alt="Kota-Jagadeesh" /></a>
<a href="https://github.com/KumarNirupam1"><img src="https://github.com/KumarNirupam1.png" width="50px" alt="KumarNirupam1" /></a>
<a href="https://github.com/lourduradjou"><img src="https://github.com/lourduradjou.png" width="50px" alt="lourduradjou" /></a>
<a href="https://github.com/lovestaco"><img src="https://github.com/lovestaco.png" width="50px" alt="lovestaco" /></a>
<a href="https://github.com/magic-peach"><img src="https://github.com/magic-peach.png" width="50px" alt="magic-peach" /></a>
<a href="https://github.com/Manan-Chawla"><img src="https://github.com/Manan-Chawla.png" width="50px" alt="Manan-Chawla" /></a>
<a href="https://github.com/Maxd646"><img src="https://github.com/Maxd646.png" width="50px" alt="Maxd646" /></a>
<a href="https://github.com/MAYANKSHARMA01010"><img src="https://github.com/MAYANKSHARMA01010.png" width="50px" alt="MAYANKSHARMA01010" /></a>
<a href="https://github.com/Mohit-368"><img src="https://github.com/Mohit-368.png" width="50px" alt="Mohit-368" /></a>
<a href="https://github.com/morningstarxcdcode"><img src="https://github.com/morningstarxcdcode.png" width="50px" alt="morningstarxcdcode" /></a>
<a href="https://github.com/Mrigakshi-Rathore"><img src="https://github.com/Mrigakshi-Rathore.png" width="50px" alt="Mrigakshi-Rathore" /></a>
<a href="https://github.com/MUKUL-PRASAD-SIGH"><img src="https://github.com/MUKUL-PRASAD-SIGH.png" width="50px" alt="MUKUL-PRASAD-SIGH" /></a>
<a href="https://github.com/Neilblaze"><img src="https://github.com/Neilblaze.png" width="50px" alt="Neilblaze" /></a>
<a href="https://github.com/nihalawasthi"><img src="https://github.com/nihalawasthi.png" width="50px" alt="nihalawasthi" /></a>
<a href="https://github.com/nitinog10"><img src="https://github.com/nitinog10.png" width="50px" alt="nitinog10" /></a>
<a href="https://github.com/oasis-parzival"><img src="https://github.com/oasis-parzival.png" width="50px" alt="oasis-parzival" /></a>
<a href="https://github.com/piyushdotcomm"><img src="https://github.com/piyushdotcomm.png" width="50px" alt="piyushdotcomm" /></a>
<a href="https://github.com/Precise-Goals"><img src="https://github.com/Precise-Goals.png" width="50px" alt="Precise-Goals" /></a>
<a href="https://github.com/preetbiswas12"><img src="https://github.com/preetbiswas12.png" width="50px" alt="preetbiswas12" /></a>
<a href="https://github.com/rounakkraaj-1744"><img src="https://github.com/rounakkraaj-1744.png" width="50px" alt="rounakkraaj-1744" /></a>
<a href="https://github.com/sabeenaviklar"><img src="https://github.com/sabeenaviklar.png" width="50px" alt="sabeenaviklar" /></a>
<a href="https://github.com/Sagar-Datkhile"><img src="https://github.com/Sagar-Datkhile.png" width="50px" alt="Sagar-Datkhile" /></a>
<a href="https://github.com/Satya900"><img src="https://github.com/Satya900.png" width="50px" alt="Satya900" /></a>
<a href="https://github.com/saurabh24thakur"><img src="https://github.com/saurabh24thakur.png" width="50px" alt="saurabh24thakur" /></a>
<a href="https://github.com/Shravanthi20"><img src="https://github.com/Shravanthi20.png" width="50px" alt="Shravanthi20" /></a>
<a href="https://github.com/sparshagarwal0411"><img src="https://github.com/sparshagarwal0411.png" width="50px" alt="sparshagarwal0411" /></a>
<a href="https://github.com/SparshM8"><img src="https://github.com/SparshM8.png" width="50px" alt="SparshM8" /></a>
<a href="https://github.com/stealthwhizz"><img src="https://github.com/stealthwhizz.png" width="50px" alt="stealthwhizz" /></a>
<a href="https://github.com/subratamondalnsec"><img src="https://github.com/subratamondalnsec.png" width="50px" alt="subratamondalnsec" /></a>
<a href="https://github.com/Suvanwita"><img src="https://github.com/Suvanwita.png" width="50px" alt="Suvanwita" /></a>
<a href="https://github.com/SyedImtiyaz-1"><img src="https://github.com/SyedImtiyaz-1.png" width="50px" alt="SyedImtiyaz-1" /></a>
<a href="https://github.com/TarunyaProgrammer"><img src="https://github.com/TarunyaProgrammer.png" width="50px" alt="TarunyaProgrammer" /></a>
<a href="https://github.com/thakurutkarsh22"><img src="https://github.com/thakurutkarsh22.png" width="50px" alt="thakurutkarsh22" /></a>
<a href="https://github.com/uddalak2005"><img src="https://github.com/uddalak2005.png" width="50px" alt="uddalak2005" /></a>
<a href="https://github.com/vanshaggarwal07"><img src="https://github.com/vanshaggarwal07.png" width="50px" alt="vanshaggarwal07" /></a>
<!-- GSSOC_MENTORS_END -->

## We thank all our Contributors for improving this project

## 💡 Tips for Users

1. **New to GSoC?** Start with "Newcomers First" filter + sort by Good First Issues
2. **Experienced?** Check "Veterans" filter + sort by Competition for challenges
3. **Building a comparison?** Use keyboard shortcut `C` to quickly add orgs
4. **Mobile browsing?** Try portrait mode — everything scrolls smoothly
   
## ✨ Contributors
<!-- CONTRIBUTORS_START -->
<a href="https://github.com/0000001abhishek-debug"><img src="https://github.com/0000001abhishek-debug.png" width="50px" alt="0000001abhishek-debug" /></a>
<a href="https://github.com/4f4d"><img src="https://github.com/4f4d.png" width="50px" alt="4f4d" /></a>
<a href="https://github.com/AAKASH22269796"><img src="https://github.com/AAKASH22269796.png" width="50px" alt="AAKASH22269796" /></a>
<a href="https://github.com/ANKITDANDOTIYA"><img src="https://github.com/ANKITDANDOTIYA.png" width="50px" alt="ANKITDANDOTIYA" /></a>
<a href="https://github.com/AbhishekVinod-dev"><img src="https://github.com/AbhishekVinod-dev.png" width="50px" alt="AbhishekVinod-dev" /></a>
<a href="https://github.com/Aditya-debugs141"><img src="https://github.com/Aditya-debugs141.png" width="50px" alt="Aditya-debugs141" /></a>
<a href="https://github.com/Aditya8369"><img src="https://github.com/Aditya8369.png" width="50px" alt="Aditya8369" /></a>
<a href="https://github.com/AdityaM-IITH"><img src="https://github.com/AdityaM-IITH.png" width="50px" alt="AdityaM-IITH" /></a>
<a href="https://github.com/Akshayaqueen"><img src="https://github.com/Akshayaqueen.png" width="50px" alt="Akshayaqueen" /></a>
<a href="https://github.com/Ashish241"><img src="https://github.com/Ashish241.png" width="50px" alt="Ashish241" /></a>
<a href="https://github.com/Ashusf90"><img src="https://github.com/Ashusf90.png" width="50px" alt="Ashusf90" /></a>
<a href="https://github.com/Ashvin-KS"><img src="https://github.com/Ashvin-KS.png" width="50px" alt="Ashvin-KS" /></a>
<a href="https://github.com/Ayushi-hi"><img src="https://github.com/Ayushi-hi.png" width="50px" alt="Ayushi-hi" /></a>
<a href="https://github.com/Ayushia5"><img src="https://github.com/Ayushia5.png" width="50px" alt="Ayushia5" /></a>
<a href="https://github.com/Bushra-gh"><img src="https://github.com/Bushra-gh.png" width="50px" alt="Bushra-gh" /></a>
<a href="https://github.com/Chizaram-Igolo"><img src="https://github.com/Chizaram-Igolo.png" width="50px" alt="Chizaram-Igolo" /></a>
<a href="https://github.com/Codewith-Yogita"><img src="https://github.com/Codewith-Yogita.png" width="50px" alt="Codewith-Yogita" /></a>
<a href="https://github.com/D4rk-Pho3nix"><img src="https://github.com/D4rk-Pho3nix.png" width="50px" alt="D4rk-Pho3nix" /></a>
<a href="https://github.com/DAYHARIKA"><img src="https://github.com/DAYHARIKA.png" width="50px" alt="DAYHARIKA" /></a>
<a href="https://github.com/Deepakvarna02"><img src="https://github.com/Deepakvarna02.png" width="50px" alt="Deepakvarna02" /></a>
<a href="https://github.com/Dhruvil135"><img src="https://github.com/Dhruvil135.png" width="50px" alt="Dhruvil135" /></a>
<a href="https://github.com/Dhruvil20060"><img src="https://github.com/Dhruvil20060.png" width="50px" alt="Dhruvil20060" /></a>
<a href="https://github.com/Dj-Shortcut"><img src="https://github.com/Dj-Shortcut.png" width="50px" alt="Dj-Shortcut" /></a>
<a href="https://github.com/G-Ganesh83"><img src="https://github.com/G-Ganesh83.png" width="50px" alt="G-Ganesh83" /></a>
<a href="https://github.com/HarshaVardhan31012007"><img src="https://github.com/HarshaVardhan31012007.png" width="50px" alt="HarshaVardhan31012007" /></a>
<a href="https://github.com/Harshith1702"><img src="https://github.com/Harshith1702.png" width="50px" alt="Harshith1702" /></a>
<a href="https://github.com/Harxhit"><img src="https://github.com/Harxhit.png" width="50px" alt="Harxhit" /></a>
<a href="https://github.com/IshitaSingh0822"><img src="https://github.com/IshitaSingh0822.png" width="50px" alt="IshitaSingh0822" /></a>
<a href="https://github.com/Itheshjs"><img src="https://github.com/Itheshjs.png" width="50px" alt="Itheshjs" /></a>
<a href="https://github.com/Itzzavdheshh"><img src="https://github.com/Itzzavdheshh.png" width="50px" alt="Itzzavdheshh" /></a>
<a href="https://github.com/Jagriti-yadav"><img src="https://github.com/Jagriti-yadav.png" width="50px" alt="Jagriti-yadav" /></a>
<a href="https://github.com/Jay-Jay-Tee"><img src="https://github.com/Jay-Jay-Tee.png" width="50px" alt="Jay-Jay-Tee" /></a>
<a href="https://github.com/Konarksharma13"><img src="https://github.com/Konarksharma13.png" width="50px" alt="Konarksharma13" /></a>
<a href="https://github.com/Kuldeeps1505"><img src="https://github.com/Kuldeeps1505.png" width="50px" alt="Kuldeeps1505" /></a>
<a href="https://github.com/KumarNirupam1"><img src="https://github.com/KumarNirupam1.png" width="50px" alt="KumarNirupam1" /></a>
<a href="https://github.com/Lathika11"><img src="https://github.com/Lathika11.png" width="50px" alt="Lathika11" /></a>
<a href="https://github.com/Manasa-2303"><img src="https://github.com/Manasa-2303.png" width="50px" alt="Manasa-2303" /></a>
<a href="https://github.com/Manav5234"><img src="https://github.com/Manav5234.png" width="50px" alt="Manav5234" /></a>
<a href="https://github.com/MehtabSandhu11"><img src="https://github.com/MehtabSandhu11.png" width="50px" alt="MehtabSandhu11" /></a>
<a href="https://github.com/Namish06"><img src="https://github.com/Namish06.png" width="50px" alt="Namish06" /></a>
<a href="https://github.com/NayansiDupare"><img src="https://github.com/NayansiDupare.png" width="50px" alt="NayansiDupare" /></a>
<a href="https://github.com/Nightkilller"><img src="https://github.com/Nightkilller.png" width="50px" alt="Nightkilller" /></a>
<a href="https://github.com/Nilamma19"><img src="https://github.com/Nilamma19.png" width="50px" alt="Nilamma19" /></a>
<a href="https://github.com/Nirula23"><img src="https://github.com/Nirula23.png" width="50px" alt="Nirula23" /></a>
<a href="https://github.com/OmkarAKadam"><img src="https://github.com/OmkarAKadam.png" width="50px" alt="OmkarAKadam" /></a>
<a href="https://github.com/Pallavi-vi-1234"><img src="https://github.com/Pallavi-vi-1234.png" width="50px" alt="Pallavi-vi-1234" /></a>
<a href="https://github.com/Pranathi-Kunjeti"><img src="https://github.com/Pranathi-Kunjeti.png" width="50px" alt="Pranathi-Kunjeti" /></a>
<a href="https://github.com/Pranav-IIITM"><img src="https://github.com/Pranav-IIITM.png" width="50px" alt="Pranav-IIITM" /></a>
<a href="https://github.com/PrincePundir123"><img src="https://github.com/PrincePundir123.png" width="50px" alt="PrincePundir123" /></a>
<a href="https://github.com/PriyaanshPandey"><img src="https://github.com/PriyaanshPandey.png" width="50px" alt="PriyaanshPandey" /></a>
<a href="https://github.com/Purohit-Yogeshraj"><img src="https://github.com/Purohit-Yogeshraj.png" width="50px" alt="Purohit-Yogeshraj" /></a>
<a href="https://github.com/Rachit-Kakkad1"><img src="https://github.com/Rachit-Kakkad1.png" width="50px" alt="Rachit-Kakkad1" /></a>
<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="50px" alt="S3DFX-CYBER" /></a>
<a href="https://github.com/SHUBHAM2775"><img src="https://github.com/SHUBHAM2775.png" width="50px" alt="SHUBHAM2775" /></a>
<a href="https://github.com/Sarvesh-Sarz"><img src="https://github.com/Sarvesh-Sarz.png" width="50px" alt="Sarvesh-Sarz" /></a>
<a href="https://github.com/Sha-lini3"><img src="https://github.com/Sha-lini3.png" width="50px" alt="Sha-lini3" /></a>
<a href="https://github.com/ShailiBoddula"><img src="https://github.com/ShailiBoddula.png" width="50px" alt="ShailiBoddula" /></a>
<a href="https://github.com/Shan7Usmani"><img src="https://github.com/Shan7Usmani.png" width="50px" alt="Shan7Usmani" /></a>
<a href="https://github.com/Shivansh181003"><img src="https://github.com/Shivansh181003.png" width="50px" alt="Shivansh181003" /></a>
<a href="https://github.com/Soquixx"><img src="https://github.com/Soquixx.png" width="50px" alt="Soquixx" /></a>
<a href="https://github.com/Taru-Sharma0503"><img src="https://github.com/Taru-Sharma0503.png" width="50px" alt="Taru-Sharma0503" /></a>
<a href="https://github.com/TarunyaProgrammer"><img src="https://github.com/TarunyaProgrammer.png" width="50px" alt="TarunyaProgrammer" /></a>
<a href="https://github.com/ThePrabhu"><img src="https://github.com/ThePrabhu.png" width="50px" alt="ThePrabhu" /></a>
<a href="https://github.com/Trrr10"><img src="https://github.com/Trrr10.png" width="50px" alt="Trrr10" /></a>
<a href="https://github.com/UjsGit"><img src="https://github.com/UjsGit.png" width="50px" alt="UjsGit" /></a>
<a href="https://github.com/VaibhavMP"><img src="https://github.com/VaibhavMP.png" width="50px" alt="VaibhavMP" /></a>
<a href="https://github.com/Vedhant26"><img src="https://github.com/Vedhant26.png" width="50px" alt="Vedhant26" /></a>
<a href="https://github.com/Vishee02"><img src="https://github.com/Vishee02.png" width="50px" alt="Vishee02" /></a>
<a href="https://github.com/Vrinda-28"><img src="https://github.com/Vrinda-28.png" width="50px" alt="Vrinda-28" /></a>
<a href="https://github.com/YLaxmikanth"><img src="https://github.com/YLaxmikanth.png" width="50px" alt="YLaxmikanth" /></a>
<a href="https://github.com/Yashvijain1234"><img src="https://github.com/Yashvijain1234.png" width="50px" alt="Yashvijain1234" /></a>
<a href="https://github.com/a638011"><img src="https://github.com/a638011.png" width="50px" alt="a638011" /></a>
<a href="https://github.com/aasthakhatri11"><img src="https://github.com/aasthakhatri11.png" width="50px" alt="aasthakhatri11" /></a>
<a href="https://github.com/abdussamad567"><img src="https://github.com/abdussamad567.png" width="50px" alt="abdussamad567" /></a>
<a href="https://github.com/ajitkumarsaini02"><img src="https://github.com/ajitkumarsaini02.png" width="50px" alt="ajitkumarsaini02" /></a>
<a href="https://github.com/amrita-a-menon"><img src="https://github.com/amrita-a-menon.png" width="50px" alt="amrita-a-menon" /></a>
<a href="https://github.com/angelina-2206"><img src="https://github.com/angelina-2206.png" width="50px" alt="angelina-2206" /></a>
<a href="https://github.com/anirudh645"><img src="https://github.com/anirudh645.png" width="50px" alt="anirudh645" /></a>
<a href="https://github.com/anshul23102"><img src="https://github.com/anshul23102.png" width="50px" alt="anshul23102" /></a>
<a href="https://github.com/anushka146"><img src="https://github.com/anushka146.png" width="50px" alt="anushka146" /></a>
<a href="https://github.com/arghya29"><img src="https://github.com/arghya29.png" width="50px" alt="arghya29" /></a>
<a href="https://github.com/arpit2006"><img src="https://github.com/arpit2006.png" width="50px" alt="arpit2006" /></a>
<a href="https://github.com/arushiranjan"><img src="https://github.com/arushiranjan.png" width="50px" alt="arushiranjan" /></a>
<a href="https://github.com/ash1shkumar"><img src="https://github.com/ash1shkumar.png" width="50px" alt="ash1shkumar" /></a>
<a href="https://github.com/basantnema31"><img src="https://github.com/basantnema31.png" width="50px" alt="basantnema31" /></a>
<a href="https://github.com/bhaktiyadav08"><img src="https://github.com/bhaktiyadav08.png" width="50px" alt="bhaktiyadav08" /></a>
<a href="https://github.com/bhavyanjain3004"><img src="https://github.com/bhavyanjain3004.png" width="50px" alt="bhavyanjain3004" /></a>
<a href="https://github.com/bipinchaudhary28899"><img src="https://github.com/bipinchaudhary28899.png" width="50px" alt="bipinchaudhary28899" /></a>
<a href="https://github.com/charu2210"><img src="https://github.com/charu2210.png" width="50px" alt="charu2210" /></a>
<a href="https://github.com/chavanGaneshDatta"><img src="https://github.com/chavanGaneshDatta.png" width="50px" alt="chavanGaneshDatta" /></a>
<a href="https://github.com/ckprojects77"><img src="https://github.com/ckprojects77.png" width="50px" alt="ckprojects77" /></a>
<a href="https://github.com/deekshithayadav-16"><img src="https://github.com/deekshithayadav-16.png" width="50px" alt="deekshithayadav-16" /></a>
<a href="https://github.com/deepak0x"><img src="https://github.com/deepak0x.png" width="50px" alt="deepak0x" /></a>
<a href="https://github.com/diksha78dev"><img src="https://github.com/diksha78dev.png" width="50px" alt="diksha78dev" /></a>
<a href="https://github.com/dishamaurya081-create"><img src="https://github.com/dishamaurya081-create.png" width="50px" alt="dishamaurya081-create" /></a>
<a href="https://github.com/garimatiwari1912-alt"><img src="https://github.com/garimatiwari1912-alt.png" width="50px" alt="garimatiwari1912-alt" /></a>
<a href="https://github.com/gauriii10"><img src="https://github.com/gauriii10.png" width="50px" alt="gauriii10" /></a>
<a href="https://github.com/gloooomed"><img src="https://github.com/gloooomed.png" width="50px" alt="gloooomed" /></a>
<a href="https://github.com/imayuss"><img src="https://github.com/imayuss.png" width="50px" alt="imayuss" /></a>
<a href="https://github.com/janhaviborade05"><img src="https://github.com/janhaviborade05.png" width="50px" alt="janhaviborade05" /></a>
<a href="https://github.com/jatinrwt01"><img src="https://github.com/jatinrwt01.png" width="50px" alt="jatinrwt01" /></a>
<a href="https://github.com/kabirumarkhan-stack"><img src="https://github.com/kabirumarkhan-stack.png" width="50px" alt="kabirumarkhan-stack" /></a>
<a href="https://github.com/kejriwalkaushal04"><img src="https://github.com/kejriwalkaushal04.png" width="50px" alt="kejriwalkaushal04" /></a>
<a href="https://github.com/kiranShamsHere"><img src="https://github.com/kiranShamsHere.png" width="50px" alt="kiranShamsHere" /></a>
<a href="https://github.com/maanyadanayak"><img src="https://github.com/maanyadanayak.png" width="50px" alt="maanyadanayak" /></a>
<a href="https://github.com/maitrak18"><img src="https://github.com/maitrak18.png" width="50px" alt="maitrak18" /></a>
<a href="https://github.com/mdudhe2007"><img src="https://github.com/mdudhe2007.png" width="50px" alt="mdudhe2007" /></a>
<a href="https://github.com/meghna-cs"><img src="https://github.com/meghna-cs.png" width="50px" alt="meghna-cs" /></a>
<a href="https://github.com/mohanteja781112"><img src="https://github.com/mohanteja781112.png" width="50px" alt="mohanteja781112" /></a>
<a href="https://github.com/mramansayyad"><img src="https://github.com/mramansayyad.png" width="50px" alt="mramansayyad" /></a>
<a href="https://github.com/mudit-codez"><img src="https://github.com/mudit-codez.png" width="50px" alt="mudit-codez" /></a>
<a href="https://github.com/neeraj477"><img src="https://github.com/neeraj477.png" width="50px" alt="neeraj477" /></a>
<a href="https://github.com/nimkarprachi17"><img src="https://github.com/nimkarprachi17.png" width="50px" alt="nimkarprachi17" /></a>
<a href="https://github.com/nitinog10"><img src="https://github.com/nitinog10.png" width="50px" alt="nitinog10" /></a>
<a href="https://github.com/omkartike"><img src="https://github.com/omkartike.png" width="50px" alt="omkartike" /></a>
<a href="https://github.com/opinder8699"><img src="https://github.com/opinder8699.png" width="50px" alt="opinder8699" /></a>
<a href="https://github.com/palak-paliwal11"><img src="https://github.com/palak-paliwal11.png" width="50px" alt="palak-paliwal11" /></a>
<a href="https://github.com/parneetbrar234-svg"><img src="https://github.com/parneetbrar234-svg.png" width="50px" alt="parneetbrar234-svg" /></a>
<a href="https://github.com/poorvasingh1610"><img src="https://github.com/poorvasingh1610.png" width="50px" alt="poorvasingh1610" /></a>
<a href="https://github.com/pranav-pachn"><img src="https://github.com/pranav-pachn.png" width="50px" alt="pranav-pachn" /></a>
<a href="https://github.com/prisha-sh"><img src="https://github.com/prisha-sh.png" width="50px" alt="prisha-sh" /></a>
<a href="https://github.com/rajdeep-yadav"><img src="https://github.com/rajdeep-yadav.png" width="50px" alt="rajdeep-yadav" /></a>
<a href="https://github.com/riddhima25bet10005-a11y"><img src="https://github.com/riddhima25bet10005-a11y.png" width="50px" alt="riddhima25bet10005-a11y" /></a>
<a href="https://github.com/riddhimagupta2"><img src="https://github.com/riddhimagupta2.png" width="50px" alt="riddhimagupta2" /></a>
<a href="https://github.com/riyanshigupta890-cloud"><img src="https://github.com/riyanshigupta890-cloud.png" width="50px" alt="riyanshigupta890-cloud" /></a>
<a href="https://github.com/rudra1337-dev"><img src="https://github.com/rudra1337-dev.png" width="50px" alt="rudra1337-dev" /></a>
<a href="https://github.com/saiprasad578"><img src="https://github.com/saiprasad578.png" width="50px" alt="saiprasad578" /></a>
<a href="https://github.com/saumyasargam"><img src="https://github.com/saumyasargam.png" width="50px" alt="saumyasargam" /></a>
<a href="https://github.com/shivam-kakkar"><img src="https://github.com/shivam-kakkar.png" width="50px" alt="shivam-kakkar" /></a>
<a href="https://github.com/shravanithouta108"><img src="https://github.com/shravanithouta108.png" width="50px" alt="shravanithouta108" /></a>
<a href="https://github.com/shreyjoshi73"><img src="https://github.com/shreyjoshi73.png" width="50px" alt="shreyjoshi73" /></a>
<a href="https://github.com/shrutisd739"><img src="https://github.com/shrutisd739.png" width="50px" alt="shrutisd739" /></a>
<a href="https://github.com/shrutssss"><img src="https://github.com/shrutssss.png" width="50px" alt="shrutssss" /></a>
<a href="https://github.com/srishav3"><img src="https://github.com/srishav3.png" width="50px" alt="srishav3" /></a>
<a href="https://github.com/syedrazamd"><img src="https://github.com/syedrazamd.png" width="50px" alt="syedrazamd" /></a>
<a href="https://github.com/v4rshh"><img src="https://github.com/v4rshh.png" width="50px" alt="v4rshh" /></a>
<a href="https://github.com/vaibhavi-vaishnav"><img src="https://github.com/vaibhavi-vaishnav.png" width="50px" alt="vaibhavi-vaishnav" /></a>
<a href="https://github.com/yuvraj-k-singh"><img src="https://github.com/yuvraj-k-singh.png" width="50px" alt="yuvraj-k-singh" /></a>
<!-- CONTRIBUTORS_END -->

---

## Star History

<a href="https://www.star-history.com/?repos=S3DFX-CYBER%2FGSoC-Org-Finder-&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=S3DFX-CYBER/GSoC-Org-Finder-&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=S3DFX-CYBER/GSoC-Org-Finder-&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=S3DFX-CYBER/GSoC-Org-Finder-&type=date&legend=top-left" />
 </picture>
</a>

---

## 📄 License

Apache 2.0 — made for GSoC beginners, by people who've been there.
Share it with anyone applying! Applications open **March 16, 2026**. 🙌
<center>
  
![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

</center>
