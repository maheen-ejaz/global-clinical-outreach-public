# Five image directions

Local review requested by Maheen before selecting the replacement style for all six page images.

Open http://localhost:8793/qa/image-style-review/. The gallery offers five generated exemplars,
full-image links, hero/course-card previews, a direction selector, light/dark themes and the current
six images for comparison. These are direction studies, not approved production replacements.
The representative image is reused in two contexts to compare framing; the final six will have
distinct subjects after selection.

Directions: 1 clinical documentary, 2 institutional architecture, 3 faculty portrait,
4 monochrome editorial, 5 architectural ink illustration. All people/settings are fictional;
no staff identity, institutional relationship or programme affiliation is asserted.

Generated using built-in imagegen. `prompts.json` stores the five full prompts; `originals/` retains
unaltered generated PNGs; `images/` contains 1200px WebP delivery exports; `assets.json` records
sizes, hashes and provenance. No API key/CLI fallback was used.

From the repository root:

```sh
python3 -m http.server 8793 --bind 127.0.0.1 --directory marketing/clinical-partnerships
```

The historical local review server was foreground exec session 57688, Python PID 57281,
bound to 127.0.0.1:8793. It was stopped after the selected institutional images were published
and verified. Owner: Codex task 01a12048-d228-7080-9956-4126f4000412;
worktree `/Users/maheenejaz/Developer/global-clinical-outreach-partners-image-styles-1539`.
Stop only that owned server after the review/handoff; never stop another task's port/process.
No background watcher, scheduler or service installation was added.

Checks: `node image-style-review/check.mjs` from `marketing/clinical-partnerships/qa` passed four
390/1440px light/dark Chromium layouts in 3s; all five images decode, every context switch works,
native selector/keyboard focus works, no page overflow, 44px controls, zero Axe/console/request errors.
No-JS retains all images/full-image links and hides optional controls. Evidence is in `evidence/`.
The first Axe invocation used the browser.newPage convenience wrapper; Axe required an explicit
browser.newContext. Corrected the harness and reran it; this changed no runtime page behavior.
The two build/style-isolation tests passed; publishing still produces the unchanged 608,304-byte
page and excludes the entire QA gallery. No Netlify deployment was performed during the comparison stage; Option 2 was later selected
and published through the normal page release.
Required repository check passed: 78 Python tests in 0.48s, 26 Node tests in 0.069s,
and the credential profile contract. Local preparation, five generations and verification took
approximately 22 minutes. The gallery is an admin review artifact, excluded from the application release.

Maheen selected Option 2: Institutional architecture. The six-image refresh and normal reviewed
preview release are now authorised. Direction studies remain as historical review evidence.
