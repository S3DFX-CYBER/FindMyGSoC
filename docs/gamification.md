# Gamification — MVP Badge System

A lightweight achievement system to reward exploration of GSoC organizations.

## What's Implemented

**2 badge types, 4 levels each = 8 total badges**

| Badge | Tracks | Bronze | Silver | Gold | Platinum |
|---|---|---|---|---|---|
| 🔍 Explorer | Org views | 10 | 25 | 50 | 100 |
| ⚖️ Comparator | Comparisons | 5 | 15 | 30 | 50 |

## How It Works

- Progress is stored in **browser `localStorage`** — no account required, fully private
- Progress is **per-device/browser** and resets if browser data is cleared
- A toast notification appears when a new badge level is unlocked
- View progress anytime via the **Analytics panel** (📊 icon in navbar)
- Reset progress via the "Reset Progress" button in the Analytics panel

## Files

- `src/js/badges-mvp.js` — Badge logic (tracking, unlock detection, notifications)
- `index.html` — Analytics panel UI + CSS styles for badges

## Future Ideas

- Search Master badge (tracks searches)
- Filter Pro badge (tracks filter usage)
- Cross-device sync (requires backend)
