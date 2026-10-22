# Synthetic TypeSafe window-status pilot

This directory contains a fixed, synthetic-only evaluation package for the post-scrape `window_status` judgment. It does not change the outreach pipeline, screen, exclusions, targeting, email handling, or dashboard. Every passage and URL uses the reserved `synthetic.example` domain; the corpus contains no actual providers, people, contacts, email addresses, cached pages, or scraped material.

The frozen input is stimuli-only.json. It has no answer labels. gold.json is separately marked parent_adjudicated_provisional after a blind independent agent reviewer agreed with all 40 status labels and the parent corrected the positive evidence IDs. agent-baseline.json records the current Codex agent's manual extraction on all 40 synthetic cases before TypeSafe results; only the 24 natural page cases enter the baseline comparison. The runner reads gold.json only to verify its frozen hash and never includes labels in a TypeSafe request.

The proposed call plan is fixed:

- 24 page cases: eight each for `fixed_dates`, `rolling`, and `not_stated`.
- 8 `not_checked` controls have no program/apply page and must make no provider request.
- 8 challenge cases exercise instruction-like page text, literal negation, old dates, fixed/rolling overlap, misleading dates, and irrelevant context.
- 32 base requests plus 8 same-input option-order repeats gives a hard ceiling of 40 attempts. Failed attempts consume the ceiling; there are no retries.

Protocol revision 2 uses two independent `Choice` questions. `window_status` can be `fixed_dates`, `rolling`, `not_stated`, or `unclear`. `evidence_id` can be an input candidate paragraph ID or `none`; its standalone prompt selects a paragraph that explicitly states application-window timing without referring to another answer. The request includes only the candidate text and page-read kinds, not the local URL mapping. For `fixed_dates` and `rolling`, code requires a candidate ID, resolves it locally, and copies the original paragraph and URL from the frozen input. For `not_stated` and `unclear`, the independent evidence answer is unused and no quote or URL is exported. If the candidate set is empty, the protocol returns no update and manual review; that absence alone never establishes `not_stated`. `not_checked` is determined locally from page-read metadata and is never a model choice.

`fixed_dates` and `rolling` may overlap in source material, while the current app schema has only one value. The evaluation-only `unclear` answer handles overlap and other conflicts; it is never written to the app. The status describes what timing is stated, not whether a deadline has passed or whether the program is currently open. The old-date challenge is not an arithmetic task.

The model version is pinned to jev-1.13.0. Requests have a 30-second deadline, reject redirects, do not retry, and emit only normalized validated answers and safe error codes. Composition errors preserve only independently validated choice distributions and token counts for diagnostics; they never attach a source quote. An append-only intent record is fsynced before each request. On resume, any previously attempted ID is skipped and never retried; attempts with no corresponding result remain consumed. A v1 attempt/result ledger is incompatible with v2 and is refused without clearing or replaying it. A concurrent or malformed run ledger fails closed. The fixed entry point accepts no arguments and uses no caller-provided prompt, dataset path, model name, endpoint, or output path. Revision 2 is blocked until the protocol moves from `pending_v2_security_review` to `ready_after_independent_review`; separate user authorization is still required before any new provider request.

The parent-verified live price snapshot is recorded in the public price artifact price-config.json: standard input tokens are priced at $0.042 per million and output tokens are free. The hard maximum run estimate is $0.10, and preflight bounds 40 attempts, including failures, at 32,000 input tokens per request. The run records actual token counts and reports a published-price estimate from actual usage, not an invoice. It records client request duration and total elapsed time; the API does not report model latency. Human review time is not measured, so integration ROI is unknown.

Offline checks:

```sh
node --test scripts/typesafe-pilot/test_offline.mjs
```

The TypeSafe runner remains gated by protocol readiness. No API call is made by the offline tests.
