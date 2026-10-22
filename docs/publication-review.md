# Public publication review — 22 October 2026

**Approved resolution: a clean public copy.** On 22 October 2026 Maheen explicitly authorized creating
`maheen-ejaz/global-clinical-outreach-public` from the cleaned source while keeping the original repo
and history private. The historical blocker below still applies to publishing the original repository,
but does not prevent exporting a reviewed source snapshot with a new independent Git root. No old
Git objects or GitHub discussions are copied. See `docs/public-source.md`.

## Historical-data blocker

`config/dashboard-usage.json` was removed in commit
`899a92581e7f2dd2a5c76d833082e12cfd5da436`, titled
“Keep vendor observations behind dashboard viewer access”. Its contents remain reachable through
ancestor `0dad0cbf8145f9700add3406cf864006d9420b5a` and other historical commits.

The historical object contains vendor credit/remaining-limit observations, an API-key **label** and
an account/team-specific usage URL containing opaque identifiers. The label/identifiers are not a
usable API credential. Nevertheless, the runbook's saved-snapshot privacy contract deliberately keeps
balances, API-key names and team-specific usage links out of public content. Deleting a file in a later
commit does not remove it from GitHub history. Turning visibility public would expose the old objects.
The current status text now keeps net spend only, with before/after account balances, a historical
API-key label and Reoon remaining-balance values removed. The historical source commit still exists, so this correction alone does not unblock publication.

The repository also intentionally contains named team business email configuration and dated project
operational history. A public version would expose those source documents. Private `data/` contents,
mailbox/CRM sessions and credentials do not come with a clone.

## Review evidence and limits

- `npm run check:pr`: 90 Python tests and 80 Node checks pass, without production credentials.
- Local Markdown file targets and whitespace checks pass; the update changes documentation only.
- Gitleaks reviewed all reachable history: two matches, classified as the intended public Supabase
  browser key and a vendored JavaScript expression. No usable server credential was identified.
- GitHub issue/PR bodies and comments were also scanned; matches were two repeated SHA-256 design
  reference checksums. No full private draft pattern was identified by that check.
- Reachable-history filenames contained no `data/`, `.env` or private-key file. These checks are not
  a guarantee that every possible confidential detail has been found.
- One isolated blind read-only reviewer identified the historical account-data conflict. No policy,
  credential binding, RLS or service access was weakened to make publication possible.
- Live Netlify site inventory showed no Git connection to this repo; its two sites are manual.
  Documentation merge requires no application deployment or paid API run.

## Decision record

Maheen selected option 1 below. Option 2 was not authorized. The earlier review offered:

1. **Clean public copy (recommended):** preserve this existing repository and its full history privately;
   create a separate public repository, proposed name `global-clinical-outreach-public`, from the reviewed
   current source snapshot, with no old Git objects or private GitHub discussions. Maintain an explicit
   record of which source commit it represents. The updated docs and existing asset/licence restrictions
   travel with that source. This changes the share URL and needs an explicit destination decision.
2. **Publish this repository with its history:** explicitly approve making the identified historical
   nonsecret account observations/labels/links public, superseding their saved privacy restriction.
   The original GitHub URL and history remain intact. No usable key is being treated as safe to publish.

History rewriting/force-pushing or renaming/deleting the original remains unauthorized. Keep its
visibility private; publish only the cleaned independent source distribution to the approved new name.
