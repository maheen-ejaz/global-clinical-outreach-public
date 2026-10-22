"""Validate discovery/extraction files and write them to Supabase without clobbering existing data."""

import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

from .config import REPO_ROOT
from .pages import domain_of
from .screen import excluded, screen_failures
from .supa import Supabase

SCHEMAS = REPO_ROOT / "schemas"
EXCLUSIONS = REPO_ROOT / "config" / "exclusions.json"


class InvalidFile(ValueError):
    pass


def validate(document: Any, schema_name: str) -> None:
    schema = json.loads((SCHEMAS / schema_name).read_text())
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(document),
                    key=lambda error: list(error.absolute_path))
    if errors:
        lines = [f"{'/'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}" for error in errors[:20]]
        raise InvalidFile("\n".join(lines))


def compact(row: dict[str, Any]) -> dict[str, Any]:
    """Drop unknown values so a later, sparser extraction never erases earlier facts."""
    return {key: value for key, value in row.items() if value is not None and value != [] and value != {}}


def load_exclusions(path: Path = EXCLUSIONS) -> dict[str, str]:
    """Excluded domain -> reason. The file is tracked in git so every batch starts from it."""
    document = read_json(path)
    validate(document, "exclusions.schema.json")
    return {domain_of(item["domain"]): item["reason"] for item in document}


def load_discovery(db: Supabase, document: list[dict], batch: str, exclusions: dict[str, str]) -> dict[str, list[str]]:
    """Insert screened organizations into `batch`.

    Excluded or failed providers are never inserted. An already-known domain keeps its batch and
    source but takes the new screen, so older orgs can be (re-)screened from a discovery file.
    Returns domains per outcome: added, rescreened, excluded, failed.
    """
    validate(document, "discovery.schema.json")
    outcome: dict[str, list[str]] = {"added": [], "rescreened": [], "excluded": [], "failed": []}
    for item in document:
        domain = domain_of(item["website"])
        reason = excluded(domain, exclusions)
        if reason:
            outcome["excluded"].append(f"{domain} ({reason})")
            continue
        failures = screen_failures(item["screen"])
        screen = {"screen": item["screen"], "source_kind": item["source_kind"]}
        found = db.select("organizations", {"domain": f"eq.{domain}", "select": "id,details"})
        if found:
            db.update("organizations", {"id": found[0]["id"]}, {"details": {**found[0]["details"], **screen}})
            outcome["rescreened"].append(f"{domain} (failed: {', '.join(failures)})" if failures else domain)
            continue
        if failures:
            outcome["failed"].append(f"{domain} ({', '.join(failures)})")
            continue
        db.upsert("organizations", {
            "name": item["name"], "website": item["website"], "domain": domain, "country": item["country"],
            "provider_type": item["provider_type"], "discovery_source": item["discovery_source"], "batch": batch,
            "details": screen,
        }, on_conflict="domain")
        outcome["added"].append(domain)
    return outcome


def load_extraction(db: Supabase, document: dict) -> dict[str, int]:
    validate(document, "extraction.schema.json")
    domain = document["domain"].lower()
    found = db.select("organizations", {"domain": f"eq.{domain}", "select": "id,details,field_sources"})
    if not found:
        raise InvalidFile(f"{domain}: organization not discovered yet; run `outreach discover` first")
    org = found[0]
    org_id = org["id"]

    fields = compact(document["organization"])
    fields["details"] = {**org["details"], **fields.get("details", {})}
    fields["field_sources"] = {**org["field_sources"], **fields.get("field_sources", {})}
    fields["researched_at"] = datetime.now(UTC).isoformat()
    db.update("organizations", {"id": org_id}, fields)

    existing_programs = {row["name"]: row["details"] for row in
                         db.select("programs", {"org_id": f"eq.{org_id}", "select": "name,details"})}
    for program in document["programs"]:
        row = {**compact(program), "org_id": org_id}
        row["details"] = {**existing_programs.get(program["name"], {}), **row.get("details", {})}
        db.upsert("programs", row, on_conflict="org_id,name")

    person_ids: dict[str, str] = {}
    for person in document["people"]:
        row = db.upsert("people", {**compact(person), "org_id": org_id}, on_conflict="org_id,full_name")
        person_ids[person["full_name"]] = row["id"]

    for item in document["news"]:
        db.upsert("news_items", {**compact(item), "org_id": org_id}, on_conflict="org_id,url")

    for email in document["emails"]:
        person_id = person_ids.get(email.get("person_name") or "")
        db.upsert("emails", compact({
            "address": email["address"].lower(), "kind": email["kind"], "org_id": org_id,
            "person_id": person_id, "source_url": email["source_url"],
        }), on_conflict="address")

    return Counter(programs=len(document["programs"]), people=len(document["people"]),
                   news=len(document["news"]), emails=len(document["emails"]))


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as error:
        raise InvalidFile(f"{path}: {error}") from error
