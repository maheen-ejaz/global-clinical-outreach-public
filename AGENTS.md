# global-clinical-outreach

Public distribution: read `docs/public-source.md`. Offline development works in the public copy;
production bindings intentionally remain tied to the original private canonical repository.
Do not alter that binding or change origin to bypass it.

Start here, in order:
1. `docs/codex-handoff.md`: what we are building, what exists, scraping rules, the post-scrape report, decisions.
   New teammates: `docs/onboarding.md`, `docs/architecture.md` and `docs/tools-and-credits.md` explain
   portable setup, system boundaries, built-in tools and the API-credit policy.
2. `docs/project-status.md`: the living record (identifiers, batch results, lessons by batch, next steps). Update it
   in the same PR whenever a decision, identifier, result or next step changes.
3. `.agents/skills/research-providers/SKILL.md`: read for a research/scraping country batch.
4. `docs/pipeline-runbook.md`: running commands, limits, the hosted dashboard, rollback. `TOOLCHAIN.md`: credentials.
5. `docs/outreach-plan.md`: canonical repeatable outreach workflow, approved base template, review gates,
   exact approval or bounded approved timing, minimum 30-minute spacing and Gmail/CRM reconciliation. Read before any outreach work.

## Commands
- `uv sync` then `uv run pytest`: unit tests (no network). `npm run check:pr`: all checks before a PR.
- `OUTREACH_BATCH=<batch> npm run infisical:run -- outreach-<step>` for
  `discover|scrape|load|emails|email-domain|shortlist|report|publish|viewers`: production credentials, only from
  the clean canonical checkout on `origin/main` (see `TOOLCHAIN.md`).
- `uv run --frozen python scripts/build-web.py` after editing `scripts/dashboard-template.html`.

## Invariants
- No provider is scraped unless it passed the one-page screen and is not in `config/exclusions.json`;
  `outreach scrape` enforces this. Batch lessons live in `docs/project-status.md` ("Lessons by batch").
- Never send email or automate LinkedIn from this repo; never fetch or scrape linkedin.com.
- Outreach stays in Gmail: save drafts first; Maheen approves exact content/recipient and either an exact
  time or an applicable explicitly bounded schedule plan before scheduling. Gmail delivers at the approved instant. No autonomous sending/scheduling or follow-ups; apply `docs/outreach-plan.md`.
- Firecrawl is used only for `map` and plain markdown `scrape`. JSON/extract modes cost 5x and are not used.
- Extracted facts are never guessed: unknown means null. Every org field, program, person and
  email keeps a source URL.
- Loads never erase known values (`compact` drops nulls and empty values; jsonb fields are merged).
- Schema changes go through new files in `supabase/migrations/`; RLS stays enabled on every table.
- The browser never reads prospect tables: the hosted dashboard reads only `dashboards`, limited to addresses in
  `config/dashboard-viewers.json`. Never add browser-facing policies to the prospect tables without the user's say.
- Never use `supabase config push` as a preview; it applies the whole config at once.
