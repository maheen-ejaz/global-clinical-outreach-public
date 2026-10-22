# Tools, skills and API-credit policy

Updated 22 October 2026. This describes the workflow used here; it is not a current vendor price quote.
The aim is to avoid unnecessary retrieval and enrichment charges while retaining source evidence.

## Choose a route before calling a service

| Need | First route | Escalation / boundary |
|---|---|---|
| Understand or change this system | Tracked docs/code, `rg`, existing tests and local scripts | No external fetch for facts already present locally |
| Read a previously captured provider fact | Cached markdown and indexed source URL | Refresh only for a concrete missing/stale source, within task scope |
| Search the public web | Agent Reach's keyless Exa MCP route | Connected Exa only if unavailable/rate-limited or materially better coverage; no duplicate sufficient query |
| Screen/read a known public URL | Jina Reader through Agent Reach | Diagnose failures and documented alternatives before a metered fallback |
| Acquire missing rendered/multi-page evidence | Bounded Firecrawl map/plain markdown scrape | State the remaining gap/scope before the first call; no JSON/extract mode here |
| Read project mail / CRM | Available native Gmail/Attio tools | Browser only for the specific unsupported capability; check CLI/API alternatives first |
| Schedule an approved message | Native Gmail Schedule send UI | Discover live tool support; the workflow has no repository sender or autonomous schedule service |
| GitHub repository/PR work | Native GitHub tools or saved `gh` operator session | Never expose credentials or switch accounts |
| Check an email/domain | Existing saved result first, then bound Reoon command | Do not rerun all checks merely to refresh a report |
| Re-rank or report | Local deterministic rules, stored research and existing publisher | No new scraping or LLM API required for a targeting-rule change |

The original batch skill's `WebSearch` and `WebFetch` labels describe operations, not a required product.
Use the routing above on the current machine. Search/Reader output can screen candidates, but the current
research contract still requires cached scraped evidence for extracted names/emails and programme facts.
Do not silently replace that provenance rule to save credits. Targeted outreach checks may use official
public pages under the outreach plan without claiming a new pipeline extraction or verification result.

Never fetch, scrape or automate linkedin.com in this project. A profile URL may be retained from a
search snippet only when the name and organisation both match.

## What actually avoids extra charges

- **Screen before scrape.** Fail closed on explicit IMG refusal, blocked outreach, wrong country or
  closed programmes. Check persistent exclusions before proposing providers again.
- **Use high-yield sources.** Curated programme directories outperformed broad search in early US
  batches. Record `source_kind` so the report can compare actual yield.
- **Select pages.** Default page plans cap reads at eight per provider. Use exact programme/staff URLs
  for a large hospital network; mapping unrelated pages wastes credits. Staff-page enrichment is
  targeted to providers lacking an outreach target.
- **Cache once, extract many fields.** Markdown is stored locally and in private Storage. The current
  Codex/agent session reads it into schema-validated JSON. A new field or report need not pay for a
  new scrape or separate extraction API. Agent usage itself still consumes its plan/budget.
- **Keep retries scoped.** Existing scrape/email skip behaviour avoids repeating completed work.
  Inspect `pipeline_runs.errors` and any uncertain external effect before retrying; request one domain
  instead of redoing a batch. `OUTREACH_REFRESH=1` deliberately spends again and needs a reason.
- **Separate ranking from acquisition.** Profiles rank the same records; they do not filter what is
  collected. Changing who counts as ready does not require rediscovery.
- **Prefer published contacts.** Do not purchase enrichment by default. Guessed addresses never qualify
  under `bulk-send`, even if another workflow verified a guess. Preserve the recorded source/method.
- **Reuse snapshots and manual sessions.** Dashboard Refresh reloads saved data. It does not poll Gmail
  or call research vendors. Only explicitly requested sessions reconcile project correspondence.
- **Prove value before integration.** Bound an experiment, define a continuation threshold, record cost
  and source-verified yield, then stop a poor-performing route.

## Evidence and cost interpretation

| Observation | Meaning / limit |
|---|---|
| Historical standard pipeline accounting: one credit/map and one/plain markdown page | Recorded project assumptions, not a promise about future provider billing; inspect current balances/terms before paid work |
| Historical Firecrawl JSON/extract mode cost about five times markdown | Reason it is excluded from this workflow; more fields are extracted from the same cached page |
| Early three US batches: about 638 Firecrawl credits and 423 logged address/domain checks | Older pipeline-operation totals, one scrape run estimated; not the latest vendor lifetime/balance totals |
| 15 October: 818 Firecrawl successful-job credits; 16 October: 388 Reoon lifetime verifications | Different dates, sources and definitions; do not subtract or present them as comparable invoice totals |
| Sixth draft group, 16 October: twenty drafts sourced with cached research, Exa/Jina and native Gmail/Attio | No Firecrawl/Reoon spend or new paid subscription recorded for that group; not a claim of zero total platform cost |
| Contact-search pilot, 21 October: nine providers, zero verified programme contacts; net 94 Firecrawl credits recorded | Failed the three-contact continuation threshold; not adopted into routine research |
| TypeSafe synthetic pilot | Hard request/budget bounds and readiness gates; no demonstrated production ROI or integration |

There is no audited dollar-savings percentage or per-country guaranteed cost. “Included”, “keyless” and
“built-in” mean no separately invoked paid extraction/enrichment step in that operation, not unlimited
usage. Check agent quotas, free tiers, connected-tool billing, instant verification balances and current
vendor prices before estimating a new batch. Keep current account balances private.

## Skills and tooling on another machine

The research procedure is versioned at `.agents/skills/research-providers/SKILL.md`. Skills are reusable
instructions, not independently running services or grants of access. The tracked workflow can be read
directly even when automatic skill discovery is absent.

Agent Reach and Maheen's credential-access skill are **operator-level installations**, not vendored in
this repository. Discover the installed capability and its documentation; do not pretend they arrived
with a clone. The routes used by this project include:

```sh
# If the approved Agent Reach / mcporter Exa setup already exists:
mcporter call exa.web_search_exa query="official clinical observership programme" numResults=5
# For a public page (not linkedin.com), using the Reader route:
curl -fsS "https://r.jina.ai/https://example.org/programme"
```

These are examples, not setup validation. Read actual responses and check the page/source; empty results
or an HTTP success alone do not establish useful retrieval. Follow installed Agent Reach recovery docs
before escalating. If tools are missing, use supported available native capabilities within the same
cost and permission boundaries, or report the concrete setup gap. Do not install a paid integration or
silently spend credits just to make onboarding pass.

For authenticated pipeline commands, `TOOLCHAIN.md` and `infisical-profiles.json` are the portable binding
contract. Only the declared `npm run infisical:preflight -- <bound-command>` and
`npm run infisical:run -- <bound-command>` may inject credentials; one exact bound command, no arbitrary
child process. No `.env` population, secret export or alternate project is part of onboarding.
