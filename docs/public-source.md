# Public source provenance and access

Maheen approved this distribution on **22 October 2026**.

- Public repository: [global-clinical-outreach-public](https://github.com/maheen-ejaz/global-clinical-outreach-public).
- Source baseline: original private repository, `main` commit
  `06b5031a61eee014670411a77d73efbd00c7f5cf`, containing the cleaned team documentation from PR #98.
- Publication adaptations: README clone URL and distribution note; onboarding access guidance;
  AGENTS/TOOLCHAIN public-origin notice; project status, publication decision and this provenance file.
  Runtime code, tests, migrations, schemas, tracked research skill and assets come from the baseline.
- Git starts with an independent source commit. No private ancestor commits, branches, tags, PRs,
  issues, comments, deleted usage files, ignored `data/`, mail exports or authenticated sessions travel
  with this copy. Source references to original commits/PRs are provenance, not accessible public history.

## What your colleague can do

Clone the public URL, read README and `docs/onboarding.md`, paste its starter prompt into Codex,
install the pinned dependencies and run `npm run check:pr`. The source explains the research pipeline,
private dashboard, Gmail/Attio workflow, approvals, cache-first retrieval and paid-tool boundaries.
The tests use local fixtures and an embedded database; no production credentials are required.

The production runner and manifest are retained to document and test their safeguards. Their trusted
origin remains the original private repository. Credential-backed preflight/run in the public repo
intentionally rejects `REPOSITORY_ORIGIN_MISMATCH`; this is not broken onboarding. Do not change
origin or modify bindings to evade it. Production work needs separately approved original-repo and
service access. Never paste keys into `.env` files or chat.

The local dashboard preview is a sign-in shell without prospect data. No production localhost redirect,
new account or dashboard-viewer access is granted by publishing source.

## Updates and reuse

This is a dated source distribution, not an automatically synchronized mirror. Original historical
status entries remain dated observations. A later public update must be reviewed from a new cleaned
snapshot or scoped public PR; never push the private Git refs/history into this repository. Keep private
operational changes in the original and publish only reviewed source changes.

The original private repo remains the production authority. Do not deploy public-copy branches to the
existing Netlify sites. Every Netlify publication retains its separate explicit release-consent rule.
Existing vendor/font licences and GooCampus asset usage restrictions still apply; making source readable
adds no blanket open-source licence. Native account integrations and operator-level skills are not
installed by cloning; the onboarding/tools guides explain portable alternatives and concrete access gaps.
