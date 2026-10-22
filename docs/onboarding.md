# Teammate and Codex onboarding

Updated 22 October 2026. This repository is the portable record of the system and its workflows.
Private operational data and access rights are intentionally separate. Maheen approved a clean public
copy on 22 October; the original repository/history stay private. Read `docs/public-source.md` for
provenance, update expectations and the intentional production-origin guard.

## First thirty minutes

1. Read the README, `AGENTS.md`, `docs/codex-handoff.md`, and the current-state section at the top of
   `docs/project-status.md`. Older dated entries are historical evidence, not fresh instructions.
2. Read `docs/architecture.md` to understand where each kind of information lives, and
   `docs/tools-and-credits.md` before selecting a paid tool.
3. Follow the README's clone/setup commands and run `npm run check:pr`. No service credentials are
   needed. Python dependencies use `uv.lock`; Node dependencies use `package-lock.json`.
4. Choose a scoped task with Maheen. For research read the tracked research-provider skill; for
   correspondence read the complete outreach plan first. Do not treat the existing prospect pool,
   draft inventory or historical approvals as a new campaign instruction.

## Access is provisioned separately

| Capability | What the colleague needs | What a clone provides |
|---|---|---|
| Read source, instructions and offline tests | Public GitHub access, local runtimes | Code, migrations, schemas, skills and documentation |
| Contribute changes | GitHub contribution access or a fork/PR, isolated worktree | Test and build instructions; no right to alter production |
| View the research dashboard | Maheen-approved viewer, emailed sign-in link | Browser shell only; the tracked viewer list is not a self-service invitation |
| Run production research | Approved Infisical user access to the exact repo binding and supported CLI | Guarded runner and manifest, never service secrets |
| Work on project mail and CRM | Explicit task authorization plus approved office Gmail / GooCampus Attio access | Workflow and template, not the operator's sessions or message inventory |
| Read cached pages / private evidence | Approved private transfer or authorized access to the existing store | No `data/` directory contents |
| Publish a site | Correct site/team access and explicit consent for that release | Static source and runbook; no deployment consent |

Production profiles intentionally bind to the original private repository origin and exact default
branch. Credential-free `npm run check:pr` works in this public copy; credential-backed preflight/run
rejects this public origin with `REPOSITORY_ORIGIN_MISMATCH`. Do not repoint origin or edit the trusted
repository registry to bypass this. A fork or a
fresh machine must not weaken those checks to “make it work.” Ask the operator/admin to establish the
approved canonical checkout and access. The runner discovers the Git common directory; old absolute
Mac paths in status entries describe the original operator's machine, not a required directory on yours.
Do not create new bindings or use another project's credentials as a workaround.

## What carries across to another Codex

The tracked `AGENTS.md`, research skill, code and documentation are available in any clone. The
`.claude/skills/research-providers` compatibility symlink points to the tracked skill. Read the skill
file directly if the agent does not automatically discover it.

Maheen's global `~/.agents/AGENTS.md`, Agent Reach installation, credential-access skill, connected
Gmail/Attio/Exa plugins, browser sessions and saved CLI authentication **do not travel with Git**.
Use your environment's trusted instructions and discover its actual tools. The portable minimum
procedures are in `TOOLCHAIN.md`, the runbook and `docs/tools-and-credits.md`; do not assume a missing
plugin is permission to bypass a credential or approval boundary. A public source reader can understand
and test this project without installing every service integration.

## Starter prompt to paste into Codex

```text
Read this repository's AGENTS.md, docs/codex-handoff.md, docs/onboarding.md,
docs/architecture.md, docs/tools-and-credits.md and the current-state section in
docs/project-status.md. Inspect git status and the relevant code before proposing changes.
Explain the implemented research pipeline, Supabase/dashboard boundary, Gmail/Attio
workflow, current holds, and how cached pages and built-in tools avoid extra API spend.
Distinguish dated observations from live evidence. Discover available tools instead of
assuming Maheen's local plugins, credentials or private data are present. Start with
credential-free setup and npm run check:pr. Do not run paid research, send/schedule mail,
change production or deploy a site merely as part of onboarding. Wait for my scoped task.
```

## Continuing real work

- **Research:** use `.agents/skills/research-providers/SKILL.md`, schemas and exclusions. Search/screen
  before spending scrape credits; page extraction still uses the repository's cached-source rules.
- **Outreach:** Gmail is the sending source of truth; Attio holds the current correspondence stage,
  exact content/approval notes and next action. Check only project participants/threads in requested
  sessions. Maintain existing holds; no whole-inbox sync, autonomous sending or follow-ups.
- **UI:** edit the source template where applicable and rebuild `web/`. The local sign-in shell has
  no seeded data. Use offline tests/fixtures for development; a real dashboard session requires its
  approved production hostname and viewer access.
- **Release:** a Git merge is not a website publication. Follow the runbook, current release ownership
  and per-release Netlify consent. No hosted preview is needed for documentation review.

When handing work back, record changed behaviour, evidence/checks, dated external observations,
private-evidence location, unresolved holds and the next decision in project status. Keep full private
mail and recipient-level evidence out of commits, PRs and public screenshots.
