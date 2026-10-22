---
name: research-providers
description: Run the clinical-program provider prospect pipeline for one country batch - discover observership/elective/attachment/fellowship providers that accept international medical students or graduates, screen them, scrape their sites with Firecrawl, extract every field from the cached pages, find LinkedIn URLs, resolve emails with Reoon and report. Use when asked to research, scrape or add providers in any country (US, UK, Australia, New Zealand, ...).
---

# Research providers (one country batch)

Inputs: a country (ISO 3166-1 alpha-2, e.g. `US`, `GB`, `AU`, `NZ`), a batch name that starts with
the country code (e.g. `us-pilot-01`, `gb-01`), and a target count per provider type. Pilot = 25 orgs,
about 6 per type. Full runs use batches of 50. One batch holds one country.

Credentials come only from the repo credential runner (see `TOOLCHAIN.md` and `docs/pipeline-runbook.md`);
never ask for keys. Every `outreach <step>` below means `OUTREACH_BATCH=<batch> npm run infisical:run -- outreach-<step>`
from the canonical checkout on an up-to-date `main` (add `OUTREACH_DOMAIN`, `OUTREACH_REFRESH=1`,
`OUTREACH_PAGES` where noted).

## Provider types (same in every country)
- `academic`: teaching hospitals, medical schools, university health systems
- `community`: non-teaching hospitals, clinics and private practices taking observers directly
- `placement_company`: commercial providers that arrange clinical placements for a fee
- `fellowship`: fellowships, clinical/research posts and certificate courses outside the main
  accredited training pathway

## Country playbook
Use the local terms and seed sources when searching; add a row here when a new country starts.

| Country | Local terms | Licensing exams | Seed sources |
|---|---|---|---|
| US | observership, visiting student elective, externship, USCE, non-ACGME fellowship | USMLE, ECFMG | Specialty-society observership directories (AAO-HNS International Observership Directory, APA "Observerships in Psychiatry" PDF), the USCEHub state observership directory, AAMC VSLO institutions, med school visiting-student pages |
| GB | clinical attachment, observership, elective, clinical fellowship, MTI | PLAB, UKMLA, GMC registration | NHS trust clinical-attachment pages, medical school elective offices, royal college MTI schemes |
| AU | observership, elective, clinical placement, IMG pre-employment structured clinical interview | AMC, AHPRA | state health department IMG pages, university elective offices, hospital medical workforce units |
| NZ | observership, elective, clinical attachment | NZREX, MCNZ | Te Whatu Ora district pages, Otago/Auckland elective offices |

## 1. Discover (no paid tools)
Read `config/exclusions.json` first and never re-propose a domain (or subdomain) listed there.

Where to look, best first (record it as `source_kind`, so `outreach report` can compare sources):
1. `img_directory`: curated lists of programs for international graduates (e.g. professional-body
   observership lists, the country playbook's seed sources).
2. `high_img_hospital`: hospitals that already train many international graduates (residency
   directories that show the IMG share) and run an observership or attachment.
3. `placement_partner_list`: host hospitals that placement companies name on their own sites.
4. `country_registry`: official registers and health-department IMG pages (playbook seed sources).
5. `web_search`: general search with the country's local terms. Last resort: in us-pilot-01 it
   favoured famous academic centres, and most of them were poor fits.
6. `referral`: a provider the team was pointed to.

Prefer community and teaching hospitals and IMG-focused programs. Skip big-name academic centres and
fellowship pages unless a page says the program is open to international graduates now.

Before fixing the batch size, count how many candidates actually pass the screen for the brief. In us-02
only about 4 of about 75 US hospitals matched a narrow brief; when the count falls well short, stop and ask
the user whether to widen the brief or change country, instead of filling the batch with weak leads.

## 1b. Screen (one page, before any scraping)
For each candidate open one page, the program page itself (WebSearch snippet or WebFetch), and
answer these questions from what it states:
- `accepts_imgs`: the page states the program is open to international students or graduates. Recorded for
  ranking only: since 2026-10-08 a page that is silent about IMGs passes the screen.
- `refuses_imgs` (set only when true): the page says the program does not take international students or
  graduates. This fails the screen.
- `program_open`: applications are accepted now (not suspended, paused or partner-schools only).
- `outreach_allowed`: the site does not forbid unsolicited contact or third-party agencies.
- `in_country`: the provider operates in the batch's country.

Screen from the program page itself (download it or WebFetch it). If only a search snippet is available,
say so in `note`; snippets missed a 2027 pause and an unstated IMG rule in us-02. After scraping, re-screen
from the cached pages and update the discovery file (`outreach discover` takes the new screen);
`outreach shortlist` marks a provider whose screen failed as not viable.

Also record `contactable` (optional, never gating): the program or staff page names a coordinator or
director, with or without an email. Targeting profiles use it to rank providers.

Record them as `screen` with `evidence_url` and `checked_on` (and `note` when a check fails).
Unclear counts as false (for `refuses_imgs`, leave it out unless the page says so). Write `data/discovery/<batch>.json` (schema: `schemas/discovery.schema.json`)
and run `outreach discover`: it skips excluded domains and failed screens, and prints both.
A provider that fails for a lasting reason (outreach forbidden, defunct, partner-only) goes into
`config/exclusions.json` through a pull request, with the reason and batch (`recheck_after` for a
paused program). `outreach scrape` refuses any provider without a passing screen; to screen an
older provider, list it in a discovery file again (it keeps its batch).

## 2. Scrape
A provider found only in a directory (no programme page on its own site) gains nothing from the map: in us-03
the picker read 2-9 unrelated pages for each of 9 such ENT departments. List the directory page in
`data/extra-pages/<batch>.json` and scrape that org with `OUTREACH_DOMAIN=<domain> OUTREACH_PAGES=1` (home page
plus the extra pages only). A directory entry that names contacts is a valid source for people and emails.
Set `website` to the narrowest section that holds the program (the page picker stays near it). For very
large networks (e.g. a health system with hundreds of hospitals on one domain) list the program and staff
pages in `data/extra-pages/<batch>.json` instead of relying on the map: in us-02, 7 of 8 pages picked on such
a domain belonged to other hospitals. If a site refuses the scraper twice, note it and move on.
`outreach scrape` maps each site (1 credit) and scrapes up to 8 pages as plain markdown
(1 credit each), following the page plan for the provider type in `pipeline/pages.py`: a placement
company's pricing page comes before its team page, a hospital's staff page before its fees.
Fees and how-to-apply pages are their own page kinds, so they are no longer crowded out by the
homepage. Never request JSON extraction from Firecrawl. Pages land in `data/pages/<domain>/` with an
`index.json`; already-scraped orgs are skipped unless `OUTREACH_REFRESH=1`.

## 3. Extract (the agent: Codex or Claude Code)
For each domain read every cached page and write `data/extractions/<batch>/<domain>.json` matching
`schemas/extraction.schema.json`:
- Capture every field the pages state: org (address as `street`, `city`, `region`
  (state/county/province), `postal_code`), all programs, every named person, dated news items, and
  every published email (named → `published` + `person_name`; role inbox → `generic_inbox`).
- `exam_requirements` holds the local licensing exam rules (USMLE, PLAB, AMC, NZREX...). Keep fees in
  the currency stated on the page, including the currency symbol or code.
- Every program gets `fee_status` and `window_status`, so an empty fee or window says why:
  `stated` (or `free`) when a fee is given; `paid_position` only when a page states a salary or
  stipend; `on_request` when the price comes after sign-up, a quote or contact; `not_stated` when the
  program's pages were read and give no fee; `not_checked` when no program, fees or apply page was
  read. Windows: `fixed_dates`, `rolling` (any time or monthly starts), `not_stated`, `not_checked`.
  The schema rejects a `stated` fee without a value, and a fee value marked anything but
  `stated`, `free` or `on_request`. Do not infer `paid_position` from the program type alone. Extraction files written
  before these fields existed fail validation until both are added.
- Null/omit anything not stated. Never guess. Put long-tail facts in `details`; map each org field
  to its source URL in `field_sources`.
- Mark `is_outreach_target` on 1–2 people by role priority (use the local equivalent title):
  academic: elective/visiting-student or international coordinator → director of international
  programmes or medical education → associate dean; community: medical staffing/medical education
  lead → programme director → medical director/CMO; placement_company: founder/CEO →
  partnerships/BD → marketing; fellowship: programme director → coordinator.
- Derived fields: `img_friendliness_score` (0–5), `price_band` (convert to USD only for banding),
  `site_freshness`, a one-line `pitch_angle`, `priority_score` (1 = best). Base them only on
  extracted facts.
- If a clearly needed page is missing (e.g. no contact page), you may run `outreach scrape` once
  with `OUTREACH_DOMAIN=<domain> OUTREACH_REFRESH=1 OUTREACH_PAGES=8`.

## 3a. First pass: load, check emails, shortlist
Run `outreach load`, `outreach emails`, `outreach email-domain` (one check of a made-up address per
email domain: records catch-all servers and an email domain that differs from the website) and
`outreach shortlist`. The shortlist ranks the batch under every profile in `config/targeting/` and
writes `data/reports/<batch>-shortlist-<profile>.csv`. Profiles only rank, they never block:
do steps 3b and 4 for every org that needs them, in the order of the `high-hit-rate` shortlist,
so the best leads are finished first.

## 3b. Find named contacts (only for orgs with no outreach target after step 3)
Institutional program pages often show only an inbox. For each such org, search (WebSearch, free) for
the page naming the people who run the program, e.g. `"<organization>" observership coordinator`,
`"<hospital>" internal medicine residency program director coordinator` (observerships hosted by a
residency program), or `"<organization>" <program> faculty staff contact`. You may use WebFetch only
to screen whether a found page is the right one; never take names or emails from WebFetch output.
Write the 1–2 best URLs per org to `data/extra-pages/<batch>.json` (schema:
`schemas/extra-pages.schema.json`, `domain` = the org's stored domain, `kind` usually `people`), run
`outreach scrape` (only those URLs are scraped, 1 credit each, no re-mapping), then re-extract those
orgs from the updated `index.json` (merging into their existing extraction file) and continue.
Skip orgs whose site forbids unsolicited contact (`details.outreach_caution`).

## 4. LinkedIn (WebSearch only)
Search only for decision-makers (program directors, chairs, founders); coordinators almost never match
(0 of 14 in us-02). For each such outreach target search `site:linkedin.com/in "<full name>" "<organization>"` and set
`linkedin_url` only when the name and organization both match the result snippet. Never open,
fetch or scrape linkedin.com pages.

## 5. Load, emails, report
`outreach load` (fix and reload any file it reports invalid), then `outreach emails`,
`outreach email-domain`, `outreach shortlist` and `outreach report`. Report the ready-to-email count
per profile, the printed stats, the `yield` lines (pages read per send-ready lead by
source and provider type), the `page limit` line (sites with matching pages left unread), the fee and
window status counts, credits used, and the targets CSV path. Spot-check 10 random rows against
their source URLs before calling the batch done.

## 6. Batch review
Add the batch's lessons, with numbers, to "Lessons by batch" in `docs/project-status.md`. Turn each
lesson into a rule: code or schema when it can be checked, otherwise this skill. Add new exclusions.

## 7. Publish the dashboard
Write the batch text for the team (label, tab name, executive summary with scores, and `run_estimates` for any
run cut off before logging) in `data/reports/<batch>-dashboard-meta.json`, following an existing batch's file.
Then run `npm run infisical:run -- outreach-publish` (all batches; `OUTREACH_BATCH=<batch>` for one) and check
the batch on https://outreach.goocampusglobal.com. Publishing changes no prospect data; see
`docs/pipeline-runbook.md`, "Hosted dashboard".
