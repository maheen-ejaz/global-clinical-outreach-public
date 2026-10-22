# Toolchain

## Public source distribution

`global-clinical-outreach-public` is a clean source snapshot for collaboration. Offline checks work
there; the credential runner intentionally rejects its different origin. The original private repo
remains the production authority. No bindings, project IDs or trusted-origin checks were changed
for publication. See `docs/public-source.md`; never repoint origin or weaken the guard.

- Python >= 3.12 managed with `uv`; dependencies are pinned in `uv.lock`.
- Supabase project: `global-clinical-outreach` (ref `wevhojfgxckximznhvbh`, ap-south-1, GooCampus org;
  created as `goocampus-us-outreach`, display name renamed in the dashboard).

## infisical-credential-access

Infisical project: `Global-Clinical-Outreach` (`1b056234-5b7a-4d98-87a2-635730076e34`), dedicated to this repository.
Runner: `scripts/infisical-profile-runner.mjs` (shared GooCampus runner, pinned to that project and this repository),
manifest `infisical-profiles.json`, binding `.infisical.json`, Infisical CLI `>=0.43.125 <0.44.0`.

| Profile | Environment | Path | Variables | Commands |
|---|---|---|---|---|
| `prod-pipeline` | `prod` | `/Production/Pipeline/v1` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIRECRAWL_API_KEY`, `REOON_API_KEY` | `outreach-discover`, `outreach-scrape`, `outreach-load`, `outreach-emails`, `outreach-report`, `outreach-email-domain`, `outreach-shortlist`, `outreach-publish`, `outreach-viewers` |
| `dev-typesafe` | `dev` | `/TypeSafe` | `TYPESAFE_API_KEY` | `dev-typesafe-smoke` |

Non-secret passthrough variables: `OUTREACH_BATCH`, `OUTREACH_DOMAIN`, `OUTREACH_PAGES`, `OUTREACH_REFRESH`.
Runbook: `docs/pipeline-runbook.md`. Production commands run only from the clean canonical checkout at
`origin/main`.

`outreach-activity` is also bound to `prod-pipeline` (no passthrough variables). It records
explicit-session activity from gitignored local files; it never sends email. The initial outreach schema was activated on 2026-10-10 using Maheen’s one-time exception
for the saved Supabase CLI operator session, recorded in docs/project-status.md. The normal
profile remains unchanged; its REST credentials do not supply future schema-management capability.

`dev-typesafe` is limited to the fixed synthetic request described in `docs/typesafe-smoke.md`.
It has no passthrough variables, uses `expand=false`, and does not share the production profile.

## Bounded synthetic TypeSafe pilot

The `dev-typesafe-pilot` command runs only the committed synthetic fixtures and
protocol under `scripts/typesafe-pilot/`, using the existing Development `/TypeSafe`
binding. It is evaluation tooling; it does not invoke application routes, update
records or change user-facing behavior. The complete pilot directory is protected
against changes from fetched default before credential injection. Request caps
include failed attempts; the append-only attempt journal prevents duplicate IDs on
resume. Local outputs go to ignored `typesafe-pilot-results/` and contain only
synthetic inputs, validated judgments, timing, token usage and estimated costs.

```sh
npm run infisical:preflight -- dev-typesafe-pilot
npm run infisical:run -- dev-typesafe-pilot
```

The protocol marks independently agent-reviewed synthetic labels as provisional,
not human-reviewed validation. No production inference or app integration is enabled.
