<!--
  Read CONTRIBUTING.md and AI_POLICY.md before filling this in. The checklist at
  the bottom mirrors the house rules in CONTRIBUTING.md; a PR that breaks one of
  them is sent back, so tick honestly rather than quickly.
-->

## What this changes, and why

<!--
Two or three sentences. A reviewer should understand the intent without reading
the diff. If it fixes something, say what the user saw before and what they see
now.
-->

## Related issue

Closes #

<!--
A PR without a linked issue is sent back for one. Use "Closes #123" or
"Refs #123" when the issue should stay open.
-->

## Type of change

<!-- Keep this to one type. If a PR needs two, it is usually two PRs. -->

- [ ] `fix:` a bug
- [ ] `feat:` a new capability
- [ ] `docs:` documentation only
- [ ] `refactor:` no behaviour change
- [ ] `test:` tests only
- [ ] `chore:` tooling, CI or dependency work

## How I verified this

<!--
Paste what you actually ran. "It works" is not verification.

  npx serve . -l 3000          # then http://localhost:3000
  npm run lint
  npm test
  npm run validate:data        # only if you touched data/

Opening index.html from disk does not work: the pages fetch their datasets over
HTTP, so a file:// page cannot load them.
-->

```bash
# commands you ran, and what they printed
```

Checked in a browser at:

- [ ] 1280px, light theme
- [ ] 1280px, dark theme
- [ ] 390px, light theme
- [ ] 390px, dark theme

## Screenshots or a recording

<!-- Anything visual needs a before and after. Drag the images in. -->

## House rules

<!-- From CONTRIBUTING.md. These are not preferences. -->

- [ ] **No build step.** No bundler, framework or transpiler was added.
- [ ] **No new runtime dependencies.** The browser side is still vanilla. Dev
      dependencies for lint and tests are fine.
- [ ] **Static first.** Anything computable from `data/` in the browser still is.
- [ ] **Both app scripts.** If logic changed, `index.html` and `src/js/app.js`
      were both updated.
- [ ] **Untrusted data is escaped.** No raw `innerHTML` with interpolated API,
      dataset or user input.
- [ ] **Outbound links are validated** before they become an `href`.
- [ ] **Accessible.** New controls have a label, a focus state and a keyboard
      path; modals trap focus and return it.
- [ ] **Data is regenerated, not hand-edited.** If a dataset changed, the script
      in `scripts/` was changed and re-run.

## Data provenance

<!-- Delete this section if the PR does not touch data/. -->

- [ ] Every value I added comes from a named source, and that source is linked in
      this description.
- [ ] Nothing is estimated, inferred or invented. Where a fact is unknown, the
      field is empty rather than filled with a guess.

## Sign-off and disclosure

- [ ] Every commit is signed off (`git commit -s`). The DCO check passes.
- [ ] The PR title follows Conventional Commits, for example
      `fix: stop the organisation card title overflowing`.
- [ ] If AI produced a substantial part of this change, I have said so here and
      described how I verified it. See [AI_POLICY.md](../AI_POLICY.md).

<!--
Disclosure example, from AI_POLICY.md:

  Drafted with an AI assistant; I reviewed every line, ran the tests, and checked
  the layout at 1280px and 390px in both themes.
-->
