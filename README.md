# 🚀 GSoC 2026 Org Finder

> **Find your perfect Google Summer of Code 2026 organization — filtered by tech stack, domain, competition level, and live GitHub activity.**
<img width="1896" height="800" alt="image" src="https://github.com/user-attachments/assets/414e4b55-ec50-4290-97a6-678f23e7c96e" />

**Live site → [https://findmygsoc.vercel.app/](https://findmygsoc.vercel.app/)**

Join our Channel for community-related questions and feedback
**Discord → [https://discord.gg/mgWV3xSV7](https://discord.gg/mgWV3xSV7)**

---

## ✨ What is this?

A fast, beautiful, single-page tool that helps GSoC 2026 applicants cut through all **184 selected organizations** and instantly find the ones that match *their* skills and interests.

No sign-up. No install. No build step. Just open and explore.

---

## 📖 Table of Contents
- [What is this?](#-what-is-this)
- [Features](#-features)
- [Flowchart](#-flowchart)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [URL Validation](#-url-validation)
- [Deploy Your Own](#-deploy-your-own)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Project Admin](#-project-admin)
- [GSSoC Mentors](#-gssoc-mentors)
- [Key Dates](#-gsoc-2026-key-dates)
- [Tips for Users](#-tips-for-users)
- [License](#-license)

---

## 📈 Flowchart

<img width="8192" height="1328" alt="User Action Flow for Org-2026-05-05-154517" src="https://github.com/user-attachments/assets/a56902d0-e172-42e9-b0d5-8a8ee2c7d156" />

---

## 🎯 Features

### Features at a glance

| Feature | Details |
|---------|---------|
| 🔍 Search | Full-text across 184 orgs |
| 🏷️ Filters | 15+ domains, 30+ languages |
| ⚖️ Compare | Up to 3 organizations side-by-side |
| 🟢 Good Issues | Browse beginner-friendly issues |
| ⌨️ Keyboard Nav | Full accessibility support |
| 🌙 Dark Mode | Fully themed |
| 📱 Responsive | Mobile to desktop |

### 🔍 Discovery & Filtering
- 🔎 **Full-text search** by org name, technology, or topic
- 🏷️ **Domain filter** — Science, Web, Security, AI, OS, Media, Infrastructure, and more
- 💻 **Language filter** — Python, Rust, Go, C++, Java, JavaScript, Haskell, Julia, and more
- 🎯 **Multi-select language pills** — stack multiple languages for combined matching
- ⚡ **Quick chips** — one-tap filters for Veterans only, Newcomers, High/Low competition, Actively Maintained
- 📊 **Sort by** — Alphabetical, Most Experienced, Newcomers First, Least Competitive, Most Stars, Good First Issues

### 📊 Live GitHub Data
- 🌟 **Live GitHub stats** — Stars , Forks , Open Issues , Last Commit  — fetched via a serverless proxy 
- 🟢 **Good First Issues count** — shown on every card and sortable, perfect for finding beginner-friendly orgs 
- 🎖️ **Activity badge** — Active  / Moderate  / Low  based on last commit date
- 🔗 **Smart repo links** — single-project orgs link directly to their repo ; umbrella orgs (Apache, OWASP, KDE…) link to their GitHub org page 

### 📋 Organization Detail Modal
- 📖 Full description, tech stack tags,  "Best Fit For" profiles
- 📅 GSoC participation timeline (every year the org has participated)
- 📈 Key metrics: years in GSoC, competition level, first year, Good First Issues count
- 💡 **Project Ideas Link** — direct link to organization's ideas page (with security-hardened 🔒 URL validation)
- ⚠️ Fallback message when no ideas link is available
- ➕ One-click add to comparison

### ⚖️ Comparison Mode
- 🏆 Select up to **3 organizations** side-by-side
- 📊 Compares: category, GSoC years, competition, stars, forks, open issues, last commit, 🟢 Good First Issues, languages
- 🟢 Green/🔴 red highlighting for best and worst values across each metric

### 🟢 Good First Issues Page
- 📄 Dedicated full-screen page listing **Good First Issues from all 184 orgs** 
- ⚡ Fetched live via the GitHub API proxy (uses your token , respects rate limits )
- 🔎 Filter by category , language , or free-text search 
- 🔗 Each issue links directly to GitHub — sorted newest first 
- 🖼️ Shows org logo, issue title, labels , comment count , and relative date 

### ⏱ Deadline Countdown
- ⏰ Live countdown banner to application open date (March 16, 2026)
- 🔄 Automatically switches to "Applications Closing In" during the open window (Mar 16 – Apr 8)

### 🔥 Trending Section
- 📈 Shows the most-viewed organizations based on your own browsing history 👀
- 💾 Powered by localStorage analytics — zero data sent to any server (100% private)

### ⌨️ Keyboard Navigation
- `↑ ↓ ← →` — move focus between cards
- `Enter` — open focused card's modal
- `C` — toggle compare for focused card
- `Esc` — close any open panel

### 📊 Usage Analytics Panel
- Tracks your own session: visits, searches, org views, filters used, session time
- Top categories browsed, most-viewed orgs, popular search terms
- All stored locally in your browser — nothing leaves your device

### 🌙 Dark / Light Mode
- Fully themed dark mode with warm ink/cream palette
- Preference persisted across sessions

### 📱 Fully Responsive
- Works on mobile, tablet, and desktop
- Three breakpoints: 900px (tablet), 640px (phone), 380px (small phone)
- Stats bar scrolls horizontally on mobile instead of stacking

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
## We are officially a Project for Nexus Spring of Code 2026 and GirlScript Summer of Code 2026
<img width="400" height="300" alt="Gemini_Generated_Image_1eyond1eyond1eyo" src="https://github.com/user-attachments/assets/0cfe15fe-2d4a-4389-9a0b-8cf8d0cfd8cd" />



## 🔑 Project Admin

<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="80px" alt="S3DFX-CYBER" /></a>

**[@S3DFX-CYBER](https://github.com/S3DFX-CYBER)** — Project Admin (PA) for GSSoC'26 and NSoC'26. Responsible for final merge decisions, mentor coordination, repository maintenance, and ensuring contribution quality across all programs.

---

## 👥 GSSoC Mentors

These mentors help guide and review contributions for the GSSoC program:

<!-- GSSOC_MENTORS_START -->
<a href="https://github.com/srinadhtadikonda"><img src="https://github.com/srinadhtadikonda.png" width="50px" alt="srinadhtadikonda" /></a>
<a href="https://github.com/ritika"><img src="https://github.com/ritika.png" width="50px" alt="ritika" /></a>
<a href="https://github.com/CoderOggy78"><img src="https://github.com/CoderOggy78.png" width="50px" alt="CoderOggy78" /></a>
<a href="https://github.com/techRunnerBySJ"><img src="https://github.com/techRunnerBySJ.png" width="50px" alt="techRunnerBySJ" /></a>
<a href="https://github.com/thakurutkarsh22"><img src="https://github.com/thakurutkarsh22.png" width="50px" alt="thakurutkarsh22" /></a>
<a href="https://github.com/aanjalii01"><img src="https://github.com/aanjalii01.png" width="50px" alt="aanjalii01" /></a>
<a href="https://github.com/SyedImtiyaz-1"><img src="https://github.com/SyedImtiyaz-1.png" width="50px" alt="SyedImtiyaz-1" /></a>
<a href="https://github.com/neilblaze"><img src="https://github.com/neilblaze.png" width="50px" alt="neilblaze" /></a>
<a href="https://github.com/abhishekraoas"><img src="https://github.com/abhishekraoas.png" width="50px" alt="abhishekraoas" /></a>
<a href="https://github.com/lovestaco"><img src="https://github.com/lovestaco.png" width="50px" alt="lovestaco" /></a>
<a href="https://github.com/Anushreebasics"><img src="https://github.com/Anushreebasics.png" width="50px" alt="Anushreebasics" /></a>
<a href="https://github.com/12fahed"><img src="https://github.com/12fahed.png" width="50px" alt="12fahed" /></a>
<a href="https://github.com/sabeenaviklar"><img src="https://github.com/sabeenaviklar.png" width="50px" alt="sabeenaviklar" /></a>
<a href="https://github.com/ayu-yishu13"><img src="https://github.com/ayu-yishu13.png" width="50px" alt="ayu-yishu13" /></a>
<a href="https://github.com/Precise-Goals"><img src="https://github.com/Precise-Goals.png" width="50px" alt="Precise-Goals" /></a>
<a href="https://github.com/morningstarxcdcode"><img src="https://github.com/morningstarxcdcode.png" width="50px" alt="morningstarxcdcode" /></a>
<a href="https://github.com/Haile-12"><img src="https://github.com/Haile-12.png" width="50px" alt="Haile-12" /></a>
<a href="https://github.com/BandhiyaHardik"><img src="https://github.com/BandhiyaHardik.png" width="50px" alt="BandhiyaHardik" /></a>
<a href="https://github.com/deepak0x"><img src="https://github.com/deepak0x.png" width="50px" alt="deepak0x" /></a>
<a href="https://github.com/knoxiboy"><img src="https://github.com/knoxiboy.png" width="50px" alt="knoxiboy" /></a>
<a href="https://github.com/saurabh24thakur"><img src="https://github.com/saurabh24thakur.png" width="50px" alt="saurabh24thakur" /></a>
<a href="https://github.com/1754riya"><img src="https://github.com/1754riya.png" width="50px" alt="1754riya" /></a>
<a href="https://github.com/magic-peach"><img src="https://github.com/magic-peach.png" width="50px" alt="magic-peach" /></a>
<a href="https://github.com/lourduradjou"><img src="https://github.com/lourduradjou.png" width="50px" alt="lourduradjou" /></a>
<a href="https://github.com/m4milaad"><img src="https://github.com/m4milaad.png" width="50px" alt="m4milaad" /></a>
<a href="https://github.com/kunalverma2512"><img src="https://github.com/kunalverma2512.png" width="50px" alt="kunalverma2512" /></a>
<a href="https://github.com/anubhavxdev"><img src="https://github.com/anubhavxdev.png" width="50px" alt="anubhavxdev" /></a>
<a href="https://github.com/stealthwhizz"><img src="https://github.com/stealthwhizz.png" width="50px" alt="stealthwhizz" /></a>
<a href="https://github.com/DevROHIT11"><img src="https://github.com/DevROHIT11.png" width="50px" alt="DevROHIT11" /></a>
<a href="https://github.com/leonagoel"><img src="https://github.com/leonagoel.png" width="50px" alt="leonagoel" /></a>
<a href="https://github.com/SaifRasool92"><img src="https://github.com/SaifRasool92.png" width="50px" alt="SaifRasool92" /></a>
<a href="https://github.com/aryanbhutani26"><img src="https://github.com/aryanbhutani26.png" width="50px" alt="aryanbhutani26" /></a>
<a href="https://github.com/AnirbansarkarS"><img src="https://github.com/AnirbansarkarS.png" width="50px" alt="AnirbansarkarS" /></a>
<a href="https://github.com/Sagar-Datkhile"><img src="https://github.com/Sagar-Datkhile.png" width="50px" alt="Sagar-Datkhile" /></a>
<a href="https://github.com/MUKUL-PRASAD-SIGH"><img src="https://github.com/MUKUL-PRASAD-SIGH.png" width="50px" alt="MUKUL-PRASAD-SIGH" /></a>
<a href="https://github.com/TarunyaProgrammer"><img src="https://github.com/TarunyaProgrammer.png" width="50px" alt="TarunyaProgrammer" /></a>
<a href="https://github.com/preetbiswas12"><img src="https://github.com/preetbiswas12.png" width="50px" alt="preetbiswas12" /></a>
<a href="https://github.com/Shravanthi20"><img src="https://github.com/Shravanthi20.png" width="50px" alt="Shravanthi20" /></a>
<a href="https://github.com/Balaji91221"><img src="https://github.com/Balaji91221.png" width="50px" alt="Balaji91221" /></a>
<a href="https://github.com/whyankush07"><img src="https://github.com/whyankush07.png" width="50px" alt="whyankush07" /></a>
<a href="https://github.com/vanshaggarwal07"><img src="https://github.com/vanshaggarwal07.png" width="50px" alt="vanshaggarwal07" /></a>
<a href="https://github.com/OmkarKathile007"><img src="https://github.com/OmkarKathile007.png" width="50px" alt="OmkarKathile007" /></a>
<a href="https://github.com/kallal79"><img src="https://github.com/kallal79.png" width="50px" alt="kallal79" /></a>
<a href="https://github.com/MAYANKSHARMA01010"><img src="https://github.com/MAYANKSHARMA01010.png" width="50px" alt="MAYANKSHARMA01010" /></a>
<a href="https://github.com/swastik7805"><img src="https://github.com/swastik7805.png" width="50px" alt="swastik7805" /></a>
<a href="https://github.com/KUMARNiru007"><img src="https://github.com/KUMARNiru007.png" width="50px" alt="KUMARNiru007" /></a>
<a href="https://github.com/rounakkraaj-1744"><img src="https://github.com/rounakkraaj-1744.png" width="50px" alt="rounakkraaj-1744" /></a>
<a href="https://github.com/himanshu007-creator"><img src="https://github.com/himanshu007-creator.png" width="50px" alt="himanshu007-creator" /></a>
<a href="https://github.com/oasis-parzival"><img src="https://github.com/oasis-parzival.png" width="50px" alt="oasis-parzival" /></a>
<a href="https://github.com/Maxd646"><img src="https://github.com/Maxd646.png" width="50px" alt="Maxd646" /></a>
<a href="https://github.com/deepaksinghh12"><img src="https://github.com/deepaksinghh12.png" width="50px" alt="deepaksinghh12" /></a>
<a href="https://github.com/manan-chawla"><img src="https://github.com/manan-chawla.png" width="50px" alt="manan-chawla" /></a>
<a href="https://github.com/nishantxscooby"><img src="https://github.com/nishantxscooby.png" width="50px" alt="nishantxscooby" /></a>
<a href="https://github.com/uddalak2005"><img src="https://github.com/uddalak2005.png" width="50px" alt="uddalak2005" /></a>
<a href="https://github.com/iarmaanx"><img src="https://github.com/iarmaanx.png" width="50px" alt="iarmaanx" /></a>
<a href="https://github.com/kota-jagadeesh"><img src="https://github.com/kota-jagadeesh.png" width="50px" alt="kota-jagadeesh" /></a>
<a href="https://github.com/AnirudhPhophalia"><img src="https://github.com/AnirudhPhophalia.png" width="50px" alt="AnirudhPhophalia" /></a>
<a href="https://github.com/IkkiOcean"><img src="https://github.com/IkkiOcean.png" width="50px" alt="IkkiOcean" /></a>
<a href="https://github.com/Eswaramuthu"><img src="https://github.com/Eswaramuthu.png" width="50px" alt="Eswaramuthu" /></a>
<a href="https://github.com/SparshM8"><img src="https://github.com/SparshM8.png" width="50px" alt="SparshM8" /></a>
<a href="https://github.com/KaranGupta2005"><img src="https://github.com/KaranGupta2005.png" width="50px" alt="KaranGupta2005" /></a>
<a href="https://github.com/sparshagarwal0411"><img src="https://github.com/sparshagarwal0411.png" width="50px" alt="sparshagarwal0411" /></a>
<a href="https://github.com/subratamondalnsec"><img src="https://github.com/subratamondalnsec.png" width="50px" alt="subratamondalnsec" /></a>
<a href="https://github.com/the-matrixneo"><img src="https://github.com/the-matrixneo.png" width="50px" alt="the-matrixneo" /></a>
<a href="https://github.com/suvanwita"><img src="https://github.com/suvanwita.png" width="50px" alt="suvanwita" /></a>
<a href="https://github.com/Harsh-2006-git"><img src="https://github.com/Harsh-2006-git.png" width="50px" alt="Harsh-2006-git" /></a>
<a href="https://github.com/nihalawasthi"><img src="https://github.com/nihalawasthi.png" width="50px" alt="nihalawasthi" /></a>
<a href="https://github.com/adithyan-css"><img src="https://github.com/adithyan-css.png" width="50px" alt="adithyan-css" /></a>
<a href="https://github.com/xthxr"><img src="https://github.com/xthxr.png" width="50px" alt="xthxr" /></a>
<a href="https://github.com/Devnil434"><img src="https://github.com/Devnil434.png" width="50px" alt="Devnil434" /></a>
<a href="https://github.com/aayushi1806sharma-afk"><img src="https://github.com/aayushi1806sharma-afk.png" width="50px" alt="aayushi1806sharma-afk" /></a>
<a href="https://github.com/AditthyaSS"><img src="https://github.com/AditthyaSS.png" width="50px" alt="AditthyaSS" /></a>
<a href="https://github.com/Satya900"><img src="https://github.com/Satya900.png" width="50px" alt="Satya900" /></a>
<a href="https://github.com/JoeCelaster"><img src="https://github.com/JoeCelaster.png" width="50px" alt="JoeCelaster" /></a>
<a href="https://github.com/AshutoshRaj1260"><img src="https://github.com/AshutoshRaj1260.png" width="50px" alt="AshutoshRaj1260" /></a>
<a href="https://github.com/topshe23"><img src="https://github.com/topshe23.png" width="50px" alt="topshe23" /></a>
<a href="https://github.com/Ayushh-Sharmaa"><img src="https://github.com/Ayushh-Sharmaa.png" width="50px" alt="Ayushh-Sharmaa" /></a>
<a href="https://github.com/piyushdotcomm"><img src="https://github.com/piyushdotcomm.png" width="50px" alt="piyushdotcomm" /></a>
<a href="https://github.com/coder-zs-cse"><img src="https://github.com/coder-zs-cse.png" width="50px" alt="coder-zs-cse" /></a>
<a href="https://github.com/bishal2623"><img src="https://github.com/bishal2623.png" width="50px" alt="bishal2623" /></a>
<a href="https://github.com/Ayush-Patel-56"><img src="https://github.com/Ayush-Patel-56.png" width="50px" alt="Ayush-Patel-56" /></a>
<a href="https://github.com/Mohit-368"><img src="https://github.com/Mohit-368.png" width="50px" alt="Mohit-368" /></a>
<a href="https://github.com/diksha78dev"><img src="https://github.com/diksha78dev.png" width="50px" alt="diksha78dev" /></a>
<a href="https://github.com/Mrigakshi-Rathore"><img src="https://github.com/Mrigakshi-Rathore.png" width="50px" alt="Mrigakshi-Rathore" /></a>
<a href="https://github.com/itsdakshjain"><img src="https://github.com/itsdakshjain.png" width="50px" alt="itsdakshjain" /></a>
<!-- GSSOC_MENTORS_END -->

## We thank all our Contributors for improving this project

## 💡 Tips for Users

1. **New to GSoC?** Start with "Newcomers First" filter + sort by Good First Issues
2. **Experienced?** Check "Veterans" filter + sort by Competition for challenges
3. **Building a comparison?** Use keyboard shortcut `C` to quickly add orgs
4. **Mobile browsing?** Try portrait mode — everything scrolls smoothly
   
## ✨ Contributors
<!-- CONTRIBUTORS_START -->
<a href="https://github.com/Aditya-debugs141"><img src="https://github.com/Aditya-debugs141.png" width="50px" alt="Aditya-debugs141" /></a>
<a href="https://github.com/Aditya8369"><img src="https://github.com/Aditya8369.png" width="50px" alt="Aditya8369" /></a>
<a href="https://github.com/Akshayaqueen"><img src="https://github.com/Akshayaqueen.png" width="50px" alt="Akshayaqueen" /></a>
<a href="https://github.com/Ashish241"><img src="https://github.com/Ashish241.png" width="50px" alt="Ashish241" /></a>
<a href="https://github.com/Ashusf90"><img src="https://github.com/Ashusf90.png" width="50px" alt="Ashusf90" /></a>
<a href="https://github.com/Bushra-gh"><img src="https://github.com/Bushra-gh.png" width="50px" alt="Bushra-gh" /></a>
<a href="https://github.com/Chizaram-Igolo"><img src="https://github.com/Chizaram-Igolo.png" width="50px" alt="Chizaram-Igolo" /></a>
<a href="https://github.com/DAYHARIKA"><img src="https://github.com/DAYHARIKA.png" width="50px" alt="DAYHARIKA" /></a>
<a href="https://github.com/Dj-Shortcut"><img src="https://github.com/Dj-Shortcut.png" width="50px" alt="Dj-Shortcut" /></a>
<a href="https://github.com/HarshaVardhan31012007"><img src="https://github.com/HarshaVardhan31012007.png" width="50px" alt="HarshaVardhan31012007" /></a>
<a href="https://github.com/Harshith1702"><img src="https://github.com/Harshith1702.png" width="50px" alt="Harshith1702" /></a>
<a href="https://github.com/IshitaSingh0822"><img src="https://github.com/IshitaSingh0822.png" width="50px" alt="IshitaSingh0822" /></a>
<a href="https://github.com/Itheshjs"><img src="https://github.com/Itheshjs.png" width="50px" alt="Itheshjs" /></a>
<a href="https://github.com/Itzzavdheshh"><img src="https://github.com/Itzzavdheshh.png" width="50px" alt="Itzzavdheshh" /></a>
<a href="https://github.com/Kuldeeps1505"><img src="https://github.com/Kuldeeps1505.png" width="50px" alt="Kuldeeps1505" /></a>
<a href="https://github.com/Manasa-2303"><img src="https://github.com/Manasa-2303.png" width="50px" alt="Manasa-2303" /></a>
<a href="https://github.com/OmkarAKadam"><img src="https://github.com/OmkarAKadam.png" width="50px" alt="OmkarAKadam" /></a>
<a href="https://github.com/S3DFX-CYBER"><img src="https://github.com/S3DFX-CYBER.png" width="50px" alt="S3DFX-CYBER" /></a>
<a href="https://github.com/SHUBHAM2775"><img src="https://github.com/SHUBHAM2775.png" width="50px" alt="SHUBHAM2775" /></a>
<a href="https://github.com/ShailiBoddula"><img src="https://github.com/ShailiBoddula.png" width="50px" alt="ShailiBoddula" /></a>
<a href="https://github.com/VaibhavMP"><img src="https://github.com/VaibhavMP.png" width="50px" alt="VaibhavMP" /></a>
<a href="https://github.com/a638011"><img src="https://github.com/a638011.png" width="50px" alt="a638011" /></a>
<a href="https://github.com/abdussamad567"><img src="https://github.com/abdussamad567.png" width="50px" alt="abdussamad567" /></a>
<a href="https://github.com/angelina-2206"><img src="https://github.com/angelina-2206.png" width="50px" alt="angelina-2206" /></a>
<a href="https://github.com/anirudh645"><img src="https://github.com/anirudh645.png" width="50px" alt="anirudh645" /></a>
<a href="https://github.com/bhaktiyadav08"><img src="https://github.com/bhaktiyadav08.png" width="50px" alt="bhaktiyadav08" /></a>
<a href="https://github.com/bhavyanjain3004"><img src="https://github.com/bhavyanjain3004.png" width="50px" alt="bhavyanjain3004" /></a>
<a href="https://github.com/bipinchaudhary28899"><img src="https://github.com/bipinchaudhary28899.png" width="50px" alt="bipinchaudhary28899" /></a>
<a href="https://github.com/diksha78dev"><img src="https://github.com/diksha78dev.png" width="50px" alt="diksha78dev" /></a>
<a href="https://github.com/gloooomed"><img src="https://github.com/gloooomed.png" width="50px" alt="gloooomed" /></a>
<a href="https://github.com/kiranShamsHere"><img src="https://github.com/kiranShamsHere.png" width="50px" alt="kiranShamsHere" /></a>
<a href="https://github.com/maanyadanayak"><img src="https://github.com/maanyadanayak.png" width="50px" alt="maanyadanayak" /></a>
<a href="https://github.com/omkartike"><img src="https://github.com/omkartike.png" width="50px" alt="omkartike" /></a>
<a href="https://github.com/opinder8699"><img src="https://github.com/opinder8699.png" width="50px" alt="opinder8699" /></a>
<a href="https://github.com/pranav-pachn"><img src="https://github.com/pranav-pachn.png" width="50px" alt="pranav-pachn" /></a>
<a href="https://github.com/prisha-sh"><img src="https://github.com/prisha-sh.png" width="50px" alt="prisha-sh" /></a>
<a href="https://github.com/shivam-kakkar"><img src="https://github.com/shivam-kakkar.png" width="50px" alt="shivam-kakkar" /></a>
<a href="https://github.com/shravanithouta108"><img src="https://github.com/shravanithouta108.png" width="50px" alt="shravanithouta108" /></a>
<a href="https://github.com/syedrazamd"><img src="https://github.com/syedrazamd.png" width="50px" alt="syedrazamd" /></a>
<a href="https://github.com/vaibhavi-vaishnav"><img src="https://github.com/vaibhavi-vaishnav.png" width="50px" alt="vaibhavi-vaishnav" /></a>
<!-- CONTRIBUTORS_END -->
## 📄 License

Apache 2.0 — made for GSoC beginners, by people who've been there.
Share it with anyone applying! Applications open **March 16, 2026**. 🙌
<center>
  
![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

</center>
