# Repeatable clinical-provider outreach workflow

Canonical instruction set for preparing, reviewing, scheduling and reconciling provider
outreach. Use when the user requests any of those actions or a new outreach group. Read
`docs/project-status.md` for dated results and `docs/pipeline-runbook.md#outreach-activity-command-active-since-2026-10-10`
for runner payloads. Research qualification remains in the provider-research skill.

## Scope, owner and authority

Maheen is the operator; introduce the sender as **Ejaz**. Use office Gmail
`maheenejaz@goocampus.in`. Codex carries out explicitly requested sessions; Gmail delivers
at the approved time. Reusing this workflow is not permission to start a new batch, contact
more providers, schedule follow-ups, or monitor the inbox in the background.

The original pilot is five providers; later groups have their own explicitly requested scope.
Use one sourced eligible contact per provider. The research pool is not a send queue. Keep
already-scheduled messages intact unless the user's current instruction expressly authorizes a
schedule change; never recreate the pilot when asked to resume. New groups and any expansion
need the user's scope and exact approvals.

Human approval covers one exact recipient, subject, body/signature, plus either an exact
date/time or an explicitly bounded schedule plan that delegates time selection within that
plan. Record each computed instant before scheduling. Draft scores, CRM locks and old approvals
do not authorize changed versions. Record applicable approval rather than asking again. A
missed time needs a newly approved time unless the approved plan expressly covers rescheduling;
never roll it forward silently. No repository sender, autonomous scheduling or automatic
follow-up exists.

## Inputs and approved base template

Before starting, locate the provider's source pages, `bulk-send` eligibility/exclusions,
current CRM row/history, current Gmail draft/message identity, approved copy and any valid
approval. Private current pilot text/metadata is in `data/outreach/pilot-drafts-2026-10-12.json`;
read its `state` before acting. Gmail/CRM are authoritative for live state; dated local files
are evidence, not permission to overwrite newer edits. Never print or commit private drafts,
addresses, raw mail, replies, screenshots or approval records to GitHub/public artifacts.

Reuse this base with small changes to the greeting, subject/programme label and one verified
programme fact. Keep the identity, offer, credibility wording, links, conditional fee sentence,
routing, decline and approved signature stable. Do not rewrite the pitch or add promises to
make a new provider sound more attractive. If platform status or URLs change, update only
the affected factual wording. Every change still requires review and exact approval.

Subject pattern: `[Specialty/programme] listing — partnership enquiry`, or a similarly short,
accurate provider-specific subject. Never put fees in the subject.

```text
Hi [contact first name or appropriate role],

I'm Ejaz from GooCampusWorld, a medical career platform operated by GooCampus Edu Solutions Pvt Ltd. We connect medical students, graduates and doctors with mentors and career guidance.

GooCampus has operated for more than a decade. Our services include UK and Australian medical career guidance and ALS training in India.

[One brief programme fact verified against the provider's source; explain audience relevance where supported.]

We'd like to discuss listing your programme for this audience. You would approve the programme information and retain eligibility and admission decisions.

This partnership page is a temporary preview as we prepare our first programme group: https://partners-preview.goocampusglobal.com/

Agreed listings would ultimately appear on our primary platform: https://www.goocampusworld.com/

We can discuss a referral-fee arrangement separately, if appropriate.

Would you be open to a brief conversation? If another colleague handles partnerships, please point me to them.

If you prefer no further contact, please reply and let me know.

Ejaz
GooCampusWorld | GooCampus Edu Solutions Pvt Ltd
[approved office email]
[approved complete business postal address]
```

- Use digits for programme durations, such as **4 weeks**, **4-week**, **4 to 8 weeks** and
  **1 to 3 months**. Preserve the operator’s reviewed wording and other edits; do not add
  personal-biography customisation.
- The two website URLs must be real direct hyperlinks in minimal HTML, with matching
  plain-text content. The preview is temporary; listings on the primary platform are planned.
  Verify the links each time. Never silently replace a URL or imply existing partnerships.
- The user confirmed the decade history and operation of GooCampus UK, GooCampus Australia
  and ALS Course. Those three trust links are on the preview page; retain the brief credibility
  sentence in email. Omit “India's only” and unverified exclusivity/accreditation claims.
- Mention referral fees once, in the conditional sentence above; never invent rates or terms.
- Reuse the approved business signature from private saved text. Inspect actual saved Gmail
  content: the pilot used one clean text signature; an account default had inserted literal HTML.
  Do not assume an image signature is inserted. Avoid duplicates/raw HTML and do not change
  account-wide signature or sender display settings as part of ordinary draft preparation.

## Attio Free project tracking

The operator selected Attio Free for project activity tracking on 13 October 2026.
Supabase remains the research/prospect store; its legacy activity rows remain historical.
Do not activate the pending preparation-slot migration or mutate legacy activity rows just
to log an Attio group. Do not create a second sender or duplicate live activity histories.

Use the authenticated **GooCampus** workspace and **Clinical provider outreach** list.
Companies represent providers; People hold the selected published contacts and link to the
provider. Standard objects, notes and two Company attributes are enough:

- `goocampus_outreach_stage`: Awaiting review, Changes requested, Content approved,
  Schedule approved, Scheduled, Sent, Interested, Not interested, Meeting booked,
  Partnered, Do not contact or Send failed.
- `goocampus_content_approved`: approval of the exact recipient and content only.
  It never approves a send time, immediate send or follow-up.

Read current attributes/options and discover current native capabilities before writes. Use
native tools for records, notes and list entries when exposed; list-entry creation was available
in the 15 October session. Use signed-in default-browser controls only for required operations
that the current supported tools cannot perform, within the requested scope.
Match existing Companies by the sourced domain and People by email; preserve unrelated data.
Persist IDs and exact versions privately. After uncertain mutations, reconcile before retrying.

Attach full recipient/subject/body versions, Gmail draft/message references, review evidence,
source/caution notes and approval scope as record notes. Use labelled Markdown links for source
URLs in Markdown notes, especially URLs containing underscores; verify the saved literal
reference so formatting cannot turn underscores into emphasis markers. Subsequent notes preserve history;
never treat an old note or checkbox as approval of a changed version. The operator’s private
review Page has the full drafts, checkboxes and comments; read current edits and approval
scope before updating Gmail or Attio. Record checkbox actors when exposed; otherwise tie
the owner-only Page state to the operator’s explicit instruction rather than guessing an actor. Its identity and record/draft mappings are private in
`data/outreach/attio-import-2026-10-13.json`. An explicit current instruction to apply digit
formatting is limited to that formatting, not authority to rewrite the pitch or send.

### Project-only correspondence

Whole-mailbox Gmail sync is removed. Attio syncs all undeleted Gmail mail and has no
project-label allowlist; privacy visibility and blocklists do not meet this project-only goal.
Never reconnect the office mailbox/calendar, set broad forwarding, or launch monitoring to
check project replies. Existing nonproject People/Companies created by the former sync remain;
this is not permission to delete them. Free remains the selected plan even if temporary trial
benefits are visible. Do not upgrade or use trial-only functionality.

During explicit requested checks, search Gmail only for project participants/thread references,
then record observed sent/reply evidence in Attio notes/stage/tasks. Gmail's **SENT** label and
actual message details are the sending source of truth. Attio was observed exposing future
`sent_at` values for Gmail Scheduled messages; email presence or that timestamp is not proof
of Sent, delivery or inbox placement. Preserve Scheduled separately from Sent.

The separate Attio forwarding inbox can receive selectively BCC'd outbound project mail or
forwarded project replies on all plans. This is an optional capture method, not enabled here.
BCC changes recipient disclosure and the approved draft version; forwarding sends a message.
Both need explicit applicable authority, and neither is allowed under a no-send hold. Do not
add its address to approved drafts silently. Project correspondence already copied from the
removed sync is preserved as project notes and Gmail references, rather than claiming native
Email-tab copies still exist. Leave unrelated Gmail mail and calendars untouched.

## Session procedure

1. **Qualify and reconcile.** Check current exclusions, programme cautions, eligibility,
   published non-guessed recipient/source and contact role. Check Gmail and CRM for duplicates,
   prior messages, replies, bounces and opt-outs. A decline stops contact; a redirected recipient
   needs new review. Do not reset an existing scheduling reservation or repeat an uncertain send.
2. **Save drafts first.** Select only the requested providers in Attio.
   Create or update their Gmail drafts and matching provider/contact records and draft notes;
   leave them unscheduled until exact approval. Prefer native Gmail tools for search/read/draft edits.
   Find current message IDs via stable draft IDs before updates; save returned replacement IDs.
   Read back recipient/subject, both MIME alternatives, links, signature and attachments.
   Preserve versions and check for human edits before replacing anything.
3. **Review exact saved versions.** Recheck provider facts against source pages and applicable
   outreach requirements. Record G1–G10 evidence and the rubric below privately against the
   exact persisted draft JSON. A draft-stage G10 remains pending until exact-time approval or an
   applicable approved schedule plan; record the scope accurately and never present draft-stage
   evidence as final sending approval. All ten gates
   must pass and score must be at least 90 before scheduling approval. Unknown is not pass; a score is a
   writing assessment, not a delivery probability. Re-review edits.
4. **Propose times.** For ordinary schedules, use a sourced programme/contact location and IANA
   timezone, not country alone. Prefer recipient-local weekday 09:00–11:00, checking holidays
   and DST for the actual date. Show local date/time/zone, UTC instant and the user's local time
   (IST in this workflow). Send separately with **at least 30 minutes between consecutive UTC
   instants**, including across timezones. Attio mass-send spacing is not this workflow's policy;
   use native Gmail scheduling.

   **Historical campaign plan, subject to later holds/revisions.** The original UK schedule below
   was cancelled/held on 20 October and revised under UK-REV-1; see current project status and
   private evidence. It is not authority to restore the old queue or add recipients.

   **Approved campaign ramp (starting 16 October 2026 IST).** Maheen explicitly approved
   changing the schedule for the 60 already-scheduled emails and 20 reviewed UK drafts under
   this plan. Count all project emails together by IST calendar day, including existing messages
   and any follow-up that receives separate approval. This instruction authorizes no new leads
   or follow-ups. For this campaign only, it waives the recipient-local weekday and morning
   preference and permits scheduling at any hour, including weekends. Asia/Kolkata (IST) anchors
   the ramp dates and selected instants; verify the timezone displayed by Gmail's picker. This
   bounded schedule delegates selection of exact instants within its limits; compute and record
   each one without requesting redundant time approval. Review observed delivery results before
   each stage increase, and pause escalation for delivery errors, account warnings or complaints.

   | Stage | Dates in IST | Daily volume |
   |---|---|---:|
   | 1 | 16–19 October 2026 | 15 |
   | 2 | 20–23 October 2026 | 20 |
   | 3 | 24–28 October 2026 | 30 |
   | 4 | 29 October–2 November 2026 | 40 |
   | 5 | 3 November 2026 onward | 48 |

   For the 80 messages covered now, schedule the 60 existing messages at 15/day on 16–19 October
   and the 20 reviewed UK drafts on 20 October at 20/day. The first day is a partial window from
   13:00–23:30 IST at 45-minute intervals; full 15-message days use 96-minute intervals and the
   20-message day uses 72-minute intervals. Every pair must still meet the 30-minute global
   minimum. The ramp is a rate plan, not authorization to add recipients; future scope and any
   follow-up need their own approval.

   For ordinary schedules, save sourced timezone metadata before finalising; this invalidates
   any earlier CRM review. For the current ramp, record Asia/Kolkata (IST) and the timezone
   displayed in Gmail's picker.
   Before scheduling, verify exact recipient/content approval and either the exact approved time
   or an applicable approved schedule plan that delegates time selection.
5. **Check sender readiness.** Verify current SPF, DKIM and DMARC with public DNS and relevant
   received-message authentication evidence. Check the actual sender account and signature.
   Failed or unknown checks block scheduling; Gmail access or an old self-test proves neither
   authentication nor inbox placement. Diagnose failures and preserve the approved timeline.
   Domain-wide DNS/admin repairs need explicit scoped authorization; they are not routine
   template changes. Do not send an extra test message without authorization.
6. **Record approval and reserve.** Revalidate the current Gmail draft and Attio note version,
   all gates, sender readiness and exact human content/recipient approval plus either exact-time
   approval or an applicable bounded schedule plan. Set Schedule approved only for that version
   and create a scheduling-reservation note with operator/chat, exact approved draft/hash, sourced
   zone and computed UTC instant. Attio fields/notes do not provide
   an atomic scheduling lock: use one active operator/session per provider, inspect current
   records/notes for another reservation, and coordinate any active owner before acting.
   A content-approved checkbox alone is never a scheduling reservation or time approval.
7. **Schedule natively in Gmail.** Gmail's API/connector has no schedule-send endpoint. Use
   Chrome's signed-in office Gmail and **More send options → Schedule send → Pick date & time**.
   Check the timezone displayed by that dialog; enter the correctly converted approved instant.
   For the current campaign, the approved schedule is anchored to Asia/Kolkata (IST), so convert
   if the dialog shows another timezone. Never click immediate Send. Check the fields
   before submission, then open the scheduled message's details and verify full date/time,
   recipient, subject, body/signature and direct links. A toast or tracker status alone is insufficient.
8. **Reconcile immediately.** Set Attio Scheduled only after observed Gmail proof, with the exact
   approved draft/hash, approved UTC instant, Gmail reference and evidence in a record note.
   Read back the persisted stage/note/reference. Reconcile each email before proceeding;
   on uncertain responses, inspect Gmail/CRM history before retrying. Never create duplicate external effects.
9. **Close with evidence.** Verify one scheduled entry per approved recipient, all instants and
   minimum 30-minute gaps, CRM counts/references and preservation of unrelated drafts/demo records.
   Save private screenshots and source/review/approval evidence, update private latest metadata
   and dated public aggregate status. Report Scheduled separately from Sent; leave a user-facing
   Gmail/CRM view available. Do not create a watcher or follow-up automation.

Draft preparation is complete when matching Gmail/CRM copies are saved and explicitly
unscheduled. Scheduling is complete only when every requested schedule is observed in Gmail
and reconciled to the exact CRM version/time/reference; otherwise report the remaining item
and concrete blocker. No source/runtime change is required to execute this workflow.

## Mandatory rules for every email

Mark each rule `pass`, `fail` or `unknown` with evidence. Failure or unknown blocks approval
regardless of score. Source/routing notes stay in the private review, not the email.

| ID | Rule and observable pass condition |
|---|---|
| G1 | Eligible recipient: provider passes existing outreach rules, is not excluded or suppressed, and the selected address satisfies `bulk-send`. Record the address source and contact rationale. Initially contact only 1 person/inbox per provider. |
| G2 | Supported facts: every provider/programme claim has a recorded source URL and has been checked against that source. Unknown facts are omitted. Do not invent eligibility, prices, availability, partnership, familiarity, outcomes or commercial terms. |
| G3 | Plain language: direct, ordinary wording; no ambiguity, poetic language, elaborate metaphors, exaggerated praise, jargon or misleading subject. State who we are, why this provider is relevant, what we propose and the requested next step clearly. |
| G4 | No personal-detail personalization: use programme/institution facts, not the person's biography, achievements, interests, background or other personal information, even if scraped. Use a simple name or role greeting only; do not discuss personal details. Contact-role evidence stays in the internal routing record. |
| G5 | Clear offer: briefly explain the GooCampusWorld programme-listing/referral proposal, with 1 low-effort next step. Do not promise that a listing is free or imply an existing agreement without confirmed authority. |
| G6 | Referral fee is secondary: mention it briefly, in at most 1 short sentence after the main proposal, never in the subject or opening hook. Use approved commercial wording; do not invent a rate, payment obligation or agreement. Until terms are approved, frame it only as a topic to discuss. |
| G7 | Routing request: explicitly ask for help reaching the appropriate person if this is not the recipient's responsibility. This should fit the same next step, not add competing requests. |
| G8 | Simple presentation: accurate subject, ordinary formatting, no raw HTML signature, tracking pixels, shortened/tracked links, attachments or elaborate marketing layout in the first email. Any website link is direct and relevant. |
| G9 | Identity and decline: clear sender name and GooCampus affiliation, approved business signature and postal address, and an easy reply-based way to decline further contact. Honor declines immediately and check applicable outreach requirements before sending. |
| G10 | Human control: saved, versioned Gmail draft; no duplicate or unapproved send/schedule; Maheen's approval is tied to the exact content/recipient and either an exact send time or an explicitly approved bounded schedule plan. Record the verified timezone, selected instant and timeline before scheduling. |


## Quality score (rubric v1)

Award 0, half or full points per dimension with a concrete reason/excerpt. Full requires
all listed conditions. Aim for 100–150 body words excluding greeting/signature; required
identity/decline disclosures take priority. Do not silently lower the 90/100 threshold.

| Dimension | Max | Conditions for full points |
|---|---:|---|
| Clarity | 20 | Simple, direct sentences; every statement has an unambiguous meaning; no poetic or inflated wording. |
| Provider relevance | 20 | 1 verified programme/institution detail explains why this provider fits the proposal, without personal details. |
| Offer and next step | 20 | Sender, listing/referral purpose and provider benefit are clear; 1 easy next step without pressure or unsupported promises. |
| Routing | 10 | Explicit, polite request to point us to the correct person if needed. |
| Referral fee balance | 10 | 1 brief, approved sentence; the listing/programme proposal remains the focus. |
| Brevity | 10 | Aim for 100–150 body words excluding greeting/signature; no repetition or unnecessary background. Required disclosures take priority over the word target. |
| Subject and presentation | 10 | Accurate, short subject; readable plain formatting; clean, identifiable signature and direct relevant links only. |
| **Total** | **100** | **All mandatory gates must also pass.** |

Store privately: complete draft/version and Gmail identity; address rationale/source;
claim/source/check date; G1–G10 and dimension evidence/score; reviewer/check timestamp;
exact human approval; sourced timezone/local date-time/UTC instant; Gmail schedule proof
and CRM version/reference; observed sent/reply evidence and last checked time. The draft/hash
referenced in Attio approval, reservation and schedule notes must match the current Gmail
version, not a reconstructed subset. Legacy RPC payloads remain documented in the runbook.

## Activity, replies and follow-ups

Attio is the current activity tracker. Research totals remain separate; the legacy hosted
Outreach screen is not a live Gmail scan and retains the original pilot history. Legacy runner
mechanics remain documented for that history in the pipeline runbook; do not copy ad hoc
commands or credentials from earlier sessions. Research production calls still use clean
current canonical main and the declared runner.

Current Attio path: Awaiting review → Content approved → Schedule approved → Scheduled.
The reservation is an explicit note, not an atomic backend lock. Sent and Send failed require
observed Gmail evidence. Editing invalidates the affected approval; scheduled content cannot
be edited until cancellation is verified in Gmail. Never cancel existing schedules to import
a new review group or free a preparation slot.

Only check inbox/delivery during requested sessions. Classify observed replies as positive,
negative, neutral/needs clarification, redirect, automatic or unclear; keep no-reply, bounce
and opt-out distinct. Scheduled is not Sent; Sent is not proof of inbox delivery. Silence
is not a negative reply. Update last-checked time and human-reviewed next action.

At most one follow-up after roughly 7–10 recipient business days without a reply, requiring
separate draft and exact recipient/content/time approval; include any approved follow-up in the
project-wide daily ramp count. No automatic follow-up or unsupervised campaign ramp. For the
current explicitly approved ramp above, review observed delivery results before each stage
increase and pause new sends on delivery errors, account warnings or complaints. Any future
campaign ramp needs explicit authorization.

`demo-self.invalid` is a separate explicitly authorised self-only test. It consumes no real
pilot slot; synthetic review evidence never qualifies a provider or grants real-send approval.
Do not repeat the demo as a prerequisite for every group or alter it during real outreach.

## Current saved state and repair reference

As of the 12 October 2026 completed session, five pilot emails are Scheduled for the approved
13 October times, CRM version 10; no real-provider Sent event was observed. These are dated
facts, not live status. Inspect Gmail/CRM on resume; do not resend. See project status and
private pilot metadata for the exact saved identities, timeline, evidence and archives.

The completed repair restored the existing Google Workspace public key at
`google._domainkey.goocampus.in` in GoDaddy (saved TTL 3600). Google Admin was already signing
with that selector, so no rotation or start/stop change was needed. Both authoritative servers
matched the one exact TXT value. Cryptographic verification of an existing received office-domain
message against that restored key passed; no extra test email was sent. For a future repair,
verify current failure/authority first and obtain scoped authorization. The provider may clamp
TTL: record saved DNS values rather than the form's initial defaults. Never assume past
success proves today's authentication, and do not change SPF/DMARC/MX/nameservers in a DKIM-only repair.
