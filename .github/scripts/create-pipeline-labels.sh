#!/usr/bin/env bash
# .github/scripts/create-pipeline-labels.sh
#
# Bootstraps PR lifecycle labels used by:
# - pr-stage-manager.yml
# - request-reviewers.yml
# - review-approval-gate.yml
# - pa-final-gate.yml
#
# This script ONLY manages lifecycle pipeline labels.
#
# It intentionally does NOT modify existing labels like:
# - dco-missing
# - dco-verified
# - ai-slop
# - low-quality-pr
# - possible-duplicate-pr
# - gssoc26
# - nsoc26
#
# Usage:
#   bash .github/scripts/create-pipeline-labels.sh
#
#   bash .github/scripts/create-pipeline-labels.sh \
#     S3DFX-CYBER/GSoC-Org-Finder-
#
# Requirements:
# - GitHub CLI (gh)
# - Authenticated with repository write access

set -euo pipefail

REPO="${1:-}"

REPO_ARG=()

if [[ -n "$REPO" ]]; then
  REPO_ARG+=(--repo "$REPO")
fi

# ─────────────────────────────────────────────
# Upsert label
# ─────────────────────────────────────────────
upsert_label() {

  local name="$1"
  local color="$2"
  local description="$3"

  if gh label list "${REPO_ARG[@]}" \
      --search "$name" \
      --json name \
      --jq '.[].name' \
      2>/dev/null | grep -Fxq "$name"; then

    printf '  ↩  updated  %s\n' "$name"

    gh label edit "$name" \
      --color "$color" \
      --description "$description" \
      "${REPO_ARG[@]}" \
      >/dev/null 2>&1

  else

    printf '  +  created  %s\n' "$name"

    gh label create "$name" \
      --color "$color" \
      --description "$description" \
      "${REPO_ARG[@]}" \
      >/dev/null
  fi
}

echo "=== 🚦 PR Pipeline Label Bootstrap ==="
echo ""

# ─────────────────────────────────────────────
# Stage 1
# ─────────────────────────────────────────────
echo "Stage 1 — Automated Validation"

upsert_label \
  "stage-1-approved" \
  "0e8a16" \
  "All automated validation checks passed"

upsert_label \
  "needs-fixes" \
  "d93f0b" \
  "Automated checks failed — contributor action required"

echo ""

# ─────────────────────────────────────────────
# Stage 2
# ─────────────────────────────────────────────
echo "Stage 2 — Human Review"

upsert_label \
  "mentor-review-requested" \
  "1d76db" \
  "Awaiting GSSOC mentor review"

upsert_label \
  "nsoc-review-requested" \
  "5319e7" \
  "Awaiting NSOC reviewer review"

upsert_label \
  "gssoc-mentor-approved" \
  "0052cc" \
  "Approved by verified GSSOC mentors"

upsert_label \
  "nsoc-reviewed" \
  "6f42c1" \
  "Approved by qualified NSOC reviewers"

upsert_label \
  "changes-requested" \
  "b60205" \
  "Changes requested during review"

echo ""

# ─────────────────────────────────────────────
# Stage 3
# ─────────────────────────────────────────────
echo "Stage 3 — Maintainer Review"

upsert_label \
  "pa-review" \
  "fbca04" \
  "Approved by PA or maintainer pending final merge gate"

upsert_label \
  "merge-ready" \
  "0e8a16" \
  "All review stages passed — safe to merge"

echo ""
echo "✅ Pipeline lifecycle labels synchronized successfully."
echo ""
echo "Run .github/scripts/create-gssoc-labels.sh to sync GSSoC labels (difficulty, quality, type bonus, validation, mentor attribution)."
