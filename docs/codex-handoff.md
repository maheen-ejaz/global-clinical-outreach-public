# Codex handoff: start here

Current orientation consolidated 22 October 2026. The original handoff was written on 9 October
when this project moved from Claude Code to Codex; dated history remains in `docs/project-status.md`.
Read that file's current-state section before continuing any operational work.

## Purpose and implemented system

GooCampusWorld wants providers of clinical observerships, electives, attachments and fellowships for
international medical students and graduates to list their programmes on its platform. This repo builds
the sourced research database and supports explicitly requested, human-reviewed partnership outreach.

- Python/`uv` research CLI: discover, screen, scrape, load, email/domain checks, shortlist, report,
  publish and viewers. Batches hold one country and begin with its ISO code.
- Supabase research/prospect store, private raw-page archive and local cached markdown. Facts keep
  source URLs; loads preserve known values. Migrations and RLS are tracked in `supabase/migrations/`.
- Private Netlify dashboard at `https://outreach.goocampusglobal.com`. Browser access uses approved
  viewers and published snapshots, not direct prospect-table reads. Vendor/outreach observations are dated.
- Gmail drafts and native scheduling; Attio Free is the current correspondence tracker since
  13 October. The legacy Supabase Outreach screen is historical, not the current campaign ledger.
- Standalone partnership presentation in `marketing/clinical-partnerships/` with design assets,
  provenance, visual QA and a separate manual site. Main-platform integration remains separate.
- Guarded Infisical runner and offline tests. TypeSafe smoke/pilot tooling is synthetic evaluation,
  not production inference. The People/contact-search pilot was not adopted.

## Latest recorded state, not a new live check

- Research snapshot verified 16 October: five batches (`us-pilot-01`, `us-02`, `us-03`, `us-04`, `gb-01`),
  132 providers, 224 programmes, 112 ready under `bulk-send`, 350 non-invalid research email records.
- Last complete global correspondence observation: 21 October at 13:32 IST. Later that afternoon,
  the scoped check confirmed all five UK messages due that day Sent, ten future UK messages matched
  for 22–23 October, and a positive GSTT discussion request. No meeting was booked by that check.
- Three US failed deliveries stay held. The sixth twenty US/UK/Australian draft group remains Awaiting
  review with no scheduling authority. Changed contact routes and automatic routing suggestions do
  not acquire approval by appearing in CRM notes.
- A GSTT meeting reply was drafted in chat on 22 October, introducing Ashwini with a missing Calendly
  link. That action did not send mail or save a new Gmail draft. Do not publish the private draft here.
- A nine-provider People pilot recorded zero source-verified programme contacts and failed its
  continuation threshold; provider pages remain the source of record.

Read live Gmail/Attio state for an authorized correspondence session. Never advance saved check times,
mark Scheduled as Sent, or claim current account balances from these records.

## Portable reading order

| Need | Read |
|---|---|
| Fresh clone, colleague access, starter prompt | `docs/onboarding.md` |
| Components, trust boundaries, sources of truth | `docs/architecture.md` |
| Built-in tools, skills, retrieval routes and credit savings | `docs/tools-and-credits.md` |
| Current holds, history, results, lessons and release identities | `docs/project-status.md` |
| Research batch procedure and required extraction fields | `.agents/skills/research-providers/SKILL.md` |
| Commands, snapshots, rollback and release procedure | `docs/pipeline-runbook.md`, `TOOLCHAIN.md` |
| Template, approvals, scheduling and CRM reconciliation | `docs/outreach-plan.md` |

Operator-level skills, global instructions, plugins, saved CLI sessions and private `data/` do not
come with a clone. Discover available tools; do not infer access or copy secret files. The onboarding
and tool guides contain the portable minimum. This repository's `AGENTS.md` owns project invariants.

## Rules to preserve

1. Screen and check exclusions before scraping. A silent IMG policy can pass; an explicit refusal,
   closed programme, wrong country or forbidden outreach cannot. Targeting ranks; it never blocks research.
2. Use existing cached evidence before new retrieval. Public discovery routes prefer keyless Exa/Jina
   under Agent Reach, connected Exa only for a gap, Firecrawl only for a bounded acquisition gap.
   Explain that gap before a Firecrawl call. Pipeline scrapes stay map/plain markdown; never JSON/extract.
3. Read every cached page for extraction; capture all stated fields, programmes, people and emails with
   their source URLs. Unknown stays null. Use schemas and the research skill rather than guessing.
   Search/Reader screening output does not replace cached-source extraction requirements.
4. Never fetch, scrape or automate linkedin.com. Search-result profile links require both name and
   organisation to match. Published email addresses and verified guesses retain distinct provenance;
   guesses never qualify for the team's `bulk-send` ready list.
5. Gmail delivers mail; this repo does not send. Review mandatory gates and score at least 90/100,
   then use exact recipient/content approval and exact-time or applicable bounded schedule authority.
   The saved 16 October instruction superseded the earlier twenty-minute gap with **thirty minutes**.
   Later provider/campaign holds and revised approvals still control; no automatic ramp or follow-up.
6. Attio Free tracks correspondence; check Gmail only for project participants/threads during requested
   sessions. No whole-mailbox sync, monitoring, unrelated CRM cleanup or duplicate legacy activity ledger.
7. Credentials only through the bound repo runner, production only from clean current canonical main.
   No `.env` setup, alternative secret source or assumption that a fork can operate production.
8. No frontend, schema, auth or external side effect is authorized merely by onboarding. Each Netlify
   publication needs explicit consent, including previews. Verify current no-Git site connections before
   a push so it cannot accidentally publish.
9. Keep private mail, recipient mappings, approval evidence, exports and screenshots out of Git. Update
   dated public status when results/decisions change; private operational evidence stays private.

## Contribution and closeout

Define observable acceptance criteria, use an isolated owned `codex/<slug>` worktree, run affected checks
and `npm run check:pr`, review the final diff, then use the applicable PR/release procedure. Do not enable
GitHub Actions or introduce background automation. For documentation-only work no application deployment
is needed. Follow current trusted instructions for high-risk review, integration and owned cleanup.
