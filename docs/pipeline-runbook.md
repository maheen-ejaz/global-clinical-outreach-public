# Pipeline runbook

For a fresh clone start with `docs/onboarding.md`; service access and private `data/` are separate.
Each Netlify publication, including a preview, requires Maheen's explicit consent for that exact
release. Commands below describe procedure, not standing consent. Documentation changes need no deploy.

Production profile `prod-pipeline` gives the `outreach-*` commands write access to the
`global-clinical-outreach` Supabase project (ref `wevhojfgxckximznhvbh`, ap-south-1) and spends
Firecrawl credits and Reoon checks. No command sends email.

## Outreach preparation and tracking

Use `docs/outreach-plan.md` as the canonical template/review/approval/Gmail workflow.
Native Gmail drafting and scheduling were verified in the completed pilot; no pipeline
command sends, schedules or reads replies. The implemented Outreach screen records
observed activity during requested sessions through the command below. Research publishing
and correspondence remain separate; keep the viewer allowlist and prospect-table boundary.

## Before a run
1. Use the canonical checkout `~/Developer/global-clinical-outreach` on `main`, fast-forwarded to
   `origin/main`, with a clean status. Run `npm run check:checkout`.
2. Sign in to Infisical in a normal terminal if the runner reports `USER_LOGIN_REQUIRED`.
3. Check credit balances: the Firecrawl dashboard (one batch of 50 uses about 350 credits) and Reoon
   instant credits (about 6 checks per provider; us-02 used 148 for 24). The pipeline spends instant credits,
   not the free daily ones. When they run out every check fails with `Reoon verify failed: 403`.

## Commands
Batches hold one country and are named with its code first (e.g. `gb-01`).
Run each step with `OUTREACH_BATCH=<batch> npm run infisical:run -- outreach-<step>` where
`<step>` is `discover`, `scrape`, `load`, `emails`, `email-domain`, `shortlist`, `report`, `publish` or `viewers`. Optional variables:
`OUTREACH_DOMAIN` (one organization), `OUTREACH_REFRESH=1` (re-scrape), `OUTREACH_PAGES` (pages per site).

Each command has a 15-minute limit. Prefix commands with `PYTHONUNBUFFERED=1`: in us-03 the first scrape hit the
limit with its output still buffered, so the log was empty and that run's credit count was never recorded
(macOS has no `timeout` command; the runner's limit is the only one). Steps are resumable: `scrape` skips organizations that already
have cached pages, and `emails` skips people who already have a deliverable email. If a step
times out, run it again.

## After a run
- `outreach-report` prints coverage and spend and writes `data/reports/<batch>-targets.csv`.
- `outreach-shortlist` is read-only. It ranks the batch under every targeting profile in
  `config/targeting/` and writes `data/reports/<batch>-shortlist-<profile>.csv`. To change who counts
  as ready to email, edit or add a profile (schema `schemas/targeting.schema.json`) through a PR.
- `outreach-email-domain` spends about one Reoon check per email domain; `OUTREACH_REFRESH=1` re-checks.
- Check `pipeline_runs.errors` for failed domains, then retry them with `OUTREACH_DOMAIN`.

## Hosted dashboard (outreach.goocampusglobal.com)
A private page for the approved dashboard viewers in `config/dashboard-viewers.json`. Static files in `web/` on Netlify (site `goocampus-outreach`, ID `705877a0-828e-46fa-94a7-ca5f7d7e94b0`, team GooCampus Team;
the `goocampusglobal.com` DNS zone is on Netlify). Sign-in is Supabase Auth with an emailed link; the page reads the
`dashboards` table, whose policy allows only signed-in addresses listed in `dashboard_viewers`. The prospect tables
have no policies, so the browser can never read them directly.

- **Refresh the figures** after a batch (or any data change): `npm run infisical:run -- outreach-publish`. It rebuilds
  every batch's snapshot from the database with the bulk-send rules (`pipeline/dashboard.py`), stores one row per
  batch plus `all`, and prints providers and ready counts. `OUTREACH_BATCH=<batch>` rebuilds one batch (and `all`).
  Batch text (labels, executive summary, `run_estimates`) comes from `data/reports/<batch>-dashboard-meta.json`; when
  that file is missing the text already published is kept. No redeploy is needed. A full publish (no
  `OUTREACH_BATCH`) also deletes dashboards of batches no longer in the database: after deleting a batch or a
  person's data on request, run a full publish so it leaves the page.
- **Who can sign in:** `config/dashboard-viewers.json` (PR), then `npm run infisical:run -- outreach-viewers`. It adds
  missing addresses with a confirmed sign-in account and removes unlisted ones, which ends their access at once.
  Sign-ups are disabled, so nobody else can create an account.
- **Change the page:** edit `scripts/dashboard-template.html` (shared with the local dashboards) or `web/app.js`, run
  `uv run --frozen python scripts/build-web.py` (tests fail when `web/` is stale), merge, then deploy from the clean
  canonical checkout: `netlify deploy --prod --dir web --site 705877a0-828e-46fa-94a7-ca5f7d7e94b0`, check the deploy is ready and the page loads.
  Netlify is not connected to GitHub, so merging alone deploys nothing.
- **Auth settings** (Supabase dashboard, Authentication), check before each deploy: site URL
  `https://outreach.goocampusglobal.com` and the redirect list exactly `https://outreach.goocampusglobal.com/` (no
  wildcards or preview hosts: a wrong redirect could let someone else complete a sign-in link), sign-ups off, email
  confirmation on, anonymous sign-ins off. Access rests on these: the policy trusts a confirmed email on the list. Never preview with `supabase config push`: it applies the
  whole local `config.toml` at once without asking (it overwrote the auth settings once on 2026-10-09; reverted).
- **Security headers** live in `web/_headers` (scripts from the site only, no framing, no indexing). The Supabase
  library is vendored (`web/vendor/supabase-2.45.4.js`, checked against the npm package checksum).
- **Sharing preview and icons:** static metadata comes from `SHARING_HEAD` in `scripts/build-web.py`; the image
  and icons are rebuilt with `uv run --no-project scripts/build-brand-assets.py` (no production credentials).
  See `scripts/brand/README.md` for the font license and image cache/versioning rules. After a page deploy, fetch
  the production HTML without JavaScript and verify the image/icon/manifest URLs return their expected types.
  Public artwork must never contain prospect records; dashboard data still requires sign-in.
- Rollback: deploy the previous Netlify deploy from the Netlify UI; `delete from dashboards` hides all data at once.

## Rollback
Data is additive. To remove a bad batch, delete its organizations
(`delete from organizations where batch = '<batch>'`). Programs, people, emails, news and pages
cascade. Then delete the matching `raw-pages/<domain>/` objects in Storage.

## Standalone clinical partnership review page

GOO-1539's marketing source is `marketing/clinical-partnerships/`, separate from the prospect dashboard.
See its `HANDOFF.md`, `asset-manifest.json` and `qa/QA.md`. The dedicated review hostname is
`partners-preview.goocampusglobal.com`, in GooCampus Team (slug `goocampus`). Its site ID and successful
deploy identity are recorded in `docs/project-status.md` after creation. Do not use the dashboard site ID.

Use the operator's supported saved Netlify CLI session, as with the dashboard deployment. These static
hosting operations require no Pipeline credentials or Infisical profile. Never read credentials from
environment files or unrelated repositories. No Supabase data/schema/auth release step applies to this
static page; its dedicated hosting has no prospect data or sign-in.

Before creation/domain association, confirm team ownership and that the exact hostname is unused through
Netlify site and zone reads. Change only that selected hostname. Do not replace other DNS records, mail
configuration or apex nameservers. Native chat discovery and the GOO-1539 section of project status are
the release ownership record; this task owns the dedicated page release until handoff.

After affected checks, the repository PR check and exactly one isolated, blind, read-only release review,
merge the source and fast-forward clean canonical `main`. From that exact current default commit:

```sh
python3 scripts/build-partnership-page.py
netlify deploy --prod --cwd marketing/clinical-partnerships --dir dist --site <recorded-dedicated-site-id> --no-build --message "GOO-1539 source <full-commit-sha>" --json
```

Use a dedicated manual site, with no Git connection or build hooks. `netlify.toml` is inside the source
folder; **both `--cwd` and `--dir` are required**. Without the page-specific working directory, the CLI
can serialize the root dashboard configuration and its headers even while uploading the correct page
files. The corrected command was verified on the dedicated review deploy. `.netlify/` is ignored if linking occurs.
Require `ready` and the published deploy ID before claiming success. Associate the exact custom hostname
with this site and use Netlify's returned site-specific DNS target; re-read the record before retrying
any uncertain write. Verify custom-domain HTTPS, expected source bytes, every asset, CSP and noindex
metadata/header; record full commit, site/deploy IDs, deploy URL and verification time. Capture deployed
desktop/mobile light/dark views. An erroneous published version is corrected in source and redeployed.

Attach the portable source/asset/design-reference/QA package and link the handoff to GOO-1539. The existing
website team owns final integration and entry points; that ticket remains open. Temporary-preview
use in email follows the separate exact approvals in `docs/outreach-plan.md`.
Keep the temporary review site and DNS after handoff; retirement requires a later authorized scope.

## Overview outreach totals

Overview loads every page of saved outreach items/history after sign-in, across all batches,
excluding the self-demo. Sent requires recorded confirmation, never just an elapsed schedule.
Human responses use the latest positive/negative/neutral/redirect/unclear/opt-out observation;
positive is Interested, negative/opt-out Rejected, the rest Other. Automatic replies and delivery
problems are shown separately. Gone cold means no human reply recorded fourteen days after
Sent confirmation; an unknown confirmation date stays Awaiting reply. Current storage holds
one outreach email per provider. These are saved observations; Refresh activity does not read
Gmail. Record requested Gmail checks/replies through the existing activity workflow below.

## Outreach activity command (active since 2026-10-10)

`npm run infisical:run -- outreach-activity` uses the existing `prod-pipeline` profile,
from clean canonical main only. It never calls Gmail or sends/schedules email. Before a read-only
export, ensure no pending `action.json` exists; inspect uncertain intent/current CRM history
before retrying a queued action. With no
`data/outreach/action.json`, it exports correspondence rows to mode-0600
`data/outreach/activity.json`. Treat these files as private; never commit or publish them.

For a requested update, save one JSON object in `data/outreach/action.json`:
`{"domain":"provider-domain","version":1,"action":"checked","data":{"evidence":"observed Gmail evidence"}}`.
Use the live exported version, never an assumed version. Allowed actions: `prepare`, `review`,
`begin_scheduling`, `scheduled`, `sent`, `cancelled`, `send_failed`, `checked`, `reply`.
The database rejects stale versions and unsupported transitions. A successful action is renamed
`last-action.json`; activity is exported before applying it so an uncertain/stale attempt can be
reconciled safely without repeating a Gmail operation.

- `prepare`: exact recipient, subject, body, IANA timezone and timezone_source. Only editable draft rows.
- `review`: `draft` matching the persisted JSON exactly, score 90–100, `gates` keyed G1–G10 with
  `{result:"pass",evidence:"source/check evidence"}`. The lock still requires Maheen's approval.
- `begin_scheduling`: record eligibility, opt-out/duplicate checks in `evidence`, then use the approved
  version in Gmail. This reserves the row against concurrent editor changes.
- `scheduled`: `draft` equal to the locked JSON, `send_at` equal to the locked instant,
  `gmail_reference` and `evidence` of the observed exact Gmail schedule. Never set merely because locked.
- `sent`, `cancelled`, `send_failed`: observed `gmail_reference` and `evidence`.
- `checked`, `reply`: observed `evidence`; reply also has `outcome` in positive, negative, neutral,
  redirect, automatic, unclear, opt_out or bounce. Cancel an outstanding schedule before recording opt-out.

Initial schema/deployment completed on 2026-10-10 through Maheen’s one-time saved-CLI exception;
see project status for source/deploy identities and verification. The exception is consumed.
Pipeline REST credentials still cannot run DDL. Future schema changes need a declared supported
capability and the normal reviewed release procedure. Activity edits remain available through the
bound runner; the live UI provides Maheen-only editing and approval.

## Preparation quota migration pending activation

**Historical capability; not an Attio prerequisite.** Since 13 October, Attio Free tracks current
correspondence. Do not activate this migration or duplicate legacy activity to log Attio groups.

`20261012104500_outreach_preparation_slots.sql` preserves scheduled/terminal history while
limiting unscheduled preparation to five real providers at a time. It replaces the existing
`private.change_outreach` function; no table, RLS or grant change. Before applying, compare
the production function with the previous `20261010121632_outreach_self_demo.sql` definition
and stop on unexpected divergence. Use only an authorised supported SQL capability; current
REST profile cannot apply DDL, and the old CLI exception is consumed. Record source SHA,
applied migration identity and live owner/role/history-preservation proof. Rollback restores
the previous function definition without changing correspondence rows or Gmail schedules.

The local counter correction needs a separately approved Netlify release. Never treat a
source merge or database migration as consent to publish frontend changes. Until activation,
keep new Gmail drafts unscheduled when CRM preparation/approval/reservation is blocked.

## Saved outreach overview snapshot

Attio is the current correspondence tracker. To update Overview during an explicitly requested
session, save only aggregate counts in private `data/outreach/dashboard-activity-summary.json`
using `schemas/dashboard-activity-summary.schema.json`. Record native Gmail Sent/Scheduled
and human/automatic reply evidence privately first. `checked_at` is the observation time,
not the publication time; never advance it without a new check. The source field is fixed.
Include total tracked contacts and awaiting-review contacts without recipient/message details.

The existing `outreach-publish` command validates this local file before any writes and stores
it only inside the all-batches `dashboards.data` snapshot behind the existing viewer policy.
Private correspondence is not copied into static assets. Invalid/private fields, inconsistent
counts and older check timestamps are rejected. With no local file, the existing published
summary is retained. No schema, RLS, credential binding, Gmail send or Attio write is needed.
The page labels the observation date and its earlier pilot editor separately. Refresh reloads
saved observations, not the inbox. Research snapshots continue to be rebuilt from current
research records, including every completed batch.

Vendor observations use private `data/reports/dashboard-usage.json`, validated against
`schemas/dashboard-usage.schema.json`, and travel in the same protected all-batches snapshot.
Each vendor retains its own check date; older local observations are rejected. Without a
local input, previously published observations are preserved. Static JavaScript contains no
usage values, balances, API-key name or team-specific source URL. Never copy these private
input files or the local-preview directory into the Netlify publish directory.
