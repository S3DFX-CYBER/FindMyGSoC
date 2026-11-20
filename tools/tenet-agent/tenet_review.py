"""
TENET Agent - PR Reviewer
Triggered by: tenet-pr-review.yml on pull_request events.

Reads the PR diff, sends it to Gemini for a security-focused review,
and posts the result as a PR comment.
"""

import os
import re
import sys

from utils import (
    get_github_client,
    get_repo,
    get_llm_client,
    call_llm,
    get_pr_diff,
    truncate_diff,
    post_pr_comment,
)
from prompts import PR_REVIEW_SYSTEM, PR_REVIEW_TEMPLATE


def main():
    """Run the TENET Agent PR review workflow."""
    print("🛡️  TENET Agent - PR Reviewer starting...")

    # ── Gather context from environment variables ──────────────────────────────
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("❌ GITHUB_TOKEN is not set.")
        sys.exit(1)

    repo_name = os.environ.get("REPO")
    if not repo_name:
        print("❌ REPO environment variable is not set.")
        sys.exit(1)

    pr_number_str = os.environ.get("PR_NUMBER")
    if not pr_number_str:
        print("❌ PR_NUMBER environment variable is not set.")
        sys.exit(1)
    try:
        pr_number = int(pr_number_str)
    except ValueError:
        print(f"❌ PR_NUMBER is not a valid integer: {pr_number_str!r}")
        sys.exit(1)
    pr_title = os.environ.get("PR_TITLE", "")
    pr_body = os.environ.get("PR_BODY", "") or "*No description provided.*"
    pr_author = os.environ.get("PR_AUTHOR", "unknown")

    print(f"📋 Reviewing PR #{pr_number}: {pr_title}")
    print(f"📦 Repository: {repo_name}")

    # ── Fetch PR diff ──────────────────────────────────────────────────────────
    print("📥 Fetching PR diff...")
    try:
        diff = get_pr_diff(repo_name, pr_number, token)
    except Exception as e:
        print(f"❌ Failed to fetch PR diff: {e}")
        sys.exit(1)

    if not diff.strip():
        print("ℹ️  PR has no diff (empty). Skipping review.")
        sys.exit(0)

    diff = truncate_diff(diff, max_chars=80_000)
    print(f"📏 Diff size: {len(diff)} chars")

    # ── Build the review prompt ────────────────────────────────────────────────
    user_prompt = PR_REVIEW_TEMPLATE.format(
        pr_title=pr_title,
        pr_author=pr_author,
        pr_body=pr_body,
        diff=diff,
        pr_number=pr_number,
    )
    # Prepend system prompt so reviewer behaviour is consistent
    prompt = f"{PR_REVIEW_SYSTEM}\n\n{user_prompt}"

    # ── Call Gemini ────────────────────────────────────────────────────────────
    print("🤖 Calling Gemini for security review...")
    model = get_llm_client()
    review_text = call_llm(model, prompt)

    if not review_text:
        print("❌ LLM returned an empty or error response.")
        sys.exit(1)

    print("✍️  Review generated. Posting to PR...")

    # ── Post the review comment ────────────────────────────────────────────────
    g = get_github_client()
    repo = get_repo(g)
    post_pr_comment(repo, pr_number, review_text)

    # ── Check for critical findings and add label ──────────────────────────────
    # Scoped regex avoids false positives where "HIGH" or "CRITICAL" appears
    # in the diff content rather than in an actual severity finding.
    if re.search(r"\[SEVERITY:\s*(CRITICAL|HIGH)\]", review_text, flags=re.IGNORECASE):
        try:
            pr = repo.get_pull(pr_number)
            existing_labels = [lbl.name for lbl in pr.get_labels()]
            if "🚨 security" not in existing_labels:
                pr.add_to_labels("🚨 security")
                print("🔴 Added '🚨 security' label due to critical/high findings.")
        except Exception as e:
            # Label may not exist — not a fatal error
            print(f"⚠️  Could not add security label: {e}")

    print("✅ TENET PR Review complete.")


if __name__ == "__main__":
    main()
