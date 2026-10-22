# Project status and handoff

Last updated: 2026-10-22 (documentation consolidation; no new inbox/database/vendor check).
Research snapshot verified 16 October: 132 providers, 224 programmes, 112 ready under bulk-send,
and 350 non-invalid research email records. This is distinct from current correspondence state.
New teammates: read `docs/onboarding.md`, `docs/codex-handoff.md`, `docs/architecture.md` and
`docs/tools-and-credits.md`. Older session notes preserve dated history, not current authority.

## Current state and next actions — consolidated 22 October 2026

- **Research:** five completed database batches: US pilot 24/14, US-02 24/19, US-03 50/47,
  US-04 13/12 and GB-01 21/20 providers/ready. The 16 October hosted snapshot is 132/112,
  224 programmes and 350 non-invalid email records. No new research batch or database refresh
  was run for this documentation task.
- **Correspondence:** the last complete global check was 21 October at 13:32 IST: Attio held
  88 Sent, three Send failed, 14 Scheduled and 20 Awaiting review (125 records). Those stage
  counts are superseded in the scoped afternoon check only: four more Scheduled records
  became Sent and GSTT became Interested. No fresh global reconciliation is asserted here.
- **Latest scoped check:** 21 October afternoon confirmed all five UK messages due that day
  SENT and ten future messages matched in Gmail Scheduled for 22–23 October, at five/day.
  Future dates may now have elapsed; inspect Gmail before changing stages. GSTT requested a
  discussion; no meeting was booked by that check. Larkin, WVU and St Luke's remain held
  Send failed. Southampton's consultant prerequisite and Moorfields' 2027 pause remain cautions.
- **Pending review:** the sixth twenty US/UK/Australian drafts remain Awaiting review,
  unapproved and unscheduled. Their completed preparation and audit record is consolidated below.
  The original UK group was approved later; the old 16 October “twenty UK awaiting review”
  section is historical, not the current twenty-draft inventory.
- **Meeting next step:** on 22 October a GSTT reply introducing Ashwini was shown in the
  `Draft-GSTT-Reply` chat with a Calendly placeholder. It was not sent or saved as a Gmail
  draft by that action. Obtain the real link and applicable exact approval before sending.
- **Operations:** Attio Free is the correspondence tracker; Supabase remains the research
  store. Whole-mailbox sync is removed. Keep legacy activity historical and do not activate
  the pending quota migration for Attio groups. Dashboard aggregates remain dated snapshots.
- **Credit lessons:** the nine-provider contact-search pilot failed its continuation threshold
  (zero verified programme contacts); do not adopt it. TypeSafe remains synthetic-only/gated.
  Current vendor balances were not checked; earlier figures keep their own dates/definitions.
- **Publication:** this task prepares public GitHub collaboration docs only; no Netlify release,
  website change, schema change, paid research, correspondence or monitoring is included.

## Firecrawl People contact-search pilot — 2026-10-21

- Tested FullEnrich profile search on nine screened `us-02`/`us-03` providers with outreach allowed, no discovered contact, no extracted person or outreach target, no outreach caution, and no exclusion. Two profile-only title searches returned 10 rows across four providers; two rows repeated, leaving eight unique profiles. Five providers returned no profiles.
- Checked candidate roles against official provider pages. The Children's National matches were GME staff, while its physician-observership page says the Office of Medical Education does not oversee those positions and directs observers to the relevant clinical division head. Baptist Health's page gives its International Observership contact route; returned profiles were specialty-level roles rather than the program contact. The Thomas Jefferson match was tied to its athletic-training program. Providence returned system-level roles unrelated to the Everett observership. No profile was verified as a program-specific outreach target, and the provider results supplied no provider-page source for that relationship.
- The pilot produced zero source-verified program contacts out of nine, below the three-contact continuation threshold. Do not integrate People into the standard workflow; keep using provider pages as the source of record. No email enrichment, prospect-table import, or outreach occurred.
- Profile search and source checks used net 94 credits against the 100-credit cap, including one feedback-credit refund. Account balance values remain private.
- Sources checked: [Children's physician-observership guidance](https://www.childrensnational.org/for-healthcare-professionals/healthcare-education/educational-resources/physician-observerships), [Children's GME team](https://www.childrensnational.org/for-healthcare-professionals/healthcare-education/graduate-medical-education/our-team), [Children's international visitor education](https://international.childrensnational.org/for-healthcare-professionals/medical-education-and-training), [Baptist Health international observerships](https://baptisthealth.net/international-services/international-healthcare-professionals/international-observerships), [Thomas Jefferson athletic-training handbook](https://www.jefferson.edu/content/dam/academic/rehabilitation-sciences/exercise-science/msat-handbook-25-26.pdf), and [Providence environmental-stewardship leadership](https://www.providence.org/about/advocacy-and-social-responsibility/environmental-stewardship/leadership).

## What this is

GooCampusWorld (goocampusworld.com) wants providers of clinical observerships, electives, clinical
attachments and fellowships for international medical students and graduates (IMGs) to list their
programs on the site. This repository builds the prospect database the outreach team uses to email
(and reach on LinkedIn) the right person at each provider, with personalised context.

- Country-agnostic. The US comes first, with GB also researched; Australia (AU), New Zealand (NZ) and others remain potential new research batches. Australian outreach candidates do not establish a completed AU database batch.
  One batch = one country; batch names start with the ISO code (`us-pilot-01`, `gb-01`).
- Separate from the UK Outreach Pilot in `~/Developer/ai-outreach` (nothing is shared).
- Nothing in this repo sends email. Save office Gmail drafts first; Maheen approves the exact recipient, content
  and time before scheduling. Gmail then delivers at that time. Plan and review rules: `docs/outreach-plan.md`.

## Dashboard access update — 2026-10-09

Nandu (`nandu@goocampus.in`) is approved for the same dashboard access as Maheen and Ashwini.
The dashboard has one approved-viewer access level, with emailed magic-link sign-in and no separate admin role.
Apply the tracked list using `outreach-viewers` from clean canonical `main`; verify an idempotent second sync
reports no additions, removals or new accounts. No page redeploy is needed for this access-only update.

## Decisions so far (and why)

| Area | Decision | Rejected / deferred |
|---|---|---|
| Storage | Supabase project `global-clinical-outreach` (ref `wevhojfgxckximznhvbh`, ap-south-1, GooCampus Pro org) | Google Sheets (too much data), Neon/Convex/Firebase |
| Team CRM | Attio Free selected 13 October for project correspondence; Supabase remains research store | Broader in-house Phase 2 CRM deferred; no whole-mailbox sync |
| Pilot outreach | Office Gmail `maheenejaz@goocampus.in`; saved drafts, exact approval before scheduling; first 5 providers only, 1 contact each, recipient-local working hours | Autonomous campaign sending, repo sender, scheduling all 77 before pilot review |
| Draft review | `docs/outreach-plan.md`: mandatory gates plus rubric v1, 90/100 working threshold; source evidence and human approval required | Score alone as authorization or a deliverability guarantee |
| Outreach activity | Legacy Supabase editor implemented; current correspondence tracked in Attio with requested Gmail evidence checks | Continuous inbox monitoring, automated follow-ups and duplicate histories remain excluded |
| Clinical partnership page | GOO-1539: standalone Attio Mono marketing page and dedicated Netlify review at `partners-preview.goocampusglobal.com`; current website team owns final integration and a visible homepage link before the Gmail pilot | Main-site rebuild, directory/booking backend, public commercial terms and treating a preview as outreach readiness |
| Provider types | `academic`, `community`, `placement_company`, `fellowship` | — |
| Discovery | Curated IMG sources first, general WebSearch last; every lead records `source_kind` and passes a one-page screen before scraping | Exa, Parallel FindAll (possible later) |
| Scraping | Firecrawl Hobby (~₹1,800 / $16–19 a month, 5,000 credits). Plain markdown scrapes only, 1 credit/page; Claude extracts the fields. Billing is per page, not per field, so every commonly available field is captured and raw pages are cached for re-extraction | Firecrawl JSON mode (5 credits/page), Apify, Bright Data |
| Named contacts (v1) | Targeted WebSearch for staff/leadership pages, then Firecrawl scrapes them (`data/extra-pages/<batch>.json`). WebFetch may only screen pages, never be a source | **Apify Leads Finder deferred** by the user for v1; reconsider only if v1 coverage stays too low |
| Emails | Published first, then guess from the domain's pattern, verified with Reoon (power mode, ~$1/1,000) | Paid enrichment |
| LinkedIn | Profile URLs found via WebSearch only; the team verifies by hand | Scraping linkedin.com (ToS) |
| Hosted dashboard | `outreach.goocampusglobal.com` on Netlify (static `web/`), Supabase Auth emailed-link sign-in, approved viewers Maheen, Ashwini and Nandu (`config/dashboard-viewers.json`), data published by `outreach publish` into `dashboards` | Netlify password (paid plan, still a snapshot), publishing the HTML files, localhost |
| Agent | Codex from 2026-10-09 (handoff `docs/codex-handoff.md`, skill in `.agents/skills/`) | Claude Code (still works through the `.claude/skills` link) |
| Credentials | Dedicated Infisical project `Global-Clinical-Outreach` (`1b056234-5b7a-4d98-87a2-635730076e34`), environment prod, path `/Production/Pipeline/v1`, keys `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIRECRAWL_API_KEY`, `REOON_API_KEY` | Shared GooCampus project |

## Earlier dashboard access update — Ashwini (2026-10-09)

- At this earlier update, authorized dashboard viewers were `maheenejaz@goocampus.in` and `ashwini.s@goocampus.in`. Both use emailed-link sign-in at https://outreach.goocampusglobal.com.
- Applied and verified in production on 2026-10-09 via PR [#35](https://github.com/maheen-ejaz/global-clinical-outreach/pull/35), merge commit `fb1f66d24d452caf08f9204d7b614a948f7d6af2`. The runner added Ashwini and created her confirmed Auth account; no viewer was removed. Verification rerun reported no additions, removals or account creations. The dashboard returned HTTP 200. That update completed; Nandu’s later addition is recorded above.
- Apply the merged allowlist from clean canonical `main` with `npm run infisical:run -- outreach-viewers`; rerun to verify no additions, removals or account creations remain. The existing `dashboards` access policy uses this list. No website redeploy is required (runbook: Hosted dashboard).

## Clinical partnership page — GOO-1539 (2026-10-09)

- Standalone source: `marketing/clinical-partnerships/`; integration instructions `HANDOFF.md`, original
  supplied design ZIP/references under `vendor/`, provenance and licences in `asset-manifest.json`,
  browser screenshots and reproducible checks under `qa/`. The page includes the full section sequence,
  truthful planned-versus-live distinction, native FAQ, direct mailto and accessible copy-email behavior.
- Chosen fallback: original abstract education/process SVG; no stock photo, partner logos, statistics,
  commercial promises or correspondence backend. CSS/variables/fonts are isolated to the partnership root.
- Netlify discovery verified the operator session and GooCampus Team (`69943cc894e50bb0b124fab5`, slug
  `goocampus`), and the owned `goocampusglobal.com` zone (`6aa4f6d2c5c59adcf6dc1e34`). The selected
  `partners-preview` hostname was unused: no existing record or site assignment.
- Acceptance/check evidence: 29 browser/layout cases across Chromium/WebKit/Firefox, both themes,
  six required widths and 200% text; native Chromium clipboard plus success/fallback/no-JS tests;
  zero Axe violations. Local Lighthouse: mobile performance/accessibility 99/100, desktop 100/100.
  Required PR check: 26 Node and 78 Python tests passed. Details and recovery observations: `qa/QA.md`.
- Intake owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Build-Clinical-Partnerships`).
  Canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-1539`; branch
  `codex/clinical-partnerships-1539`; initial HEAD/fetched default
  `ec035a9cebab967c78068a0606c69d16b493dc80`, fetched 2026-10-09T10:51:22Z; clean at intake,
  disposition `active` during implementation. This task owns the dedicated page release; no other
  active project release owner appeared in native chat discovery.
- Delivered source through [PR #39](https://github.com/maheen-ejaz/global-clinical-outreach/pull/39),
  merge `7e048c30d3fe803fcfc5837b7abd1b52ebe74a17`. The single independent reviewer found a non-blocking
  `.body` utility-adaptation bug; it was fixed, regression-checked and verified by that same reviewer.
- Dedicated Netlify site `goocampus-clinical-partners-preview`, ID `c6f69133-aea0-4f88-8e7d-78d7c4332e24`.
  Review https://partners-preview.goocampusglobal.com/; fallback
  https://goocampus-clinical-partners-preview.netlify.app/.
  Initial review deploy `6ac8ceef1511aa3c4e89bb52` (ready/published 2026-10-09T11:24:33.176Z), immutable URL
  https://6ac8ceef1511aa3c4e89bb52--goocampus-clinical-partners-preview.netlify.app/.
  Full deployed source SHA `7e048c30d3fe803fcfc5837b7abd1b52ebe74a17` is recorded in the deploy title.
- Selected DNS record `6ac8cdb1d0153e0008607d2a`: `NETLIFY`, `partners-preview.goocampusglobal.com` →
  `goocampus-clinical-partners-preview.netlify.app`. Netlify created it when associating the owned hostname;
  all four older record IDs/targets remain. Issued certificate covers `*.goocampusglobal.com` and expires
  2027-01-05T06:43:27Z; forced HTTPS verified. Domain/API/config recovery outcomes are in `qa/QA.md`.
- Canonical live proof at 2026-10-09T11:26:43.957848Z: custom-host trusted HTTPS, expected HTML/noindex/CSP,
  all 12 served files byte-matched the canonical build. Full deployed browser matrix: 29 cases in 31s,
  zero console/network/Axe violations; desktop/mobile light/dark screenshots captured. Public/authoritative
  DNS resolves correctly; this Mac's recursive DNS retained an earlier NXDOMAIN, so public DNS-over-HTTPS
  verified the custom host, the browser suite used the Netlify hostname, and custom captures used the
  exact public-DNS IP with certificate validation. No network settings were changed.
- Post-merge canonical sync: `ec035a9cebab967c78068a0606c69d16b493dc80` →
  `7e048c30d3fe803fcfc5837b7abd1b52ebe74a17`, fetched 2026-10-09T11:15:07.477010Z, clean before/after.
  Deployment/evidence follow-up branch `codex/clinical-partnerships-1539-evidence` is task-owned in the
  same sibling worktree. Final integration and owned cleanup evidence/disposition are recorded on GOO-1539.
- Next: Maheen reviews the working page and the current GooCampusWorld website team integrates the
  confirmed final route plus homepage/stable navigation links. The source/asset/design/QA handoff is
  attached to GOO-1539; the rollout ticket stays open until final main-site integration is verified.

### Partnership copy review (2026-10-09)

- Maheen requested a full-page review and surgical edits for sharper, shorter, clearer copy.
  Tightened the hero/stage note and company introduction, made process steps and FAQs more direct,
  and replaced abstract wording with specific actions. The HTML structure, attributes, design and
  contact controls are unchanged. Existing offerings remain live; eligibility, responsibilities and
  private commercial terms remain provider-specific; the new collection still depends on an initial
  provider group and agreed details.
- Acceptance: no new factual or commercial claims, complete section/FAQ coverage, unchanged links and
  controls, and readable layouts across both themes, six required widths and 200% text. Refresh the
  preview and versioned integration package after checks and the isolated release review.
- The main narrative is 607 → 547 words (9.9% shorter), with identical HTML tags/attributes.
  Review/check records and updated local screenshots are under `marketing/clinical-partnerships/qa/`.
- Owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Sharpen-Partnership-Copy`).
  Canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-copy-1539`, branch
  `codex/partnership-copy-1539`, initial HEAD/fetched default
  `a706c0f9992b0fd0c84094fb6f4596fde8872339`, fetched 2026-10-09T11:45:48Z; clean at intake,
  disposition `active`. This task owns the dedicated partnership-preview release; dashboard-access
  work uses a separate worktree and is coordinated before canonical release operations.
- Dashboard-access owner confirmed canonical work complete and handed off at
  `ef9a0324eb21734d200be6bbe0f37524afd7f9bc`. Its merged changes are preserved in this branch.
- Copy revision delivered through [PR #42](https://github.com/maheen-ejaz/global-clinical-outreach/pull/42),
  runtime SHA `f2d06955bca92411fd425c9721c9a779d99ab528`. The one isolated reviewer flagged an implication
  of already-agreed provider participation; the row now states future agreement and the same reviewer
  verified the correction. Affected/browser checks and required PR check passed after it.
- Copy preview deploy `6ac8d83dcc2fe463a5476aa1`, ready/published 2026-10-09T12:04:15.093Z, at the
  existing dedicated site/domain. All 12 served files matched the build over trusted custom-host HTTPS
  at 2026-10-09T12:05:40.612419Z. Deployed browser matrix: 29 cases in 32s, zero Axe/console/network
  violations, both themes/six widths/200% text and keyboard/copy/no-JS behavior. Evidence and fresh
  screenshots: `qa/evidence/copy-review-deployed/`; the earlier local DNS limitation remains documented.
- Canonical post-merge sync was clean: `ef9a0324eb21734d200be6bbe0f37524afd7f9bc` →
  `f2d06955bca92411fd425c9721c9a779d99ab528`, fetched 2026-10-09T12:03:53.276017Z. Evidence/package follow-up
  branch is `codex/partnership-copy-1539-evidence` in the same owned worktree. Final close/cleanup and
  latest ZIP revision are recorded on GOO-1539. Main-site integration remains owned by the current
  website team; this copy revision does not make the Gmail pilot ready.

### Partnership motion refinement (2026-10-09)

- Maheen requested premium, subtle animation that feels native to Attio Mono. The page-local adaptation
  uses the system's 4px spacing unit for one-time section settling, 150ms directional-arrow/press and
  FAQ-indicator feedback, and a 200ms native-FAQ answer settling. Original vendor tokens, palette,
  typography, geometry and copy remain intact. This explicit request extends the earlier colour/border-only
  transition default; no vendor/reference file is edited.
- Acceptance: every section remains fully visible without JavaScript and during motion; no opacity
  reduction, loops, parallax or layout animation; reduced motion disables the layer and cancels active
  section motion immediately; keyboard targets stay stable; touch does not retain hover movement.
  Verify normal/reduced motion, dynamic preference changes, no-JS/unsupported-API fallback, both themes,
  six widths/200% text, native FAQ/email/copy behavior and published source/header parity.
- Owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Refine-Partnership-Motion`); canonical
  repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-motion-1539`; branch
  `codex/partnership-motion-1539`; clean intake HEAD/fetched default
  `24e430861361bcc4ccef360c6d5830686bd2dd8e`, fetched 2026-10-09T12:25:47Z; disposition `active`.
  Native chat discovery found no other active release owner for this project. This task owns the
  dedicated partnership-preview release; final main-site integration remains with the website team.
- Motion revision delivered in [PR #44](https://github.com/maheen-ejaz/global-clinical-outreach/pull/44),
  runtime SHA `da147f4f9d867d4d1783d98ce66cad9896a0909c`. The one isolated reviewer has no remaining
  findings after lifecycle event coverage was added; a screenshot observation was ruled out by
  matching illustration-region pixels. Local checks: 25 motion cases, 29 layout/control cases,
  78 Python and 26 Node tests; fresh Lighthouse mobile 99/100 and desktop 100/100, CLS 0.
- Initial motion preview deploy `6ac8e59046e0a1f29bc6a77e`, ready/published 2026-10-09T13:01:07.986Z.
  All 13 served files matched the build over trusted custom-host HTTPS at 2026-10-09T13:03:57.749968Z;
  expected CSP/noindex verified. Deployed motion suite: 25 cases in 66s; deployed layout/control suite:
  29 cases in 26s, with zero Axe/console/network errors. Fresh light/dark screenshots and desktop/mobile
  motion clips are in `qa/evidence/motion-deployed/` and `motion-layout-deployed/`.
- Canonical sync was clean: `24e430861361bcc4ccef360c6d5830686bd2dd8e` →
  `da147f4f9d867d4d1783d98ce66cad9896a0909c`, fetched 2026-10-09T12:59:45.411784Z. Follow-up evidence/package
  branch `codex/partnership-motion-1539-evidence` uses the same owned worktree. Final package/cleanup
  identities and disposition are recorded on GOO-1539. Dedicated site/DNS are retained for review;
  overall main-site integration and Gmail prerequisites remain unchanged.
- Final keyboard check identified inherited positional transition on the skip link; restrict positional
  control feedback to buttons/arrows so the skip link appears immediately. Add a cross-engine/theme
  regression assertion. Corrected source/evidence use the same task-owned worktree on
  `codex/partnership-motion-1539-focus`, based on `f253ea0019ead4d0f7014e7183d1d518ff5820ca`.
- Skip-link correction checks passed: 25 motion cases in 40s, 78 Python and 26 Node tests. The same
  isolated reviewer confirmed the selector/regression fix. Original local 39s motion evidence is
  retained separately; final correction evidence lives in `qa/evidence/motion-focus-local/`.
- Final motion correction delivered in [PR #46](https://github.com/maheen-ejaz/global-clinical-outreach/pull/46),
  source `f0c411e74467f14308490fd1d463ba3a13f9ebf7`. Latest preview deploy
  `6ac8eaadb8796491c80fd715` is ready/published at 2026-10-09T13:22:55.270Z. All 13 files matched source
  over trusted custom-host HTTPS at 2026-10-09T13:24:41.131922Z; CSP/noindex preserved. Final deployed
  motion suite passed 25 cases in 74s, including immediate skip-link focus; layout/control suite
  passed 29 cases in 30s with zero Axe/console/network errors. Final evidence is under
  `qa/evidence/motion-final-deployed/` and `motion-final-layout/`.
- Canonical correction sync was clean: `f253ea0019ead4d0f7014e7183d1d518ff5820ca` →
  `f0c411e74467f14308490fd1d463ba3a13f9ebf7`, fetched 2026-10-09T13:21:59.444923Z. Final evidence/package
  branch is `codex/partnership-motion-1539-final` in the same owned worktree. Final package and owned
  cleanup identities/disposition are recorded on GOO-1539; earlier source/evidence remain history.

### Illustrative programme-card carousel (2026-10-09)

- Maheen requested a course-card carousel in the same Netlify partnership preview, with AI imagery
  and dummy institution/date/fee details informed by already-scraped programmes. This explicitly
  extends the earlier no-programme-card/default-no-fee boundary for a labelled illustrative section;
  it does not create live listings, booking, payments, affiliations or new public prospect access.
- Cached-data research: 8 representative extracted programmes, 6 checked against cached markdown.
  Common fields are programme type/specialty, institution/location, duration, eligibility, dates/window,
  tuition/fee and billing unit, separate application fees and funding. Keep stipends separate from fees
  and show missing amounts as on request; attachment-style externships are not a direct pricing equivalent.
  Sources/patterns live in `marketing/clinical-partnerships/qa/card-research.json`, excluded from deployment.
- Four fictional cards cover observership, elective, attachment and fellowship. Examples use US$2,500
  per 4 weeks, US$4,250 per 4 weeks plus US$175 application fee, an on-request attachment fee, and
  self-funded US$1,400/month fellowship tuition. These are synthetic interface examples, not provider
  quotes or pricing recommendations. All institutions/dates/eligibility are explicitly illustrative.
- Built-in imagegen produced four cohesive generic clinical-education photographs. Original outputs
  and prompt set are preserved in QA; responsive delivery exports are self-hosted under
  `assets/images/programmes/` with provenance in the asset manifest. No real institution/partner is depicted.
- Acceptance: readable Attio Mono cards with the original type/palette/radii/hairlines, explicit example
  labels, correct fee units/date durations, swipe/native horizontal scrolling, keyboard and previous/next
  controls, no autoplay, preserved focus, reduced-motion behavior, and no-JS readable fallback. Verify
  both themes, six widths/200% text, image/performance budgets, all existing motion/contact/FAQ behavior,
  private/public data separation, and production source/header parity before release.
- Owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Preview-Programme-Cards`); canonical
  repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-carousel-1539`, branch
  `codex/partnership-carousel-1539`, initial HEAD/fetched default
  `8933114ccd9954e8e6700832f8a9d8da21ed2c69`, fetched 2026-10-09T13:41:39Z, clean at intake;
  disposition `active`. Native chat discovery found no other active project release owner; this task
  owns the dedicated preview release. Current website team still owns final main-site integration.
- Local preparation/checks took approximately 63 minutes, including four built-in image generations.
  Passed 33 carousel cases (13s), 29 existing layout/control cases (14s), 25 motion cases (44s),
  2 build/style-isolation tests (0.01s), required PR checks (78 Python/26 Node/profile contract),
  and local Lighthouse mobile 95/100 and desktop 100/100 performance/accessibility, CLS 0.
  Exactly one isolated blind read-only reviewer found no blocking issue; source/fee/date/asset and
  private/public boundaries were checked. Source and local evidence are preserved in QA.
- PR #48 merged runtime source `5598eccf5bece00448d4d292e17c58b9432546b0`; clean canonical `main`
  fast-forwarded from `8933114ccd9954e8e6700832f8a9d8da21ed2c69` after the fetch completed,
  at 2026-10-09T14:46:19.609313Z. An earlier guarded sync ran before the pending fetch completed
  and was a no-op at the old revision; the full merged SHA was explicitly required before release.
  Dedicated deploy `6ac8fe4096879ebb1b29181b` is ready/published 2026-10-09T14:46:29.847Z.
  Site/team/custom host are unchanged; no database or auth release applies to this static page.
  First-candidate source/header proof matched all 22 served files; custom-host captures passed.
  The complete live carousel suite caught late WebKit offscreen layout leaving Next disabled even
  when the actual maximum was 290px. Serial retry and interval polling did not resolve it; refresh
  bounds after layout, on reveal scroll and focus, and add a three-engine late-layout regression.
  The image-layout harness now waits for selected resources before each resize/navigation, preserving
  strict error checks. These are separate from any final deployed success claim.
  Correction branch is `codex/partnership-carousel-final-1539` in the same owned worktree.
- The same reviewer verified the late-layout change and identified unchanged aria-live writes on
  vertical scrolling. Deduplicated status writes; all 36 carousel cases passed again (15s), including
  quiet status mutations in six browser/theme cases. The same reviewer verified both corrections;
  no additional reviewer was used. Final PR checks passed 78 Python/26 Node/profile contract.
- PR #49 merged final runtime source `5561782f3fdc5128162b1f7022900671c8bff67e`; canonical main
  fast-forwarded from `5598eccf5bece00448d4d292e17c58b9432546b0` at 2026-10-09T15:02:36.145065Z.
  Final dedicated Netlify deploy `6ac9021122b00e097abe265e` is ready/published
  2026-10-09T15:02:44.216Z. All 22 served files matched the canonical build with trusted custom-host
  HTTPS and expected CSP/noindex at 2026-10-09T15:03:20.373226Z; full publish directory is 483,008
  bytes uncompressed. Final live carousel passed 36 cases in 65s; layout/control passed 29 in 39s
  with zero Axe/console/request errors; the final motion suite passed 25 cases in 109s. Custom-host light/dark desktop/mobile captures passed with
  the same documented local-DNS limitation; no machine settings or DNS records changed.
  Final source/evidence package and exact owned cleanup identities/disposition are recorded on
  GOO-1539. Current record branch is `codex/partnership-carousel-record-1539` in the same worktree;
  website-team integration and Maheen's review remain pending, so the rollout ticket stays In Review.

### Partnership marketing polish (2026-10-09)

- Maheen requested additional generated imagery, bento cards, icons and marketing-page polish in
  the same Netlify preview. Keep the already-delivered four-card illustrative carousel and its
  cached-data-informed fictional fee formats; this revision improves the surrounding page.
- Acceptance: two new clearly illustrative AI images, responsive bento benefit cards and consistent
  1.5px outline icons; retain Attio Mono tokens, type, spacing, borders and radii. Preserve truthful
  planned/live wording, native contact/FAQ/carousel controls, dark mode, keyboard, no-JS and reduced
  motion; no fake partner logos, claims or application flows. Verify responsive layouts, assets,
  accessibility/performance budgets and live source/header parity on the same dedicated site.
- Owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Polish-Partnership-Page`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-polish-1539`, branch
  `codex/partnership-marketing-polish-1539`; base/fetched default
  `d1461e956430460ed8bdf353cbacbcdb1a61762a`, clean at intake; fetched default revalidated
  2026-10-09T15:29:26Z; disposition `active`.
  Native task discovery found no other active project release owner; this task owns the dedicated
  preview release. Main-site integration remains with the current GooCampusWorld website team.
- Local checks: 29 layout/control cases (15s), 36 carousel cases (15s), 25 motion cases (44s), two
  build/style-isolation tests (0.01s), all 19 manifest asset hashes and original token CSS, required
  PR check (78 Python/26 Node/profile contract). Fresh Lighthouse mobile performance/accessibility
  97/100, desktop 100/100; CLS 0 on both. Publish directory 608,304 bytes uncompressed. Approximately
  12 minutes for local design, two built-in image generations, delivery exports and verification.
- One isolated blind read-only reviewer found no blocking issue. PR #51 merged runtime
  `e2f0dee1403e13980f0dddd882b480d50baffeb9`; clean canonical main fast-forwarded from
  `d1461e956430460ed8bdf353cbacbcdb1a61762a` at 2026-10-09T15:36:14.574640Z. Same dedicated site/team;
  deploy `6ac909f5fc7dc07a4bd5118f` ready/published 2026-10-09T15:36:25.547Z. All 26 served files
  matched canonical bytes with expected CSP/noindex at 2026-10-09T15:37:21.907790Z. No schema/auth
  release applies to this static page, per the standalone-page runbook.
- Local DNS now resolves the custom host; native HTTPS and browser checks use it directly with
  normal TLS, without the earlier IP/DoH workaround. No machine or DNS settings changed. Final live
  layout/control suite passed 29 cases in 31s with zero Axe/console/request errors.
  Final live carousel suite passed 36 cases in 45s; motion passed 25 cases in 74s on the custom host.
  Record branch: `codex/partnership-marketing-record-1539` in the same worktree. Final source package
  and owned cleanup identities/disposition are recorded on GOO-1539; main-site integration remains
  pending with the current website team and the ticket stays In Review.

### Image direction review (2026-10-09)

- Maheen rejected the current generated-image style and requested a more professional, experienced
  impression. After an optional style question, Maheen requested at least five visual directions
  on localhost before deciding. Hold replacement of the six production images and Netlify release
  until a direction is selected; this stage produces a local comparison gallery only.
- Reviewed the two marketing images and four programme images. The current set relies heavily on
  staged small-group classroom scenes and anatomy props. Compare clinical documentary, institutional
  architecture, formal faculty portrait, monochrome editorial and architectural ink illustration.
  Each direction uses a new generated exemplar, full image and the same hero/course-card contexts.
- Acceptance: five distinct images, readable Attio Mono gallery, responsive controls, native keyboard
  access, visible fictional/AI labels, functioning local preview; existing production page untouched.
- Owner: Codex task `01a12048-d228-7080-9956-4126f4000412` (`1539: Compare-Image-Styles`);
  repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-image-styles-1539`, branch
  `codex/partnership-image-styles-1539`; base/fetched default
  `74b5756ba0a73892294c428d641f8b0964a7e2ef`, fetched/validated 2026-10-09T16:29:13Z;
  disposition `active`. No application release is required for this local-only review stage.
- Gallery ready at `http://localhost:8793/qa/image-style-review/`; five full-image links, hero and
  course-card contexts, a direction selector and both themes. Original PNGs, complete built-in
  prompts and hashed WebP exports are preserved under `qa/image-style-review/`, excluded from
  publishing. Existing production HTML/CSS/assets and Netlify release remain untouched.
- Four responsive Chromium checks passed in 3s (390/1440px, both themes, all five context switches,
  native selector/keyboard focus, no-JS fallback, 44px controls, zero Axe/console/request errors).
  Two build/style-isolation tests passed; build remains 608,304 bytes and excludes the gallery.
  Initial Axe harness required explicit browser.newContext; correction passed without a page
  runtime change. Gallery README/evidence records reproduction and actual outcomes.
- Owned local review server: foreground exec session 57688, Python PID 57281 on 127.0.0.1:8793.
  Retain it and the owned worktree for Maheen's requested review. Replacement direction is pending;
  this is a reviewable local stage. The six-image refresh and Netlify release await selection.

### Selected institutional image direction (2026-10-09)

- Maheen selected Option 2, Institutional architecture, and requested it across the entire page.
  This satisfies the earlier selection hold and authorises the six-image replacement and the
  existing scoped preview-release procedure. Reuse the exact approved exemplar for the hero;
  generate five distinct architectural environments for the bento and four programme categories.
- Acceptance: architecture-led academic/clinical environments, restrained materials/lighting and
  few people in the middle distance; six distinct images with clear fictional/AI labels. Preserve
  Attio Mono layout/type/icons, existing copy/fees, native controls, dark/reduced-motion/no-JS,
  responsive framing and working performance budget. Archive superseded delivery assets in QA
  and exclude them from publishing; keep original art and direction studies for provenance.
- Resumed owner: `01a12048-d228-7080-9956-4126f4000412` (`1539: Apply-Institutional-Imagery`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; existing owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-partners-image-styles-1539`, branch
  `codex/partnership-image-styles-1539`, resumed HEAD `293e60b0fb6d66c010c6d2d683967454e6b80ff2`.
  Fetched default `74b5756ba0a73892294c428d641f8b0964a7e2ef`, validated 2026-10-09T17:14:20Z,
  clean at resume; disposition `active`. Native task discovery found no other active same-project
  release owner; this task owns the dedicated preview release. Website-team integration remains separate.
- New public image exports live in `assets/images/institutional/`; active/archived manifests verify
  all 19/12 entries. Earlier delivery images were moved byte-for-byte to `qa/superseded-images/`,
  and the original PNGs/direction gallery remain in QA. Publishing excludes every QA/archive artifact.
  Quality-76 encoding initially produced 782,359 bytes; tested quality-72 WebP exports retain the
  composition and reduce the complete publish directory to 747,101 bytes, below the working budget.
- Local checks: final layout/control 29 cases (15s), carousel 36 (15s), motion 25 (44s), gallery four
  cases (3s), two build/style-isolation tests (0.01s), required PR check (78 Python/26 Node/profile
  contract), fresh Lighthouse mobile performance/accessibility 96/100 and desktop 100/100, CLS 0.
  Approximately 18 minutes of local selected-image preparation/generation/verification. One isolated
  blind read-only reviewer found no blocking issue; approved hero source is byte-identical to Option 2.
- PR #53 runtime source `e73e4077ec4101bbb4da61f270314c2cf5790e5c`; canonical main fast-forwarded
  from `74b5756ba0a73892294c428d641f8b0964a7e2ef` at 2026-10-09T17:37:35.025385Z. Dedicated deploy
  `6ac926662f49de17ab8391cc` ready/published 2026-10-09T17:37:46.021Z. All 26 served files matched
  canonical source with expected CSP/noindex over native custom-host HTTPS at 2026-10-09T17:39:36.904730Z.
  Live layout/control 29 cases passed in 34s, zero Axe/console/request errors. No schema/auth release
  applies to this static page. Record branch `codex/partnership-institutional-record-1539` shares the
  owned worktree; final package and cleanup identities/disposition are recorded on GOO-1539.
- Final deployed carousel passed 36 cases in 32s and motion passed 25 in 68s on the custom host.
  The owned localhost server was stopped after checks, and the live page was opened in the system
  browser. No DNS/auth/data change occurred. Website-team main-site integration remains pending;
  GOO-1539 stays In Review. All six imagery replacements are complete in the dedicated preview.

## How to run a batch

Use the skill `.agents/skills/research-providers/SKILL.md` (steps 1–7, including 3b for named contacts and 7 to
publish the dashboard; `.claude/skills/research-providers` links to it). Commands run from the canonical checkout `~/Developer/global-clinical-outreach` on an
up-to-date, clean `main`:

```sh
npm run check:checkout
OUTREACH_BATCH=<batch> npm run infisical:run -- outreach-<step>   # discover | scrape | load | emails | report
```

Details, timeouts and rollback: `docs/pipeline-runbook.md`. Credential setup: `TOOLCHAIN.md`.

## Where things are

- Code, schema, skill and docs: this repo (GitHub `maheen-ejaz/global-clinical-outreach`, private).
- Hosted dashboard: https://outreach.goocampusglobal.com (Netlify site `goocampus-outreach`, ID `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, team GooCampus
  Team). Page source `web/` (generated from `scripts/dashboard-template.html` by `scripts/build-web.py`); data in the
  `dashboards` table, refreshed with `outreach-publish`. Runbook: "Hosted dashboard".
- Dashboard template and builders, now tracked: `scripts/dashboard-template.html`, `scripts/build-dashboard.py`,
  `scripts/build-final-report.py` (moved out of `data/reports/` on 2026-10-09; outputs still go to `data/reports/`).
- Data of record: Supabase tables `organizations`, `programs`, `people`, `emails`, `news_items`,
  `pages`, `pipeline_runs`; raw page markdown in the private Storage bucket `raw-pages`.
- Local working files (gitignored, on this Mac only) in `data/`:
  - `discovery/<batch>.json`, `extra-pages/<batch>.json`, `extractions/<batch>/<domain>.json`
  - `pages/<domain>/` cached markdown plus `index.json`
  - `reports/<batch>-targets.csv` (from `outreach-report`)
  - `reports/us-pilot-01-dashboard.html`: interactive dashboard (open in Chrome), shared with the team
    as a file (never published). Rebuild with `uv run --frozen python scripts/build-dashboard.py us-pilot-01`, which
    merges `reports/dashboard-template.html` + `reports/us-pilot-01-dashboard-data.json` (snapshot of
    2026-10-06 22:39 IST, checked against Supabase on 2026-10-07: counts and email statuses match) +
    fee/window statuses from `extractions/us-pilot-01/` + `reports/us-pilot-01-partnerships.json`.
    To refresh the snapshot, query Supabase into the same shape (`generated_at`, `runs[]`, `orgs[]` with
    nested `programs`, `people`, `emails`). Edit the template, never the built file. The template
    follows the Attio Mono design system (`~/Downloads/Attio Mono`) with the blue accent layer.
  - `reports/us-pilot-01-partnerships.json`: which providers state they are open to partnerships, with
    quotes and source URLs (from cached pages only).
  - `reports/us-02-dashboard.html`: the us-02 dashboard, same template, built from
    `reports/us-02-dashboard-data.json` (Supabase snapshot of 2026-10-08) with
    `uv run --frozen python scripts/build-dashboard.py us-02`. Its snapshot adds `source_kind`, `contactable`,
    `catch_all_domain` and `screen_failed` (true only when a screen exists and fails) per org; the batch text
    lives in `reports/us-02-dashboard-meta.json`.
  - `reports/final-report.html`: combined final report of both batches (totals, side-by-side funnels, a
    16-measure comparison, the 9 ready providers, next steps), same design. Rebuild with
    `python3 data/reports/build-final-report.py` (local script; its figures are written in, so update them
    after any new batch). To view all three pages with working links:
    `cd data/reports && python3 -m http.server 8765 --bind 127.0.0.1`, then open
    http://127.0.0.1:8765/final-report.html.

## Pilot results (`us-pilot-01`, 24 US providers, 2026-10-06/07)

- 21 with an IMG-relevant program (44 programs), 15 with a full address, 17 with a usable email
  (13 with a verified one), **10 with a named contact** (4 before the targeted contact search).
- Spend: 195 Firecrawl credits (~4% of a month). The original run made 61 email-address checks (~$0.06); later
  email-domain runs added 27 server checks, for 88 logged email-check operations in the current dashboard.
- Outreach cautions are recorded in `organizations.details.outreach_caution`:
  - Yale: **do not contact** (the site forbids unsolicited outreach).
  - Griffin: contact only the observership inbox.
  - Saint Peter's: says it works with no third-party agencies, so pitch a free listing.
- Not viable for now: Cincinnati (applications suspended), Northwestern (partner schools only), IMG
  Rotations (site 404). Athens Medical Group was removed (Greek, not US).

## Batch `us-02` results (24 US providers, 2026-10-08)

- **Scope change, approved by the user mid-batch:** the brief was 25 community and teaching hospitals whose
  internal or family medicine programmes run IMG observerships and name a coordinator. About 75
  hospitals were checked; only about 12 passed the screen and only about 4 matched the brief. The user chose
  to widen: 11 community hospitals (6 internal/family medicine or general observerships, 2 international
  observer programs, 3 psychiatry) and 13 lesser-known university teaching hospitals. 20 more were screened,
  failed and kept on record in the discovery file.
- **Ready to email under `high-hit-rate`: 6 of 24 (25%)**, against the pilot's 3 of 24 (12.5%); target was 8.
  BronxCare (Noemi Edwards), Hurley (Annalynn Cummings), IU Pathology (Aleah La Neve), Missouri Neurology
  (Alan Jarvis), SUNY Upstate (Meaghan Mahar, likely), USF (Barbara Pearce, internal medicine residency
  contact rather than the observership office). `broad` listed 21 of 24 before the shortlist learned to drop providers
  whose re-screen failed (UNMC, Tufts).
- By provider type: community 2 of 11, academic 4 of 13. Within the brief's core group (community internal or
  family medicine): 1 of 6. By source: `img_directory` 4 of 13, `high_img_hospital` 1 of 3, `web_search` 1 of 8.
- Near misses: Larkin (verified coordinator email, but no read page says it takes IMGs), Kettering and MCW
  (published emails on servers that gave no clear answer), Griffin Memorial and Mount Sinai Miami (servers
  accept every address).
- 23 sites scraped and extracted (Sarah Bush Lincoln returns HTTP 502 to the scraper twice), plus 8 extra
  pages from the named-contact search. 109 extracted emails, names and programs all trace to cached pages.
- Fee status: stated 9, not stated 8, on request 4, free 2. Window: fixed dates 11, rolling 9, not stated 3.
- Spend: 154 page credits; 148 email-check operations (the checker ran out of prepaid credit mid-run and returned
  HTTP 403 until the user added 10,000 credits on 2026-10-08).

## Batch `us-03` results (50 US providers, 2026-10-08)

- **Brief (user's choices):** keep widening in the US, 50 providers, no placement companies, and a relaxed screen
  (a page silent about IMGs passes; only a stated refusal fails, PR #23). No institution from us-pilot-01 or us-02
  was reused. 65 screened from programme pages: 50 passed, 15 failed and stay on record in the discovery file.
- **Sources:** two new curated lists did most of the work: the AAO-HNS 2026 International Observership Directory
  (12 ENT departments, all named contacts) and the USCEHub state observership directory (6). Plus the APA psychiatry
  list (2) and department-level international observership pages found by search (30).
- **Ready to email: 46 of 50 under `bulk-send` (92%), 27 of 50 under `high-hit-rate`** (pilot 3 of 24, us-02 6 of 24).
  Not ready: UT Southwestern plastic surgery (no email on the page), UW urology (coordinator named, no email),
  CHOP (phone only), Children's National (no contact; divisions arrange observerships).
- By source under `high-hit-rate`: AAO-HNS directory 9 of 12, APA 1 of 2, USCEHub 1 of 6, web search 16 of 30.
- Mix: 43 academic, 5 community, 3 fellowship. Community observerships stay scarce in the US after three batches.
- 43 of 50 have a named outreach target; 36 a full address. Fee: stated 18, not stated 39, on request 6, free 2,
  paid position 1. Window: fixed dates 15, rolling 16, not stated 35.
- Spend: 289 Firecrawl credits (54 recorded plus 235 estimated for the run stopped at the 15-minute limit);
  187 email-check operations (138 address checks and 49 email-server/catch-all checks).
- Cautions recorded in extractions: CHOP and MSKCC-style rules (observerships must not be used toward US residency;
  MSKCC failed the screen for it), CHLA takes only practising doctors and trainees abroad, Stanford OHNS forbids
  contacting faculty (failed), BIDMC IR is not for pre-residency applicants, Barrow's window closes 15 Oct 2026.
- Every extracted name and email (164) was checked by script against the cached pages; all trace.

## Historical gaps and next steps — 2026-10-16 (superseded by current state above)

- Review the twenty UK draft recipient/content versions in the private review Page. They remain
  Awaiting review and unscheduled; source consolidation and dashboard release approve no sends.
- Attio is the correspondence tracker; Gmail provides sending/reply evidence. The published
  overview is an explicitly dated saved aggregate, not a live inbox integration. Request another
  session when an updated check is needed; no monitoring or autonomous follow-up is enabled.
- The reviewed dashboard release is complete. Any later Netlify publication needs fresh release
  consent. Merged alignment/UK documentation worktrees are eligible for the authorized scoped
  cleanup after this release record is integrated; private local evidence must be preserved.
- Earlier research gaps below are historical context; reassess against current code before work.

## Earlier gaps and next steps — 2026-10-09 (historical)

### Pipeline gaps

- The `us-pilot-01` providers were found before screening existed, so `outreach scrape` skips them as "not screened".
  To re-scrape one, list it in a discovery file with a passing screen; it keeps its batch.
- Email domains can differ from provider websites (e.g. Hopkins → jhmi.edu, BU → bmc.org), so guesses fail for
  Gupta (BU), Yu (Hopkins) and Buchanan (RMPDS). A proposed fix is to record `email_domain` per organization and use
  it in `pipeline/cli.py:guess_domain`.
- Some institutions publish only shared inboxes (UAB, CU Anschutz, Cleveland Clinic, AMOpportunities); those are
  usable first-contact addresses.
- Page selection remains heuristic (`pipeline/pages.py`); deep programme pages on large sites can miss staff pages.
  Step 3b covers this by hand. A small follow-up is to surface the email checker's error reason in `pipeline/emails.py`.

### Project decisions

- Choose the next research batch: continue with remaining US specialty directories and university departments, or
  start the first GB, AU or NZ batch and add it to the skill's country playbook. The narrow US community target was
  scarce (about 4 of 75 candidates passed in us-02; us-03 found 5 community providers of 50).
- The hosted dashboard is the current source for research readiness: **77 providers** under `bulk-send`
  (9 October 2026, 12:00 IST), with 76 in the nested funnel after programme capture. Readiness is not draft approval
  or permission to send; verify each provider's cautions and source pages before outreach.
- Prepare only 5 initial Gmail drafts using `docs/outreach-plan.md`. Select the providers/contact per provider,
  verify domain authentication, replace the literal-HTML signature in each draft, approve commercial wording and
  record recipient timezones and the approved calendar. Drafts remain unscheduled until exact approval.
- The email pilot also waits for GOO-1539's final page integration into GooCampusWorld and a visible
  homepage entry point. The Netlify review URL is for review and team handoff, not the outreach destination.
- Build the planned Outreach inner screen and persistent activity update path; track confirmed sends, observed
  replies, positive/negative and other outcomes, opt-outs and owned next actions. This is planned work, not a live
  Gmail integration. Broader Phase 2 team CRM, analytics and team logins remain deferred.

## Where we left off (2026-10-09)

### Dashboard sharing identity (2026-10-09)

- Hosted title: **Global Clinical Outreach | GooCampus**. The public description explains the private workspace
  for clinical programme research, provider contacts and outreach preparation. Canonical URL is
  `https://outreach.goocampusglobal.com/`, including when sharing a batch link.
- Added static Open Graph and X large-image metadata with accessible alt text, a 1200 × 630 social image,
  connected-G SVG/ICO/PNG favicons, an Apple touch icon, 192/512px home-screen icons and a browser-mode manifest.
  Artwork uses the existing Inter/blue/charcoal palette; it includes no private records or changing batch counts.
- Editable raster source: `scripts/build-brand-assets.py`; font license and rebuild/cache instructions:
  `scripts/brand/README.md`. Metadata is added only to the hosted build, preserving offline reports.
- Delivered in [PR #37](https://github.com/maheen-ejaz/global-clinical-outreach/pull/37), deployed from clean
  canonical `main` (`ba2044b4534c27447a7039fd11cd0153f6720ec3`) to Netlify production deploy
  `6ac8bd8c879def06cfc16b63` (ready/published). Live root/batch HTML, social card and all icons returned 200 and
  matched the release files; the signed-in dashboard loaded successfully. Pre-release Auth settings matched
  the runbook. Checks passed (76 Python, 26 Node tests), including one independent read-only review.
- Live verification found Netlify serving `.webmanifest` as `application/octet-stream`; the follow-up explicitly
  declares `application/manifest+json` for that path. Platform caches can retain older previews in existing messages.

### Outreach plan and draft standards (2026-10-09)

- Agreed office Gmail drafts and explicit approval of each recipient/content/time before scheduling. Gmail's
  scheduled delivery is automatic after approval; "no automatic sending" prohibits unapproved/autonomous actions.
  The repo still never sends email. Pilot is 5 providers, 1 contact each; wider groups await pilot review.
- Added `docs/outreach-plan.md`: simple/direct language, programme-based context with no personal-detail
  personalization, a brief secondary referral-fee sentence, correct-person routing request, evidence-backed facts,
  mandatory gates and a 100-point quality rubric with a 90-point working pass threshold. Scores do not replace
  fact checks or approval and do not predict inbox placement or replies.
- Gmail browser check verified access and saving/reopening a recipient-free test draft. Schedule send was visible,
  but no message was scheduled or sent. Recent business correspondence exists. Automatic signature inserted raw
  HTML; account-wide settings are unchanged. Authentication/reputation and actual scheduling/delivery remain
  unverified. The capability-test draft remains in Gmail, clearly labelled not to send.
- Required an Outreach inner screen for draft/scheduled/sent states, reply outcomes, thread timeline and future
  actions. Replies include positive/negative, neutral, redirect, automatic and unclear; no-reply, bounces and
  opt-outs remain distinct. It is not implemented. No automatic inbox monitoring or follow-up scheduler exists.
- Implementation requirements are tracked in [GitHub issue #33](https://github.com/maheen-ejaz/global-clinical-outreach/issues/33).
- Reconciled prior manual-send wording with approved Gmail scheduling; brought activity tracking into the pilot
  plan without expanding to team CRM or granting prospect-table browser access. Existing research rules remain.

### Hosted dashboard and Codex handoff (2026-10-09, PR "hosted dashboard")
- The user wanted the dashboards permanent and reachable like a web app, for their use only, on a goocampusglobal.com
  subdomain, and chose a live app with sign-in over uploading the HTML files.
- Built: `outreach publish` (snapshots from the database, bulk-send ranking, one row per batch plus `all`),
  `outreach viewers` (sign-in allowlist from `config/dashboard-viewers.json`, viewer `maheenejaz@goocampus.in`),
  migration `20261009070000_dashboard_access` (`dashboards`, `dashboard_viewers`, select policy for listed viewers
  only; prospect tables unchanged), and `web/` on Netlify with strict security headers.
- Batch text for the hosted page lives in `data/reports/<batch>-dashboard-meta.json` (pilot text added from the old
  template; us-03 gained `run_estimates` for the run cut off before logging).
- Dashboard width is capped at 1,280px (1,216px content on desktop), with 16–32px responsive gutters. The overview's
  four email-table columns use balanced proportions; detailed tables scroll within their cards on smaller screens.
  This replaces the earlier 1,920px cap after the overview was simplified.
- The hosted dashboard opens to an all-batches overview: providers, programmes, send-ready providers and addresses, plus
  Firecrawl/Reoon credit totals. The detailed confidence, funnel, provider, programme, contact and email views stay under
  "Research details" with the batch selector there. Current totals: 98 providers, 133 programmes, 77 ready to email,
  145 eligible email addresses, about 638 Firecrawl credits (one run estimated), and 423 Reoon checks. One ready provider
  has no programme record, so the nested funnel shows 76 after the programme-captured stage.
- Incident: a `supabase config push` meant as a preview applied local defaults to the live auth settings (site URL,
  MFA, confirmations, OTP length). Reverted within minutes from the printed diff; no auth users existed. Rule added
  to `AGENTS.md` and the runbook.
- Handoff for Codex: `docs/codex-handoff.md`, `AGENTS.md` start-here list, skill moved to `.agents/skills/`, README
  results brought up to three batches.

## Previous session notes (2026-10-08)

### Batch us-03 done (2026-10-08, PRs #23 and this one)
- 50 US providers, **46 ready to email under bulk-send**; see "Batch `us-03` results". Files in `data/`:
  `discovery/us-03.json`, `extra-pages/us-03.json`, `extractions/us-03/`, `reports/us-03-targets.csv`,
  `reports/us-03-shortlist-*.csv`.
- 2026-10-09: `reports/us-03-dashboard.html` was built from `us-03-dashboard-data.json`, and `reports/final-report.html`
  covered all three batches: 98 providers, 133 programmes, **77 ready to email** (13 + 18 + 46) in that offline
  snapshot. The earlier hosted funnel showed 76 because one email-ready provider had no programme row. The first us-03 scrape run
  was cut off before logging credits, so the offline snapshot marks it as estimated (~235: 193 pages plus 42 maps).
- Local template change (gitignored): the dashboard funnel no longer nests "ready" under "named contact" and
  "personal email verified", which bulk-send does not require; both moved to the note under the funnel.
- Skipped this batch: the LinkedIn step (bulk sending does not use it).
- Extraction ran in five parallel helpers (one per 10 providers) because the pages (about 6 MB) do not fit one context.


### Ready-to-email rules changed (2026-10-08, PR #20)
- The user set new criteria for bulk sending: `bulk-send` profile (see "Targeting profiles"). **31 of 48 ready**
  (pilot 13, us-02 18), up from 9; 18 of the 31 go to a shared inbox. Left off: 8 not viable, forbidden or
  refusing IMGs, 6 with no email, 3 with only guessed addresses.
- Dashboards and `final-report.html` rebuilt with it; the final report now builds its ready table from the
  snapshots (`uv run --frozen python data/reports/build-final-report.py`). The us-02 snapshot gained
  `screen_failures` (Tufts: accepts_imgs only, so now ready; UNMC: program_open, still not viable).
- Screen relaxed (user's decision, 2026-10-08, batch us-03): a page silent about IMGs now passes; only an explicit
  refusal (`screen.refuses_imgs`) fails. `accepts_imgs` is still recorded for ranking (`high-hit-rate` needs it).

### Done in the us-02 session (2026-10-08)
- Batch `us-02` ran end to end; results are in "Batch `us-02` results" above, lessons in "Lessons by batch".
- This PR: 6 new exclusions, shortlist drops providers whose re-screen failed, skill and runbook rules.
- us-02 dashboard built locally (`data/reports/us-02-dashboard.html`), same template, plain language.
- Combined final report built (`data/reports/final-report.html`): 48 providers, 67 programmes,
  **9 ready to email** (pilot 3 + us-02 6), 349 page reads and 209 email checks in total (about $0.21).
- Email checker: the user added 10,000 prepaid credits on 2026-10-08 (about 9,850 left after us-02).
- At that time, the next target was undecided and 9 providers passed the then-current `high-hit-rate` criterion.

### Done in the 2026-10-07 session
- **Pilot data confidence**, scored for the user: overall 6/10 (organisations and programmes 8,
  people 6, emails 5). Reasons are in the dashboard's executive summary.
- **PR #10, screen before scrape**: four-check screen, `config/exclusions.json`, page plan per provider
  type (8 pages), results by source in `outreach report`. See "Lessons by batch".
- **PR #11, fee/window status and page-limit evidence**: migration `20261007063303` applied to
  production; all 44 pilot programs backfilled from cached pages and loaded (fee: stated 14,
  not_stated 27, on_request 3; window: fixed_dates 10, rolling 9, not_stated 25). No fellowship page
  states a salary, so none is `paid_position`.
- **Dashboard** (local file, see "Where things are"):
  - Two tabs: "Pilot report" (KPIs, executive summary with highlighted numbers, plain wording with no
    vendor names) and "Team data" (internal only: Providers, Programmes, Contacts and Emails tables,
    each searchable with CSV download).
  - Email labels now follow the check result (`status`): valid = Verified, catch_all = Likely,
    unknown = Unconfirmed. That cut "with a verified email" from 13 to 10 providers.
  - "Open to partnerships" checkbox, chip and filter. 2 of 24 providers: MediTrack USA (site menu
    has "Partner With Us"; that page was not read) and Weill Cornell (expanding affiliations with
    medical colleges). Saint Peter's "no third-party agencies" note is not in any cached page and
    could not be re-verified.
- **Ready to email** under `high-hit-rate`: 3 of 24 providers, all with a verified personal email:
  NMHS (Dorie Crouch, published; David Pizzimenti, guessed), Mobile Infirmary (JoAnn Phillips Wood,
  guessed), UCLA (Carole Barrinuevo, published; IMG fit 2). ACE (Jon Bernad) and Project IMG
  (Michael Hermosa) were counted as "likely" at first, but their emails are guesses on servers that
  accept every address, so the profile treats them as unconfirmed. The `broad` profile still lists them.

### Targeting profiles (built 2026-10-08, rank only)
The user wants a high email hit rate first, kept separate from the scraping tool so the criteria can
be loosened later. The user chose **rank only**: profiles never block collection or research.
- `config/targeting/<name>.json` (schema `schemas/targeting.schema.json`): `require` = ready to
  email, `prefer` = +1 point each, `exclude` = left off. Profiles: `high-hit-rate` (accepts IMGs,
  named person, email verified or likely; prefers community hospitals, curated sources, open to
  partnerships, contactable, a verifiable domain, IMG fit 3+), `bulk-send` (the user's criteria from
  2026-10-08, see below) and `broad` (any email, any provider that does not forbid outreach).
- **`bulk-send` is the team's "ready to email" since 2026-10-08** (dashboards and final report use it).
  The team will bulk-send, so: a shared inbox is fine; a provider is left off only when it says it does
  not take IMGs (`exclude.refuses_imgs`), silence is fine; non-viable (exclusion list, failed re-screen
  other than "no IMG statement") and outreach-forbidden providers are never ready. The email must be
  verified, likely, or `published` (unconfirmed but printed on the provider's site); guessed addresses
  never count, to keep bounces down. `high-hit-rate` stays for comparison.
- `outreach shortlist` (read-only) ranks the batch under every profile and writes
  `data/reports/<batch>-shortlist-<profile>.csv`. It merges `data/reports/<batch>-partnerships.json`
  when present. `pipeline/targeting.py` holds the rules; `from_snapshot` lets the dashboard use them.
- `outreach email-domain`: one Reoon check of a made-up address per email domain; records
  `details.email_domain` (domain, catch_all, differs_from_website).
- Screen: optional, never gating `contactable` answer. The results-by-source lines count verified
  personal emails. The skill runs the costly extras (3b, 4) in shortlist order.
- A guessed address on a server that accepts every address counts as unconfirmed, never likely.
- Dashboard: "Ready to email" chip and filter, plus a team-table column, from `bulk-send`
  (`scripts/build-dashboard.py:PROFILE`; snapshots may carry `screen_failures` per org). Its
  scores are partial until the snapshot is refreshed (no source, coordinator or domain data yet).
- Runs are logged in `pipeline_runs` (steps `email_domain`; `shortlist` writes nothing to the database).

### Dashboard changes on 2026-10-08 (local template, rebuilt)
- Full width: padding scales from 16px to 64px, with a 1920px cap. On screens of 1280px or wider the
  executive summary shows three columns. The pipeline and "Work done" cards share a row only on
  screens of 1200px or wider.
- The pipeline is now a nested funnel (each stage counts providers that passed every stage above it):
  24 discovered, 23 website read, 21 programme captured, 16 usable email, 8 named contact,
  3 personal email verified or likely, 3 ready to email. The biggest drop is at "named contact".
  "Full address" moved to a note under the funnel, because it is not a stage.
- Email labels everywhere follow `pipeline/targeting.py`: a guessed address on a catch-all server is
  "Unconfirmed".

### Other open questions
- **Step 2 (lead enrichment):** paid email finders, a second email checker for catch-all servers,
  doctor registers (NPI, GMC, AHPRA, MCNZ) and search-based agents were discussed but not priced or
  built. Compare prices and billing before choosing a tool.
- **Placement companies:** prospects or competitors? Decide before the next batch.
- **Partnership checking:** could become a standard extraction field, with "partner with us" pages
  added to the page plan (offered, not requested yet).

## Lessons by batch

Each lesson is enforced in code or the skill; the rule column says where.

| Batch | Lesson (evidence) | Rule |
|---|---|---|
| us-pilot-01 | About a third of 24 providers were low-value or not viable: applications suspended (Cincinnati), partner schools only (Northwestern), outreach forbidden (Yale), no program found (Hopkins), US-trained only (Duke radiology), dead site (IMG Rotations), wrong country (Athens Medical Group). Each cost credits before anyone noticed. | One-page screen with four checks before scraping (`pipeline/screen.py`, `schemas/discovery.schema.json`); `outreach scrape` refuses unscreened or failed providers |
| us-pilot-01 | Lasting failures would be rediscovered by the next search | `config/exclusions.json`, checked by `outreach discover` and `outreach scrape` |
| us-pilot-01 | General web search surfaced famous academic centres; community hospitals and placement companies gave 4 of the 6 top-priority providers | Discovery source order in the skill; `source_kind` on every lead; `yield` lines in `outreach report` |
| us-pilot-01 | Reading about 2–3 pages per site missed fees (29 of 44 programs without one), deadlines (26 of 44) and staff; a targeted staff-page search took named contacts from 4 to 10 | Separate `fees` and `apply` page kinds, a page plan per provider type (`pipeline/pages.py`), default 8 pages per site |
| us-pilot-01 | Fellowships rarely charge fees and placement companies quote prices only after sign-up, so an empty fee is ambiguous; the same holds for windows (rolling admissions) | Required `fee_status` and `window_status` on every program (columns on `programs`, schema rules in `schemas/extraction.schema.json`); counts in `outreach report` |
| us-pilot-01 | The page limit (6, now 8) was a judgement call: 16 of 25 sites ran out of matching pages before reaching it, so the picker, not the limit, was the constraint | Each full scrape records `details.page_pick` (matching vs read pages); `outreach report` prints the `page limit` line. Revisit the limit when it shows sites with pages left unread |
| us-02 | The brief's target group was scarce: of about 75 US hospitals checked, about 12 passed the screen and about 4 were community internal or family medicine observerships naming a coordinator. Many had stopped (Weiss, Cook County, Mercy St Vincent, Saint Agnes, Beaumont, St Luke's, Mercy St Louis) or never take IMGs (Guthrie) | New lasting entries in `config/exclusions.json`; skill: count passing candidates for the brief before fixing the batch size, and ask the user to widen or change country early |
| us-02 | Screening from a search snippet was wrong twice (UNMC paused from 2027, Tufts never says it takes IMGs) and four program pages had moved or gone (MedStar, Texas Tech, Conemaugh policy, Larkin) | Skill: screen from the program page itself and say in `note` when only a snippet was available; re-screen from the cached pages after scraping. `outreach shortlist` now marks providers whose screen failed as not viable (`pipeline/targeting.py:screen_block`) |
| us-02 | Curated sources beat search again: `img_directory` 4 of 13 ready, `high_img_hospital` 1 of 3, `web_search` 1 of 8; academic departments with a dedicated international observership page gave most ready leads | Source order in the skill unchanged; `yield` lines in `outreach report` |
| us-02 | Very large domains wasted pages: on providence.org 7 of 8 pages were other hospitals, and the page-limit line counted 1,894 unread pages, almost all on large networks | Skill: set `website` to the narrowest program section and, for big networks, scrape only the program and staff pages via `data/extra-pages/<batch>.json` |
| us-02 | The targeted staff-page search found named emails for 5 orgs from 8 pages, while LinkedIn search matched 0 of 14 coordinators and program directors | Skill: run 3b for every org without a target; search LinkedIn only for decision-makers, not coordinators |
| us-02 | The email checker ran out of prepaid credit mid-run and returned HTTP 403 with no reason, which looked like a fault | Runbook: check the checker's prepaid balance before a run (about 6 checks per provider) |
| us-02 | 8 of 24 email domains accept every address, so published emails there stay "unconfirmed" (Griffin Memorial, Mount Sinai Miami) | `outreach email-domain` records it; a second checker for catch-all servers stays an open question |
| us-03 | The relaxed screen plus bulk-send rules took the ready share from 31 of 48 to 46 of 50; curated specialty directories that name contacts beat search under the strict profile (AAO-HNS 9 of 12 ready vs web search 16 of 30) | Skill: specialty-society directories first in the US playbook row |
| us-03 | Providers found only in a directory gave the page picker nothing to find: 2-9 unrelated pages read for each of 9 ENT departments, while the directory PDF held every contact | Skill step 2: scrape them with `OUTREACH_PAGES=1` plus the directory as an extra page |
| us-03 | The first scrape hit the runner's 15-minute limit with output buffered, so the log was empty and its credit count never reached `pipeline_runs` | Runbook: prefix commands with `PYTHONUNBUFFERED=1`; scrape resumes where it stopped |
| us-03 | Screens can overstate fit: in 3 of 50 the extraction found the IMG statement was only on another page (Texas Tech residency) or narrower than screened (CHLA practising doctors only; UW DLMP silent) | Re-screen from cached pages after extraction (existing rule); `accepts_imgs` stays null when only implied |
| us-03 | Large academic sites still waste reads: 20 of 50 had more matching pages than the limit, with mostly unrelated pages read on MD Anderson (7 of 9), SLU (7 of 8) and Cook County (6 of 8) | Existing rule (narrow `website`); revisit the picker for department sites |
| us-03 | New lasting exclusions: dead site (Saint Elizabeths), no IMG observerships (Iowa pathology, Nicklaus), partner, affiliate, referral or invitation only (Rutgers RWJMS, CHRISTUS, OSU, Ochsner, Houston Methodist) | `config/exclusions.json` |

## Working agreements with the user

- Separate, country-agnostic program; never hard-code US-only concepts.
- Research alternatives in depth (pricing model, agent workflow fit) before recommending a tool.
- The user asks for `/grilling` when they want questions first; ask one material choice at a time.
- Team-facing reports use plain language: no vendor or tool names (Firecrawl, Reoon, Supabase), short
  bullets, highlighted key numbers, and existing design tokens.
- The team dashboard is shared as a file by the user; do not publish it as an artifact. The user's own view is the
  hosted dashboard (outreach.goocampusglobal.com), private to the addresses in `config/dashboard-viewers.json`.
- Workflow follows `~/.agents/AGENTS.md`: task worktree on `codex/<slug>`, PR, squash-merge,
  fast-forward the canonical checkout, clean up.

## Outreach workspace — 2026-10-10

- Grilling decisions: Maheen alone edits and locks approvals; Ashwini and Nandu view progress.
  The workspace lists every shortlisted provider but reserves only five pilot selections.
  Codex prepares drafts for selected recipients; no in-dashboard AI generation.
- Finalising proposes the next recipient-local weekday morning (09:00–11:00), at least
  ten minutes from another reserved message. Show recipient and operator-local time; Maheen
  can change it and confirms the recipient calendar. Unknown timezones block finalisation;
  DST gaps/overlaps are rejected. A lock approves the exact recipient, subject, body and instant.
- Gmail native scheduling selected after checking its public API: no schedule operation.
  Locks await an explicitly requested active Codex session; the dashboard never sends or
  schedules email. Record “Scheduled” only after checking the exact version in Gmail.
  App-managed background sending and in-dashboard AI drafts were rejected for this version.
- Implementation: hosted Outreach tab, editor, persistent versioned correspondence/history,
  Maheen-only bounded mutations and viewer-only reads. New migration keeps RLS enabled and
  prospect policies unchanged. Research publishing cannot overwrite outreach records.
  Reviews need 90/100 and sourced evidence for every mandatory rule. Saving edits clears
  review/finalisation/approval; scheduling reservations block edits until Gmail reconciliation.
- Operator update path: bound `outreach-activity`, private `data/outreach/action.json` input and
  `activity.json` export. Supports prepared drafts, exact-version reviews and observed Gmail events;
  it has no send/schedule operation and logs no correspondence. The command must be merged before
  production credentials are available.
- Local verification: PostgreSQL (PGlite) exercises RLS, revoked viewer/admin access, stale versions,
  pilot capacity, mandatory reviews, approval invalidation and exact Gmail reconciliation. Chrome
  fixture UI exercises saving/finalising and viewer-only controls at 390/1440 px. Time helpers cover
  weekday spacing, half-hour offsets and DST gaps/overlaps. No real email or production mutation used.
- Release remains pending: the declared Infisical manifest has pipeline REST credentials but no
  schema-migration/database-management binding. No Supabase native management tool is available in
  this session. The installed CLI is not a substitute credential source. An administrator must provide
  the supported scoped migration capability before applying the new migration and deploying this UI.
- Task owner: Codex chat `01a123ba-6017-7e10-8eb0-d17a26a89816` (`Build-Outreach-Workspace`).
  Canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-workspace`; branch `codex/outreach-workspace`.
  Intake HEAD/default SHA `f42b9973f31aac9f47ab2c704891148385f3c818`, fetched 2026-10-10T04:04:00Z.
  Disposition during implementation: `active`. Production integration and cleanup are pending release access.

- Independent read-only review requested changes for unapproved proposal collisions and existing
  local directory/input permissions. Fixed: pending proposals reserve slots at finalisation and lock,
  and existing correspondence directories/inputs are tightened to 0700/0600 before import. Affected
  database, file-permission and Chrome checks pass; the same reviewer approved the final scope.

- Delivered as ready [PR #55](https://github.com/maheen-ejaz/global-clinical-outreach/pull/55),
  implementation commit `2b3d413` (full revision retained in Git). PR remains unmerged pending
  the supported schema-release path. No production database mutation, deploy, real draft import
  or Gmail scheduling was performed. Owned branch/worktree are preserved, disposition
  `preserve-unmerged`; release access is owned by the administrator. Next trigger: a declared
  scoped migration capability for project `wevhojfgxckximznhvbh`, followed by production migration
  security/parity checks and the documented dashboard release.

### Activation exception — 2026-10-10

Maheen explicitly authorised a one-time exception to obtain/use the migration capability
needed to activate this feature. The exception is limited to the saved Supabase operator CLI
session and the existing project `wevhojfgxckximznhvbh`, for this reviewed migration and its
release verification. It does not change the normal Infisical bindings or grant broader
credential discovery. Read-only CLI preflight succeeded: role postgres, new outreach tables
absent, existing dashboard/prospect RLS enabled, existing private viewer function intact.

This chat owns the dashboard release; native task discovery found no other active release
owner for this project. Resume source HEAD `854ae15a25c3840c8aaf1c15440ae4cce7356604`;
canonical default still `f42b9973f31aac9f47ab2c704891148385f3c818` after refresh. Migration
history records the dashboard access baseline as `20261009062909`, while the existing local
file is `20261009070000_dashboard_access.sql`; verify the baseline schema and record this
historical mapping rather than reapply the dashboard migration or rewrite its history.
Apply only the new reviewed outreach migration, atomically with its matching history row.
Disposition resumed: `active`. No outreach email is authorised for scheduling by this exception.


### Outreach workspace activated — 2026-10-10

- Source delivered by [PR #55](https://github.com/maheen-ejaz/global-clinical-outreach/pull/55),
  squash merge/source SHA `33df12a4352525e48c332667489e59848a58dd14`. Canonical main safely
  fast-forwarded from `f42b9973f31aac9f47ab2c704891148385f3c818` with a clean tree.
- Applied only `20261010040527_outreach_workspace.sql` through the authorised saved Supabase
  operator CLI session, with an atomic transaction/history insertion and a guard against reruns.
  Stored migration source MD5 `3e05890174e368312facf6ec1c619bb9` equals the reviewed file.
  Historical dashboard baseline version mapping above is preserved; nothing was reapplied.
- Production role verification passed with rollback-only checks: Maheen's real confirmed identity
  is admin; Ashwini is a viewer and cannot mutate; no direct authenticated table writes or viewer
  operator RPC access; anonymous select denied (also HTTP 401 through the public Data API).
  RLS remains enabled on correspondence and prospect tables. Security advisor reported no errors
  and only the existing leaked-password-protection warning; existing magic-link settings unchanged.
- Browser verified exact site/redirect URLs, one redirect only, sign-ups and anonymous sign-ins off,
  email confirmation on. Hosting ownership: GooCampus team `69943cc894e50bb0b124fab5`, site
  `705877a0-828e-46fa-94a7-ca5f7d7e94b0`; Git continuous deployment remains absent.
- Published Netlify deploy `6ac9c844e7e622f9db540e9c` is ready/current at
  https://outreach.goocampusglobal.com/; immutable deploy
  https://6ac9c844e7e622f9db540e9c--goocampus-outreach.netlify.app/.
  Canonical HTTPS HTML and all six changed/supporting assets byte-match deployed source; CSP verified.
- Signed-in Chrome loads the Outreach tab, all 77 shortlisted providers and Maheen's editor controls.
  Search and the recipient/subject/body editor verified without saving a real pilot selection.
  Private activity/event counts remain zero; no email was created, sent or scheduled.
  Normal bound `outreach-activity` runner succeeded and exported zero rows to the private local store.
- Required checks before merge: 81 Python tests, 26 runner checks and four PostgreSQL/time tests.
  The earlier isolated reviewer approved the reviewed code after fixes; no runtime code changed
  during activation. The one-time exception has been consumed for this release; future credential
  work follows the normal tracked bindings and procedures.
- Release owner remains this chat until the documentation/owned cleanup is completed. Original
  implementation branch `codex/outreach-workspace` at `abf55b74f1f507cc4385545e8518517b9435264a`
  has a tree identical to merge `33df12a4352525e48c332667489e59848a58dd14` (squash integration proof).
  Release-record branch `codex/outreach-activation-record` uses the same owned sibling worktree.
  Disposition: `active` until documentation delivery, then `ready-for-admin-retirement-review`.

## Self-only workflow demo — 2026-10-10 (preparation)

- User requested a real self-addressed Gmail scheduling test plus CRM drafting, review, editor,
  date/time and button testing. Only permitted recipient: the confirmed office account; no Cc/Bcc,
  no actual provider contacts, no real programme claims. Unsent `[SELF-TEST]` draft saved through
  the connected Gmail tool; correspondence and references remain private, never committed here.
- Existing code has no demo fixture and blocks weekend approvals. Today is Saturday. New source
  adds a synthetic `demo-self.invalid` fixture through `?view=outreach&demo=self`; no organization,
  prospect email or research snapshot is inserted/changed. Both UI and database fix the recipient
  to the office inbox, require labelled test content, and keep demo review explicitly self-only.
  Demo activity/slots do not enter the normal research/pilot display or capacity counts.
- Ten-minute proposal and weekend approval apply only to the reserved self-test domain.
  Normal provider eligibility, weekday, review, approval and scheduling verification stay enforced.
  Locking is still only a persisted approval; no Gmail automation is triggered by a button.
- Acceptance: non-self recipients rejected by the database (including forged RPCs); real providers
  hidden in demo UI; five real pilot slots preserved; demo editing resets review/approval; all ten
  review gates still required with self-demo scope; date/time editable before lock; lock stays
  awaiting Gmail until explicit-session verification; no outbound sends used in automated tests.
- Migration/release pending a supported scoped schema path. The earlier one-time saved-CLI
  exception was consumed by initial activation; it is not reused for this new migration.
  Exact final recipient, content and instant still require Maheen's approval before Gmail scheduling.
- Owner `01a123ba-6017-7e10-8eb0-d17a26a89816` (`Test-Outreach-Workflow`); canonical repo
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-self-demo`; branch `codex/outreach-self-demo`.
  Intake source/default `3d585eb1378cc744a35712cacbac94186c85190e`, fetched 2026-10-10T12:15Z;
  disposition `active` while preparing the bounded demo. Requested approximate ten-minute initial
  window may expire during setup; no elapsed approval is silently rescheduled.
- Local checks passed: 81 Python tests, 26 runner checks, PostgreSQL/time regressions and Chrome UI.
  One isolated read-only reviewer requested tighter route isolation and sign-in preservation;
  fixed by bypassing all dashboard reads/rendering in demo mode, hiding research/export controls,
  filtering both activity queries server-side, and restoring the self-view after a magic-link callback.
  The same reviewer approved the revised candidate. Fresh-login boot/query/control regression passed.
  Real providers remain untouched; the self-addressed Gmail message is still an unscheduled draft.

### Self-demo activation authorisation — 2026-10-10

Maheen renewed the saved Supabase CLI exception specifically to activate the reviewed self-demo
migration in PR #57 and verify this existing project's release. It does not approve an email
send/schedule or reuse the earlier exception for other work. This chat owns the release; current
native task discovery shows no other active release owner for this project. Read-only preflight:
new migration absent, expected base migration hash intact, zero demo/real activity rows; baseline
all-batches snapshot hash `594ba8f1d45127c7209f84d7915c079a` retained for comparison.
Resume worktree HEAD `e85784ff62c27f2023d23c9e221d2df0411d6d92`, canonical/default
`3d585eb1378cc744a35712cacbac94186c85190e`; owner this chat, disposition `active`.
The previously isolated read-only reviewer approved the final runtime/migration source; only this
release-authorisation note changes on resume. Normal credential procedures remain in force for
pipeline operations. No real provider may be selected or scheduled during this test.

### Self-only demo activated — 2026-10-10

- [PR #57](https://github.com/maheen-ejaz/global-clinical-outreach/pull/57) merged as full runtime
  source `71fc141939572ba5ee410830b27ea2a01681e1b1`. Applied only the reviewed demo migration
  `20261010121632`, atomically with its history row; stored/file MD5 both
  `bc6b172714a646b2c77d23abe8587480`. Existing historical dashboard version mapping is unchanged.
- Production guard test rejected a non-self address in a rolled-back transaction. No fixture
  from the guard test persisted. RLS, denied anonymous/direct viewer writes and operator-RPC
  restrictions remain intact. Security advisor: no errors; existing leaked-password warning only.
- Netlify site `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, GooCampus team
  `69943cc894e50bb0b124fab5`; ready/current deploy `6aca325651b21bc820a0b88b`:
  https://6aca325651b21bc820a0b88b--goocampus-outreach.netlify.app/.
  Canonical HTTPS HTML/app/editor assets byte-match the merged source; public anonymous
  correspondence request returns 401. Live demo URL:
  https://outreach.goocampusglobal.com/?view=outreach&demo=self.
- Signed-in browser verified demo-only row and hidden research/export tabs. Created only the
  reserved self-test activity row via the admin editor. Normal bound activity runner loaded the
  verified existing self-addressed Gmail draft into that row. Browser finalisation and date/time
  edit/restore verified; recipient control is disabled and server-fixed to the office inbox.
- Demo is finalised, unlocked and unapproved; approval boxes remain unchecked. G9/G10 exact
  signature/content/time approval remains pending, and the reviewed check report is in private
  prepared-event evidence, not falsely recorded as a passing review. Gmail message remains a
  verified unscheduled draft. No real course provider/recipient was touched, contacted or queued.
  Actual correspondence/references/screenshots remain in private gitignored local files and Gmail.
- Original all-batches snapshot hash `594ba8f1d45127c7209f84d7915c079a` remains identical;
  real outreach activity count remains zero. Demo does not use a pilot slot. The proposed time
  is illustrative/editable and is not authority to send; elapsed proposals need a fresh approved
  instant. Continuing the email demo requires Maheen's exact content/time approval.
- Renewed CLI exception is consumed by this activation/verification; normal credential rules
  continue. Checks passed on resume: 81 Python tests, 26 runner tests, PostgreSQL/time tests and
  Chrome UI isolation/fresh-login tests. The same prior independent reviewer approved this source;
  activation introduced no new runtime code beyond the reviewed PR.
- Release succession: after this release-record PR merges, confirmed next dashboard release
  owner is `01a125d3-1928-78a1-a169-11a598ec1570` (`Apply-Revised-Tokens`). Native task-to-task
  messages coordinated the transfer. Preserve self-route isolation, fixed recipient, no real-data
  reads, demo scope and approval-only lock; do not touch correspondence or schedule/send emails.
  This chat continues only the explicitly requested self-email demo after human approval.
- Owned source worktree `/Users/maheenejaz/Developer/global-clinical-outreach-self-demo`, original
  branch `codex/outreach-self-demo` at `065d9d3ccee77952107f344de9f0098d751bce51`, tree identical
  to source merge above. Release-record branch `codex/self-demo-release-record`; clean merged
  work is eligible for authorised cleanup after documentation delivery. Disposition then:
  `ready-for-admin-retirement-review`; data/approval state remains preserved in the private store.


## Attio Mono v2 visual rollout — 2026-10-10

- User requested the revised local package across every visual surface, including the
  marketing review page. Source: `design/attio-mono-v2/`, copied from Downloads/Attio Mono v2.
- Acceptance: sign-in, overview, research/provider details, every data table, outreach
  editor/activity/history, offline report templates and marketing components consume v2
  design roles; light/dark, phone/desktop, keyboard focus, disabled/pressed states and
  reduced motion are covered. Research, access and Gmail approval behavior stay intact.
- Owner: Codex `01a125d3-1928-78a1-a169-11a598ec1570` (`Apply-Revised-Tokens`).
  Canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-mono-v2`; branch `codex/attio-mono-v2`.
  Intake HEAD/default `71fc141939572ba5ee410830b27ea2a01681e1b1`, fetched
  2026-10-10T12:41:37Z. Disposition `active` during implementation.
- Design mapping and maintenance: `docs/design-system.md`. No schema/data migration or
  outreach activity write is needed. Two independent static sites require manual releases
  after checks and one isolated read-only release review. Dashboard ownership transferred
  explicitly from the self-demo task after PR #58 at `068aff9b3ff02ef1c0ed0b85ca619c1e781508ac`.
  This task owns both static-site releases. Schema parity is inherited from that verified
  activation: demo migration MD5 `bc6b172714a646b2c77d23abe8587480` matches source;
  no schema files change here. The self-only row remains finalised/unlocked/unapproved.

- Verification: 83 Python tests, 26 runner checks and four PostgreSQL/time checks passed
  through `check:pr`; Chrome synthetic dashboard checks cover 320/390/768/1440px in both
  themes, all research tables, expanded records, keyboard focus, disabled controls and
  reduced motion. Outreach light/dark editor and self-demo regression passed. Marketing
  checks: 29 cross-browser layouts/controls (15s), 36 carousel cases (16s) and 25 motion
  cases (42s), with no accessibility/console/request failures. Full local implementation
  and verification took about 25 minutes; temporary servers are stopped.
- Marketing publish size is 779,926 bytes including local Inter 400 and the v2 CSS;
  its documented working budget is now 780KB. Source references and QA are not deployed.
  The final diff is reviewed; independent read-only release review is next.


### Attio Mono v2 released — 2026-10-10

- Independent blind read-only reviewer approved `6b692e7376f07b2dbcdd3ab5e705711ce0f06b79`
  without blockers. [PR #59](https://github.com/maheen-ejaz/global-clinical-outreach/pull/59)
  merged as source `cd5cd7537372319aac2acbd671705e0fc1161f3a`; the two trees are identical.
  Canonical main safely fast-forwarded from `068aff9b3ff02ef1c0ed0b85ca619c1e781508ac`
  to this source with a clean tree. No database migration or correspondence mutation occurred.
- GooCampus team `69943cc894e50bb0b124fab5`: dashboard site
  `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, ready/current deploy
  `6aca38a596879eac672917bc`, immutable URL
  https://6aca38a596879eac672917bc--goocampus-outreach.netlify.app/;
  canonical https://outreach.goocampusglobal.com/. Marketing site
  `c6f69133-aea0-4f88-8e7d-78d7c4332e24`, ready/current deploy
  `6aca38c5ce0337be3c8c1e2a`, immutable URL
  https://6aca38c5ce0337be3c8c1e2a--goocampus-clinical-partners-preview.netlify.app/;
  canonical https://partners-preview.goocampusglobal.com/. Both deployed from the full
  source SHA above using their separate documented manual commands. Git CD stays absent.
- All 18 dashboard and 27 marketing public files byte-match source at canonical HTTPS.
  CSP and noindex headers verified. Hash/time proof and deployed light/dark phone/desktop
  marketing captures: `marketing/clinical-partnerships/qa/evidence/mono-v2-deployed/`.
  Deployed marketing checks pass all 29 layouts/control cases across three browsers (28s).
- Browser verified signed-in overview (98 providers, 77 ready), research tables and
  outreach (77 shortlisted, zero real pilot selections), and the self-only editor.
  Demo recipient remains disabled/fixed; email typography computes 16px/24px at weight400;
  the existing demo stays finalised, unlocked and unapproved. No email operation occurred.
  Live content max is 1024px; ordinary cards have no shadow; no page overflow.
- Read-only auth preflight: exact dashboard site URL, one exact redirect URL, sign-ups and
  anonymous sign-ins off, email confirmation on. Existing production migration source hashes
  match the self-demo handoff; schema files/auth runtime/headers have no diff in this rollout.
- Close owner: `01a125d3-1928-78a1-a169-11a598ec1570` (`Apply-Revised-Tokens`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-mono-v2`. Original branch
  `codex/attio-mono-v2` at `6b692e7376f07b2dbcdd3ab5e705711ce0f06b79` is clean/integrated
  by identical-tree proof. Release-record branch `codex/attio-mono-v2-release` uses this
  same owned worktree; cleanup follows delivery of this documentation. Disposition then
  `ready-for-admin-retirement-review`. Main-site marketing integration remains with the
  existing website team; this task releases only the two existing sites.

## Self-email workflow verified end to end — 2026-10-10

- The admin reported reviewing the self-only draft, checking both approval boxes and clicking
  Lock. Inspection showed the click had been rejected because no passing review was recorded.
  The exact selected future time and unchanged draft were preserved; no timing/content choice
  was inferred or changed. This exposes an operational order requirement: record review before lock.
- Recorded all ten evidence-backed checks with explicit `self_only_demo` scope and 90/100 score
  (fictional-demo relevance is not actual-provider qualification). Completed the same approved
  lock, reserved the row against edits, then used native Gmail Schedule send in the approved
  office account. Exactly one matching self-addressed draft; no Cc/Bcc, attachments or duplicate.
- Verified the native Scheduled message's exact date/time, recipient and wording, and only then
  recorded Scheduled. Gmail applied ordinary plain-text line wrapping; normalised wording matched
  the approved draft. After the time arrived, waited for observed SENT and INBOX labels rather
  than inferring delivery from the clock; then recorded Sent. The live CRM confirms Sent.
- Only the reserved demo row changed. Real outreach activity remains zero; no actual provider
  or course contact was selected, contacted or queued. Raw recipient/text/time, approvals,
  review evidence, Gmail references and screenshots remain private in Gmail and gitignored data.
- No code/schema/auth/deployment change was needed. Normal bound activity command handled the
  explicit-session records. Locking still does not launch an agent or Gmail automation; the
  admin requests an active Codex scheduling session, and Gmail delivers an approved schedule.
  This self-inbox result is not proof of hospital inbox placement or external campaign readiness.
- Documentation owner: this chat `01a123ba-6017-7e10-8eb0-d17a26a89816` (`Verify-Demo-Approval`).
  Canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-self-test-completion`; branch
  `codex/self-test-completion`; intake source/default
  `2da5ad540ce5542fd5a9162ec62983729ca87339`, fetched 2026-10-10T17:25Z.
  Disposition active during documentation delivery; ready for authorised cleanup once merged.
  No further self-demo scheduling or sending is pending.

## Partnership presentation revision — 2026-10-12

- Maheen requested company-facing CTAs/contact details, varied images without repeated AI captions,
  direct company contact in the introduction, a brief mentorship section, existing-audience positioning
  and an FAQ that opens only one answer at a time. This supersedes the earlier all-architecture
  image direction and repeated public-image-caption requirement for this preview. Fictional card
  data stays visibly labelled; image provenance remains in the private/source QA manifest.
- Acceptance: no personal name/email in page content or mailto links; verified company contact
  `info@goocampus.in`, published phone/address in section two; factual mentorship/platform copy
  with provider-confirmed eligibility; varied editorial subjects; exclusive keyboard-accessible
  FAQ; existing Attio Mono v2, mobile/dark/no-JS, clipboard/carousel/motion and privacy preserved.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Refine-Partnership-Presentation`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-presentation`; branch
  `codex/partnership-presentation`; intake HEAD/fetched default
  `263248033e1c584b78da8916364a8f85ba16d7b1`, fetched 2026-10-12T04:54:36Z; clean at intake.
  Native project-chat discovery shows no other active release owner; this chat claims the existing
  dedicated marketing-preview release. Dashboard and correspondence release scope is unchanged.
  Disposition `active` through checks, review, source delivery and manual preview deployment.
- Source evidence rechecked 12 October: company email/phone/address and partnership invitation at
  https://www.goocampusworld.com/contact-us; mentor matching/session booking and career tools at
  https://www.goocampusworld.com/; experienced mentor support at
  https://www.goocampusworld.com/mentorship. Maheen confirms the existing audience; no traffic,
  conversion, admission or guaranteed applicant-volume claims are added.

- Local verification: 29 three-engine layout/control cases (15s), 36 carousel cases (15s),
  25 motion cases (40s), exclusive keyboard/no-JS FAQ and zero Axe/console/request failures.
  Affected build tests: 3 passed (0.02s). Required `check:pr` passed 83 Python tests,
  26 runner checks and 4 PostgreSQL/time checks. Asset hashes match; publish size 703,184 bytes.
  Approximately eight minutes of local implementation/generation/verification. Temporary local
  server remains owned on 127.0.0.1:8794 until release checks finish.
- Final source diff reviewed; independent blind read-only release review follows. This revision
  changes only the static marketing page and documentation/QA, so schema/auth/migration parity
  steps are inapplicable. Prospect/correspondence data and both Gmail approvals remain untouched.

### Partnership presentation published — 2026-10-12

- One isolated blind read-only reviewer found no blockers on candidate
  `1d475071177075bd7ca49d72a213c889fea49bdd`. [PR #62](https://github.com/maheen-ejaz/global-clinical-outreach/pull/62)
  merged runtime source `281ebf4b952ffbcb8361b04d4d48fb4a2bd86b0e`; identical-tree proof
  confirms squash integration. Canonical main safely fast-forwarded from
  `263248033e1c584b78da8916364a8f85ba16d7b1`, clean before/after.
- Existing GooCampus team `69943cc894e50bb0b124fab5`, dedicated marketing site
  `c6f69133-aea0-4f88-8e7d-78d7c4332e24`; ready/current deploy
  `6acc6b3efc7dc06760d512e0`, published 2026-10-12T05:08:17.869Z from the full runtime SHA
  above through the documented manual command. Git CD remains absent. Public URL:
  https://partners-preview.goocampusglobal.com/; immutable URL:
  https://6acc6b3efc7dc06760d512e0--goocampus-clinical-partners-preview.netlify.app/.
- All 27 served files byte-match source over trusted canonical HTTPS. Netlify consumes `_headers`
  as configuration, so it is checked through actual CSP/noindex response headers rather than
  as a public file. Live three-engine layout/control checks: 29 passed (27s), including
  exclusive keyboard/no-JS FAQ and clipboard/contact behavior, zero Axe/console/request errors.
  Deployed desktop/mobile light/dark evidence and byte proof: `qa/evidence/presentation-deployed/`.
  Refreshed the user's in-app browser and observed the revised company contact, CTAs and copy.
- The user's hosted preview remains the intended URL for outreach drafts. Main-site integration
  stays with the existing website team; source presentation changes do not approve any Gmail
  recipient, wording or time and do not establish sender authentication or campaign readiness.
- Close owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Refine-Partnership-Presentation`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-presentation`; original branch
  `codex/partnership-presentation` at `1d475071177075bd7ca49d72a213c889fea49bdd`,
  integrated by tree identity above. Release-record branch `codex/partnership-presentation-record`
  uses that same worktree; disposition `active` until record delivery, then
  `ready-for-admin-retirement-review`. Required owned cleanup is already authorised.

## Five-provider pilot drafts prepared — 2026-10-12

- Maheen explicitly selected the five previously recommended pilot contacts and requested
  unscheduled drafts in office Gmail and the CRM, including the updated marketing-preview URL.
  This request authorises draft preparation/storage only; no finalisation, locking, scheduling
  or sending is authorised. The existing recipient/content/time approval boundary remains.
- Rechecked provider programme/contact sources and tracked exclusions. The office Gmail search
  across the five provider domains and selected addresses found no existing messages before
  draft creation. Each initial selection was saved through the signed-in admin CRM controls;
  the normal bound `outreach-activity` runner then recorded the matching prepared version.
- Five text/plain Gmail drafts were created, one recipient each, with no Cc/Bcc, attachments,
  tracking or invented commercial terms. Full Gmail reads verified exact recipient, subject,
  body and DRAFT labels. CRM exports independently verified the same five complete drafts,
  each at version 2/state draft, with no approval, send time or passing review. Live browser
  shows 5/5 pilot selections and zero awaiting Gmail, scheduled or confirmed sent.
- Drafts include one supported programme detail, the listing/referral proposal, a brief
  conditional referral-fee discussion, a routing request, plain signature/postal address and
  reply-based decline. Main body lengths are 116–123 words excluding greeting/signature.
  Sources, exact text, Gmail references and preparation evidence stay in private Gmail and
  gitignored `data/outreach/`; no correspondence or recipient details are committed.
- Human review of wording, signature and commercial positioning remains pending. No all-ten-gates
  passing review is recorded. Timezone/calendar and sender-readiness verification remain required
  before any future scheduling; this session proposes no time. Demo remains Sent/version 10.
- Documentation owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Draft-Pilot-Emails`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned record worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-pilot-draft-record`; branch
  `codex/pilot-draft-record`; intake HEAD/fetched default
  `7625bd9175201b0f3f18c74fd8c3af5198451b74`, validated/fetched this session and worktree
  created 2026-10-12T05:28:01Z. Disposition active until record delivery, then
  ready-for-admin-retirement-review and authorised clean owned cleanup.
- Acceptance verified through actual Gmail reads, the version-checked activity export and
  signed-in CRM; no outbound test messages used. Application deployment/migration is inapplicable:
  only this aggregate documentation changes; runtime source, schemas and hosting stay identical.

- Aggregate-record `check:pr` passed: 83 Python tests, 26 runner checks and four
  PostgreSQL/time tests. Final documentation diff reviewed; no runtime or private file included.

## Pilot draft copy revised — 2026-10-12

- Maheen requested Ejaz introductions, a clear GooCampusWorld/company relationship, an explicit
  temporary-preview explanation and eventual main-platform listings, actual hyperlinks and one
  referral-fee mention. The confirmed primary domain is `goocampusworld.com` (two o's); the
  single-o spelling could not be verified. Persist writing preferences in outreach-plan.md.
- Reconciled the original Gmail draft identities before editing: a human edit had changed one
  underlying message ID while preserving its draft ID. Read the live copies, preserved private
  pre-revision evidence and updated the original five drafts in place; no duplicates created.
- Both text/plain and minimal text/html alternatives contain the revised text. Preview and primary
  URLs use real anchor hrefs. Main proposals discuss listings; only the separate conditional fee
  sentence mentions referral. Per-draft sender display and signature use Ejaz; office address
  remains unchanged. Body lengths 126–133 words excluding greeting/signature.
- Signature check: a recent business Sent message contains an inline image signature, but Gmail
  web's current default contains literal HTML code rather than a rendered image. The original
  pilot drafts had only typed text signatures. Each revised draft uses one clean Ejaz signature;
  no image, duplicate signature or literal HTML is inserted. Account-wide settings stay untouched.
- Verified actual Gmail readbacks: original draft IDs retained, DRAFT labels, unchanged recipients
  and subjects, exact plain/HTML text, both hyperlink targets and no Cc/Bcc or attachments.
  Matching content and preparation evidence are recorded through the normal bound activity runner;
  all remain editable Draft with no approval, review or send time. No send/schedule authorisation.
- Raw text, old/new Gmail references, signature evidence and screenshots remain in private Gmail
  and gitignored `data/outreach/`; no correspondence or recipient details are committed.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Revise-Pilot-Drafts`); canonical repo
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned record worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-draft-revisions`; branch
  `codex/pilot-draft-revisions`; intake/fetched default `ff2244d9f6fc208bdaf96f4ba02d288cb02bef1e`.
  Disposition active through documentation delivery, then ready-for-admin-retirement-review
  and authorised clean owned cleanup. Runtime/schema/hosting changes and release are inapplicable
  to this policy/aggregate-record update; message edits are verified directly in their stores.

- Final CRM export verifies all five revised drafts at version 3, with exact matching content
  and approval/review/send_at null; self-demo remains Sent/version 10 and no pending action file
  remains. Gmail's rendered composer confirms both links are clickable and only one clean
  signature is present. All original draft identities remain in the Draft folder.
- Required record `check:pr` passed: 83 Python tests, 26 runner checks and four PostgreSQL/time
  tests. Final policy/aggregate-record diff reviewed; only documentation is delivered.

## Partnership credibility update — 2026-10-12

- User approved the business-history sentence in the five existing drafts and all three
  trust-building websites on the hosted partnership preview: `goocampusuk.com`,
  `goocampusaustralia.com`, `alscourse.com`. The user confirms GooCampus operates these
  services and has operated for more than a decade. Public pages support their UK/Australia
  career-pathway and India ALS-training descriptions. No exclusivity or unverified
  accreditation claim is added; “India’s only” remains excluded.
- Acceptance: credibility sentence appears once in the same five Gmail/CRM drafts; originals
  retained as editable Draft with no approval/send time; existing two email hyperlinks,
  Ejaz identity, single conditional fee mention and one clean signature preserved. Preview
  introduction features three labelled direct website links and supported descriptions in
  Attio Mono v2, with desktop/mobile, both themes, keyboard/no-JS and existing controls intact.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Strengthen-Partnership-Credibility`);
  canonical repo `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-credibility`; branch
  `codex/partnership-credibility`; intake/fetched default
  `78a8d64f44c733bc53e02ae91a66f38b4ea88f16`, fetched/worktree created
  2026-10-12T07:02:24Z; clean at intake. Native project-chat discovery found no other
  active release owner; this chat claims the existing dedicated marketing-preview release.
  Disposition active through checked/reviewed source delivery and manual site publication.
- No dashboard runtime, schema, auth or hosting configuration change is needed. Gmail remains
  unscheduled; exact content/recipient/time approvals and remaining readiness checks still apply.
  Private correspondence, MIME bodies, Gmail references and evidence remain in Gmail and
  gitignored `data/outreach/`; only aggregate results/policy and public page source are committed.
- Local release checks: 3 affected tests, 29 browser/layout cases (18s), 36 carousel cases
  (18s) and 25 motion cases (43s) pass; repository `check:pr` passes 83 Python, 26 runner
  and four PostgreSQL/time checks. Publish build is 705,888 bytes; direct links and mobile
  network presentation verified. One isolated read-only release review follows checks.
- Same five Gmail draft identities updated in place; exact plain/HTML, Ejaz sender, recipients,
  subjects and DRAFT labels read back. CRM preparation versions are now 4, exact body/subject/
  recipient match, with review/approval/send time null. One fee mention and real hyperlinks
  retained. Self-demo remains version 10. Private version-3 archive and verification preserved.
  No schedule/send action taken; no passing review or final integration claimed.
- Independent isolated blind read-only reviewer found no actionable source/release blockers.
  Source candidate `708b36c1dcac720fbb28b28f9f03f4e50777c96e` merged via PR #66 as
  `45710c171abcfe133b48b029d759b1d08596da7a`; identical-tree integration verified. Canonical
  main cleanly fast-forwarded from intake SHA to that merge.
- Manual dedicated-site release `6acc89a97bc7950e162a0c50` published 2026-10-12T07:18:03.167Z,
  ready/current, title records full source SHA. Team/site/custom hostname unchanged. All 27
  served files byte-match the canonical 705,888-byte build (496-byte headers file is provider
  configuration), CSP/noindex preserved. Deployed 29-case browser matrix passes in 32s.
- Release-record branch `codex/partnership-credibility-record` in the same owned worktree is
  based on fetched default `45710c171abcfe133b48b029d759b1d08596da7a`; runtime unchanged.
  Owner/canonical/worktree unchanged; disposition ready-for-admin-retirement-review after
  record delivery. Both clean owned branches/worktree will be removed only after refreshed
  default integration/SHA checks. Local server stopped and port 8794 verified free.

## Navy accent partnership page — 2026-10-12

- User requests Attio Mono v2 navy-to-blue styling on key sections, numbers, actions/buttons,
  and more attention to GooCampus Network. Final contact section retains buttons and loses
  its repeated visible email/phone block; introduction company contact remains.
- Acceptance: exact original light/dark gradients on primary CTAs and step numbers; themed
  emphasis on key headings/actions, blue-tinted network cards; visible focus, readable contrast,
  mobile layouts and existing FAQ/carousel/clipboard/no-JS behavior preserved. No prospect,
  Gmail/CRM, schema or hosting configuration change.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Apply-Navy-Accent`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`, owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-navy`, branch `codex/partnership-navy`;
  intake/fetched default `a7227a3081d83d11a5ca4a0b369df87b6c419b2e`, fetched 2026-10-12T07:27Z;
  clean at intake. Native project-chat discovery shows no competing release owner; current
  chat continues ownership of dedicated marketing-preview release. Disposition active.
- Local checks pass: 3 build/isolation tests (0.01s), 29 three-engine browser cases (17s),
  36 carousel cases (17s), 25 motion cases (41s), and check:pr (83 Python, 26 runner, four
  PostgreSQL/time checks). Exact gradient hover/press, blue keyboard focus, heading themes,
  bottom contact removal and clipboard/no-JS fallback verified. Build 707,236 bytes.
  Visual review corrected heading selector specificity before final successful captures.
- One isolated blind read-only release reviewer found no blockers after checks. Candidate
  `ac506ab34e2efc6670ca52f5692b5c3ea5c038ca` merged via PR #68 as
  `79dccdbfef67e89a5d1a47c912671f162f96d06e`; identical-tree integration verified. Canonical
  main fast-forwarded cleanly from intake default to source merge.
- Manual dedicated-site deploy `6acc8df9ad36738d279cabea` published 2026-10-12T07:36:27.857Z,
  ready/current, title contains full source SHA; site/team/custom hostname unchanged. All 27
  served files byte-match 707,236-byte canonical build (496 bytes are provider header config),
  CSP/noindex retained. Deployed 29-case browser matrix passes in 34s with zero errors.
- Release-record branch `codex/partnership-navy-record` is based on refreshed default
  `79dccdbfef67e89a5d1a47c912671f162f96d06e` in same owned worktree; runtime unchanged.
  Owner/canonical/worktree unchanged. Clean source/record branches and worktree will be
  removed after record merge and refreshed integration/SHA checks; disposition
  ready-for-admin-retirement-review. Local server stopped and port 8794 verified free.
  Gmail/CRM drafts remain outside this page-only change; no schedule/send action occurred.

## Five-provider pilot scheduled — 2026-10-12

- User approved exact current draft text/recipients and proposed 13 October local times,
  with at least twenty minutes between separate sends. User reiterated scheduling
  authorization after approving the specific DKIM repair and signing into admin/DNS.
- Initial sender preflight found SPF/DMARC passing but DKIM `permerror` because selector
  `google._domainkey.goocampus.in` was absent. Existing Google Admin public key retrieved;
  2048-bit RSA syntax valid; one isolated blind read-only security reviewer found no blockers.
  Only missing TXT record restored in GoDaddy using existing key, provider-saved 3600-second TTL.
  Both authoritative nameservers returned exactly the expected single TXT; Google recursive
  DNS also matched. Existing received office-domain mail cryptographically verified DKIM
  against the restored authoritative key. No key rotation, other DNS changes or test send.
- All five Gmail bodies re-read and matched the approved text. Published contacts/programme
  claims rechecked, existing bulk-send eligibility retained, no duplicate/reply/opt-out found.
  Sourced IANA zones saved, ten mandatory gates reviewed, rubric scores 95/100 recorded
  privately. Human approval remains tied to exact recipient/subject/body/date-time.
- CRM versions: timezone preparation 5, review 6, finalise 7, exact-time approval lock 8,
  scheduling reservation 9, observed Gmail Scheduled 10. Each native Gmail custom schedule
  verified in full message details and exact body; native scheduled-mail search confirmed
  the five instants. CRM matches all five references/times; gaps 20, 20, 20 and 120 minutes.
  Hosted pilot summary shows five scheduled, zero awaiting Gmail and zero confirmed sent.
  Self-only demo remains version 10 and separate. Recipient-free test draft untouched.
- All correspondence, precise timelines, raw verification mail, DNS proposal/admin evidence
  and Gmail/CRM screenshots stay in gitignored mode-0600 private store. Latest local pilot
  metadata reflects scheduled state; pre-scheduling approved-text archive preserved.
  No immediate-send, follow-up, monitoring automation or wider campaign action performed.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Schedule-Pilot-Emails`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned record worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-scheduling-record`, branch
  `codex/pilot-scheduling-record`, intake/default `75a47e6679becc3418cc9139dc393177609667aa`,
  fetched 2026-10-12T08:35:47Z. Clean canonical at intake. This is documentation only: no
  dashboard/marketing runtime, schema or deployment change. Disposition
  ready-for-admin-retirement-review after record merge and refreshed integration/SHA checks;
  remove only this clean owned worktree and feature branch after delivery.
- Record-only check:pr passed: 83 Python tests (0.28s), 26 runner tests and four
  PostgreSQL/time tests (0.59s). Final aggregate/policy diff reviewed; no private records
  or keys included. Application release is inapplicable because only two documentation
  files change; actual DNS and Gmail/CRM mutations have their separate live proof above.

## Repeatable outreach instructions saved — 2026-10-12

- User explicitly requests preserving the finalized process for future requested outreach,
  reusing the same email template with only small changes. Applied the explicitly invoked
  `$writing-for-agents` skill to the named outreach instruction set. Documentation only;
  no new emails, schedules, DNS changes, reminders or workflow execution authorized here.
- `docs/outreach-plan.md` is the one source for trigger/scope/owner, generic approved base
  template, small sourced changes, G1–G10/rubric, human exact approval, sender checks,
  sourced timezone/holiday/DST proposals, separate sends with at least twenty-minute gaps,
  owner lock/reservation, native Gmail Schedule send and observed CRM reconciliation.
  Resume rules preserve existing schedules and prevent stale-ID updates or duplicate effects.
  Future authority stays per requested group/exact version; no automatic campaign/follow-up.
- Removed stale planned/not-built Outreach requirements and obsolete main-site waiting hold
  for the explicitly approved temporary-preview pilot. Entry points in AGENTS, Codex handoff,
  runbook, README and marketing handoff point to the canonical workflow. Historical status
  entries remain dated evidence. Runbook owns payload mechanics; no duplicated global rules.
- Exact provider correspondence, timelines, raw mail, approval evidence and screenshots stay
  private in Gmail/CRM and gitignored `data/outreach/`. The committed example is a generic
  template with recipient/fact/signature placeholders, not a provider message. Current
  scheduled records are preserved; this documentation request does not re-check live mail.
- Acceptance: future agents can find the workflow at intake, reuse its stable base, distinguish
  preparation from scheduling approval and Scheduled from Sent, apply twenty-minute spacing
  despite generic UI suggestions, and resume without recreating the pilot. No unresolved
  authority decision; each future recipient/content/time approval remains required.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Save-Outreach-Workflow`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-workflow-guide`; branch
  `codex/outreach-workflow-guide`; intake/fetched default
  `a8b166965f4d00bbf402b3e227e9189249086392` at 2026-10-12T09:22:15Z, clean at intake.
  Disposition active through record checks/merge, then ready-for-admin-retirement-review
  for this clean owned worktree/ref only. No application release: all changes are documentation.
- Bounded read-only documentation audit found one stale README next-step block; removed
  its obsolete pilot-preparation/screen-build instructions. Clarified draft-stage pending G10
  versus final passing CRM review, and timezone-save review invalidation before locking.
  Documentation path/rule consistency checks pass; check:pr passes 83 Python (0.38s),
  26 runner and four PostgreSQL/time tests (0.57s). No runtime or credential files changed.

## Dashboard control polish — 2026-10-12

- Bounded UX pass across sign-in, overview, research and Outreach: native dropdowns now
  reserve a 12px arrow inset and 40px text clearance in both themes; Outreach Details
  reserves 100px so Select/Open stays on one line even beside long provider content.
  Shared table actions no longer break words. Copy targets, filter heights, disclosure
  spacing and tab focus visibility also improved. Native menus and forced-colour arrows
  retained; no correspondence, auth, schema or prospect access changes.
- Acceptance: readable single-line actions, inset themed dropdown arrows, visible keyboard
  focus, no page overflow at 320/390/768/1440px; existing editor/approval behavior preserved.
- Owner `01a12f8d-5b1d-7aa3-9771-ca3c837e6fd1` (`Polish-Dashboard-Interactions`);
  canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-ux`, branch
  `codex/dashboard-ux-polish`; intake/fetched default
  `06378f1ea0c3492d8cafb0efb0837f8f8fc3f43a` at `2026-10-12T10:00:26Z`.
  Disposition active through checks, isolated release review and manual dashboard publication.
  Active candidate-selection chat confirmed it owns no dashboard release slot or runtime
  changes; this task owns the dashboard release. Checks pass: both eight-view browser
  matrices (6.4s research; 2.5s Outreach), 83 Python tests (0.26s), 26 runner checks
  and four PostgreSQL/time checks (0.60s). Browser screenshots visually reviewed.
  Live read-only auth preflight verifies exact site/sole redirect URL, sign-ups and
  anonymous sign-in off, email confirmation on; no settings changed.

- Isolated blind read-only review found no blockers. Candidate
  `87dac2f8e4395549d4ad45aa7c84db275e6a8d0b` merged in PR #73 as
  `39e96253acfb6179f46d817aa8f3521fb4f74994`; identical-tree integration verified.
  Clean canonical main fast-forwarded from intake to that full source SHA.
- Dashboard deployment `6accb14e2d589fcb2b3c42c9` is ready/current on the existing
  dashboard site `705877a0-828e-46fa-94a7-ca5f7d7e94b0`; title records full source SHA.
  Live HTTPS files byte-match canonical web assets; CSP/noindex preserved. Signed-in
  browser verifies 77/77 Select/Open controls stay on one line and dropdown uses exact
  12px arrow inset/40px text clearance. Five existing scheduled pilot records remain.
- Close owner/canonical/worktree unchanged. Record branch `codex/dashboard-ux-record`
  starts from refreshed default/source merge `39e96253acfb6179f46d817aa8f3521fb4f74994`
  fetched 2026-10-12T10:08Z. Both source/record refs and owned worktree are clean after
  commits, with no in-progress operations; disposition ready-for-admin-retirement-review
  after record merge. Remove only these clean owned refs/worktree after refreshed
  SHA/integration checks. Browser tests stopped their owned servers; no service remains.
  Record-only delivery needs no redeploy because application files are identical.

## Next five outreach candidates recommended — 2026-10-12

- User requests identifying the next five suitable candidates from the existing ready pool.
  Scope is recommendation only: no new CRM selection, draft, scheduling, send, pipeline
  scrape/load or pilot cancellation. Existing scheduled pilot remains intact.
- Proposed group: Drexel Physician Refresher/Re-entry, UAB International Visiting Medical
  Observer, Griffin Hospital Clinical Observership, UC Davis Pathology and Augusta/MCG
  Anesthesia Post-Graduate Observership. Their programme/source details and selected public
  contact routes were checked; none is an excluded domain or current activity provider.
  Focused Gmail searches found no correspondence with the selected addresses. Full rationale,
  contacts, sources and cautions are private in `data/outreach/next-five-candidates-2026-10-12.json`.
- Fit: broad IMG residency preparation at Drexel/UAB; community-hospital graduates at Griffin;
  upcoming defined windows for UC Davis (December–January applications, May 2027 programme)
  and Augusta (February–May 2027 season). Partnership willingness and referral terms remain
  unknown; do not promise slots, acceptance or an existing agreement.
- Routing: Drexel's ranked director address was pattern-guessed despite a valid published
  programme inbox, so use the inbox. Provider-level readiness does not qualify every listed
  address. Griffin permits programme inquiries only through its observership inbox, not
  directors/faculty; eligibility is strict and listed monthly capacity is small.
- Source freshness: the web reader returned an older paused Augusta notice, but direct live
  official HTTP text confirms February–May 2027 and names the coordinator; the live official
  clerkship page's mailto link confirms the existing public coordinator address. No Augusta
  exclusion was added. Check live source when cached web content contradicts recent extracts.
  Columbia is fully booked through August 2027 and deferred for later timing; NYU Dermatology
  remains a narrower specialty alternative, with 2027 review beginning January 2027.
- Current CRM export contains the original five scheduled pilot items and separate self-demo.
  The new group is proposed, not saved as pilot selections or approved for contact. Drafts and
  later exact content/recipient/time approval follow `docs/outreach-plan.md`.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Select-Outreach-Candidates`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned record sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-next-candidates`; branch
  `codex/next-outreach-candidates`; intake/fetched default
  `39e96253acfb6179f46d817aa8f3521fb4f74994` at 2026-10-12T10:07:51Z, clean at intake.
  Documentation only, no application release. Coordinated with
  `Polish-Dashboard-Interactions` on its dashboard release; this chat holds no runtime release slot. Disposition
  ready-for-admin-retirement-review after record merge and refreshed integration checks,
  for this clean owned worktree/ref only.
- Source/address/exclusion/duplicate checks completed; private record contains five unique
  proposed contacts outside the current pilot. Record-only check:pr passes 83 Python
  (0.31s), 26 runner and four PostgreSQL/time tests (0.77s). No runtime release applies.

## Overview outreach tracking — 2026-10-12

- User requests sent-email and response/outcome totals on Overview; confirms gone cold
  after fourteen days. Acceptance: confirmed Sent only, Scheduled separate, human replies
  split into interested/rejected/other, awaiting/cold separated, automatic/bounce separate,
  self-demo excluded; all activity pages loaded; both themes/mobile and refresh work.
- Current store has one outreach email per provider. Overview reads the existing private
  activity tables after sign-in, across all batches, and preserves Sent history after opt-out.
  Latest human reply determines interest/rejection; opt-outs count as rejected. Automatic
  replies never count as human replies. Cold uses fourteen days from recorded Sent confirmation
  because actual delivery timestamps are not stored. Unknown confirmation age stays awaiting.
  Counts represent recorded observations, not a live inbox scan. Refresh/load timestamps and
  latest recorded Gmail check are visible; errors mark any previous totals as stale.
- Owner `01a12f98-5d80-7af3-b89d-4b9668d0a645` (`Track-Outreach-Responses`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; task sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-overview`; branch
  `codex/outreach-overview`; intake/fetched default `d4f99db0cf2b4c6ba2a1fa3eff62762bb0c27e47`
  fetched 2026-10-12T10:12Z; clean at intake. Disposition active through delivery/release.
  Previous UX release completed; its chat is archived and no dashboard owner is active.
  This task claims the existing dashboard release slot; candidate-selection task is documentation only.
- No schema, auth, prospect policies, Gmail sending/scheduling or inbox monitoring change.
  Correspondence and recipient evidence stay in the existing private stores.
- Affected checks: seven PostgreSQL/model/pagination cases (0.59s), eight-view design
  matrix (8.3s), Outreach editor/demo matrix (2.7s). check:pr passes 83 Python (0.28s),
  26 runner and seven PostgreSQL/model cases (0.60s); final diff and desktop screenshot
  reviewed. Read-only live auth preflight confirms exact site/sole redirect URL, signup
  and anonymous access off, email confirmation on; no settings changed. Exact Netlify
  dashboard site/team/hostname and existing ready deployment verified; no Git connection.
- One isolated blind read-only review found no blockers. Candidate
  `e9bace2e74a7d30dc18967c5fe383e9667165063` merged via PR #76 as
  `3bf08190057ef0cee9d37af5dc6079d2b094415e`; identical runtime/test tree verified.
  Canonical main cleanly fast-forwarded from `29bf28af9e92821df38e839f5e0575d029d7f337`
  to that source merge. No in-progress operations or unrelated local changes.
- Dashboard deployment `6accb40a0cfd9270b016964a` published
  2026-10-12T10:18:54.212Z, ready/current on site
  `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, GooCampus team; full source SHA in title.
  Seventeen served files byte-match canonical assets; CSP/noindex retained.
  Signed-in live Overview verifies zero confirmed real-provider sends, five scheduled,
  zero human replies/outcomes; demo excluded. Refresh reloads timestamps and View outreach
  opens the existing five-pilot workspace. No correspondence data changed.
- Release slot relinquished after verified publication. Close owner/canonical/worktree
  unchanged; record branch `codex/outreach-overview-record` starts from source merge above,
  default refreshed 2026-10-12T10:20Z. Runtime unchanged, no second deploy required.
  Source and record refs/worktree are clean after commits, no in-progress operations;
  disposition ready-for-admin-retirement-review after record integration. Remove only
  this owned worktree and these two feature refs after refreshed SHA/integration checks.
  UI-test servers stopped automatically; no task process/service remains.

## Next-wave scheduling and preparation quota — 2026-10-12

- User requests checking the five displayed emails, especially UC Davis dates, then scheduling
  the next available recipient-business slots with the established twenty-minute minimum,
  and reporting all scheduled emails in IST. Current first five schedules remain untouched.
- Source checks confirm UC Davis applications December 1, 2026–January 31, 2027 for May 3–28,
  2027; Augusta live/Jina text confirms February–May 2027; Drexel IMG observership/preceptorship,
  UAB four/eight-week eligibility, Griffin four-week/ECFMG/USMLE facts and chosen public routes
  verified. No matching prior/new correspondence found; five exact displayed emails saved
  as Gmail drafts, plain/HTML bodies read back. Precise content/identities/proposed timeline
  are private in `data/outreach/next-wave-drafts-2026-10-12.json`. New five are not scheduled.
- CRM Save rejects the next provider: `The five-provider pilot is full`. The deployed guard
  counts all non-parked history, including Scheduled and Sent, so it cannot support repeat
  groups without discarding/cancelling history. No guard was bypassed and no existing record
  was changed. Preparation/approval/reservation must precede Gmail scheduling.
- Narrow fix: migration `20261012104500_outreach_preparation_slots.sql` replaces only the
  quota predicate/message in the existing function: count Draft/Finalised/Locked/Scheduling,
  excluding self-demo, with maximum five. Scheduled/terminal history remains preserved.
  Existing role checks, eligibility, exact approvals, versioning, serialisation, schedule
  reconciliation and RLS/grants stay intact. Local UI counter distinguishes preparing
  quota from selected history; no wider campaign or automatic sending is introduced.
- Production migration is not applied: there is no declared SQL/DDL command or binding.
  Current `prod-pipeline` only has REST/DML credentials; the prior saved-CLI exception is
  consumed. A documented migration capability or explicit scoped operator-console exception
  is required. No Netlify release consent exists under the latest shared instructions.
  UI changes are local only; pending database activation blocks completing new schedules.
- Checks: eight affected PostgreSQL/model tests pass (0.62s); Outreach UI test passes (4.47s);
  check:pr passes 83 Python, 26 runner and eight PostgreSQL/model checks. Initial test reused
  a parked fixture with version zero; corrected to its current version three and reran.
  One isolated blind read-only migration/security review follows final checks.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Schedule-Next-Outreach`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-slots`; branch
  `codex/outreach-preparation-slots`; intake/fetched default
  `b6ec4c9d8026f298989f03e96a7646a90b6d241a` at 2026-10-12T10:35:29Z; clean at intake.
  Disposition active through checked/reviewed source delivery; preserve pending migration
  evidence and credentials boundary. No production activation or hosted-publication claim.
- Before source push/merge, dashboard and marketing Netlify sites show no Git repository
  provider/path/build command; GitHub repository hook inventory is empty. Source delivery
  therefore does not trigger a Netlify publication. All actual email/DNS evidence stays private.
- Isolated blind read-only review found no blocking migration/security defect; confirmed
  only quota predicate/message change and preserved role/eligibility/approval/version/Gmail
  protections. Required activation checks: compare live prior function, verify applied
  identity/owner/grants, and unchanged scheduled/terminal rows. SQL capability remains absent.
  Scoped native SQL Editor operator exception is the proposed next access decision.


## Twenty outreach drafts prepared for review — 2026-10-13

- User requests about twenty customised provider drafts, including five previously prepared
  unscheduled messages, with checkboxes and comments for reviewing the complete set together.
  Scope is recipient/content review only: no new scheduling, sends, follow-ups or monitoring.
- Prepared twenty unique provider/contact drafts: retained the five existing Gmail versions
  unchanged and saved fifteen additional drafts using published programme contacts and one
  brief programme-specific paragraph. Exact recipient, subject, plain/HTML alternatives,
  direct preview/main-platform links and the approved signature match Gmail readback.
  Original five scheduled pilot records and unrelated recipient-free test draft are preserved.
- Private owner-only Page contains twenty native unchecked approval checkboxes, twenty comments
  areas, full exact email text and separately labelled source/caution notes. Checkbox approval
  covers the displayed recipient/content version only; send times require later approval.
  Page identity, draft identities/text/hashes and sources remain private in
  `data/outreach/review-twenty-2026-10-13.json`, not in this public status record.
- Source review replaced unsuitable or narrower candidates rather than relying on historical
  readiness alone; current official shared inboxes supersede guessed/older contacts. Seasonal
  closures, specialist eligibility, sponsor requirements and routing limits are review notes;
  no open-seat, placement, affiliation, fee-rate or personal-biography claims are invented.
  UC Davis and Augusta dates were rechecked against current official pages. New-provider
  Gmail searches found no previous correspondence; current CRM export contains only the
  original five scheduled items and separate self-demo.
- Gmail connector briefly returned a shared per-minute quota error. Native draft inventory
  confirmed the failed create made no draft; after the limit cleared, remaining saves completed
  without duplicate effects. All twenty are observed as Draft, with exact MIME readback.
- Hosted CRM matching preparation remains unavailable because the original five-provider
  total-history guard is still active; the already-reviewed preparation-slot migration is
  not activated. The twenty-draft review request does not authorize bypassing the guard,
  a new credential source, automatic sending or a hosted application release. Review proceeds
  in the private Page and Gmail; CRM reconciliation remains pending supported activation.
- Acceptance: twenty sourced custom emails available together; five existing versions preserved;
  twenty unchecked native content-approval controls and comment areas; zero new schedules/sends;
  private correspondence excluded from Git. Native Page readback confirms all controls and
  recipient/subject/custom paragraphs; saved Gmail confirms exact content and Draft state.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Review-Outreach-Drafts`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-review-twenty`; branch
  `codex/outreach-review-twenty`; intake/fetched default
  `20a03c2e4338fc2b5e4c217fa719610740c8a110` fetched 2026-10-13T06:03:08Z.
  Documentation-only delivery; application release is inapplicable because no runtime,
  schema or configuration changes. Disposition active through record checks/merge, then
  ready-for-admin-retirement-review for this clean owned worktree/ref only.

- Signed-in Chrome preview confirms the owner can edit the Page, all twenty native checklist
  controls are unchecked, headings provide navigation, and the full email text/direct links
  render correctly. Private preview screenshot saved; the review tab is retained for the user.
- Record-only checks: 83 Python tests (0.27s), 26 credential/worktree contract tests and eight
  PostgreSQL/model checks pass. Initial fresh-worktree check lacked installed PGlite; installed
  locked dependencies with scripts disabled and a nonsecret-only child environment, then
  reran check:pr successfully. No source, dependency lock or credential binding changes.


## Attio Free project outreach imported — 2026-10-13

- User explicitly requests configuring the free-tier outreach pipeline, importing the twenty
  reviewed candidates/drafts/statuses, no new scheduling or sending, and removing unrelated
  email from Attio. Attio is now the project activity tracker; Supabase research remains.
- Current workspace plan shows Free at zero monthly cost. Original automatic trial benefits
  may remain temporarily visible; configuration uses only standard Companies/People, notes,
  a Status field and an approval Checkbox. No upgrade, paid sequence, workflow, watcher or
  new sender was activated. Native connector handles records/notes; browser handles the
  unsupported attribute/list/list-entry controls.
- Private review Page shows all twenty content approvals checked and no comment threads.
  Preserved the operator's edits, applied digits to remaining programme durations, and updated
  ten changed Gmail drafts. Exact plain/HTML readback verifies twenty still-Draft messages.
  Content approval is separate from send-time approval; none of the twenty has a new schedule.
- Imported twenty unique provider Companies, twenty linked published-contact People and twenty
  complete draft/review/source notes. Company fields expose Content approved and the exact
  human content approval. Native readback verifies IDs, associations, stages, bodies and list
  membership. The project list also retains the five existing scheduled pilot records with
  five preserved full-email notes and native Gmail schedule references: twenty review candidates
  plus five historical pilot records, not twenty-five new outreach recipients.
- Attio exposed future sent timestamps for the five Gmail Scheduled messages. Native Gmail
  confirms five Scheduled and zero project Sent; never use synced presence/timestamps as
  sending or delivery proof. No schedule cancellation, immediate send or forwarding occurred.
- Attio has no Gmail-label allowlist; the account settings also state that the operator always
  sees all their own synced mail. Full office-mailbox/calendar connection was removed after
  preserving known project text/references and independent read-only privacy review. Native
  Attio email search now returns zero communications; account UI shows only its separate
  forwarding inbox. Gmail drafts/schedules and originals are preserved. Removing sync does
  not remove the previously generated People/Companies; those unrelated records are left
  untouched and outside the project list. No claim of erasing unrelated calendar recordings.
- Project-only updates occur during requested sessions: targeted Gmail sent/reply checks and
  Attio evidence notes/stages/tasks. Optional selective BCC/forwarding capture needs explicit
  authority and is not enabled under the no-send hold. No broad mail sync or background updates.
  The older preparation-slot migration remains unapplied; it is unnecessary for Attio tracking.
- Exact recipient correspondence, approval scope/version evidence, draft/record/note/list IDs,
  mailbox-removal proof and screenshots remain private in gitignored `data/outreach/`.
  Canonical workflow now documents Attio controls, digits, project-only capture and Gmail
  status as sending truth. Existing research schema/RLS/credentials and public sites unchanged.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Import-Attio-Outreach`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-attio-import`; branch
  `codex/attio-outreach-import`; intake/fetched default
  `6fd78242f39cda064576f2cf27933fdd97cfeba3` fetched 2026-10-13T06:38:23Z.
  Documentation-only source delivery; no application release applies. Disposition active
  through record checks/merge, then ready-for-admin-retirement-review for the clean owned ref.
- Source push/release guard: signed-in Netlify Developer settings show Current repository:
  Not linked for both dashboard and partnership projects; GitHub hooks and Actions workflows
  are empty. Documentation source delivery cannot trigger an unapproved hosted publication.

- Required check:pr passes 83 Python tests (0.29s), 26 runner/worktree checks and eight
  PostgreSQL/model checks (0.67s). Final documentation diff reviewed, whitespace check clean.
  One isolated blind read-only privacy/removal reviewer found the scoped operation safe
  conditional on preserving project notes/Gmail and verifying removal; all required postchecks
  passed. No authenticated reviewer access, new paid features or application deployment.

## Explicit project inbox check — 2026-10-14

- At Maheen's request, Gmail was checked only against 12 known outreach participants whose messages had a Gmail `SENT` label: the five original pilot contacts and seven first-wave contacts sent on 14 October. The full private evidence and message references remain in gitignored `data/outreach/reply-check-2026-10-14.json`; recipient details and message bodies are not copied into this document.
- Attio now records all 12 as Sent. Seven companies moved from Scheduled to Sent after the sent labels and message dates were verified; the five pilot records were already confirmed Sent.
- The participant-scoped search found one automatic mailbox reply, not a human partnership response. It reports the programme is fully booked through April 2027 and describes its waitlist/application requirements. The reply is logged in Attio as automatic; the company stage remains Sent. It was not a decline, redirect or opt-out.
- No human replies were found among the 12 sent participants. No response or follow-up was sent or scheduled. At the previous verified snapshot 40 messages were scheduled; seven have now sent, leaving 33 scheduled by reconciliation. New checks remain explicit and session-only; no mailbox monitoring was enabled.

## TypeSafe development smoke capability — 2026-10-15

- Added the development-only `dev-typesafe` binding in Infisical project
  `1b056234-5b7a-4d98-87a2-635730076e34`, environment `dev`, path
  `/TypeSafe` (folder ID `66891fa3-18ed-48e2-ba02-f20b92be21f0`), with only
  `TYPESAFE_API_KEY` and `expand=false`.
- The reusable `dev-typesafe-smoke` command sends one fixed synthetic request to TypeSafe's
  System One endpoint using `jev-latest`. Its fictional excerpt explicitly says the fictional
  observership accepts international medical graduates. It validates the returned model,
  `noul` answer, probability range and token usage capped at 10,000 total tokens; arguments,
  retries, redirects, raw response output and raw error output are excluded. Runbook and
  invocation commands are in `docs/typesafe-smoke.md`.

## Twenty approved outreach emails scheduled — 2026-10-13

- User explicitly approved the proposed times and scheduling all twenty reviewed versions.
  Native Gmail scheduling is complete: ten on each of the two approved weekday dates.
  Final native Scheduled query returns twenty-five unique messages, including the five
  unchanged original pilots; the minimum gap across all twenty-five UTC instants is
  twenty minutes. All new sends fall within the approved recipient-local morning windows.
- Preflight matched exact approved recipients, subjects, bodies and links, confirmed no
  incoming replies or duplicate sent/scheduled effects for the new twenty, and verified
  current SPF/DKIM/DMARC without changing DNS. Each Gmail date/time picker showed IST.
  Each saved message was checked for its scheduled banner, full recipient/date/year/time,
  approved content, direct hyperlinks and absence of extra recipients or attachments.
  Gmail serialization changed wrapping only; normalized content and links remained exact.
- Attio records moved to Scheduled only after observed Gmail proof. Twenty separate
  approval/reservation notes and twenty new scheduled-confirmation notes preserve exact
  approved versions, times and Gmail references. Original draft notes remain historical.
  Native record and note readback confirms all twenty statuses and matching evidence.
  The private review Page and current local records now show the actual schedules.
- Whole-mailbox sync remains removed and native Attio email search returns zero. No new
  BCC, forwarding, background monitoring, follow-ups or immediate sending was enabled.
  Scheduled remains distinct from Sent; future sending requires observed Gmail Sent proof.
  The unrelated recipient-free test draft remains intact.
- One isolated blind read-only auditor verified recipient/time mappings, original pilot
  preservation, timezone conversions and spacing. Evidence metadata was clarified to record
  the native in:scheduled query, all twenty reservations and distinct note relationships.
  Exact correspondence, identifiers, dates/times and screenshots remain gitignored/private
  in data/outreach/twenty-scheduling-2026-10-13.json and its referenced evidence files.
- Acceptance: exactly twenty newly scheduled approved messages, five unchanged originals,
  minimum twenty-minute spacing, twenty verified Attio Scheduled statuses and updated review
  evidence. No runtime/schema/configuration changes; application release is inapplicable.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Schedule-Approved-Outreach); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling
  /Users/maheenejaz/Developer/global-clinical-outreach-twenty-schedules; branch
  codex/outreach-twenty-schedules; intake default
  986d060b8c423934effa1c89a538722c66d78a1f. Documentation-only record saved locally;
  no push, merge or Netlify publication required for this scheduling request. Preserve
  this clean unmerged record branch; private operational evidence stays in canonical data.
- Required check:pr passes: 83 Python tests (0.27s), 26 runner/worktree checks and eight
  database/model checks. Installed missing locked PGlite dependencies with scripts disabled
  before retrying the initial fresh-worktree failure; dependency lock remains unchanged.
  Documentation diff reviewed; whitespace check clean. Refreshed default remains
  986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-13T09:25:21Z.
  Disposition preserve-unmerged: clean local record commit retained, no hosted release.

## Next twenty provider drafts prepared in Gmail and Attio — 2026-10-13

- User requested twenty new suitable candidates and customised drafts saved in Gmail and
  Attio for review, with an explicit no-schedule/no-send hold. Checked thirty-two remaining
  sourced candidates against programme pages and the current professional-body directory.
  Chose twenty direct hospital/university providers, with one published contact each; no
  placement companies, guessed recipients, paid enrichment or new research-pipeline writes.
- Excluded closed intake, unverified stale requirements, unsuitable contact routes and
  uncertain cached contacts. Additional departments at institutions already approached were
  omitted. Programme-specific inboxes replaced two weaker shortlist contacts using existing
  cached published sources and current verification. Source cautions preserve conditional
  availability, faculty-sponsor requirements and student/graduate audience distinctions.
- Reused the approved Ejaz/company identity, decade credibility sentence, conditional
  referral-fee sentence once, routing/decline text and single business signature. Each draft
  changes its subject, role greeting and one verified programme paragraph only. Programme
  durations use digits; no personal-biography customisation or unsupported date/seat promises.
  Preview and primary website links are direct real HTML hyperlinks and both return HTTP 200.
- Native Gmail create/read verifies twenty unique Draft messages: exact recipients/subjects
  and both MIME bodies; no CC/BCC, attachments, images or duplicate signatures. Gmail
  normalizes email-domain capitalization only. Targeted Gmail/Attio preflight history is
  clear; the final new-recipient Sent/Scheduled query returns zero. All twenty-five existing
  schedules retain their IDs, recipients, subjects and times. The unrelated test draft remains.
- Attio Free project list contains forty-five entries: twenty new Awaiting review plus the
  twenty-five prior records. Twenty linked contacts and full version/hash/body/source/caution
  notes are saved and read back. Content approval remains false. No mailbox/calendar sync,
  forwarding/BCC, paid feature, follow-up or background monitoring was enabled. Automatically
  enriched domain metadata is not treated as verified programme evidence.
- New private owner-only review Page contains twenty full exact saved emails, unchecked
  recipient/content checkboxes, comment areas, source cautions and Gmail/Attio links. Native
  readback verifies all twenty bodies and controls. Initial Page creation capped the input
  units; readback found the missing last body/notes and a guarded insertion completed them
  without replaying existing content. Attio browser preview shows review statuses and a count of 45.
- Private data/outreach/next-twenty-drafts-2026-10-13.json holds the exact current versions,
  identities, quality evidence and mappings; separate qualification files preserve source
  checks. G1–G9 draft checks pass, rubric 90/100 with explicit brevity deduction; G10 remains
  pending human recipient/content/time approval. These are drafts, not approved sends.
- Acceptance: twenty custom sourced drafts saved and matched in both services, available
  together for review; zero new schedules/sends and prior schedules/test preserved. Affected
  content/hash/MIME/links/signature, note/record/list and Page checks pass; no runtime, schema
  or configuration changes, so no application release or hosted publication applies.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Prepare-Outreach-Candidates); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling /Users/maheenejaz/Developer/global-clinical-outreach-next-twenty;
  branch codex/outreach-next-twenty, intake HEAD 986d060b8c423934effa1c89a538722c66d78a1f.
  Refreshed default 986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-13T10:30:40.681450+00:00. Documentation-only
  operational record committed locally; disposition preserve-unmerged, clean owned branch
  retained. No source push/merge or Netlify release is required for draft preparation.

## Next twenty approved emails scheduled with delegated time selection — 2026-10-13

- Operator approved the exact twenty reviewed recipient/content versions, retained the two
  existing website links, and explicitly delegated choosing suitable send times and Gmail
  scheduling. This supersedes the previous no-schedule hold for this group only; it does
  not authorize future groups, immediate sending, follow-ups or inbox monitoring. The exact
  instruction and selected recipient/local/UTC/IST timeline are retained privately.
- Selected two recipient-local weekday mornings, ten messages per day, after the existing
  queue. Current NIST daylight-saving rules, federal holiday schedule and sourced provider
  locations support the conversions. Every new send falls between local 09:00 and 11:00.
  Current SPF, restored DKIM key and DMARC verified; an existing received office message
  cryptographically verifies against current public DNS. No DNS change or new test mail.
- Fresh Page and stable Gmail draft-ID reconciliation matched all twenty approved versions;
  targeted reply/prior-effect searches and scheduling-reservation checks were clear. Each
  native Gmail IST picker was checked before submission, then the saved Scheduled banner,
  Cancel send control, full year/date/time/recipient/subject, body/signature and direct links
  were verified. Gmail MIME readback preserves wording and no extra recipients/attachments.
- Twenty distinct authorization/reservation notes preceded scheduling; twenty Scheduled
  confirmation notes followed observed Gmail proof. Attio stages and confirmation-note
  bodies are read back. Historical draft notes remain separate. One transient Attio write
  connection error was reconciled by metadata search before saving the absent note. A Gmail
  connector rate limit cleared after independent work and a bounded wait; no scheduling
  action was repeated. Full UI observations handle omitted connector label arrays.
- Final native Gmail in:scheduled query returns forty-five unique messages with no next
  page: twenty new schedules plus the twenty-five original IDs/recipients/subjects/times
  unchanged. Minimum gap across all forty-five actual UTC instants is twenty minutes. The
  unrelated recipient-free test draft remains. All twenty new Attio records show Scheduled;
  none is claimed Sent. Current private review Page shows checked typed-content approval
  records and actual IST schedules, with direct native Gmail references.
- Exact drafts/hashes, delegated authorization, source zones, original/final snapshots,
  reservation/confirmation relationships, screenshots and reconciliation live privately in
  data/outreach/next-twenty-scheduling-2026-10-13.json. Latest draft/intake files point there.
  The Page checkbox update records the typed instruction, not a guessed human click actor.
- Acceptance: exactly twenty unchanged approved emails scheduled and matched to Attio,
  at least twenty minutes between sends, original twenty-five schedules/test preserved,
  review evidence current. Native message/MIME, Attio note/stage, Page and deterministic
  timezone/spacing checks pass. No runtime/schema/config changes; application release and
  hosted publication are inapplicable. Independent read-only audit is recorded privately.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Schedule-Next-Outreach); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling /Users/maheenejaz/Developer/global-clinical-outreach-next-schedules;
  branch codex/outreach-next-schedules; intake HEAD 986d060b8c423934effa1c89a538722c66d78a1f.
  Refreshed default 986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-13T11:14:36.554170+00:00.
  Documentation-only operational record committed locally; disposition preserve-unmerged.
  Clean owned branch retained; no source push, merge or Netlify publication required.
- One isolated blind read-only reviewer independently matched all twenty plans/completions,
  original twenty-five identities/instants, forty-five-message spacing and timezone math,
  and the dates/times in all twenty saved screenshots. Refreshed stale intake approval/state
  fields and made completion version/hash references explicit, preserving intake history.
  The preferred 09:00–11:00 recipient-local window includes its endpoints.

## First five pilot sends confirmed and tracking updated — 2026-10-14

- Operator requested confirming the first outreach batch and updating project tracking.
  Native Gmail Sent search returns exactly the five original pilot messages, each with
  SENT in both search and full MIME readback. Original IDs, recipients and subjects match;
  internal timestamps and Date headers agree with the approved previous-day instants.
  None of these five remains Scheduled. Sending is confirmed; recipient inbox delivery
  is not independently established.
- Targeted incoming-recipient and delivery-failure searches return zero, and all five
  project threads contain only the outgoing message. No replies or failure notices
  observed at this check. Do not infer a guaranteed delivery outcome from that absence.
- Updated only the five current Attio pilot Companies from Scheduled to Sent, preserving
  their content approvals and historical scheduling notes. Five new evidence notes keep
  actual sent text, Gmail references, UTC/IST timestamps and check results. Native stage
  and note readback verifies all five. No new messages, schedules, follow-ups, forwarding,
  BCC, calendar events, mailbox connection or background monitoring actions.
- Gmail still contains forty future schedules; their IDs, recipients, subjects and times
  exactly match the earlier forty-five-message snapshot minus the sent pilot. Updated
  active private pilot metadata, Attio-import latest-state fields and the two review-Page
  summaries. Historical captures/legacy activity remain historical; Attio is the current
  tracker. Private current-outreach-state.json records five Sent and forty Scheduled.
- Exact correspondence, note/message IDs, complete verification and private snapshots are
  gitignored in data/outreach/pilot-sent-confirmation-2026-10-14.json. Acceptance: five
  genuine SENT proofs reflected in Attio/current records, replies/failures checked and all
  forty future schedules preserved. Affected native-label/header/date/thread, Attio note/
  stage, Page-summary and private-state checks pass; whitespace check clean.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Confirm-Outreach-Sends); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling /Users/maheenejaz/Developer/global-clinical-outreach-pilot-sent;
  branch codex/outreach-pilot-sent; intake HEAD 986d060b8c423934effa1c89a538722c66d78a1f;
  refreshed default 986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-14T05:18:58.935375+00:00. Documentation-only
  operational record saved locally; no runtime/config/schema change, application release
  or Netlify publication applies. Disposition preserve-unmerged; clean owned branch retained.

## Next twenty contact candidates shortlisted — 2026-10-14

- Operator requested the next twenty suitable email IDs only. Excluded forty-five providers
  already contacted or scheduled, screened the remaining research pool and supplemented
  it with six fresh candidates from the previously scraped/current professional-body
  directory. Selected twenty direct U.S. providers, one published address each, after
  current programme and contact-role checks. No placement companies or guessed addresses.
- Prefer programme inboxes/coordinators over weaker shortlist contacts. New selections
  correct several contact-role mismatches. Hold closed intake, stale/unverified programme
  evidence, partner-affiliation-only and regional-audience restrictions, wrong offices,
  additional departments at institutions already approached and restrictive direct-contact
  applicant routes. Future seasonal and advanced-specialist requirements stay attached
  to individual candidates; a contact shortlist never proves available placements.
- Supplementary ENT candidates use exact emails already in the cached/current 2026
  directory, with current official department/programme screens. The separately sourced
  Columbia rhinology programme is distinct from its closed psychiatry programme. The
  separately eligible Duke ENT programme is not under the excluded Duke Radiology domain;
  existing exclusions remain unchanged. One candidate uses a personal-domain address
  explicitly published as a professional programme contact; it is not inferred.
- Fresh targeted Gmail searches for all selected contacts return zero correspondence,
  and Attio company-domain searches return zero matching records. Twenty unique domains
  and addresses pass exclusion/history/source checks. Public source retrieval used free
  reader/direct-page routes; no new paid checker/scraper or subscription was used.
- Private source/role/caution evidence and selected addresses are saved in gitignored
  data/outreach/third-twenty-shortlist-2026-10-14.json and its matching CSV. Qualification
  files retain held alternatives and the reasons. No new Gmail drafts, CRM imports,
  schedules, sends, follow-ups, calendar items or monitoring actions were created.
- Acceptance: twenty source-backed direct-provider contact candidates available for review,
  existing outreach excluded, route/audience cautions retained and no outreach effects.
  Affected source/publication, uniqueness, exclusion and native history checks pass;
  no code/runtime/config/schema change or application release applies.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Shortlist-Outreach-Contacts); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling /Users/maheenejaz/Developer/global-clinical-outreach-third-shortlist;
  branch codex/outreach-third-shortlist; intake HEAD 986d060b8c423934effa1c89a538722c66d78a1f;
  refreshed default 986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-14T08:07:40.835702+00:00. Documentation-only
  record committed locally; disposition preserve-unmerged. Clean owned branch retained;
  no source push, merge or Netlify publication required.

## Third twenty provider drafts saved for review — 2026-10-14

- Operator requested customised Gmail and Attio drafts for the twenty just-shortlisted
  published contacts, using the approved template, with an explicit no-schedule/no-send hold.
  Reused Ejaz/company identity, decade credibility sentence, two direct website hyperlinks,
  one conditional referral-fee sentence, routing/decline text and one clean business signature.
  Customised subject, role greeting and a sourced programme/audience detail per provider.
  Seasonal, senior-physician, licensing/residency and sponsor restrictions are reflected
  in the appropriate text and private review notes; no biography personalisation or capacity
  promises. Programme durations use digits; no guessed intake dates.
- Fresh office-Gmail and Attio history checks were clear for these twenty. Native Gmail
  creation and full MIME readback verifies twenty unique DRAFT messages with exact To,
  subject, plain/HTML bodies and real links; no CC/BCC, attachments, pixels or image signature.
  Both website URLs return HTTP 200. Existing forty schedules retain their exact IDs,
  recipients, subjects and instants; the unrelated recipient-free test draft remains.
- Attio Free has twenty new provider Companies, linked published-contact People and
  complete draft/version/hash/source/caution notes. Each stage is Awaiting review and
  content approval is false. Native stage, association, list and full-note readbacks pass.
  Project list has sixty-five entries including the previous forty-five. An interrupted
  note response was reconciled by finding and verifying the already-saved note; no duplicate
  was created. No whole-mailbox sync, forwarding/BCC, paid workflow or monitoring change.
- New private owner-only review Page contains all twenty full exact emails, native unchecked
  recipient/content approval controls, comment areas, source/caution notes and Gmail/Attio
  references. Native Page readback matches all twenty email bodies and controls; initial
  creation used twenty-two complete units to avoid the earlier input-unit cap.
- Exact correspondence and identifiers remain gitignored in
  data/outreach/third-twenty-drafts-2026-10-14.json. Current private outreach summary adds
  twenty Awaiting review contacts. G1–G9 draft checks pass; score 90/100 with explicit brevity
  deduction for retained approved disclosures. G10 remains pending human recipient/content/
  time approval; sender readiness/timezone checks await any later scheduling instruction.
- Acceptance: twenty customised sourced versions saved/matched in both services and
  available together for review; zero new Sent/Scheduled effects and old schedules/test
  preserved. Affected MIME/source/link/signature, stage/note/list and Page checks pass.
  Documentation-only record; no runtime/schema/config change or application release applies.
- Owner 01a12a58-97aa-7e13-8c38-0c32cb3dd950 (Draft-Provider-Outreach); canonical
  /Users/maheenejaz/Developer/global-clinical-outreach; owned sibling /Users/maheenejaz/Developer/global-clinical-outreach-third-drafts;
  branch codex/outreach-third-drafts; intake HEAD 986d060b8c423934effa1c89a538722c66d78a1f;
  refreshed default 986d060b8c423934effa1c89a538722c66d78a1f at 2026-10-14T09:09:42.730716+00:00. Local record commit
  retained clean, disposition preserve-unmerged. No source push, merge or Netlify publication.

## Third twenty scheduled in Gmail — 2026-10-15

- The operator approved the twenty reviewed recipient/content versions and explicitly
  delegated choosing the next recipient-local morning slots, with at least 20 minutes
  between sends. All twenty are now Scheduled in office Gmail and reconciled to Attio.
- Kept the established ten-per-day cadence: ten on Tuesday 20 October and ten on
  Wednesday 21 October 2026. Every send falls within 09:00–11:00 recipient-local
  time using sourced locations and the applicable Eastern, Central or Pacific zone.
  Actual-date DST and federal holiday checks passed.
- Exact current Gmail plain/HTML drafts matched the approved review Page and Attio
  version notes. Duplicate/prior-send/incoming checks were clear for these recipients.
  Current SPF/DKIM/DMARC and received-message cryptographic DKIM checks passed;
  no extra test email or domain/admin change was needed.
- Recorded per-provider scheduling reservations before using Gmail's native Schedule
  send dialog. Verified each saved full date/year/time, recipient, subject, exact
  wording, direct links and clean signature before setting Attio Scheduled. Native
  Gmail query/MIME and Attio stage/note readbacks confirmed all twenty.
- Final Gmail queue: fifty upcoming messages. The thirty pre-existing schedules
  retained their IDs, times, recipients and subjects. Minimum gap across the whole
  queue is twenty minutes. Three unrelated/test drafts remain untouched. No immediate
  send, follow-up, forwarding, mailbox sync, paid feature or monitoring was activated.
- The private review Page records typed chat approval and all twenty saved IST/local
  schedules; email text and comments are preserved. Full private correspondence,
  versions/hashes, approval, source zones, reservations, Gmail/Attio references and
  screenshots are retained in gitignored `data/outreach/third-twenty-scheduling-2026-10-15.json`.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Schedule-Provider-Outreach`);
  canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-third-schedules`; branch
  `codex/outreach-third-schedules`; fetched default
  `1289dfd3e47881187038e3b065debac106e77d07` on 15 October 2026.
  Documentation-only local delivery; application release and hosted publication
  are inapplicable because no runtime/configuration/schema changed.

## Fourth twenty saved for review — 2026-10-15

- The operator requested twenty additional suitable candidates and customised drafts
  using the approved template, saved in Gmail and Attio, with an explicit no-schedule/
  no-send hold. All twenty are now saved as Gmail Draft and Attio Awaiting review,
  with recipient/content approval false and no send time. The private review Page
  contains all twenty full emails, unchecked content-approval boxes and comment areas.
- The group comprises sixteen direct hospital/clinic/education programmes and four
  clinical-placement networks. Each has a published source-matched contact and a
  programme-only custom paragraph. The stable Ejaz/GooCampusWorld introduction,
  credibility wording, two direct website links, one conditional fee sentence,
  routing/decline language and approved postal signature remain unchanged. No personal
  biography, price, seat guarantee or unverified programme date was added.
- Checked the prior sixty-five project participants and Gmail/Attio history. Reused
  an existing nonproject company record for one network and preserved its unrelated
  fields. Its historical 2021 partnership discussion is flagged for re-engagement
  review; the email contains no historical personal details. Three networks have
  explicitly published partnership routes, and the fourth has a general business inbox.
- New US research batch `us-04` contains thirteen providers: twelve pass current
  bulk-send published-contact rules and one is held after cached content exposed an
  expired 2025 intake deadline. Eight existing research providers supply the remainder
  of the twenty-draft group; research-batch totals are distinct from outreach totals.
  Official programme/contact pages were captured with bounded plain-markdown scrapes;
  thirty Firecrawl credits are logged for `us-04`, with six additional scoped credits
  for existing-provider contact enrichment. No Reoon checks were run in this session;
  published-address evidence is not a deliverability claim.
- Source screening removed paused/closed programmes, unconfirmed routes and regional/
  language restrictions that did not fit the audience. Post-scrape review replaced
  the expired-intake provider. Programme-specific fees and dates from sibling hospitals
  were kept separate. The research report records thirteen providers, thirteen with
  programmes, ten full addresses, and eight sites with additional unvisited matching
  pages after the one-page selection limit; scoped contact pages supplemented that limit.
- Native Gmail MIME readback verifies exact recipient, subject, plain/HTML body,
  direct links, signature, no CC/BCC/attachments and Draft state for all twenty.
  Attio record/note/list readbacks verify twenty Awaiting review records, with saved
  hashes/versions and Gmail references. Page readback verifies 402 native blocks,
  twenty unchecked controls and exact full email bodies. All fifty prior scheduled
  Gmail messages retained their IDs, recipients, subjects and times.
- Full correspondence, source/route cautions, draft/record/note IDs, MIME evidence and
  review controls remain private in gitignored `data/outreach/fourth-twenty-drafts-2026-10-15.json`
  and its dated verification files. No paid subscription, mailbox sync, forwarding,
  monitoring, follow-up, immediate send or scheduling was enabled.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Prepare-Provider-Drafts`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; task-owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-fourth-drafts`; branch
  `codex/outreach-fourth-drafts`; intake/fetched default
  `1289dfd3e47881187038e3b065debac106e77d07` on 15 October 2026.
  Documentation-only local source delivery; no application release or Netlify
  publication applies. Existing research snapshot data is refreshed through the
  declared pipeline command; no static site publication is triggered.

- An isolated read-only evidence audit confirmed twenty matching MIME drafts, hashes,
  recipient/source mappings, unapproved states and Page copies. One bare source URL in
  an Attio note had underscores rendered as emphasis. Appended and read back a literal
  URL correction; no email content or recipient changed. The runbook now requires
  labelled source links and current native capability discovery for list-entry writes.

## Fourth twenty scheduled in Gmail — 2026-10-15

- The operator approved all twenty saved recipient/content versions and delegated
  the next available recipient-local morning slots with at least twenty minutes
  between sends. All twenty now have verified native Gmail schedules and matching
  Attio Scheduled states and exact version/hash/reference notes.
- Preserved the established ten-per-day cadence: ten on Thursday 22 October and
  ten on Friday 23 October 2026, after the existing queue ending 21 October.
  Nineteen slots are within 09:00–11:00 in the sourced programme/contact timezone.
  Tucson uses America/Phoenix, which remains on Mountain Standard Time.
- One multi-location network publishes New York, Chicago, Miami, Houston and Los
  Angeles programme locations but no inbox office timezone. Used a US-wide morning
  instant: 11:00 Eastern / 10:00 Central / 08:00 Pacific. The private records and
  review Page state this timing basis and do not claim a known inbox-office location.
- Current Gmail/Page content and Attio version notes matched the approved drafts.
  Participant-scoped duplicate/incoming checks were clear; a campaign-scoped failure
  notice check was clear. Current SPF, DKIM, DMARC and cryptographic verification of
  the retained received-message DKIM signature passed without sending a test email.
- Recorded scheduling reservations before native Gmail scheduling; verified every
  saved full date/year/time, recipient, subject, body, signature and direct links,
  then immediately reconciled each to Attio. No immediate Send or follow-up was used.
- Final queue: seventy upcoming Gmail messages. All fifty pre-existing schedules
  retained their message IDs, recipients, subjects and times. The minimum gap across
  all seventy is twenty minutes. Three unrelated/test drafts remain.
- An unscoped native Gmail query returned partial results during rate limiting.
  Reconciled using recipient-scoped groups of ten and the native Gmail queue; no
  schedules were recreated. The first new schedule briefly preceded native search
  indexing; read-only reconciliation confirmed it before proceeding.
- The private Page records chat approval and all twenty schedules in IST/local time,
  preserving the exact email bodies and source/comments sections. Private canonical
  evidence is in gitignored `data/outreach/fourth-twenty-scheduling-2026-10-15.json`,
  with saved MIME, Page readback, screenshots and the IST schedule CSV.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Schedule-Provider-Outreach`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; task-owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-fourth-schedules`; branch
  `codex/outreach-fourth-schedules`; intake/fetched default
  `88eb7f3474c2a7e06b13bd4caddb58e0771b6e3d` on 15 October 2026.
  Documentation-only local delivery; application release and Netlify publication
  are inapplicable. No paid feature, sync, forwarding or monitoring was enabled.

- One isolated read-only scheduling audit confirmed all twenty saved message/timing
  records and preservation of the prior fifty. It identified stale local completion
  phases, historical draft-note fields and CRM draft descriptions. Current schedule
  notes are now saved with matching Gmail references/hashes/UTC times, historical
  draft notes have explicit archive fields, completion phases are reconciled, and
  nineteen project-owned descriptions are neutral about workflow state. The existing
  nonproject network description is preserved. Live CRM readback and deterministic
  post-repair checks pass; the hash canonicalization method is recorded privately.

## Outreach branch consolidation — 2026-10-15

- Consolidated nine local outreach record branches in session order. Entries describe dated observations, not a fresh Gmail/Attio check. Draft approvals and schedule counts remain historical; the original pilot summary is omitted because later Sent/reply checks supersede it. No email, CRM, research data, schema, runtime or hosted site is changed.
- Preserved fourth-group runbook corrections for discovering current native capabilities and saving literal source links. Private correspondence/evidence remains gitignored in the canonical checkout.
- Owner `01a13f63-d97f-7393-a1e1-59e628675028`; canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; task worktree `/Users/maheenejaz/Developer/global-clinical-outreach-consolidation`; branch `codex/consolidate-outreach-records`. Intake/default `39cad76e1293978e503c7d2fe4ea5560ce3daf9d`, fetched 2026-10-15 UTC. Preserve `codex/dashboard-alignment` and its worktree.
- Authorized disposition: retire the nine clean outreach worktrees/branches only after required checks, PR integration and refreshed ancestor/HEAD checks. Preserve unknown files or active operations. Netlify publishing is explicitly prohibited; documentation-only delivery requires no application release.
- Consolidated source tips:
  - `codex/outreach-twenty-schedules`: `9664ca2c21707f813af72677ab4c685e2ce32393`.
  - `codex/outreach-next-twenty`: `07d053006a41e24696f524d7be89e9ba2c77dc18`.
  - `codex/outreach-next-schedules`: `0dc4b6ddcd5b90f81c73c886361e1533daf1261b`.
  - `codex/outreach-pilot-sent`: `0fc1617f38c5e47d599adaa5bcbfb1f87ca580f7`.
  - `codex/outreach-third-shortlist`: `7c898fe6e33e1bbeb06ce24ceb8a42e014572d09`.
  - `codex/outreach-third-drafts`: `01a5356690d2138f11927523112ad948a8bf51c3`.
  - `codex/outreach-third-schedules`: `450576eed1129c78048322fd5caffc93b6c6540a`.
  - `codex/outreach-fourth-drafts`: `8fd2223c9025ae1ae058ee00b2b5e7b53cdf85cb`.
  - `codex/outreach-fourth-schedules`: `0f7e43a43851e9224bd6182e9f03f8d272bcff46`.
- Consolidation checks: all nine session additions retained exactly once; existing main session history preserved; stale header and next-step framing corrected; final diff limited to the two documentation files, whitespace clean. `check:pr` passes 83 Python tests and 38 runner/worktree, eight outreach database/model, fifteen TypeSafe smoke and nineteen offline pilot tests. Test-reported durations total about 2.4 seconds, excluding dependency setup. Initial fresh-worktree run lacked PGlite; locked dependencies were installed with scripts disabled and the repository nonsecret setup environment, then the full check passed.
- Before source delivery, read-only Netlify API verified both project sites have no Git repository/provider/path/build command; GitHub hooks and Actions workflow inventories are empty. No publication command or hosted preview is used.
- Independent read-only documentation review confirmed nine unique records and no added private correspondence. It identified the stale update date and initial-pilot next steps; the date is corrected and the earlier backlog is explicitly historical, with a dated current handoff.

## Dashboard alignment local preview — 2026-10-12

- User requests two equal tool cells in Overview's Work done so far, vertically centered
  figures, and a bounded dashboard alignment pass. Explicit hold: no Netlify publishing.
  Updated shared instructions require fresh explicit consent for each Netlify release;
  this task is delivered locally with no push, PR, merge or hosted preview.
- Tool cells now occupy equal halves with a central divider, symmetric vertical padding,
  and the estimated-run note in its own footer. Shared figure cards center their content;
  page/card header actions and provider badges center beside their associated text.
  Long table records retain top alignment for readability. No auth, schema or data change.
- Acceptance verified: equal cell widths and centered number/label groups, no horizontal
  overflow at 320/390/768/1440px in both themes. Existing research UI matrix passes in
  8.0s, Outreach UI matrix in 2.8s; check:pr passes 83 Python (0.29s), 26 runner and
  seven PostgreSQL/model checks (0.59s). Generated page matches template; final diff reviewed.
- Localhost preview: http://127.0.0.1:8795/, foreground server serving gitignored
  `data/local-preview/`. Cached research contains 98 providers; the local-only Reoon figure
  uses the latest 423 total evidenced in the user's screenshot (cached runs total 396).
  Outreach activity is an explicitly labelled read-only five-scheduled visual example,
  not a live Gmail/CRM view. No authentication, production requests or writes occur.
- Owner `01a12fa3-a8d9-7a32-b2d2-ccdeb03532ff` (`Polish-Dashboard-Alignment`);
  canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-alignment`, branch
  `codex/dashboard-alignment`. Intake HEAD and refreshed default
  `b6ec4c9d8026f298989f03e96a7646a90b6d241a`, fetched 2026-10-12T10:28:18Z.
  Canonical preserved; no in-progress Git operation. Final local commit is recorded
  in branch history. Disposition preserve-unmerged: retain clean committed worktree
  and requested foreground preview. Future publishing requires explicit consent;
  before any push/merge, verify it cannot trigger an unapproved Netlify deployment.

## Live usage links in local preview — 2026-10-12

- Added a small underlined View live usage link beneath each tool's credits. Firecrawl
  points to `https://www.firecrawl.dev/app/t/YduQUzfnY3X/usage`; Reoon points to
  `https://emailverifier.reoon.com/overview/`, exactly as provided by Maheen.
  Links open in a new tab, have distinct accessible names and preserve centered equal cells.
- Acceptance: both links visible in the refreshed localhost preview with exact hrefs and
  new-tab targets; existing eight-view theme/size browser matrix passes (7.2s), check:pr
  passes 83 Python, 26 runner and seven PostgreSQL/model checks. No external usage retrieval,
  credentials, production writes or Netlify publication. Local preview script URLs use a
  query version to avoid stale browser cache; preview-only files remain gitignored.
- Owner/canonical/worktree/branch unchanged from preceding entry; chat renamed
  `Link-Live-Usage`. Resumed HEAD `39483fd3230551e88a158e405f6f000b3f9ae497`;
  refreshed default `b6ec4c9d8026f298989f03e96a7646a90b6d241a` at 2026-10-12T10:32:54Z.
  Final commit recorded in local branch history; clean with no in-progress Git operation.
  Disposition preserve-unmerged. Retain requested localhost preview and owned worktree;
  no push or merge performed, and the explicit Netlify publishing hold remains.

## Vendor usage refreshed locally — 2026-10-12

- Requested live usage checked through existing signed-in Chrome tabs. Firecrawl filter
  explicitly selects the configured project key (label and record ID withheld),
  all endpoints, 15 July–12 October 2026 UTC: 729 credits from successful jobs.
  Reoon Overview's Lifetime Usage Statistics reports 388 total verifications.
  The account balance and whole-team Firecrawl metrics are not project usage totals.
- `config/dashboard-usage.json` stores the observed values, scope, source URLs and check
  time; hosted-page build embeds this dated snapshot. Overview now shows 729 without
  an estimate marker and 388 Reoon verifications, with explicit API-key/lifetime scope
  and saved-snapshot footer. Existing per-run history and offline reports are preserved;
  no guessed reconciliation or database/pipeline history rewrite. Future refresh is manual.
- Local preview no longer overrides Reoon to the earlier 423 screenshot value. Exact
  observed figures and both links visibly verified on localhost. Eight-view light/dark
  browser matrix passes (7.9s); check:pr passes 83 Python (0.11s), 26 runner and seven
  PostgreSQL/model checks (0.59s). Generated assets verified; final source diff reviewed.
- Owner/canonical/worktree/branch unchanged; chat renamed `Refresh-Tool-Usage`.
  Resumed HEAD `1d07e271a49fc4d24cdbf8d164c50dece8a2d4e6`; refreshed default
  `b6ec4c9d8026f298989f03e96a7646a90b6d241a` at 2026-10-12T11:31:41Z.
  Close fetch succeeded after a transient connection reset; no integration/cleanup attempted.
  Final local commit is in branch history. Clean committed tree, no in-progress Git
  operations; disposition preserve-unmerged. Retain requested foreground localhost preview.
  No production write, push, merge or Netlify publish; explicit publishing hold remains.

## Dashboard dates standardized — 13-10-2026

- Maheen requests dates as DD-MM-YYYY and explicit IST times. Overview research timestamp,
  tool usage check and Firecrawl period boundaries now use fixed Asia/Kolkata formatting.
  Outreach load/check/save/history/scheduled timestamps also show DD-MM-YYYY, HH:mm IST,
  independent of device locale/timezone. Recipient-local comparison remains explicitly
  labelled in the scheduling editor, with DD-MM-YYYY and Your time shown in IST.
- Original source range is preserved: UTC reporting days correspond to 15-07-2026,
  05:30 IST through 13-10-2026, 05:29 IST. The saved usage check remains
  12-10-2026, 16:06 IST; this request does not re-check vendor usage. Stored timestamps,
  approvals, scheduling calculations and correspondence remain unchanged.
- Acceptance verified on localhost: exact numeric dates and IST suffix; independent
  rollover check yields 01-01-2027, 01:30 IST for 31 December 20:00 UTC. Both eight-view
  light/dark browser matrices pass (8.0s research, 2.6s Outreach); check:pr passes
  83 Python, 26 runner and seven PostgreSQL/model checks (0.62s). Final diff reviewed.
- Owner/canonical/worktree/branch unchanged; chat `Standardize-Dashboard-Dates`.
  Resumed HEAD `9e84cbb71a151f0d30f2c6bee93aa46eba1cfab2`; fetched default
  `20a03c2e4338fc2b5e4c217fa719610740c8a110` on 13-10-2026, 10:18 IST.
  Clean committed work retained; no in-progress Git operation. Disposition preserve-unmerged.
  Foreground localhost preview retained as requested; no push, merge or Netlify publication.

## Dashboard month-name dates — October 13th, 2026

- Maheen supersedes the numeric-date display preference for this dashboard: use full
  month names and ordinal days, e.g. October 12th, 2026, 16:06 IST. Actual dates are
  preserved; the example October 10th is interpreted as a style example, not a request
  to change the stored 12 October check date. IST remains the default display timezone.
- Applied to Overview data/usage timestamps and period boundaries, Outreach load/check/
  save/history/scheduled timestamps and the explicit recipient-local scheduling comparison.
  Native scheduling inputs, stored instants and source correspondence remain unchanged.
- Acceptance: correct st/nd/rd/th suffixes including 11th–13th, 21st–23rd and 31st;
  IST year rollover preserved. Local preview verified with October 12th, 2026, 16:06 IST.
  Eight-view research matrix passes (8.3s), Outreach matrix (2.8s), check:pr passes
  83 Python, 26 runner and seven PostgreSQL/model checks (0.58s); final diff reviewed.
- Owner/canonical/worktree/branch unchanged; chat `Format-Dashboard-Dates`.
  Resumed HEAD `44df403fc3747f6a8686dd0dbc29ca293557f022`; refreshed default
  `20a03c2e4338fc2b5e4c217fa719610740c8a110` on October 13th, 2026, 10:23 IST.
  Clean committed work retained, no in-progress Git operations; disposition preserve-unmerged.
  Requested foreground localhost preview retained. No push, merge or Netlify publication.

## Dashboard alignment integration preview — 2026-10-15

- User requests reviewing dashboard-alignment against main, resolving conflicts and running checks, with a localhost preview before merge and no Netlify publication. Acceptance: equal usage columns, centered card/header alignment, correct vendor links and explicit dated snapshot, full month/ordinal dates in IST independent of browser timezone, no mobile overflow and preservation of current main behavior.
- Owner `01a13f63-d97f-7393-a1e1-59e628675028`; canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; task sibling `/Users/maheenejaz/Developer/global-clinical-outreach-alignment-review`; branch `codex/dashboard-alignment-review`; intake/fetched default `4415744022752051a1857cd20038255f969a7837` on 15 October 2026 UTC. Source `codex/dashboard-alignment` remains unchanged at `093d4b1de1ca9e4e733b264e7324e873abaa1340`.
- Merged source into the task branch locally; only conflict was the status-history append. Both histories are retained. Current main preparation-quota behavior is preserved, and generated hosted assets match the template. The saved vendor usage remains the dated 12 October observation; no live usage, mailbox, CRM or production research refresh occurred.
- Extended the existing eight-view light/dark responsive UI matrix to assert equal usage-cell widths, exact vendor URLs, saved-snapshot wording and IST year rollover with browser timezone America/Los_Angeles. Research/design UI passes in 11.0 seconds; Outreach UI passes in 3.1 seconds. Full check:pr passes 83 Python and 80 JavaScript/database/tooling tests; whitespace check clean. No runtime or test service from those checks remains.
- Requested loopback preview is served at `http://127.0.0.1:8796/` from task-ignored `data/local-preview/`. It uses copied cached research and explicitly labelled sample activity with a local-only boot script; no live authentication or external writes. Preview service remains available for operator review. Original preview/cache and canonical private evidence are preserved.
- Disposition preserve-unmerged pending operator preview review before integration. No source push, PR merge or Netlify publication is performed by this preview task; original source branch/worktree and reviewed task branch/worktree are retained.
- Independent runtime review found misleading timezone labels and a UTC date-range rollover. Scheduled table heading now explicitly says IST; recipient comparison keeps its sourced timezone beside an explicitly labelled IST comparison. Usage period endpoints now stay date-only under a UTC reporting-dates label; the saved check timestamp remains IST. UI assertions cover both corrections. These supersede the historical range-display description above.
- Final corrected UI matrices pass in 10.1 seconds (research/design) and 4.1 seconds (Outreach); full check:pr passes again. Same independent reviewer verified the fixes with no remaining blocker. Refreshed actual localhost preview has no JavaScript errors or mobile horizontal overflow; desktop/mobile captures retained under `/tmp/dashboard-alignment-preview-*.png`. Final diff reviewed; original alignment worktree stays unchanged.

## Localhost figures refreshed for review — 2026-10-15

- User requests current figures on the localhost alignment preview before deciding about merge or Netlify. Both remain on hold. Source branch/worktree/owner remain the preceding alignment-review record; private captures live only in its ignored data directory.
- A fresh recipient-scoped Gmail check covers the 85 established outreach participants: 25 unique Sent messages with native SENT readback, 60 unique scheduled results reconciled to their messages, four automatic replies and no observed human replies or matching delivery-failure notices. All search pages and 25 sent-message threads were read. No sends, schedules, cancellation, CRM updates or mailbox monitoring were performed.
- Canonical clean main used declared read-only outreach-report and outreach-shortlist bindings for the four completed US batches. Totals are 111 providers, 159 programmes and 92 bulk-send-ready providers (14/19/47/12). Reports contain 270 non-invalid email records across all providers; the preview explicitly labels this wider scope instead of the previous ready-provider-only address figure. The in-progress UK batch is excluded.
- Local preview research detail was reconstructed from cached snapshots plus fourth-batch/enrichment extractions, with provider/programme/ready totals checked against the fresh reports. Contact rows remain explicitly cached: two legacy address statuses differ from the live report total. Fresh aggregate email total is displayed separately; cached rows are not presented as newly validated contacts.
- Replaced the five-message sample with redacted aggregate rows/events derived from the fresh Gmail check. The preview shows the check time and reloading only reloads the saved capture. Full correspondence stays out of the browser aggregate dataset and Git. This local-only refresh is not a hosted Attio/Gmail integration and would not automatically update hosted activity after deployment.
- Vendor usage remains explicitly dated 12 October (729 Firecrawl credits and 388 Reoon verifications). Browser access for a fresh vendor check failed at feature-gate initialization with HTTP 403 after documented recovery/retry; no credential binding was bypassed and no newer usage total is claimed. No scraping or email-verification credits were spent for this dashboard refresh.
- Local browser verification checks exact refreshed figures, saved-check reload, console errors and overflow at 320/390/768/1440px in both themes. Preview remains loopback-only on port 8796; no application source changed during this data refresh. Disposition preserve-unmerged pending operator review; no push, merge or publication.

## Vendor credit refresh for localhost — 2026-10-15

- Browser access recovered. Native Firecrawl credit-usage read was followed by the signed-in dashboard to verify the existing project API-key scope and successful-job metric. The dashboard shows 818 credits for the configured project key (label withheld), all endpoints, UTC reporting dates 15 July–15 October 2026. This is project-key successful-job usage, not the team balance or whole-team consumption; reporting/billing delays can differ from the historical native-reader view.
- Localhost now displays 818 with the new check timestamp in ignored vendor-usage.json. Reoon redirects to sign-in in both Chrome and the in-app browser. Its 388 lifetime verifications remain explicitly dated 12 October with current usage unavailable until sign-in; no current Reoon count is claimed. The Chrome login tab is retained for operator handoff.
- Desktop/mobile local verification confirms 818 and the qualified 388, preserves fresh research/outreach totals, and finds no console errors or horizontal overflow. No source runtime/config file, credential binding, production record or external publication changed. No paid crawl or verification was started. Original alignment and reviewed branch/worktree remain preserved and unmerged; merge and Netlify publication remain on hold. Remaining blocker: operator Reoon sign-in for a fresh lifetime-usage read.

## Reoon usage verified after sign-in — 2026-10-16

- At the operator's request, read the signed-in Chrome Reoon Overview. Lifetime usage remains 388 verifications; account-specific remaining balances are retained only in private evidence. Usage and balance are separate metrics. No verification, purchase or account change was initiated.
- Updated task-ignored localhost vendor snapshot and check timestamp; removed the prior sign-in warning and displayed both remaining-credit balances. Firecrawl stays at its separately dated 818 successful-job credits from the 15 October check. Other saved research/outreach figures remain unchanged and retain their own check dates.
- Restarted only the requested loopback preview on port 8796 after its prior process had stopped. Browser verification confirms correct figures/freshness, no console errors and no mobile horizontal overflow. No application source changed. Owner/canonical/task paths and branch remain the alignment-review record above; local record committed, disposition preserve-unmerged. No branch push, merge or Netlify publication is authorized or performed.

## Fifth twenty UK drafts saved for review — 2026-10-15

- Identified twenty new providers across UK clinical attachments, specialist observerships,
  primary-care placements and one international medical-student elective. Used the UK as
  the next planned market after the US groups. Excluded all eighty-five prior project contacts
  and current configured exclusions; selected one published relevant recipient per provider.
- Twenty exact plain-text/minimal-HTML Gmail drafts and matching Attio company/list/contact
  records and full versioned notes are saved as Awaiting review. All content and schedule
  approvals remain false; send times remain empty. No schedule, immediate send, follow-up,
  mailbox sync, forwarding or BCC was added. Existing schedules and unrelated drafts were
  left intact; earlier Sent/Scheduled counts retain their original verification dates.
- The private review Page contains all twenty full saved emails, twenty unchecked approval
  controls, comments, programme/contact sources, eligibility cautions and Gmail/Attio links.
  Template identity, two direct website hyperlinks, one conditional referral-fee sentence,
  routing, decline and the approved business signature are preserved. Programme-only
  customisation uses no personal biography. Both website links returned HTTP 200.
- Current source screening held closed windows, paused programmes, speculative-enquiry bans
  and unsuitable contact routes. One source's FAQ supplied a relevant general enquiry route;
  another programme's direct Medical Workforce inbox replaced its general office address
  before review. Version history and superseded notes are explicit in the private record.
  Sponsorship and student-only restrictions remain visible beside the affected drafts.
- UK research batch `gb-01`: twenty-one researched providers, twenty with programmes and
  published contact routes; the additional specialty provider has no selected suitable route.
  Twenty-six cached pages used forty-seven Firecrawl credits. No Reoon checks were run:
  published addresses satisfy bulk-send, but are not SMTP deliverability confirmation.
  The strict verified-personal-email report remains zero; the bulk-send shortlist is twenty.
- All twenty extraction files pass the schema. The report records six full addresses,
  ten sites with further matching pages beyond the one-page selection limit, and fee/window
  status counts across every captured training programme, including ancillary courses.
  The exact outreach selection is separate from the ranker's first-email suggestion.
  Refreshed research dashboard snapshots through the declared runner: UK twenty-one/twenty,
  all batches one-hundred-thirty-two/one-hundred-nine providers/ready. This is a data refresh,
  with no Netlify build or static publication.
- Native readbacks verify exact MIME recipient, subject, plain/HTML alternatives, signature,
  direct links, Draft state and no CC/BCC/attachments; Attio stage/approval/note/hash/reference
  and list-entry checks pass. The Page has 402 canonical blocks with all twenty full copies.
  Gmail quota errors were reconciled before retries; no duplicate draft was created.
- Private source, route, version and verification evidence lives in gitignored
  `data/outreach/fifth-twenty-drafts-2026-10-15.json` and its dated evidence files. Current
  aggregate state records twenty Awaiting review and 105 total project contacts without
  turning elapsed schedules into Sent. Review remains the next human action.
- Lessons: check live full pages after search snippets; future application windows and
  old adverts do not establish current intake. Re-read FAQs for a missing enquiry route.
  Distinguish the legal provider domain used in Attio from a programme subdomain used by
  the research cache. Select the relevant programme route manually rather than sending
  to the research ranker's first published address.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Prepare-Provider-Drafts`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; task-owned sibling
  `/Users/maheenejaz/Developer/global-clinical-outreach-fifth-drafts`; branch
  `codex/outreach-fifth-drafts`; intake/fetched default
  `4415744022752051a1857cd20038255f969a7837` on 15 October 2026.
  Documentation-only local delivery; application release is inapplicable. No Netlify
  release or hosted preview is requested or authorized. Preserve the local unmerged
  documentation branch and the ignored operational records for review/resume.

- Deterministic final checks pass for all twenty hashes, approved-base invariants, source
  email mappings and current unscheduled states. Gmail's paginated inventory contains
  exactly twenty new project drafts plus the three preserved unrelated/test drafts.
  `check:pr` passes 83 Python tests and 38 runner/worktree, eight outreach database/model,
  fifteen TypeSafe smoke and nineteen offline pilot tests (about 2.3 seconds reported by
  the suites). A fresh-worktree dependency gap was resolved with the locked install,
  scripts disabled and the repository nonsecret setup environment; no source changed.

- One isolated read-only audit passed the twenty source/recipient mappings, canonical
  hashes, MIME drafts, CRM notes/stages and full Page copies. Added a missing PLAB 2 and
  named-supervisor eligibility caution to one provider's review notes and verified both
  saved copies; the email, recipient and hash are unchanged.

## Reviewed dashboard release and branch consolidation — 2026-10-16

- Maheen explicitly authorizes merging reviewed changes, publishing the dashboard with updated
  figures to Netlify, and cleaning up verified merged dashboard worktrees/branches. This
  supersedes the preceding local-only publication holds for this one dashboard release.
- Owner `01a13f63-d97f-7393-a1e1-59e628675028` claims the dashboard release slot; no other active
  dashboard publisher is listed. Coordinated with `Check-Provider-Replies`, which owns its
  ongoing Gmail/Attio check; this release does not mutate correspondence or its evidence.
- Canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; task worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-alignment-review`, branch
  `codex/dashboard-alignment-review`; fetched default `4415744022752051a1857cd20038255f969a7837`
  on 16 October UTC. Original alignment source is `093d4b1de1ca9e4e733b264e7324e873abaa1340`.
- Remaining `codex/outreach-fifth-drafts` at `91b327b2e21055d3a171d66297cf98c393c49cfa`
  contains only a checked UK drafting record. Consolidated it with both status histories
  retained; its twenty drafts remain unapproved/unscheduled. Earlier research headline and
  local-preview numbers are historical; release refresh uses the current published database.
- Acceptance: reviewed responsive alignment/dates preserved; per-vendor usage/check dates
  and Reoon balances match observed figures; research uses complete current database snapshots;
  outreach uses a validated aggregate check behind the existing sign-in/viewer boundary.
  Private preview/recipient files are never deployed. Old pilot activity is labelled separately.
- Saved aggregate publication extends the existing dashboard publisher, with no new credential
  command, schema, policy or grant. Rejects private fields, inconsistent counts and stale local
  snapshots; preserves an existing summary on later research-only refreshes. The Supabase
  changelog and JSON guidance were checked; no new platform interface or TLS configuration.
- Preflight verified exact Netlify dashboard site `705877a0-828e-46fa-94a7-ca5f7d7e94b0`,
  GooCampus team, `https://outreach.goocampusglobal.com`; both project sites have no Git
  provider/repository, GitHub hooks and Actions workflows are empty. Supabase site URL and
  sole redirect are exact; signups/anonymous login are off and email confirmation is on.
  No auth setting was changed. Disposition active through checks, isolated blind release
  review, merged-source publication, live proof, and clean integrated worktree retirement.
- Required checks pass: 85 Python tests (including aggregate persistence/privacy/staleness cases), 38 runner/worktree tests, eight outreach database/model tests, fifteen TypeSafe smoke and nineteen offline pilot tests. Responsive design matrix passes in 9.1 seconds; Outreach UI in 3.6 seconds. Final whitespace check is clean; affected runtime diff reviewed.
- The isolated blind release review found vendor values were embedded in the pre-sign-in
  JavaScript. Fixed by removing the tracked usage input and build-time injection; private
  `data/reports/dashboard-usage.json` is validated and published only inside the authenticated
  all-batches snapshot. Generic links remain in public code; account-specific links and
  usage/balance values arrive only after sign-in. No API secret was present. Same reviewer
  verifies the fix after rerun checks; no second isolated review is introduced.
- Privacy-fix checks pass: 88 Python tests, 80 JavaScript/database/tooling tests and the responsive UI matrix. A regression check confirms no vendor account name, team identifier, key-record ID or balance is present in public dashboard JavaScript. No account data or local preview files are in the deployment directory.

## Verified dashboard publication — 2026-10-16

- Source PR #86 merged as `b3520003c0da94e3c16f1f2753edd63d0aad89b2` after 88 Python,
  80 JavaScript/database/tooling checks and responsive/editor UI checks. Exactly one isolated
  blind release reviewer identified the public vendor-data issue; the same reviewer verified
  the protected-snapshot fix with no remaining finding. Static assets contain no vendor values,
  balances or account-specific key/team identifier. No schema, RLS, grants or auth changed.
- Canonical clean main fast-forwarded from `4415744022752051a1857cd20038255f969a7837` to the
  source merge above. Private mode-0600 aggregate/vendor inputs were validated and published
  through the existing declared `outreach-publish` runner. It rebuilt GB 21/20, US pilot 24/14,
  US-02 24/19, US-03 50/47 and US-04 13/12 providers/ready: all 132/112. Signed-in live page
  verifies 224 programmes and 350 non-invalid research email records from current database data.
- Live saved outreach summary verifies 25 Sent, 60 Scheduled, one neutral/needs-clarification
  human reply (Other), 24 Awaiting reply, four automatic replies, zero Interested/Rejected/Cold/
  delivery problems, twenty Awaiting review and 105 tracked contacts. Latest complete reply
  check is 16 October 10:16 IST; scheduled inventory was separately rechecked as sixty results,
  with no remaining search page. No Gmail/Attio mutation was performed by this release.
- Netlify site `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, GooCampus (`goocampus`) team, deployment
  `6ad1add730a6f104fc2ad520` is ready and current at `https://outreach.goocampusglobal.com`.
  Published 2026-10-16T04:53:45.911Z; deployment title records the full source merge SHA above.
  Nineteen served files byte-match that source's web tree; CSP/frame denial/noindex remain.
  Anonymous dashboard read is denied. Normal signed-in production access and saved-data refresh
  show the expected aggregates and vendor dates/balances; live mobile has no horizontal overflow.
- Runtime release is finished; this record changes documentation only and requires no second
  deployment. Owner `01a13f63-d97f-7393-a1e1-59e628675028` relinquishes the dashboard release slot.
  Canonical/task paths remain as preceding entry. Source tips `codex/dashboard-alignment`
  (`093d4b1de1ca9e4e733b264e7324e873abaa1340`) and `codex/outreach-fifth-drafts`
  (`91b327b2e21055d3a171d66297cf98c393c49cfa`) are ancestors of source main. This reviewed
  branch also carries the release record; all three worktrees are clean with no Git operation.
  Disposition ready-for-admin-retirement-review after record merge and refreshed HEAD/ancestor
  checks. Retire only these approved merged worktrees/local refs and the task's remote review
  ref. Preserve ignored data privately in canonical data/archive before deletion; discard only
  known dependency/test caches. Stop the task's loopback preview before removing its checkout.

## Project-only reply and delivery reconciliation — 2026-10-19

- At Maheen's request, checked Gmail only for known project outreach participants and sent-message threads. All 79 outbound messages in scope carry Gmail `SENT` evidence; no unrelated mailbox mail was searched and no background monitoring was started.
- Of the 54 ramp messages whose send times had passed, Attio now records 51 as Sent and three as Send failed. A recipient-scoped Gmail `in:scheduled` query matched the other 26 approved future schedules. Attio readback verifies 76 Sent, three Send failed, 26 Scheduled and 20 Awaiting review.
- The participant search and thread review found 15 inbound items: ten automated replies (two include alternate-contact routes), two human replies classified neutral / needs clarification, and three bounces. Four automatic replies and the UT Health neutral reply were already recorded on 16 October; this check added six automatic replies, one neutral reply and three delivery failures. No positive, negative or opt-out reply was found.
- The new human reply appears to answer as if the sender were applying for an observership; it does not express partnership interest. It is recorded as neutral / needs clarification. Automatic replies and routing suggestions are not treated as human partnership decisions. The redirect contacts were noted, not added to the provider records.
- The three delivery failures are one sender-policy rejection (`554 5.7.1`) and two recipient access rejections (`550 5.4.1`). Attio records all three as Send failed with message evidence.
- Full message references, participant identifiers and per-record notes remain private in gitignored `data/outreach/reply-check-2026-10-19.json`. No recipient details or message bodies are included here.
- No reply or follow-up was sent; no new schedule was created or cancelled. The 26 previously approved future schedules remain unchanged. Any new outreach or clarification requires the existing exact review and approval workflow.

## Delivery holds, contact corrections and UK pause — 2026-10-20

- At Maheen's request, investigated the three previously recorded US delivery failures, corrected two contact routes, and reconciled all 20 UK messages against native Gmail evidence. Acceptance criteria: documented failure dispositions and sourced contact updates in Attio; every UK message accounted for; any required pause verified as unscheduled drafts with content preserved.
- Five UK messages had already sent: Southampton, GOSH, GSTT, Moorfields and Queen Square. Southampton's saved schedule was 20 October at 00:00 IST, not midnight at the end of 20 October. Its automatic acknowledgement asks for up to four working days; this is not a human partnership response. No UK bounce or opt-out was found in the participant-scoped check.
- Applied the outreach plan's delivery-error pause to the 15 remaining UK messages, previously due from 06:00 through 22:48 IST on 20 October. Native Gmail Cancel send preserved all 15 as drafts; subsequent Gmail readback verifies five SENT and 15 DRAFT messages, unchanged recipients and MIME bodies, and zero remaining UK scheduled results. Attio readback verifies the five as Sent and the 15 as Changes requested with explicit delivery-hold notes. Unchanged content approval is retained; cancelled times provide no authority to resume.
- Larkin still publishes its existing programme address. Its rejection explicitly blocks `.in` senders, so changing the recipient is not a demonstrated fix. WVU and St Luke's returned recipient access rejections; no verified replacement email suitable for the same enquiry was found. All three remain Send failed, with future recipient/content approval cleared, explicit contact-record holds, delivery evidence and official phone/form routing alternatives. No address was guessed and no successful delivery repair is claimed.
- BIDMC's departed contact now has the new BWH address on the existing person record; the old active address was removed and historical correspondence retained. A current published BIDMC radiology education contact was added and linked to BIDMC. Emory's named absence-cover contact was added while retaining the original contact. These changed routes have no new-send approval. An automatically created BWH affiliation record is a reference only, outside the outreach list; ancillary enrichment is not research evidence.
- Verified the saved Attio notes, contact records and stages. Public source checks used Agent Reach Exa/Jina routes, with connected Exa for a remaining discovery gap after the keyless route was rate-limited. No Firecrawl or LinkedIn retrieval, new mail, test message, follow-up, rescheduling, form submission, sender-account change or DNS change occurred. SPF/DKIM/DMARC TXT records are present; that alone is not a fresh authentication or inbox-placement pass.
- Private evidence and the complete provider-by-provider schedule CSV are saved in gitignored `data/outreach/delivery-repair-final-2026-10-20.json` and `data/outreach/uk-schedule-disposition-2026-10-20.csv`; the initial evidence and Gmail screenshot are retained alongside them. Global counts remain the dated 19 October snapshot and were not presented as a new global reconciliation. Supabase research records and the hosted dashboard were not changed.
- Remaining work: recipient-side resolution or confirmed routing for the three failed providers, then delivery/readiness review and exact new recipient/content/time approval before any resumed outreach. This session's contact and UK scheduling reconciliation is finished; end-to-end delivery repair remains incomplete. Documentation-only source change; no application deployment is required or authorized.


## Local helper simplification — 2026-10-20

- Applied the requested audit follow-up: shortlist reuses the dashboard partnerships-file
  reader, page classification relies on iteration order for equal-score ties, and dashboard
  and Outreach timestamps share one timezone-aware formatter. The formatter is available
  before rendering so the self-demo still works; offline reports keep the same inline helper.
  The marketing CSS parser and its vendor adaptation workflow remain unchanged.
- Acceptance: unchanged timestamp text, ordinals and recipient timezone labels; unchanged
  missing partnerships-file behavior and first-kind tie selection; generated hosted assets
  match the template. All checks passed: 28 affected Python tests (0.28s), design browser
  matrix (8.3s), Outreach browser flow including self-demo (2.9s), and full check:pr
  runs (88 Python and 80 JavaScript/database/tooling checks). Another 3,650 hosted/offline
  comparisons against the original timestamp functions cover a full year and four zones.
  Loopback browser previews passed; their owned servers and browsers stopped afterward.
- Owner `01a156a6-82ae-72d0-a6e3-127b34b8d42e` (`Simplify-Repository-Helpers`);
  canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; task worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-simplify-helpers`; branch
  `codex/simplify-repository-helpers`. Intake task HEAD and fetched default are
  `dcbbc5ed2c7c08a0dc4d4b1310e10c3c442929cd` (20 October 00:25:22 UTC), unchanged
  on close refresh at 00:26:34 UTC. Local commit only, unmerged; disposition
  `preserve-unmerged`. Keep the clean committed worktree for review. No push, merge,
  production data refresh or Netlify publication; the user explicitly requested local
  delivery. A hosted release is outside this delivery and remains unapproved.


## Null partnerships-file rejection — 2026-10-20

- Fixed the review finding from local commit `3b83046`: the shared partnerships reader
  now returns None only for a missing file and raises InvalidFile with the file path
  for JSON null or another non-object root. Valid object data remains unchanged.
  Shortlist generation rejects null before provider reads or shortlist CSV output;
  dashboard publication and offline reports use the same reader.
- The new regression test reproduced the failure before the fix and passes afterward.
  Acceptance checks cover absent files, intact populated objects and null rejection.
  Affected CLI/dashboard tests: 28 passed (0.08s). Full check:pr: 89 Python tests
  (0.11s) and 80 JavaScript/database/tooling checks (about 2.3s across their suites).
- Owner `01a156a6-82ae-72d0-a6e3-127b34b8d42e` (`Reject-Null-Partnerships`);
  canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; same task worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-simplify-helpers` and branch
  `codex/simplify-repository-helpers`; intake HEAD
  `3b830464d0b9df8d6bf14ba2047e305c1e6e0228`. Fetched default
  `3d2689b570dee62530e60797369a2b03243175c9` at 02:07:14 UTC, unchanged on the
  02:08:01 UTC close refresh. Local-only unmerged delivery; preserve the committed
  worktree (`preserve-unmerged`). No push, merge, production command or Netlify
  publication; publishing remains explicitly prohibited for this task.


## Approved UK-REV-1 scheduling — 2026-10-20

- Maheen explicitly approved UK-REV-1, instructed sender-readiness checks followed by scheduling the 15 paused UK emails, and retained the holds on Larkin, WVU and St Luke's. This scoped approval supersedes the UK pause only; it does not authorize retries to the three failed providers, follow-ups, redirected-recipient emails or duplicate outreach to the five UK providers already Sent.
- Acceptance criteria met: the 15 live Gmail drafts exactly matched the approved full snapshots before scheduling; sender, recipient, plain/HTML alternatives, clean signature, direct links, disclosures and absence of attachments were checked. Current participant-scoped checks found no new inbound items or scheduled duplicates. Attio records and recent cancellation notes showed no competing scheduling owner.
- Sender-readiness checks passed: SPF, Google DKIM selector, DMARC and the Workspace SPF include agreed across both authoritative nameservers and two public resolvers. A recent unexpired outgoing signature verified against the current authoritative key, using original headers/boundary retained in a received failure notification and the corresponding unchanged Sent MIME content. The Gmail stored raw copy uses a different MIME boundary; restoring the recorded original boundary makes both the body hash and complete signature verify. Relevant historical receiver SPF/DMARC evidence was retained with its date and limits. Office Gmail identity, clean saved signature and both website links were verified. No new test email, DNS change or inbox-placement claim was made.
- One isolated read-only review confirmed supported content, G1–G10/current approval, 90/100 scores, unique eligible recipients, exclusion of held/already-sent providers, sourced Europe/London timing and the 30-minute gaps. Private source citations were clarified for the Maudsley attachment PDF, Dudley Medical Workforce address and Medical Appraisals UK contact page; no email content changed. Earlier cancelled `send_at` fields were treated only as historical values; only UK-REV-1 proposed/approved instants were used.
- All 15 emails are now natively Scheduled in Gmail: five each on 21, 22 and 23 October 2026 at 09:00, 09:30, 10:00, 10:30 and 11:00 BST, equivalent to 08:00–10:00 UTC and 13:30–15:30 IST. Dates precede the 25 October clock change and have no listed bank holidays. The Gmail picker explicitly displayed India Standard Time; each saved message's full date, time and recipient was checked through Show details with Cancel send visible.
- Each schedule was reconciled in Attio before proceeding to the next provider, with exact approval/version, reservation, current Gmail reference and verified schedule note. Final Attio readback confirms all 15 Scheduled; the three held providers remain Send failed with recipient/content approval false. Gmail's HTML serialization changed wrappers/entity notation, while plain text, visible HTML text, direct URLs and signatures remained equivalent to approved content.
- Final native Gmail inventory confirms exactly one scheduled message for each approved UK subject, 15 total; per-message evidence and individual connector reads verify the approved instants. A combined connector search lagged at five results and a separate held-provider query was rate-limited; neither was treated as the final inventory. The complete native inventory and individual proofs were used without repeating scheduling actions.
- Private schedule confirmations, screenshots, full MIME/version evidence, readiness/review records and approval/reservation mappings remain gitignored under `data/outreach/uk-rev1-*`. The confirmation table is `data/outreach/uk-rev1-scheduled-confirmation-2026-10-20.csv`. UK-only current state is five previously Sent, 15 Scheduled and zero paused drafts; older global totals remain explicitly dated. No immediate send, follow-up, background monitoring, Supabase research mutation or dashboard publish occurred. Scheduling is complete; the three separate delivery investigations remain held. Documentation-only source update; no application release required.


## Reviewed helper release preparation — 2026-10-20

- Maheen explicitly requests review of `dcb1f64999a4bd6e0231f491e0835bdc1c993913`
  followed by Netlify publication. This supersedes this chat's preceding local-only hold
  for one release of the helper simplifications and null-file fix.
- Owner `01a156a6-82ae-72d0-a6e3-127b34b8d42e` (`Review-Publish-Helpers`) claims
  the existing dashboard release slot after native chat/status inspection finds no active
  dashboard publisher. The prior recorded dashboard owner relinquished the slot. Current
  same-repository work prepares correspondence drafts and does not own this release.
- Canonical `/Users/maheenejaz/Developer/global-clinical-outreach`; task worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-simplify-helpers`; branch
  `codex/simplify-repository-helpers`. Intake HEAD is the reviewed commit above;
  fetched default `3d2689b570dee62530e60797369a2b03243175c9` contains documentation
  only since the branch point. Integrated it, preserving both status histories.
- Confirmed Netlify target `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, `goocampus-outreach`,
  GooCampus (`goocampus`) team, `https://outreach.goocampusglobal.com`. Both repository
  Netlify sites have no Git provider/repository; GitHub hooks and tracked Actions are empty.
  Live Supabase auth read confirms exact site URL and sole redirect, signups/anonymous
  sign-in off, email confirmation on. No auth, policy, schema or credential binding changes.
- Acceptance: null partnerships files rejected before shortlist output; valid/missing
  files preserve intended behavior; shared formatter works before dashboard rendering,
  including the self-demo; built assets match source and live files match merged source
  after publication. Publish only static web assets; preserve existing research/outreach
  snapshots and correspondence. Proceed through checks, one isolated blind read-only
  release review, PR/merge, clean canonical fast-forward, publication and live verification.

- Release checks pass: 42 affected Python tests (0.15s), localhost design browser
  matrix (9.4s), Outreach browser flow/self-demo (4.3s), and full check:pr (89 Python
  tests and 80 JavaScript/database/tooling checks). Final runtime diff reviewed.


## Requested partnership clarification drafts — 2026-10-20

- Prepared the two clarification replies requested by Maheen for UT Health San Antonio and Miami Harrington. Each explains that the enquiry concerns a programme-listing partnership rather than an individual observership application or placement, preserves provider control over programme information/admissions, and asks for partnership routing. UT's reply answers the observed hospital-preference misunderstanding; Miami's acknowledges the application information without applying or requesting a place.
- Both drafts are saved in their original Gmail conversations, addressed to the observed human respondent/team inbox with original In-Reply-To and References intact. Verified exact recipients, subjects, both MIME alternatives, direct working website links, clean approved business signatures, no copied attachments and DRAFT status. Removed automatically inserted quote blocks from the new draft MIME; the original sent/received messages remain in the threads. Final participant-scoped inventory verifies exactly these two unscheduled drafts.
- Attio now marks these current clarification drafts Awaiting review with content approval false. Full saved versions, hashes, Gmail draft/message/thread identities, source replies and review evidence were saved in verified record notes. The UT human respondent was added as a sourced professional contact linked to the existing provider. Historical initial sends remain documented as Sent; the two human replies remain neutral/needs clarification and are not reclassified as partnership interest. G1–G9 were reviewed; G10 remains pending exact human recipient/content/time approval.
- Private evidence is gitignored in `data/outreach/partnership-clarification-drafts-verified-2026-10-20.json` and `data/outreach/partnership-clarification-attio-2026-10-20.json`. Preparation is complete: neither reply was sent or scheduled. The approved 15 UK schedules, the three bounced-provider holds, unrelated correspondence, research records and hosted dashboard were untouched. Documentation-only source update; no application release required. Next action is Maheen's review of the saved replies, with separate exact send-time approval before any scheduling.

- The isolated release reviewer found that a null partnerships file in a later batch
  could abort full snapshot refresh after earlier batches had already been stored.
  Reproduced with a failing regression test, then preloaded/validated the selected batches'
  partnerships before any store. Existing all-batches and old-batch snapshots remain intact
  on this error; partial refresh still reads partnerships only for its selected batch.
  Affected checks pass: 29 CLI/dashboard tests (0.06s); full check:pr now passes 90 Python
  and 80 JavaScript/database/tooling checks. Runtime static assets are unchanged from the
  passing browser matrix. The same reviewer verifies the correction before merge.


## Helper release verified live — 2026-10-20

- PR #92 merged the reviewed helpers, null-file rejection and pre-write validation fix
  as `0733661b2fad6da0ffdcedc753e0c9b980d03fab`. Exactly one isolated blind release
  reviewer found the multi-batch partial-write edge case; the same reviewer verified the
  correction and reported no remaining code/static release blockers. Final checks pass:
  90 Python tests and 80 JavaScript/database/tooling checks; browser suites passed before
  the backend-only correction. Both new regression tests reproduced their failures first.
- Guarded canonical clean-main fast-forward from
  `65bbd807a0e3588dd4ad240decd194c9a2203d2a` to source merge above; verified the merged
  tree exactly matches reviewed candidate `01ec22be263f142ee816596b735287a8c9a55506`.
- Netlify `goocampus-outreach`, site `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, GooCampus
  (`goocampus`) team: deploy `6ad6cfba921651e505df2c82` is ready/current at
  `https://outreach.goocampusglobal.com`, published `2026-10-20T02:19:39.956Z`.
  Deployment title records the full source merge SHA. All 19 served files byte-match
  source; CSP/frame-denial/noindex headers pass and anonymous dashboard read returns 401.
- Normal signed-in Chrome loads the release without browser errors and preserves
  timestamp formatting and the existing saved figures/dates. Research remains the
  16 October snapshot (132 providers, 224 programmes, 112 ready, 350 research addresses);
  correspondence remains its separately dated saved capture. No live data refresh,
  Gmail/Attio change, schema migration, auth/policy change or marketing-site deploy.
- Owner `01a156a6-82ae-72d0-a6e3-127b34b8d42e` (`Review-Publish-Helpers`) relinquishes
  the dashboard release slot. Canonical/task paths and branch remain the preceding
  preparation record. Default refreshed at `2026-10-20T02:20:30Z` to source merge above.
  Disposition `ready-for-admin-retirement-review`: clean integrated source, no Git
  operation; task ignored files are only known dependency/test caches. Preserve unrelated
  worktrees. Merge this documentation-only release record, then retire this task worktree
  and its verified local/remote feature branch. This record needs no second Netlify release.

## Clarification content approval and proposed times — 2026-10-20

- Maheen approved both clarification replies exactly as written and requested proposed local/IST send times for separate approval. Fresh Gmail readbacks match both approved full-message snapshot hashes; the messages remain unscheduled drafts. Attio now records Content approved with the checkbox true and verified notes tying that scope to the exact recipients, wording and versions. This is not schedule approval.
- CLARIFY-1 proposes Tuesday 20 October 2026 at 09:00 EDT in Miami (America/New_York; 13:00 UTC; 18:30 IST), then 09:00 CDT in San Antonio (America/Chicago; 14:00 UTC; 19:30 IST). Office locations are sourced from the retained official contact/programme records and UT's actual reply signature. Current NIST daylight-saving rules and federal/institutional calendar checks support these weekday morning slots; no listed 20 October holiday was found. The two UTC instants are 60 minutes apart and clear of the approved 15 UK schedules on 21–23 October.
- Private approval, hashes, timing/source evidence and Attio note identities are saved under `data/outreach/partnership-clarification-content-approval-*` and `data/outreach/partnership-clarification-schedule-proposal-2026-10-20.json`. No send, schedule or reservation was created; exact human timing approval, fresh draft/readiness checks and normal native Gmail reconciliation are still required. Missed proposed times must not roll forward silently. The UK schedules and three bounced-provider holds remain unchanged. Documentation-only update; no application release required.

## CLARIFY-1 replies scheduled — 2026-10-20

- Maheen explicitly approved CLARIFY-1 and instructed scheduling the unchanged Miami Harrington reply for 20 October at 18:30 IST (09:00 EDT, 13:00 UTC), followed by UT Health San Antonio at 19:30 IST (09:00 CDT, 14:00 UTC). Both are now natively Scheduled in Gmail and reconciled in Attio. The two approved instants are 60 minutes apart and clear of the 15 UK schedules.
- Fresh provider-matched comparisons found only Gmail history-marker changes since the original approved snapshots; all recipients, subjects, sender/reply headers, MIME bodies, direct links and signatures remained identical. Saved both the original approved hashes and current complete pre-schedule hashes, without guessing why the history markers advanced. Current scoped threads/participant checks found no new inbound, decline, bounce or duplicate schedule; recent Attio notes and active-chat checks identified no competing operator.
- Sender-readiness checks passed again: current SPF/DKIM/DMARC and the Workspace SPF include agreed across both authoritative servers and two public resolvers; the retained recent unexpired outgoing signature verified with the current authoritative key and recorded original MIME boundary. Relevant historical receiver evidence remains dated and qualified. The actual office Gmail account, complete clean signatures and both HTTP-200 website links were checked. One isolated read-only review passed G1–G10/current approval, exact versions, recipients and timing. No new test email, DNS/admin change or inbox-placement claim was made.
- Created and read back exact scheduling reservations, then used Gmail's native Schedule send with the picker explicitly showing India Standard Time. Checked each saved message's full date, time, recipient and Cancel send through Show details. Miami was fully reconciled in Attio before proceeding to UT Health. Both scheduled-message readbacks preserve original thread IDs, In-Reply-To/References, To/From/Subject/Cc/Bcc, plain text, visible HTML content, direct URLs and signatures; no incoming attachments or new images were copied. Gmail serialization differences did not change the approved wording.
- Final native Gmail and connector inventories each verify exactly these two scheduled replies, and Attio readback shows both Scheduled with content approval true. Scheduled is not Sent or delivery confirmation. Initial-send and neutral/needs-clarification response history remains intact. The UK15, three bounced-provider holds and unrelated records were untouched; no immediate send, follow-up, watcher, research-table mutation or dashboard publish occurred.
- Full versions, approval/readiness/review evidence, reservations, UI screenshots and current Gmail/CRM references remain gitignored in `data/outreach/clarify1-*`. The confirmation table is `data/outreach/clarify1-scheduled-confirmation-2026-10-20.csv`; the final record is `data/outreach/clarify1-scheduled-final-2026-10-20.json`. Acceptance criteria met: exactly two unchanged approved replies, correct original threads and future instants, no duplicates, and Gmail/Attio proof. Documentation-only source update; no application release required. No further action scheduled by this session.

## Project-only reply and schedule reconciliation — 2026-10-21

- At Maheen’s request, rechecked Gmail against known project participants and thread references only. At the 13:32 IST snapshot, 93 outbound messages carried Gmail `SENT` evidence (including three delivery failures and two clarification replies); 14 remained in Gmail Scheduled for 21–23 October. The 93 includes one clarification to a redirected UT Health contact outside the original recipient query.
- Since the 19 October check, 12 first-touch messages and two approved clarification replies were sent. Attio now shows 88 Sent, three Send failed, 14 Scheduled and 20 Awaiting review (125 records). Nine records previously marked Scheduled were updated to Sent using current Gmail evidence; five UK messages already marked Sent were left as recorded. The first due UK message was confirmed Sent at 13:30 IST.
- Three new inbound messages arrived: two human replies categorized neutral / needs clarification and one automatic acknowledgement. All-time totals are four human replies, 11 automatic replies and three bounces; there are no positive, negative or opt-out responses. The human replies report that one programme is paused pending a 2027 site move and the other requires contact with a named consultant before a clinical attachment can proceed.
- Full message references and record-level summaries remain private in gitignored `data/outreach/reply-check-2026-10-21.json`. No new reply or follow-up was sent, and no schedule was created or cancelled by this check. The next approved scheduled time is 21 October at 14:00 IST.


## Clarification and UK delivery check — 2026-10-21, afternoon

- Requested one-time Gmail check covered the two CLARIFY-1 conversations and all 20 UK providers, including participant-scoped searches across Spam/Trash for separate responses or delivery notices. Both clarification replies have Gmail SENT evidence at the approved 20 October instants: Miami 18:30 IST and UT Health San Antonio 19:30 IST. Neither has a new reply or bounce; their earlier application-oriented replies remain neutral/needs clarification.
- All five UK-REV-1 emails due today are confirmed SENT at 13:30, 14:00, 14:30, 15:00 and 15:30 IST: Maudsley, King's, Coventry/Warwickshire, Derby/Burton and Dudley. Four remaining Scheduled stages were reconciled to Sent; Maudsley and the two US clarifications were already reconciled by the earlier check. The ten future UK messages remain individually matched in Gmail Scheduled for 22–23 October, five daily at 13:30–15:30 IST. No new delivery failure, complaint or opt-out was found in this scope, so no additional pause was warranted. Larkin, WVU and St Luke's remain Send failed, content approval false and explicitly held.
- A new positive GSTT reply arrived during the check: the Visiting Professional Programme administrator asks for availability next week to arrange a programme discussion. Attio is Interested, with the Gmail evidence and next human action recorded; no meeting is booked. Two new automatic acknowledgements from Derby/Burton and Dudley indicate high mail volume. Dudley's acknowledgement supplies a clinical-observership routing address, retained in the private CRM note as an unreviewed candidate, without replacing the approved contact or sending to it.
- Reviewed the already-recorded Southampton consultant prerequisite and Moorfields programme pause pending its 2027 move; neither is a partnership acceptance. These programme-specific cautions do not affect the ten other approved UK schedules. No human reply, follow-up, calendar invitation, new schedule or cancellation was executed. Sent does not establish inbox placement.
- Acceptance: exact due message IDs carry SENT and approved timestamps; ten future IDs match the scheduled inventory and approved instants; CRM stage/note readbacks match observed evidence; holds preserved. Full evidence and fresh last-checked details remain private in gitignored `data/outreach/clarify-uk-check-2026-10-21-afternoon.json`, preserving the earlier check file. Documentation-only update; no application release or Netlify publication is required.


## Approved outreach ramp and revised queue — 2026-10-16

- The operator approved the twenty saved UK recipient/content versions and delegated revision
  of the existing Gmail queue under the agreed ramp. Recipient-local morning and weekday-only
  preferences are waived for this campaign. All project messages count together by IST calendar
  day, with at least thirty minutes between consecutive UTC instants, including day boundaries.
- Approved stage targets: fifteen/day for 16–19 October, twenty/day for 20–23 October, thirty/day
  for 24–28 October, forty/day for 29 October–2 November, then forty-eight/day from 3 November.
  Review observed delivery results before each increase. These are operating targets, not
  verified delivery guarantees or authority to add recipients. No follow-up or monitoring was added.
- Revised and verified sixty existing scheduled emails, then scheduled the twenty approved UK
  drafts. The current eighty-message queue uses only the first two stages: fifteen on each of
  16–19 October and twenty on 20 October. Today's partial window is 13:00–23:30 IST at forty-five
  minute intervals; the next three full days use ninety-six minute intervals, and 20 October
  uses seventy-two minute intervals from 00:00–22:48. The global minimum is thirty minutes.
- Every email has an approval/reservation note before mutation, exact native Gmail full date,
  year, time and recipient proof, then a matching Attio completion note and Scheduled stage.
  Current version/hash, original wording, signature and two direct website links are preserved.
  The conditional fee sentence remains once per email; no immediate Send was used.
- Native MIME readback verifies all eighty recipients, subjects and message words, no CC/BCC,
  attachments or images, and the direct website links. Gmail's equivalent CRLF/soft wrapping,
  HTML wrapper and entity changes are distinguished from the approved canonical content hash.
  All eighty canonical hashes and full native date/time proofs pass deterministic checks.
- Gmail shows eighty Scheduled messages and three remaining unrelated/test drafts. Attio
  readback verifies eighty Scheduled records with content approval true and current exact
  version/hash/time/reference notes. Four original review Pages retain all eighty full bodies
  and now show the revised dates. The new owner-only schedule Page and local CSV list all
  eighty recipients and times in IST; the UK Page records current chat approval explicitly.
- Current public SPF/DKIM/DMARC checks pass; the retained received-message DKIM signature
  verifies locally against the current restored public key. Its historical receiver verdict
  remains distinguished from today's verification. No new test email or DNS change was made.
  Participant-scoped incoming checks for these eighty and a matching recent failure-notice
  check were clear. These checks do not supersede the separate earlier sent/reply observations.
- Browser restoration/menu timeouts were reconciled against live state before continuing.
  Saving and reopening a restored draft avoids the transient menu problem. No duplicate
  scheduled entry or unintended send was created; each selected recipient has one future slot.
- Canonical private evidence is gitignored in
  `data/outreach/outreach-ramp-scheduling-2026-10-16.json`, with sender-readiness evidence,
  native MIME/CRM readbacks, eighty date/time screenshots, Page readbacks and the IST CSV.
  The repeatable policy is updated in `docs/outreach-plan.md`; the earlier twenty-minute
  requirement is superseded by this explicit thirty-minute instruction.
- Owner `01a12a58-97aa-7e13-8c38-0c32cb3dd950` (`Ramp-Outreach-Schedules`); canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach`; owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-ramp-schedules`; branch
  `codex/outreach-ramp-schedules`. Intake default was
  `b3520003c0da94e3c16f1f2753edd63d0aad89b2`; the clean owned branch was fast-forwarded to
  `e6a5c1241b1f4745a715dda8f6a8e78a2265ddb3` after the parallel completed-record integration. No application code, production
  schema, Netlify publication or hosted preview changes apply to this correspondence task.
  Preserve the local documentation branch and private operational evidence for resume.

- Verification: all eighty canonical hashes, saved message contents, native full-date/time
  proofs, daily counts, global gaps, Attio stages and preserved Page copies pass. `check:pr`
  passes 88 Python tests and eighty Node checks (38 runner/worktree, eight outreach database/
  model, fifteen TypeSafe smoke and nineteen offline pilot), about 2.5 seconds reported by
  the suites, excluding setup. Final diff is limited to the two agent-facing documents and
  is whitespace-clean. The owner-only schedule preview was visually checked; table time
  columns have room for the complete AM/PM values.

- One isolated blind read-only audit found no blocking discrepancy: all eighty canonical
  hashes, saved MIME words/links, timestamps, daily counts/gaps, current Attio references,
  Page/CSV entries and screenshot date/year/time/Cancel-send proofs reconcile. Legacy
  recipient-local timezone fields remain unknown where not retained; the explicit verified
  Asia/Kolkata scheduling anchor is separate and sufficient for this approved campaign.


## Sixth outreach review group — 2026-10-16

- Prepared 20 customised Gmail drafts and matching Attio Free Companies, People, list entries and full versioned notes: 10 US, 6 UK and 4 Australian candidates, excluded from the 105 current project contacts. The project list now holds 125 contacts; these twenty are **Awaiting review**, with false content/schedule approval and no send times. No email was scheduled or sent, and the existing schedule was not changed.
- The private review Page contains all twenty complete emails, twenty unchecked recipient/content controls, Gmail/Attio links, programme/contact sources and review notes. Private current versions, hashes, identities, evidence and review location are indexed in ignored `data/outreach/sixth-twenty-drafts-2026-10-16.json`; per-recipient checkpoints and retained source text are in the same private directory.
- Retained the approved Ejaz identity, corporate affiliation and postal signature, credibility sentence, two direct website hyperlinks, one secondary conditional referral-fee sentence, routing request and decline. Only greetings, subjects and programme facts were customised; no personal biographies, images, tracking, attachments or additional website links were added.
- Qualification used current official programme and contact pages, existing cached research, provider-alias deduplication, and explicit Gmail/Attio participant checks. Published addresses satisfy the current bulk-send rule; they were not represented as fresh SMTP-verification results. Keyless Exa reached its free rate limit; connected Exa and Jina supplied the remaining official-page evidence. No Firecrawl or verification credits, paid subscriptions, pipeline mutation, Supabase research publishing or Netlify release was used. Research/dashboard totals therefore retain their previous snapshot dates.
- Material review conditions are retained beside the emails: UWA's application window and institution/training criteria; ANU's processing role for Canberra Health Services; the RNOH peripheral-nerve unit's conflicting duration guidance; current programme capacity and audience restrictions; and malformed email links where the provider separately displays the correct address. No disputed duration, fee, promotional deadline or outcome promise appears in the email copy.
- Gmail history exposed a 2020 GooCampus business discussion with one candidate. It is explicitly marked as a reintroduction for review, rather than a new relationship. No old correspondence or personal details were inserted into the email. A search-index candidate whose domain no longer resolves was excluded; cached search content alone did not qualify it.
- Lessons: deduplicate legal providers across domains and departments; check mailbox history before drafting even when a provider is absent from the current project list; verify the current application page as well as the overview; separate university facilitators from clinical hosts; and confirm a live domain rather than relying on a retrieved search cache. Keep referral eligibility and source contradictions in private review notes.
- Verification: all 20 Gmail MIME readbacks match the exact recipients, subjects, plain/HTML bodies and hashes and remain DRAFT-only; all 20 Attio notes and Awaiting review/false-approval fields match; all 20 bodies and unchecked review controls are present. The 3 unrelated Gmail drafts remain in the inventory. Deterministic cross-system checks and `npm run check:pr` passed (88 Python and 80 Node tests; reported test groups total about 3 seconds, plus dependency setup). The native review layout was visually inspected in Chrome.
- An isolated read-only audit checked the retained sources and system snapshots. Its two minor findings were addressed: the Canberra duration sentence is version 2 in every current copy, and the historical business note no longer implies a completed call or agreed partnership. Cross-system checks passed again after these corrections; unresolved eligibility/capacity details remain explicit review cautions, not email promises.
- Delivery is draft preparation and private CRM/review data only; an application or website release is inapplicable. The prior locally committed ramp policy is retained in this task branch; it grants no scheduling authority for these new drafts. Next action: Maheen reviews exact recipients and wording and requests any revisions; time selection and scheduling remain on hold.



## Public collaboration documentation — 2026-10-22

- Owner/chat `01a16283-c9a7-7f40-83f0-eecfcd6c6b89`; canonical repository
  `/Users/maheenejaz/Developer/global-clinical-outreach`; attached task worktree
  `/Users/maheenejaz/.codex/worktrees/public-repository/global-clinical-outreach`; branch
  `codex/public-repository`; intake HEAD/fetched default
  `f5b316afda3d05d3a27ee9076edc154ae4571329`, fetched 2026-10-22T07:29:55Z.
- Acceptance: README and agent entry points reflect the implemented systems and dated current
  state; a colleague can run offline checks from a fresh clone, identify separate access needs,
  follow the native-tool/cache-first cost policy, and preserve outreach/release holds. Review
  source and reachable Git history before changing GitHub visibility; no production deployment.
- Consolidated completed documentation from `codex/outreach-sixth-drafts` (including the
  ramp source/audit ancestry) and `origin/codex/firecrawl-people-pilot`, preserving source
  commits. Restored the approved thirty-minute policy, exact/bounded timing distinction and
  records; later delivery holds and UK-REV-1 approvals still supersede old campaign dates.
  Other tasks' worktrees and private evidence are preserved.
- Added colleague onboarding, architecture/source-of-truth and tool/credit guides. Local skills,
  plugins and authenticated sessions are explicitly separate from the portable tracked skill.
  Historical spend is dated and not represented as a current tariff or audited savings figure.
- Live Netlify read before delivery found seven sites and no connection to this repository;
  dashboard/partnership sites have no repository connection. GitHub hooks/workflows were empty.
  Documentation integration requires no static-site publication or Supabase/Gmail/Attio action.

- Validation: `npm run check:pr` passed 90 Python tests and 80 Node checks (38 runner/worktree,
  eight outreach database/model, fifteen TypeSafe smoke, nineteen offline pilot); reported
  suite durations total about 2.5 seconds, excluding dependency setup. Local Markdown paths
  and whitespace checks pass. Runtime/schema files are unchanged.
- Exactly one isolated blind read-only publication reviewer identified a blocking historical
  privacy conflict: deleted `config/dashboard-usage.json` remains reachable in Git history
  and contains observations/account-specific links deliberately restricted to signed-in
  viewers. No usable API secret was identified. Current pilot text now records net spend
  without account balances. See `docs/publication-review.md` for exact commits and choices.
- GitHub issue/PR/comment scans yielded only design reference-checksum matches; source/history
  scanner matches were the intentional public browser key and a vendored-code expression.
  Scans are evidence, not proof of complete absence. No private working-data filenames were
  found in reachable history. No deployment artifacts/releases were listed; no wiki repository
  was available. No GitHub Actions workflows or hooks were added or enabled by this task.
- **Historical hold, resolved for a new clean copy by the later approval below.** Keep the existing GitHub repository private.
  Do not rewrite/force-push history, rename/delete the repository, create a substitute public
  repository, or disclose the restricted historical account details without the applicable
  explicit instruction. Documentation can be integrated privately; no Netlify release applies.
- Reviewer corrections also remove the historical API-key label and Reoon remaining-balance values
  from the current status text and reconcile the AGENTS timing invariant with bounded approvals.
  These source corrections do not erase the original historical objects.


## Clean public source distribution approved — 2026-10-22

- Maheen explicitly approved `maheen-ejaz/global-clinical-outreach-public` from the cleaned
  source and instructed that the original repo/history remain private. This authorizes the
  new source distribution, not disclosure of restricted historical objects.
- Source baseline: private main `06b5031a61eee014670411a77d73efbd00c7f5cf` (PR #98).
  Export adaptations update README/onboarding, AGENTS/TOOLCHAIN, publication decision and
  source provenance only; application code, tests, migrations, schemas and assets are retained.
- Acceptance: independent Git root with no inherited history or private working files; all
  offline checks pass from a public-origin clone; source provenance, Codex starter prompt,
  cost-saving policy and separate-access requirements are present; original stays private.
- Credential bindings remain pinned to the original private origin. Offline checks can run in
  the public copy; credential-backed operations intentionally fail the origin guard there.
  Public GitHub access does not grant dashboard, Gmail, CRM, database or Infisical access.
- Owner/chat `01a16283-c9a7-7f40-83f0-eecfcd6c6b89`; canonical original
  `/Users/maheenejaz/Developer/global-clinical-outreach`; attached task worktree
  `/Users/maheenejaz/.codex/worktrees/publish-clean-copy/global-clinical-outreach`,
  branch `codex/publish-clean-copy`, intake HEAD/fetched default `06b5031a61eee014670411a77d73efbd00c7f5cf`
  at 2026-10-22T08:31:30Z. The newly initialized public source checkout is task-owned at
  `/Users/maheenejaz/Developer/global-clinical-outreach-public`; it is not Codex-managed.
- This distribution requires no Netlify publication, paid research, correspondence, migration
  or production access. No automatic sync, workflow, deployment hook or monitoring is added.


## Public README illustration upgrade — 2026-10-22

- Replaced the README's simple SVG overview with a 1536 × 1024 editorial clinical-research
  cover, and added a matching Research → Review → Outreach illustration. Both use concise
  accessible alt text and full-resolution optimized WebP files; provenance and checksums are
  in `docs/images/README.md`. Old source images remain available for existing references.
- The artwork is fictional/conceptual: no live metrics, provider/contact records, account
  observations, vendor marks, real institutions or partnership claims. Workflow artwork
  preserves human review and approval rather than depicting automatic sending.
- Acceptance: both illustrations decode at full resolution with readable labels, GitHub
  README images load, existing onboarding links remain usable, and repository checks pass.
  Runtime, credential bindings, database, outreach state and Netlify sites are unchanged.
- Owner/chat `01a16283-c9a7-7f40-83f0-eecfcd6c6b89`; public canonical
  `/Users/maheenejaz/Developer/global-clinical-outreach-public`; ordinary task-owned worktree
  `/Users/maheenejaz/Developer/global-clinical-outreach-public-illustrations`, branch
  `codex/public-illustrations`; intake HEAD/fetched main
  `864c5968150ea932a4489d72d1ae8b1412a995b9` at 2026-10-22T10:00:15Z. Native worktree
  creation targets the original private repo in this chat and cannot select this public
  repository, so this isolated worktree is outside managed roots and is not Codex-managed.
- This is a public documentation/asset update; no application deployment is required.
- Validation: both optimized images were decoded and visually inspected at 1536 × 1024;
  combined transfer is 419,966 bytes. Local Markdown targets/whitespace pass; `check:pr`
  passes 90 Python and 80 Node tests, about 2.5 seconds of suite time excluding setup.
