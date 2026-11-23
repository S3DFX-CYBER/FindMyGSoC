# AI contribution policy

FindMyGSoC welcomes contributors who use AI tools. ChatGPT, Claude, Copilot,
Gemini and coding agents are all fine. What is not fine is submitting work you
cannot stand behind.

This policy applies to every contribution: code, data, documentation, issues and
review comments.

## What is welcome

- Using AI to understand the codebase, an issue, or an unfamiliar concept.
- Debugging with an assistant's help.
- Drafting code, tests or documentation that you then read, run and refine.
- Improving the grammar and clarity of your writing.
- Using an agent to explore a large diff before you review it.

## What is not welcome

- Pull requests that are mostly machine output with no human involvement.
- Code you cannot explain line by line when asked.
- Changes copied from an assistant without being run.
- Unrelated refactors, reformatting or "improvements" bundled into a fix.
- Generic boilerplate, restated comments, or documentation that describes the
  diff rather than the system.
- Invented facts: a benchmark that was never run, a bug that was never
  reproduced, a fix described as verified when it was not.

## Disclosure

Say so in the pull request description when AI produced a substantial part of the
change, and what you did to verify it. For example:

> Drafted with an AI assistant; I reviewed every line, ran the tests, and checked
> the layout at 1280px and 390px in both themes.

Disclosure does not count against you. Claiming otherwise does.

## If you are an agent

Read [AGENTS.md](AGENTS.md) before changing anything. It lists the architectural
constraints, the file map, the checks to run, and the things reviewers reject. The
short version:

- No build step, no framework, no new runtime dependencies.
- `index.html` and `src/js/app.js` carry the same logic; change both.
- Escape untrusted data, validate outbound URLs.
- Run `npm run lint`, `npm test` and `npm run validate:data` before opening a PR.
- Do not describe work as verified unless you actually verified it.

## How this is enforced

Maintainers may ask you to walk through any part of your change. If you cannot,
the pull request is closed rather than merged. This is not a punishment for using
AI; it is the same standard applied to every contribution: the person submitting
it understands it.

Automated review runs on pull requests from people: the security review workflow
skips two named bot accounts and does not filter by path, so any non-empty diff
from a human gets it. It is useful, but it is not the decision. A bot approving a change does not make it correct, and a bot objecting
to one does not make it wrong. If a review comment is mistaken, reply with your
reasoning in the thread.
