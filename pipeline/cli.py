"""Command line entry point: `outreach <command>`.

Discovery, field extraction and LinkedIn lookup are done by Claude Code (see
.claude/skills/research-providers/SKILL.md); these commands do the deterministic, paid and
database work around them.
"""

import argparse
import csv
import json
import os
import secrets
import sys
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

import httpx

from . import dashboard
from . import emails as email_lib
from . import targeting
from .config import DATA_DIR, ConfigError, load_settings, require
from .firecrawl import Firecrawl
from .load import InvalidFile, load_discovery, load_exclusions, load_extraction, read_json, validate
from .pages import content_hash, domain_of, page_pick_record, pick_urls, same_site, site_root, storage_path
from .screen import excluded, scrape_block, screen_failures
from .supa import Supabase

BUCKET = "raw-pages"
# Per-organization failures that should not stop a batch (httpx errors, bad JSON, missing keys).
NETWORK_ERRORS = (RuntimeError, httpx.HTTPError, ValueError, KeyError)


def now() -> str:
    return datetime.now(UTC).isoformat()


def batch_orgs(db: Supabase, batch: str, domain: str | None = None) -> list[dict]:
    params = {"batch": f"eq.{batch}", "select": "*", "order": "domain"}
    if domain:
        params["domain"] = f"eq.{domain}"
    return db.select("organizations", params)


def start_run(db: Supabase, batch: str, step: str) -> str:
    return db.insert("pipeline_runs", {"batch": batch, "step": step})["id"]


def finish_run(db: Supabase, run_id: str, **values) -> None:
    db.update("pipeline_runs", {"id": run_id}, {"finished_at": now(), **values})


def cmd_discover(db: Supabase, args) -> None:
    outcome = load_discovery(db, read_json(Path(args.file)), args.batch, load_exclusions())
    for key in ("excluded", "failed"):
        for entry in outcome[key]:
            print(f"skip {entry}: {key}")
    print(f"added {len(outcome['added'])} new organizations to batch {args.batch}; "
          f"re-screened {len(outcome['rescreened'])}, excluded {len(outcome['excluded'])}, "
          f"failed the screen {len(outcome['failed'])}")


def load_extra_pages(batch: str) -> dict[str, list[tuple[str, str]]]:
    """Pages Claude found by targeted search (e.g. staff or residency leadership pages), per domain."""
    path = DATA_DIR / "extra-pages" / f"{batch}.json"
    if not path.exists():
        return {}
    document = read_json(path)
    validate(document, "extra-pages.schema.json")
    extras: dict[str, list[tuple[str, str]]] = {}
    for item in document:
        extras.setdefault(item["domain"].lower(), []).append((item["url"], item["kind"]))
    return extras


def merge_details(db: Supabase, org_id: str, key: str, value: dict) -> None:
    """Set one key of organizations.details. Re-reads details first so keys written since the batch
    was listed (screen, source_kind, extraction facts) are kept."""
    current = db.select("organizations", {"id": f"eq.{org_id}", "select": "details"})[0]["details"] or {}
    db.update("organizations", {"id": org_id}, {"details": {**current, key: {**value, "recorded_at": now()}}})


def record_page_pick(db: Supabase, org_id: str, record: dict) -> None:
    """Evidence for tuning the page limit."""
    merge_details(db, org_id, "page_pick", record)


def cmd_scrape(db: Supabase, args, settings) -> None:
    firecrawl = Firecrawl(require(settings.firecrawl_api_key, "FIRECRAWL_API_KEY"))
    extras = load_extra_pages(args.batch)
    exclusions = load_exclusions()
    run_id = start_run(db, args.batch, "scrape")
    credits, processed, errors = 0, 0, []
    try:
        for org in batch_orgs(db, args.batch, args.domain):
            block = scrape_block(org, exclusions)
            if block:
                print(f"skip {org['domain']}: {block}")
                continue
            extra = extras.get(org["domain"], [])
            mapped = not org["scraped_at"] or args.refresh
            if not mapped and not extra:
                print(f"skip {org['domain']}: already scraped (set OUTREACH_REFRESH=1 to re-scrape)")
                continue
            # A partially scraped org (earlier failure) resumes: cached URLs are not paid for again.
            known = {page["url"]: page for page in db.select(
                "pages", {"org_id": f"eq.{org['id']}", "select": "url,content_hash,storage_path,page_kind"})}
            cache_dir = DATA_DIR / "pages" / org["domain"]
            cache_dir.mkdir(parents=True, exist_ok=True)
            index_path = cache_dir / "index.json"
            # Extra pages extend the existing index; a full (re-)scrape rebuilds it.
            index = [] if mapped or not index_path.exists() else json.loads(index_path.read_text())["pages"]
            try:
                targets: list[tuple[str, str]] = []
                if mapped:
                    # Map from the site root: mapping a deep program URL only returns pages below it.
                    links = firecrawl.map(site_root(org["website"]))
                    credits += 1
                    targets = pick_urls(org["website"], links, args.pages, org["provider_type"])
                    record_page_pick(db, org["id"], page_pick_record(org["website"], links, targets, args.pages))
                targets += [(url, kind) for url, kind in extra if url not in {t for t, _ in targets}]
                for url, kind in targets:
                    if any(entry["url"] == url for entry in index):
                        continue
                    path = storage_path(org["domain"], url)
                    local = DATA_DIR / "pages" / path
                    if url in known and local.exists() and not args.refresh:
                        index.append({"url": url, "kind": kind, "file": local.name})
                        continue
                    markdown, metadata = firecrawl.scrape_markdown(url)
                    credits += 1
                    status = metadata.get("statusCode")
                    if isinstance(status, int) and status >= 400:
                        print(f"  skip {url}: HTTP {status}")
                        continue
                    local.write_text(markdown)
                    index.append({"url": url, "kind": kind, "file": local.name, "title": metadata.get("title")})
                    digest = content_hash(markdown)
                    if known.get(url, {}).get("content_hash") == digest:
                        continue
                    db.upload_text(BUCKET, path, markdown)
                    db.upsert("pages", {"org_id": org["id"], "url": url, "page_kind": kind, "storage_path": path,
                                        "content_hash": digest, "credits_used": 1, "scraped_at": now()},
                              on_conflict="url")
                db.update("organizations", {"id": org["id"]}, {"scraped_at": now()})
                processed += 1
                print(f"scraped {org['domain']}: {len(index)} pages")
            except NETWORK_ERRORS as error:
                errors.append({"domain": org["domain"], "error": str(error)[:300]})
                print(f"error {org['domain']}: {error}", file=sys.stderr)
            index_path.write_text(json.dumps({"org": {key: org[key] for key in (
                "name", "domain", "website", "provider_type")}, "pages": index}, indent=2))
    finally:
        finish_run(db, run_id, orgs_processed=processed, firecrawl_credits=credits, errors=errors)
        print(f"firecrawl credits used: {credits}")


def cmd_load(db: Supabase, args) -> None:
    failed = 0
    for name in args.files:
        try:
            counts = load_extraction(db, read_json(Path(name)))
            print(f"loaded {name}: {dict(counts)}")
        except InvalidFile as error:
            failed += 1
            print(f"invalid {name}:\n{error}", file=sys.stderr)
    if failed:
        sys.exit(1)


def guess_domain(org: dict, named: list[tuple[str, str]], all_emails: list[dict]) -> str:
    """Email domain for guesses: most common among named published emails, else any published, else site."""
    domains = Counter(address.split("@")[1] for _, address in named)
    if not domains:
        domains = Counter(row["address"].split("@")[1] for row in all_emails if row["kind"] != "pattern_guess")
    return domains.most_common(1)[0][0] if domains else org["domain"]


def cmd_emails(db: Supabase, args, settings) -> None:
    reoon = email_lib.Reoon(require(settings.reoon_api_key, "REOON_API_KEY"))
    run_id = start_run(db, args.batch, "emails")
    processed, errors = 0, []
    try:
        for org in batch_orgs(db, args.batch, args.domain):
            try:
                resolve_org_emails(db, org, reoon)
                processed += 1
            except NETWORK_ERRORS as error:
                errors.append({"domain": org["domain"], "error": str(error)[:300]})
                print(f"error {org['domain']}: {error}", file=sys.stderr)
    finally:
        finish_run(db, run_id, orgs_processed=processed, reoon_checks=reoon.checks, errors=errors)
        print(f"reoon checks used: {reoon.checks}")


def resolve_org_emails(db: Supabase, org: dict, reoon: email_lib.Reoon) -> None:
    rows = db.select("emails", {"org_id": f"eq.{org['id']}", "select": "*"})
    people = db.select("people", {"org_id": f"eq.{org['id']}",
                                  "select": "id,full_name,is_outreach_target,email_resolved_at"})
    names = {person["id"]: person["full_name"] for person in people}

    for row in rows:
        if row["status"] == "unchecked":
            provider_status = reoon.verify(row["address"])
            status = email_lib.classify_reoon(provider_status)
            row["status"] = status
            db.update("emails", {"id": row["id"]}, {
                "status": status, "provider_status": provider_status, "checked_at": now(),
                "confidence": email_lib.confidence(row["kind"], status, pattern_inferred=False)})

    named = [(names[row["person_id"]], row["address"]) for row in rows
             if row["person_id"] in names and row["kind"] == "published" and row["status"] != "invalid"]
    pattern = email_lib.infer_pattern(named)
    domain = guess_domain(org, named, rows)
    has_email = {row["person_id"] for row in rows if row["person_id"] and row["status"] != "invalid"}
    for person in people:
        # email_resolved_at marks a finished attempt, so people with no deliverable guess are not re-paid for.
        if not person["is_outreach_target"] or person["id"] in has_email or person["email_resolved_at"]:
            continue
        best = email_lib.resolve_person(person["full_name"], domain, pattern, reoon)
        if best:
            db.upsert("emails", {**best, "org_id": org["id"], "person_id": person["id"], "checked_at": now()},
                      on_conflict="address")
        db.update("people", {"id": person["id"]}, {"email_resolved_at": now()})
        print(f"{org['domain']} / {person['full_name']}: "
              f"{best['address'] + ' (' + best['confidence'] + ')' if best else 'no deliverable guess'}")


def email_domain_of(org: dict, emails: list[dict]) -> str:
    """Domain the provider's mail lives on: most common among non-guessed emails, else its website domain."""
    domains = Counter(row["address"].rpartition("@")[2].lower() for row in emails
                      if row["kind"] != "pattern_guess" and "@" in row["address"])
    return domains.most_common(1)[0][0] if domains else org["domain"]


def probe_domain(domain: str, reoon: email_lib.Reoon) -> dict:
    """One check of a made-up address: a server that accepts it accepts every address (catch-all),
    so emails there can at best be "likely"."""
    status = email_lib.classify_reoon(reoon.verify(f"no-such-person-{secrets.token_hex(4)}@{domain}"))
    catch_all = {"valid": True, "catch_all": True, "invalid": False}.get(status)  # unknown: undecided
    return {"catch_all": catch_all, "probe_status": status}


def cmd_email_domain(db: Supabase, args, settings) -> None:
    """Record per provider whether its email domain can be verified and whether it differs from the website."""
    reoon = email_lib.Reoon(require(settings.reoon_api_key, "REOON_API_KEY"))
    run_id = start_run(db, args.batch, "email_domain")
    orgs = batch_orgs(db, args.batch, args.domain)
    # Decided domains are reused (also across orgs sharing a domain); undecided ones are retried.
    known = {} if args.refresh else {
        record["domain"]: {"catch_all": record["catch_all"], "probe_status": record.get("probe_status")}
        for record in ((org.get("details") or {}).get("email_domain") for org in orgs)
        if record and record.get("catch_all") is not None}
    processed, errors, probed, failed = 0, [], dict(known), set()
    try:
        for org in orgs:
            previous = (org.get("details") or {}).get("email_domain") or {}
            if previous.get("catch_all") is not None and not args.refresh:
                continue
            try:
                emails = db.select("emails", {"org_id": f"eq.{org['id']}", "select": "address,kind,status"})
                domain = email_domain_of(org, [row for row in emails if row["status"] != "invalid"])
                if domain in failed:
                    continue  # this run's probe of the domain already failed; don't pay again
                if domain not in probed:
                    try:
                        probed[domain] = probe_domain(domain, reoon)
                    except NETWORK_ERRORS:
                        failed.add(domain)
                        raise
                website = domain_of(org["website"])
                # Mail on the website's parent or a subdomain of it (griffinhealth.org for meded.griffinhealth.org)
                # is the same organisation; only an unrelated domain counts as different.
                record = {"domain": domain, "differs_from_website": not (same_site(domain, website) or same_site(website, domain)),
                          **probed[domain]}
                merge_details(db, org["id"], "email_domain", record)
                processed += 1
                print(f"{org['domain']}: {domain} catch_all={record['catch_all']} "
                      f"differs_from_website={record['differs_from_website']}")
            except NETWORK_ERRORS as error:
                errors.append({"domain": org["domain"], "error": str(error)[:300]})
                print(f"error {org['domain']}: {error}", file=sys.stderr)
    finally:
        finish_run(db, run_id, orgs_processed=processed, reoon_checks=reoon.checks, errors=errors)
        print(f"reoon checks used: {reoon.checks}")


SHORTLIST_COLUMNS = ["rank", "ready", "organization", "domain", "score", "why", "missing", "contact", "title", "email",
                     "email_check", "priority"]


def cmd_shortlist(db: Supabase, args) -> None:
    """Rank the batch under each targeting profile (or only --profile). Read-only: changes nothing in the database."""
    names = [args.profile] if args.profile else targeting.profile_names()
    profiles = {name: targeting.load_profile(name) for name in names}
    partners = dashboard.local_partnerships(args.batch)
    partners = {} if partners is None else partners["providers"]
    exclusions = load_exclusions()
    leads, screen_blocks = [], {}
    for org in batch_orgs(db, args.batch):
        screen = (org.get("details") or {}).get("screen")
        screen_blocks[org["domain"]] = screen_failures(screen) if screen else []
        org_id = f"eq.{org['id']}"
        people = db.select("people", {"org_id": org_id, "select": "id,full_name,title"})
        emails = db.select("emails", {"org_id": org_id, "select": "address,kind,status,person_id"})
        leads.append(targeting.from_db(org, people, emails, partners.get(org["domain"])))
    for name, profile in profiles.items():
        results = [targeting.apply_exclusion(
            targeting.apply_exclusion(targeting.evaluate(lead, profile), excluded(lead.domain, exclusions)),
            targeting.screen_block(screen_blocks[lead.domain]), label="not viable") for lead in leads]
        write_shortlist(args.batch, name, profile, targeting.rank(results))


def write_shortlist(batch: str, name: str, profile: dict, ranked: list[dict]) -> None:
    out = DATA_DIR / "reports" / f"{batch}-shortlist-{name}.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=SHORTLIST_COLUMNS)
        writer.writeheader()
        for position, result in enumerate(ranked, 1):
            contact = result["best_contact"] or {}
            writer.writerow({"rank": position, "ready": "yes" if result["ready"] else "", "organization": result["name"],
                             "domain": result["domain"], "score": result["score"], "why": "; ".join(result["reasons"]),
                             "missing": "; ".join(result["missing"] + result["excluded"]), "contact": contact.get("name"),
                             "title": contact.get("title"), "email": contact.get("email"),
                             "email_check": contact.get("check"), "priority": result["priority"]})
    ready = [r for r in ranked if r["ready"] and not r["excluded"]]
    print(f"profile {name} ({profile['name']}): {len(ready)} of {len(ranked)} providers ready to email")
    for position, result in enumerate(ready, 1):
        contact = result["best_contact"] or {}
        print(f"{position}. {result['name']}: {contact.get('name') or contact.get('email')} "
              f"({contact.get('check')}), score {result['score']}")
    print(f"shortlist csv: {out}")


REPORT_COLUMNS = ["organization", "provider_type", "country", "region", "priority_score", "pitch_angle", "full_name",
                  "title", "role_tier", "email", "email_confidence", "email_kind", "linkedin_url", "website"]


def yield_lines(records: list[dict]) -> list[str]:
    """Pages read per send-ready lead, by discovery source and provider type, best first.

    A send-ready lead is an org with a named outreach target whose email has high confidence.
    """
    groups: dict[tuple[str, str], Counter] = {}
    for record in records:
        group = groups.setdefault((record["source_kind"], record["provider_type"]), Counter())
        group["orgs"] += 1
        group["pages"] += record["pages"]
        group["send_ready"] += record["send_ready"]
        group["verified_personal"] += record.get("verified_personal", False)
    lines = []
    for (source, kind), group in sorted(groups.items(), key=lambda item: (
            -(item[1]["send_ready"] / item[1]["orgs"]), item[0])):
        per_lead = f"{group['pages'] / group['send_ready']:.1f}" if group["send_ready"] else "n/a"
        lines.append(f"yield {source} / {kind}: {group['orgs']} orgs, {group['send_ready']} send-ready, "
                     f"{group['verified_personal']} with a verified personal email, "
                     f"{group['pages']} pages, {per_lead} pages per send-ready lead")
    return lines


def page_limit_line(orgs: list[dict]) -> str:
    """How often the page limit left matching pages unread, from each org's last full scrape."""
    records = [(org.get("details") or {}).get("page_pick") for org in orgs]
    recorded = [record for record in records if record]
    capped = [record for record in recorded if record["unread"]]
    limits = sorted({record["limit"] for record in recorded})
    return (f"page limit {'/'.join(map(str, limits)) or 'n/a'}: {len(capped)} of {len(recorded)} providers had more "
            f"matching pages than the limit ({sum(r['unread'] for r in capped)} pages left unread); "
            f"{sum(r['read'] < r['limit'] for r in recorded)} ran out of matching pages first (pages planned, before fetch errors); "
            f"{len(records) - len(recorded)} not recorded")


def status_line(label: str, programs: list[dict], field: str) -> str:
    counts = Counter(program.get(field) or "unclassified" for program in programs)
    return f"{label}: " + ", ".join(f"{key} {value}" for key, value in counts.most_common())


def cmd_report(db: Supabase, args) -> None:
    orgs = batch_orgs(db, args.batch)
    stats = Counter(orgs=len(orgs))
    rows_out, records, all_programs = [], [], []
    for org in orgs:
        org_id = f"eq.{org['id']}"
        programs = db.select("programs", {"org_id": org_id, "select": "id,fee_status,window_status"})
        all_programs += programs
        people = db.select("people", {"org_id": org_id, "select": "*"})
        emails = [row for row in db.select("emails", {"org_id": org_id, "select": "*"}) if row["status"] != "invalid"]
        stats["with_full_address"] += all(org.get(key) for key in ("street", "city", "region", "postal_code"))
        stats["with_program"] += bool(programs)
        stats["with_named_target"] += any(p["is_outreach_target"] and p["role_tier"] != "other" for p in people)
        stats["with_any_inbox"] += bool(emails or org.get("general_inbox"))
        for row in emails:
            stats[f"email_{row['confidence'] or 'none'}"] += 1
        by_person = {row["person_id"]: row for row in emails if row["person_id"]}
        records.append({
            "source_kind": (org.get("details") or {}).get("source_kind", "unrecorded"),
            "provider_type": org["provider_type"],
            "pages": len(db.select("pages", {"org_id": org_id, "select": "id"})),
            "send_ready": any(p["is_outreach_target"] and p["role_tier"] != "other"
                              and by_person.get(p["id"], {}).get("confidence") == "high" for p in people),
            "verified_personal": any(row["person_id"] and row["status"] == "valid" for row in emails),
        })
        for person in people:
            if not person["is_outreach_target"]:
                continue
            email = by_person.get(person["id"], {})
            rows_out.append({"organization": org["name"], "provider_type": org["provider_type"],
                             "country": org["country"], "region": org.get("region"), "priority_score": org.get("priority_score"),
                             "pitch_angle": org.get("pitch_angle"), "full_name": person["full_name"],
                             "title": person.get("title"), "role_tier": person["role_tier"],
                             "email": email.get("address"), "email_confidence": email.get("confidence"),
                             "email_kind": email.get("kind"), "linkedin_url": person.get("linkedin_url"),
                             "website": org["website"]})
    runs = db.select("pipeline_runs", {"batch": f"eq.{args.batch}", "select": "firecrawl_credits,reoon_checks"})
    stats["firecrawl_credits"] = sum(run["firecrawl_credits"] for run in runs)
    stats["reoon_checks"] = sum(run["reoon_checks"] for run in runs)
    out = DATA_DIR / "reports" / f"{args.batch}-targets.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=REPORT_COLUMNS)
        writer.writeheader()
        writer.writerows(rows_out)
    for key, value in stats.items():
        print(f"{key}: {value}")
    for line in yield_lines(records):
        print(line)
    print(page_limit_line(orgs))
    print(status_line("fee status", all_programs, "fee_status"))
    print(status_line("window status", all_programs, "window_status"))
    print(f"targets csv: {out}")


def cmd_publish(db: Supabase, args) -> None:
    """Store every batch's dashboard (or only --batch) and the combined view for the hosted page."""
    for batch, providers, ready in dashboard.publish(db, args.batch):
        print(f"published {batch}: {providers} providers, {ready} ready to email ({dashboard.PROFILE})")


def cmd_viewers(db: Supabase, args) -> None:
    """Sync config/dashboard-viewers.json to the database: who may sign in to the hosted dashboard."""
    result = dashboard.sync_viewers(db, dashboard.load_viewers())
    for key, emails in result.items():
        print(f"{key.replace('_', ' ')}: {', '.join(emails) or 'none'}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="outreach")
    sub = parser.add_subparsers(dest="command", required=True)
    # Defaults come from OUTREACH_* variables so the credential runner can invoke fixed npm scripts.
    batch = {"default": os.environ.get("OUTREACH_BATCH")}
    domain = {"default": os.environ.get("OUTREACH_DOMAIN") or None}
    discover = sub.add_parser("discover", help="upsert discovered providers (default data/discovery/<batch>.json)")
    discover.add_argument("file", nargs="?")
    discover.add_argument("--batch", **batch)
    scrape = sub.add_parser("scrape", help="map + scrape provider sites into the page cache")
    scrape.add_argument("--batch", **batch)
    scrape.add_argument("--domain", **domain)
    scrape.add_argument("--pages", type=int, default=int(os.environ.get("OUTREACH_PAGES") or 8))
    scrape.add_argument("--refresh", action="store_true", default=os.environ.get("OUTREACH_REFRESH") == "1")
    load = sub.add_parser("load", help="load extraction files (default data/extractions/<batch>/*.json)")
    load.add_argument("files", nargs="*")
    load.add_argument("--batch", **batch)
    emails = sub.add_parser("emails", help="verify published emails and resolve target emails")
    emails.add_argument("--batch", **batch)
    emails.add_argument("--domain", **domain)
    report = sub.add_parser("report", help="print batch stats and write the targets CSV")
    report.add_argument("--batch", **batch)
    email_domain = sub.add_parser("email-domain", help="check whether each provider's email domain can be verified")
    email_domain.add_argument("--batch", **batch)
    email_domain.add_argument("--domain", **domain)
    email_domain.add_argument("--refresh", action="store_true", default=os.environ.get("OUTREACH_REFRESH") == "1")
    shortlist = sub.add_parser("shortlist", help="rank the batch under a targeting profile (read-only)")
    shortlist.add_argument("--batch", **batch)
    shortlist.add_argument("--profile", help="one profile from config/targeting/ (default: every profile)")
    publish = sub.add_parser("publish", help="store dashboards for the hosted page (every batch, or only --batch)")
    publish.add_argument("--batch", **batch)
    sub.add_parser("viewers", help="sync config/dashboard-viewers.json: who may sign in to the hosted page")
    args = parser.parse_args(argv)
    if args.command not in ("publish", "viewers") and not args.batch:
        parser.exit(2, "missing batch: pass --batch or set OUTREACH_BATCH\n")
    if args.command == "discover" and not args.file:
        args.file = str(DATA_DIR / "discovery" / f"{args.batch}.json")
    if args.command == "load" and not args.files:
        args.files = sorted(str(path) for path in (DATA_DIR / "extractions" / args.batch).glob("*.json"))
        if not args.files:
            parser.exit(2, f"no extraction files in data/extractions/{args.batch}/\n")

    try:
        settings = load_settings()
    except ConfigError as error:
        parser.exit(2, f"{error}\n")
    db = Supabase(settings.supabase_url, settings.supabase_service_role_key)
    try:
        match args.command:
            case "discover":
                cmd_discover(db, args)
            case "scrape":
                cmd_scrape(db, args, settings)
            case "load":
                cmd_load(db, args)
            case "emails":
                cmd_emails(db, args, settings)
            case "report":
                cmd_report(db, args)
            case "email-domain":
                cmd_email_domain(db, args, settings)
            case "shortlist":
                cmd_shortlist(db, args)
            case "publish":
                cmd_publish(db, args)
            case "viewers":
                cmd_viewers(db, args)
    except (ConfigError, InvalidFile, FileNotFoundError) as error:
        parser.exit(2, f"{error}\n")


if __name__ == "__main__":
    main()
