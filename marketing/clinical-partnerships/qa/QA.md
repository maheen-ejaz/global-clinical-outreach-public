# Page verification — 9 October 2026

Story: a clinical provider reads the invitation, checks the planned-versus-live distinction,
navigates the programme/process/FAQ sections, and opens an email or copies Maheen's address.
There is no API/data flow or credential requirement in the page.

## Attio Mono v2 tokens — 10 October 2026

The page now consumes the supplied v2 tokens and button, input, layout, floating and reading
recipes through the isolated `.gc-clinical-partnerships` scope. The original v1 references remain
intact in `vendor/attio-mono/`; the complete v2 source is retained in `vendor/attio-mono-v2/`.
Inter 400 is bundled locally for the reading recipe and recorded with its OFL licence and checksum.

The current publish build is 779,926 bytes uncompressed, including the v2 token CSS and Inter 400.
Use 780KB as the current working size budget; the earlier 750KB target predates these additions.
Cards remain border-only; the v2 floating elevation is available for future floating UI and is not
applied to page cards. The page has no input or floating control instance.

Final local checks: 29 layout/control cases in 15s across Chromium, WebKit and Firefox with zero
Axe/console/request errors; 36 carousel cases in 16s; 25 motion/reduced-motion cases in 42s; and
three build/style-isolation tests passed. The browser suite covers both themes, 320–1440px widths,
200% text, keyboard, clipboard and no-JavaScript behavior. Evidence and light/dark screenshots are
in `evidence/mono-v2-local/`, `evidence/mono-v2-carousel/` and `evidence/mono-v2-motion/`.

## Institutional architecture — 9 October 2026

Maheen selected Option 2 from the five-direction localhost gallery and authorised it across the
page. This satisfies the earlier style-selection hold. All six editorial image placements now use
institutional architecture: the exact approved hero exemplar, a learning atrium, clinical teaching
wing, skills centre, department briefing suite and specialist laboratory. Settings/people remain
fictional and visibly AI-labelled; layout, icons, copy, dummy programme data and runtime scripts
are unchanged. Current prompts/originals are in `qa/institutional-imagery/`; the five-direction
gallery and earlier art remain historical provenance.

Twelve responsive exports are in `assets/images/institutional/`; twelve superseded delivery files
were moved byte-for-byte into `qa/superseded-images/` and excluded from publishing. Active and
archived manifests validate all 19/12 file sizes and SHA-256 values. Programme image attributes now
match the natural 4:3 asset dimensions; their existing 16:10 card crop remains CSS-controlled.

Initial quality-76 exports produced a 782,359-byte publish directory. Tested quality-72 WebP delivery
exports, preserving original composition and full-resolution PNGs; final publish size is 747,101
bytes uncompressed, below the working 750KB target. Quality-76 layout evidence is historical in
`evidence/institutional-local/`; final layout captures use the quality-72 files.

Local checks: 29 final layout/control cases in 15s, zero Axe/console/request errors; 36 carousel
cases in 15s; 25 motion cases in 44s; two build/style-isolation tests in 0.01s; four local gallery
cases in 3s after archival/selection updates. All six new images were inspected, including the
approved hero. Evidence: `evidence/institutional-final-layout-local/`, `institutional-carousel-local/`,
`institutional-motion-local/`. The publish build excludes original PNGs, archived files and all QA.
Fresh Lighthouse: mobile performance/accessibility 96/100, desktop 100/100; CLS 0 on both.
Required source PR check passed 78 Python tests in 0.10s, 26 Node tests in 0.068s and the profile
contract. Selected-image preparation, generation, export and local verification took approximately
18 minutes. Exactly one isolated blind read-only reviewer inspected all six active images, local
render and source/evidence with no blocking finding. It confirmed the hero PNG is byte-identical
to the approved Option 2 exemplar and all 31 active/archive manifest entries match size/hash.

PR #53 merged runtime `e73e4077ec4101bbb4da61f270314c2cf5790e5c`; clean canonical main fast-forwarded
from `74b5756ba0a73892294c428d641f8b0964a7e2ef` at 2026-10-09T17:37:35.025385Z. Same dedicated
Netlify site/team/domain; deploy `6ac926662f49de17ab8391cc` ready/published 2026-10-09T17:37:46.021Z.
All 26 served files matched canonical bytes over native custom-host HTTPS with expected CSP/noindex
at 2026-10-09T17:39:36.904730Z. Live layout/control checks passed 29 cases in 34s with zero
Axe/console/request errors; new light/dark desktop/mobile captures are in `evidence/institutional-deployed/`.
Final live carousel passed 36 cases in 32s; motion passed 25 cases in 68s on the canonical custom
hostname. Evidence: `evidence/institutional-carousel-deployed/`, `institutional-motion-deployed/`.
The owned local review server was stopped after final checks; the live preview was opened in the
system browser. No machine/DNS/auth/data settings changed. Original website-team integration and
main-site entry-point verification remain pending; GOO-1539 stays In Review.

## Marketing polish — 9 October 2026

Maheen requested generated images, bento cards and icons around the already-delivered programme
carousel. Acceptance retains the Attio Mono palette/tokens/type/radii, truthful offer, nine-section
sequence, native controls, both themes, reduced-motion/no-JS behavior and public/private boundary.
Two new built-in imagegen images are labelled illustrative and depict generic fictional education;
responsive WebP exports total 118,482 bytes. Original PNGs and prompts are preserved in QA.

The benefits form one asymmetric four-tile bento; process steps form three equal cards on desktop.
Both stack on mobile and have only one nested card level. Original inline outline icons use the
reference's 16px grid, 1.5px stroke and muted colour; all are decorative with visible text labels.
No runtime script changed. The additional listing-preview link uses the existing horizontal arrow
feedback; the primary email action and existing factual copy remain intact.

Local checks passed: 29 layout/control cases in 15s with zero Axe/console/request errors;
36 carousel cases in 15s; 25 motion cases in 44s; two build/style-isolation tests in 0.01s.
All 19 asset manifest sizes/hashes and the intact original token CSS were verified.
Fresh Lighthouse mobile performance/accessibility 97/100, desktop 100/100; CLS 0 on both.
Full publish directory: 608,304 bytes uncompressed, below the 750KB working budget.
Evidence: `evidence/marketing-local/`, `marketing-carousel-local/`, `marketing-motion-local/`.
Local design, image preparation and verification took approximately 12 minutes.

The initial reference read used a nonexistent guidelines.md filename; inventory located the actual
vendor README and Card guide, which were read before design changes. No source was changed from
that failed read. Generated images were inspected, copied into the owned worktree and resized/encoded
without changing their composition. Earlier source/evidence remains historical.

Required PR check passed (78 Python in 0.36s, 26 Node in 0.069s, profile contract). Exactly one
isolated blind read-only reviewer found no blocking issue after checking source, local render,
stored evidence, original references and the publish boundary; no suites were rerun by the reviewer.
PR #51 merged runtime `e2f0dee1403e13980f0dddd882b480d50baffeb9`; clean canonical main fast-forwarded
from `d1461e956430460ed8bdf353cbacbcdb1a61762a` at 2026-10-09T15:36:14.574640Z before release.
Dedicated Netlify deploy `6ac909f5fc7dc07a4bd5118f` is ready/published 2026-10-09T15:36:25.547Z.

The custom hostname now resolves through this Mac's normal local DNS: a native HTTPS HEAD check
passed before release. This revision's live source and browser checks use the canonical custom host
directly with normal TLS validation; no IP mapping or DNS-over-HTTPS workaround is needed. No machine
or DNS settings were changed. Earlier DNS limitations remain historical observations.
All 26 served files matched canonical bytes at 2026-10-09T15:37:21.907790Z with expected CSP/noindex.
Live layout/control checks passed 29 cases in 31s, zero Axe/console/request errors; fresh desktop/mobile
light/dark captures are in `evidence/marketing-deployed/`.

Final live carousel checks passed 36 cases in 45s; motion checks passed 25 cases in 74s on the
canonical custom hostname. Evidence: `evidence/marketing-carousel-deployed/` and
`marketing-motion-deployed/`. Source and headers, responsive images, dark/light layouts, native
contact/FAQ/carousel controls and reduced-motion/no-JS behavior are verified for this revision.
Local static server stopped after review. The current website team's final route/homepage/navigation
integration remains pending, and GOO-1539 stays In Review.

## Programme carousel — 9 October 2026

Maheen requested a proper carousel in the same preview, with AI-generated images and fictional
institution/date/fee information informed by cached provider pages. Acceptance: four rich illustrative
cards, explicit fictional/AI labels, correct fee units and date durations, unchanged Attio Mono tokens,
responsive native touch/keyboard scrolling, stable focus, no autoplay, reduced-motion/no-JS fallback,
no public prospect data and the same verified Netlify destination.

| Check | Actual result |
|---|---|
| Carousel behavior | 33 cases passed in 13s: Chromium/WebKit/Firefox, both themes, six responsive widths on Chromium, native Chromium touch swipe, keyboard/boundaries/focus, live reduced-motion, 200% text, no-JS and missing preference-listener fallback |
| Existing layout and controls | 29 cases passed in 14s; zero Axe, console or failed asset requests |
| Existing motion | 25 cases passed in 44s; section/focus/reduced-motion/lifecycle guards retained with the additional section |
| Affected deterministic checks | Carousel/motion JavaScript syntax and 2 build/style-isolation tests passed (0.01s) |
| Required PR check | 78 Python tests passed in 0.32s; 26 Node tests in 0.066s; credential profile contract passed |
| Fresh local Lighthouse | Mobile performance 95/accessibility 100; desktop 100/100; CLS 0 on both, measured before the final focus-colour selector correction |
| Publish size | 482,744 bytes uncompressed; four responsive lazy images, each 960px WebP under 37KB; raw generated PNGs and all QA/research excluded |
| Content/provenance | Inclusive date durations 28/28/42/365 days; all names/dates/fees fictional; source URLs, prompt set, originals and asset hashes preserved |

Evidence: `evidence/carousel-local/`, `carousel-layout-local/`, `carousel-motion-local/`.
The cards preserve monochrome type, borders, spacing and geometry; actual Tab focus now uses the
intended ink ring. The page-level focus selector was made equally specific to the vendor adaptation
so its existing monochrome override takes precedence over the vendor accent.

Test corrections were limited to evidence collection: wait for the rAF-updated boundary state,
dispatch a boundary no-op rather than ask Playwright to click an aria-disabled control, use actual
keyboard activation for macOS WebKit focus, and poll native no-JS scrolling outside browser rAF.
The initial-section-focus test now establishes focus during DOM parsing before deferred scripts;
DOMContentLoaded occurs after those scripts and was too late to prove the initial-focus guard.
No runtime motion code changed for that correction.

One isolated blind read-only reviewer found no blocking findings after checking the source, stored
local evidence, existing publish output and local page. The review confirmed fictional/AI labels,
fee units, date math, image hashes, Mono tokens and the publish boundary. It did not claim live release
verification. Local preparation and checks took approximately 63 minutes including image generation.

Runtime PR #48 merged as `5598eccf5bece00448d4d292e17c58b9432546b0`. Netlify deploy
`6ac8fe4096879ebb1b29181b` is ready/published 2026-10-09T14:46:29.847Z on the same dedicated preview.

First-candidate live proof matched all 22 served files and expected CSP/noindex at
2026-10-09T14:47:15.941059Z; custom-host light/dark 390/1440px captures passed. Browser matrices use
the equivalent Netlify hostname because the Mac's recursive resolver retains NXDOMAIN. Source checks
use public DNS-over-HTTPS and captures map the verified public IP inside that browser only, retaining
normal TLS validation. No machine or DNS settings changed.

The first deployed carousel run caught a real WebKit dark-context initialization issue: the track
was at scrollLeft 0 with maximum 290, but Next remained aria-disabled after offscreen layout had
initially reported no overflow. Direct single-page checks worked in all engines, so serial retry
alone did not resolve the issue. The correction refreshes bounds after the first layout, on vertical
scroll and on focus. A regression case simulates zero offscreen overflow metrics before reveal and
requires Next to become usable afterward in all three engines. The initial candidate is not claimed
as passing the complete live behavior check.

The layout suite also reported cancelled responsive-image requests during rapid resizing/navigation.
It now waits for each selected image to decode before moving on, keeping actual request/HTTP errors
strictly checked; the carousel suite retains lazy-image behavior. Browser matrices are run separately
after the initial concurrent motion run was stopped. Position polling uses a bounded 50ms interval;
changing polling alone did not resolve the WebKit issue. These outcomes are recorded separately from
the runtime correction and final deployed results.

Correction checks: 36 carousel cases passed in 14s (including three late-layout regressions),
29 layout/control cases in 14s with zero request/console/Axe errors, and 25 motion cases in 44s.
JavaScript syntax and both build/style-isolation tests passed (0.01s). Corrected local evidence:
`evidence/carousel-final-local/`, `carousel-final-layout-local/`, `carousel-final-motion-local/`.

The same reviewer verified the late-layout correction and identified repeated identical aria-live
status writes on vertical scrolling. Status text now changes only when the visible-card range changes.
All 36 carousel cases passed again in 15s, including zero live-region mutations from ordinary vertical
scrolling in each engine/theme; evidence is `evidence/carousel-quiet-local/`. JavaScript syntax passed.
Required PR checks were rerun for both runtime corrections; no additional reviewer is used.

The same reviewer verified status deduplication with no remaining blocking concern. Final correction
PR #49 merged source `5561782f3fdc5128162b1f7022900671c8bff67e`. Clean canonical main fast-forwarded
from `5598eccf5bece00448d4d292e17c58b9432546b0` at 2026-10-09T15:02:36.145065Z before the exact-SHA
deploy. Deploy `6ac9021122b00e097abe265e` is ready/published 2026-10-09T15:02:44.216Z. Final required
PR check passed 78 Python tests in 0.11s, 26 Node tests in 0.069s and the profile contract.

Final deployed checks completed separately: 36 carousel cases in 65s, 29 layout/control cases in 39s,
and 25 motion cases in 109s. Both themes, all three engines, native touch/keyboard/no-JS, reduced motion,
late-layout and quiet-live-status regressions passed; zero Axe/console/request errors. All 22 served
files matched final canonical bytes over trusted custom-host HTTPS at 2026-10-09T15:03:20.373226Z,
with expected CSP/noindex. Fresh normal-motion custom-host captures cover both themes at 390/1440px.
Evidence: `evidence/carousel-final-deployed/`, `carousel-final-layout-deployed/`,
`carousel-final-motion-deployed/`. Full publish directory: 483,008 bytes uncompressed (served source
files excluding the header configuration: 482,512 bytes). Later bounds/status corrections add 264 bytes
of script; the earlier 95/100 mobile and 100/100 desktop Lighthouse results remain dated measurements.

The temporary static servers were stopped after local checks/review; no task-owned service remains.
The final main-site route/homepage/navigation and continued existing-course operation remain the
current website team's integration criteria. GOO-1539 stays In Review; this preview revision is delivered.

## Acceptance evidence

| Check | Actual result |
|---|---|
| Original reference assets | Original ZIP SHA-256 `19a2dbbe2f4935bcfe3736d94e8bd29afe5e70fb50619483a5be482e20b965e6`; token checksums match GOO-1539; all 12 files retained unchanged |
| Affected deterministic checks | `node --check assets/js/contact.js` passed; `uv run --frozen pytest -q tests/test_partnership_page.py`: 2 passed, 0.01s |
| Required repository check | `npm run check:pr`: profile contract passed, 26 Node tests passed, 78 Python tests passed; repeated only after the review's scoped CSS utility correction |
| Browser/layout/interaction | `node qa/browser-checks.mjs`: 29 layouts passed in 14s; 320/375/390/768/1024/1440px in both themes on Chromium, 390/1440px in both themes on WebKit/Firefox, 200% text at 320/768/1440px in all three |
| Accessibility | Axe WCAG 2 A/AA and 2.1 AA: zero violations for both themes in each browser; visible 2px focus; skip link and complete keyboard traversal; native FAQ Enter toggles; controls at least 44px |
| Clipboard | Native Chromium clipboard writing and reading verified after the explicit button click; successful-writing and missing-API test doubles passed in all three; visible/selectable email remains available |
| No JavaScript | Narrative, mailto, navigation and native disclosure remain usable in all three; clipboard enhancement is hidden |
| Requests/console | No page/console errors or failed asset requests in the browser run; assets self-hosted; no page network API, trackers, forms or correspondence backend |
| Local Lighthouse mobile | Performance 99, accessibility 100; 0 cumulative layout shift; JSON evidence includes run settings and metrics |
| Local Lighthouse desktop | Performance 100, accessibility 100; 0 cumulative layout shift; JSON evidence includes run settings and metrics |
| Static size | 263,862 bytes for the complete publish directory uncompressed, below the 750KB working initial-resource budget; original SVG hero is 1KB, below 180KB |
| Main-site links | Homepage, `/mentorship`, `/courses`, `/contact-us`, `/privacy`, `/tnc` returned 200; legal pages verified by their actual headings; observations preserved in `asset-sources.json` |
| Visual review | Desktop/mobile full-page and first-view screenshots in both themes; no clipped navigation/email, overlap or horizontal page scrolling; original logo on white backing in both themes |

Engines: Playwright 1.64.0, Chromium 156.0.8078.4, WebKit 27.2, Firefox 157.0.
WebKit on this Mac uses **Option+Tab** to include links, consistent with the Safari keyboard
navigation preference. The test uses that shortcut on macOS; it does not change the system setting.
This is WebKit smoke coverage, not a claim of testing every installed Safari version.
Lighthouse 13.5.0 used installed Google Chrome, default simulated mobile throttling and the desktop
preset respectively. Python's local static server does not implement Netlify's compression/cache
headers; Lighthouse noted cache/image-delivery opportunities, but both targets passed.

The code/layout/asset preparation and local verification took approximately 25 minutes from
isolation to final local checks. The full runtime page remains buildless and has no framework bundle.

## Approach observations and corrections

1. **Browser launch:** the selected Playwright version expected Chromium v1248 while older cached
   versions were installed. Hypothesis: matching engine binaries were missing. Smallest supported
   test: install the package-matched browsers with `npx playwright install chromium firefox webkit`.
   Outcome: all three engines launch and the checks pass.
2. **First keyboard link:** the initial run asserted plain Tab would reach the skip link in every
   browser. A fresh-page retry showed the same first focus on WebKit's FAQ summary, rejecting the
   focus-restoration hypothesis. A three-engine key trace showed Chromium/Firefox include links,
   while WebKit includes them with Option+Tab from a fresh page. Outcome: use the native macOS
   shortcut in the WebKit test; the skip jump and full traversal pass, without a system change.
3. **Mobile header visual:** the screenshot exposed a broken word in the extra brand-name text.
   Hypothesis: the desktop wordmark and main-site link compete for phone width. Smallest change:
   hide the supplemental wordmark below 768px and use the genuine logo/main-site link row specified
   in the brief. Outcome: browser matrix rerun passes and updated screenshots show clean wrapping.

## Release and remaining boundary

The isolated, blind, read-only review found one non-blocking integration utility defect: the build's
text replacement matched `.body` as well as the standalone `body` selector. The current page used root
typography and `.body-sm`, so its render was unaffected. The replacement is now anchored to a standalone
selector, and a regression assertion preserves the scoped `.body` rule. Affected checks were rerun and
the same reviewer verified the correction with no remaining concern; no second reviewer was used. Original font licences are
preserved byte-for-byte; the whitespace diff check excludes their upstream trailing spaces.

Published source: `7e048c30d3fe803fcfc5837b7abd1b52ebe74a17` (PR #39). Dedicated Netlify site:
`c6f69133-aea0-4f88-8e7d-78d7c4332e24`, GooCampus Team. Successful final deploy:
`6ac8ceef1511aa3c4e89bb52`, ready/published 2026-10-09T11:24:33.176Z.

Post-deploy browser matrix on the stable Netlify hostname: 29 cases passed in 31s across all three
engines; both themes, native clipboard, fallback, keyboard, no-JS and zero Axe violations. Custom-domain
desktop/mobile light/dark screenshots also captured without console errors. All 12 served source files
matched canonical build bytes; HTML/noindex, fonts, image formats and dedicated CSP were verified over
trusted custom-domain HTTPS. `evidence/deployed/live-proof.json` records file hashes and actual headers.

Deployment approach outcomes:

- Initial domain update used the legacy API `site` body key; re-read showed no mutation. Installed CLI
  source uses `body`; that supported payload was used thereafter.
- Associating the domain and forcing SSL in one request returned 422 while SSL was false. Re-read showed
  no mutation. Associating only the selected hostname succeeded and Netlify created its single managed
  DNS record. Once the certificate was issued, enabling force SSL succeeded. Existing four DNS records
  retained their IDs and targets; no apex/mail/nameserver changes were made.
- First published deploy `6ac8ccf5760929239581ed2f` had correct page bytes but inherited dashboard headers
  from the root configuration. The smallest correction was a new deploy using the existing page
  `--cwd` plus `--dir dist`; the resulting CSP serves local fonts and has `connect-src 'none'`. No page
  source or unrelated site change was required; the corrected deploy replaced the prior review publish.
- Local recursive DNS retains the earlier NXDOMAIN result. Authoritative/public Google and Cloudflare
  DNS return the expected Netlify addresses. Custom HTTPS/source checks used Cloudflare DNS-over-HTTPS.
  Browser smoke on the canonical custom URL initially reported `ERR_NAME_NOT_RESOLVED`; the full suite
  ran on the equivalent Netlify hostname, and custom-domain captures mapped only this hostname to the
  exact public-DNS IP while preserving normal TLS trust/hostname checks. This limitation is explicit;
  local network settings were not changed.

Main-site integration has not been performed by this page task. The existing website team must
integrate the agreed route, remove review-only metadata, add homepage/navigation entry points and
verify continued operation of courses/mentorship. Maheen's visual review is pending. GOO-1539 stays
open, and the separate email pilot is not ready on the basis of this preview alone.

## Full-page copy review — 9 October 2026

Reviewed every section, including all FAQs, the stage note, diagram labels, navigation, CTAs and footer.
Retained the clear headline, navigation, email/copy labels and legal links. Tightened the company
introduction, benefits, programme descriptions and contact invitation; replaced abstract process
labels and passive FAQ answers with direct wording. Existing programmes remain live, the additional
collection remains planned, launch still depends on the initial provider group and agreed details,
and eligibility, responsibilities and private terms remain provider-specific.

Main narrative copy: 607 → 547 words (9.9% reduction), counted consistently from the main landmark;
HTML tags/attributes compare identically with the prior version. Only public copy and task records
change; CSS, assets and control logic retain their reviewed source. The browser suite passed all
29 cases in 14s: both themes, six widths, 200% text, keyboard, copy success/fallback and no-JS across
Chromium/WebKit/Firefox, with zero Axe/console/network errors. Local evidence: `evidence/copy-review-local/`.
Affected deterministic checks passed; required `check:pr` passed (78 Python tests in 0.10s, 26 Node tests
in 0.070s). It was rerun after the final two copy refinements and integration of the newer default.
An isolated, blind, read-only reviewer checks the copy against the GOO-1539 baseline before release.

That reviewer identified wording in the “Planned” row that could imply provider participation was
already agreed. Replaced it with a clear future action: “We’ll agree participation and programme details
with each provider.” Browser and required PR checks were rerun after that correction; the same reviewer
verified the correction with no remaining implication concern before release. No additional reviewer is used.

Copy revision published from `f2d06955bca92411fd425c9721c9a779d99ab528` (PR #42) as Netlify deploy
`6ac8d83dcc2fe463a5476aa1`, ready/published 2026-10-09T12:04:15.093Z. All 12 served files matched the
canonical build over trusted custom-host HTTPS at 2026-10-09T12:05:40.612419Z, with expected CSP/noindex.
The deployed suite passed all 29 cases in 32s, with zero Axe/console/network errors. Fresh light/dark
desktop/mobile screenshots and file/hash evidence are in `evidence/copy-review-deployed/`.
The same local recursive DNS limitation applies: public DNS-over-HTTPS verifies the custom host,
the full browser matrix uses the equivalent Netlify hostname, and custom captures use the current
public-DNS IP with normal TLS verification. No network settings changed. Local review/edit/check
work took approximately 20 minutes; the runtime change is copy only, so the earlier Lighthouse
benchmarks remain historical evidence rather than a new performance measurement.

Intake recovery: merging the dashboard-access task's newer default into the dirty owned worktree
was refused because project status had local edits. No merge changes were applied. Committed the
scoped copy changes, then merged the fetched default; the dashboard-access changes were preserved
without stashing or shared-checkout edits. That task confirmed its canonical operation was complete
and handed off at `ef9a0324eb21734d200be6bbe0f37524afd7f9bc` before this page's release.

## Motion refinement — 9 October 2026

The requested local motion palette uses 4px/420ms one-time section settling, 1–2px/150ms directional
arrow feedback, 1px press feedback, and 150ms outline FAQ-indicator/200ms answer settling. Every
card/text remains visible at full opacity throughout. Original tokens/references, copy, typography,
colours, spacing, radii and borders are preserved; no loops/parallax/shadows or layout-size animations.
All motion is gated by reduced-motion preference. Live preference changes, hidden-page transitions
and pagehide cancel current section movement; already-seen sections do not replay. Focused sections
are skipped, and gaining focus cancels movement immediately. Missing APIs leave readable native content.

| Check | Actual result |
|---|---|
| Motion behavior suite | `node qa/motion-checks.mjs`: 25 cases passed in 39s across Chromium/WebKit/Firefox, both themes, once-only/full-opacity behavior, live/first-load reduction, native FAQ/arrow feedback, three missing-API variants, initial/during-animation focus, and Chromium touch without persistent hover |
| Responsive/control regression | 29 cases passed in 14s; six widths, 200% text, both themes, keyboard/native FAQ, clipboard success/fallback and no-JS; zero Axe/console/network errors |
| Affected deterministic checks | JavaScript syntax and the two build-boundary/style-isolation tests passed (0.01s) |
| Required repository PR check | 78 Python tests passed in 0.11s; 26 Node tests passed in 0.068s; profile contract passed |
| Fresh local Lighthouse | Mobile performance/accessibility 99/100; desktop 100/100; CLS 0 on both |
| Visual evidence | Desktop/mobile motion recordings in `evidence/motion-local/`; light/dark responsive screenshots in `evidence/motion-layout-local/` |

The Node test first attempted to read a browser-only DOMMatrix constructor outside the browser.
Smallest correction: evaluate the indicator matrix in the browser realm. The corrected motion suite
passed. An initial log redirection prevented the PR command from launching because the ignored local
`data/` directory was absent; creating that task output directory and running the command succeeded.
Neither issue changed runtime behavior or required a different release target.

The isolated reviewer found no blocking implementation defect. Its lifecycle evidence note was closed
with direct simulated visibility/pagehide/persisted-pageshow cancellation and resume cases in each
engine, without claiming an actual OS/tab or bfcache navigation test. The PR check was rerun after
adding those cases. A perceived blank dark illustration was ruled out by direct pixel inspection:
the same 308 × 231 image region contains 1,835 dark linework pixels in both first-view and full-page
artifacts; the SVG/styling are unchanged. Local implementation and verification took approximately
25 minutes.

Motion release: PR #44, runtime source `da147f4f9d867d4d1783d98ce66cad9896a0909c`; dedicated Netlify
deploy `6ac8e59046e0a1f29bc6a77e`, ready/published 2026-10-09T13:01:07.986Z. All 13 served files matched
the canonical build over trusted custom-host HTTPS at 2026-10-09T13:03:57.749968Z, including the new
script; expected CSP/noindex retained. Deployed checks passed: 25 motion cases in 66s, 29 layout/control
cases in 26s, zero Axe/console/network errors. Fresh motion clips, normal-motion custom-host light/dark
desktop/mobile captures, file hashes and browser records are in `evidence/motion-deployed/` and
`evidence/motion-layout-deployed/`. The prior local recursive DNS limitation remains explicit: public
DNS-over-HTTPS verifies the custom host; the full browser suites use the equivalent Netlify hostname,
and custom captures map the exact current public-DNS IP with normal TLS verification. No network
settings, DNS records, application data or authentication settings changed.

Final keyboard check found the generic transform transition also applied to the skip link's existing
offscreen-to-focused transform. Immediate focus left it briefly above the viewport (observed y −21px).
Restricted transform transition to `.gc-button`; decorative arrows retain their own small transitions,
while the skip link now appears instantly. The motion suite asserts immediate on-screen position and
no transform transition on the skip link in all engines/themes. This correction is released after
affected checks and continuation of the same isolated review; it changes no copy, tokens or geometry.
Correction evidence is separate from the earlier 39s run: `evidence/motion-focus-local/motion-results.json`
records 25 cases in 40s, with instant skip-link focus in all six engine/theme cases. Required PR checks
passed (78 Python tests in 0.09s, 26 Node tests in 0.067s). The same reviewer verified the restricted
selector and regression assertions with no remaining behavioral concern.

Final corrected release: PR #46, source `f0c411e74467f14308490fd1d463ba3a13f9ebf7`; Netlify deploy
`6ac8eaadb8796491c80fd715`, ready/published 2026-10-09T13:22:55.270Z. All 13 served files matched the
canonical build over trusted custom-host HTTPS at 2026-10-09T13:24:41.131922Z with expected CSP/noindex.
Final deployed motion suite passed 25 cases in 74s (including immediate skip-link focus in every
engine/theme); layout/control suite passed 29 cases in 30s with zero Axe/console/network errors.
Records and fresh layout screenshots are in `evidence/motion-final-deployed/` and
`evidence/motion-final-layout/`. The original motion clips still represent the unchanged section,
arrow, press and FAQ effects; the final correction only restores instant skip-link visibility.

## Presentation revision — 12 October 2026

Company-facing CTAs and verified public contact details replace personal name/email; direct
contact is present in the introduction. Brief mentorship and audience relevance sections avoid
traffic/admission guarantees. Four new built-in editorial generations add mentorship, clinical
teaching, simulation and overhead still life beside the retained architectural hero/laboratory.
The user requested removing repeated AI captions; fictional-data/illustrative-image disclosure,
source prompts/originals and asset provenance remain. FAQ uses native exclusive details grouping.

- 3 affected build/style-isolation tests passed (0.02s).
- Chromium/WebKit/Firefox: 29 layout/control cases passed (15s), zero accessibility,
  console or request failures; both themes, 320–1440px and 200% text.
- Exclusive FAQ verified through keyboard and without JavaScript in all three engines.
- Carousel: 36 cases passed (15s); motion: 25 passed (40s).
- Active and archived asset hashes all match (20 each); publish output 703,184 bytes
  under the existing 780KB working budget; no QA/prospect/correspondence files published.
- Initial concurrent suites caused connection resets on the local Python server; the server
  was restarted with a larger request backlog and suites ran sequentially without errors.
  No product code workaround or weakened request/accessibility checks were added.
- Evidence: `qa/evidence/presentation-local/`, `presentation-carousel/`, `presentation-motion/`.

Repository PR checks and one independent read-only release review precede delivery;
release/source/cleanup identity is recorded in project status and RELEASE.json after publication.

### Published presentation verification

PR #62 source `281ebf4b952ffbcb8361b04d4d48fb4a2bd86b0e` published as ready/current
Netlify deploy `6acc6b3efc7dc06760d512e0`. All 27 publicly served files byte-match canonical
source with CSP/noindex headers. Deployed browser matrix passed 29 layout/control cases in
27s across Chromium/WebKit/Firefox, including exclusive FAQ with keyboard and no JavaScript,
clipboard and email/phone routing; zero Axe, console or request errors. `_headers` is provider
configuration, not a publicly served asset. Evidence: `qa/evidence/presentation-deployed/`.
The local server is stopped before owned cleanup; no database or email action occurred.

## Credibility revision — 12 October 2026

Three labelled website cards within the introduction feature GooCampus UK, GooCampus Australia
and ALS Course. The owner confirmed the business history and operation of all three sites;
service descriptions reflect their public pages, without exclusivity or accreditation claims.

- Affected build/style-isolation tests: 3 passed (0.02s).
- Browser matrix: 29 cases across three engines passed in 18s, zero Axe/console/request errors.
- Carousel: 36 cases passed in 18s; motion: 25 cases passed in 43s.
- Publish build: 705,888 bytes, within the 780KB working budget.
- New website links are included in 44px touch-target checks; desktop/mobile light/dark network
  captures inspected. The three hrefs match the user-provided URLs.
- Local evidence: `evidence/credibility-local/`.

Published source `45710c171abcfe133b48b029d759b1d08596da7a` (PR #66), Netlify deploy
`6acc89a97bc7950e162a0c50`, ready/current at the custom host. All 27 served files match the
canonical build, with CSP/noindex. Deployed browser matrix passes 29 cases in 32s across
three engines, including new network link targets, both themes, mobile and keyboard/no-JS.
Evidence: `evidence/credibility-deployed/`. Owned local server stopped; port 8794 released.

## Navy accent revision — 12 October 2026

Original Attio Mono v2 accent tokens now style primary CTAs, section emphasis, process-number
badges and action/focus states. Network cards use accent tint, headings and direct blue links.
Final contact removes its repeated email/phone block while keeping the two buttons. Clipboard
reads the existing introduction email; native mailto and no-JS fallback remain functional.

- Affected build/isolation: 3 tests pass (0.01s); publish build 707,236 bytes under 780KB.
- Browser/layout matrix: 29 cases pass across three engines in 17s, zero Axe/console/request
  errors. Exact gradients persist through hover/press in both themes, keyboard focus uses
  blue, headings resolve to light navy/dark accent, and bottom contact has no address/phone.
- Carousel: 36 cases pass in 17s. Focus assertion updated for the requested accent layer.
- Desktop/mobile light/dark network, process and contact captures inspected.
- Local evidence: `evidence/navy-local/`. Motion: 25 cases pass in 41s; repository check:pr passes 83 Python, 26 runner and four PostgreSQL/time checks.

Published source `79dccdbfef67e89a5d1a47c912671f162f96d06e` (PR #68), dedicated Netlify
deploy `6acc8df9ad36738d279cabea`, ready/current at the custom hostname. All 27 served files
match the canonical build with CSP/noindex. Deployed browser matrix passes 29 cases in 34s
across three engines, including exact gradient states, heading/focus themes, contact removal,
clipboard and no-JS. Evidence: `evidence/navy-deployed/`. Owned server stopped; port 8794 free.
