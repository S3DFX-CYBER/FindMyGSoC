#!/usr/bin/env bash
# .github/scripts/create-gssoc-labels.sh
#
# Bootstraps GSSoC-specific labels:
# - Difficulty levels (level:beginner, level:intermediate, level:advanced, level:critical)
# - Quality labels (quality:clean, quality:exceptional)
# - Type bonus labels (type:docs, type:testing, type:accessibility, etc.)
# - Validation labels (gssoc:approved, gssoc:invalid, gssoc:spam, gssoc:ai-slop)
# - Mentor attribution labels (mentor:<username> for each mentor in gssoc-mentors.json)
#
# Usage:
#   bash .github/scripts/create-gssoc-labels.sh
#   bash .github/scripts/create-gssoc-labels.sh S3DFX-CYBER/GSoC-Org-Finder-
#
# Requirements:
# - GitHub CLI (gh)
# - jq
# - Authenticated with repository write access

set -euo pipefail

REPO="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LABELS_FILE="$SCRIPT_DIR/../labels/gssoc-labels.json"
MENTORS_FILE="$SCRIPT_DIR/../reviewers/gssoc-mentors.json"

REPO_ARG=()
if [[ -n "$REPO" ]]; then
  REPO_ARG+=(--repo "$REPO")
fi

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

echo "=== 🏷️ GSSoC Label Bootstrap ==="
echo ""

echo "── Difficulty Labels ──"
jq -r '.difficulty[] | "\(.name) \(.color) \(.description)"' "$LABELS_FILE" | while read -r name color description; do
  upsert_label "$name" "$color" "$description"
done
echo ""

echo "── Quality Labels ──"
jq -r '.quality[] | "\(.name) \(.color) \(.description)"' "$LABELS_FILE" | while read -r name color description; do
  upsert_label "$name" "$color" "$description"
done
echo ""

echo "── Type Bonus Labels ──"
jq -r '.type_bonus[] | "\(.name) \(.color) \(.description)"' "$LABELS_FILE" | while read -r name color description; do
  upsert_label "$name" "$color" "$description"
done
echo ""

echo "── Validation Labels ──"
jq -r '.validation[] | "\(.name) \(.color) \(.description)"' "$LABELS_FILE" | while read -r name color description; do
  upsert_label "$name" "$color" "$description"
done
echo ""

echo "── Mentor Attribution Labels ──"
jq -r '.reviewers[]' "$MENTORS_FILE" | while read -r username; do
  upsert_label "mentor:${username}" "5319e7" "GSSoC mentor attribution"
done
echo ""

echo "✅ GSSoC labels synchronized successfully."
