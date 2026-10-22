"""Targeting profiles: rank providers for outreach without changing what the pipeline collects.

A profile (config/targeting/<name>.json, schema schemas/targeting.schema.json) only ranks:
`require` decides who is ready to email, `prefer` adds points, `exclude` leaves a provider off the
shortlist. Nothing here blocks discovery, scraping or research, so a looser profile can reuse the
same data later without re-collecting anything.
"""

from dataclasses import dataclass, field
from pathlib import Path

from .config import REPO_ROOT

PROFILES = REPO_ROOT / "config" / "targeting"
# Email check result shown to the team, from emails.status.
EMAIL_CHECK = {"valid": "verified", "catch_all": "likely"}
CHECK_RANK = {"verified": 0, "likely": 1, "published": 2, "unconfirmed": 3}


def email_check(status: str | None, kind: str | None = None) -> str:
    """verified / likely / unconfirmed. A guessed address on a server that accepts every address was
    never confirmed by anything, so it stays unconfirmed rather than likely."""
    if status == "catch_all" and kind == "pattern_guess":
        return "unconfirmed"
    return EMAIL_CHECK.get(status or "", "unconfirmed")


@dataclass
class Lead:
    """The facts a profile can use, the same whether they come from Supabase or a dashboard snapshot."""
    domain: str
    name: str
    provider_type: str
    accepts_imgs: bool | None = None
    img_fit: int | None = None
    priority: int | None = None
    source_kind: str | None = None
    do_not_contact: bool = False
    open_to_partnerships: bool = False
    contactable: bool | None = None
    catch_all_domain: bool | None = None
    # Named people with an email: {"name", "title", "email", "check", "kind"}; inboxes: {"email", "check"}.
    contacts: list[dict] = field(default_factory=list)
    inboxes: list[dict] = field(default_factory=list)


def _do_not_contact(caution: str | None) -> bool:
    return (caution or "").startswith("Do not contact")


def from_db(org: dict, people: list[dict], emails: list[dict], partnership: dict | None = None) -> Lead:
    details = org.get("details") or {}
    names = {person["id"]: person for person in people}
    lead = Lead(
        domain=org["domain"], name=org["name"], provider_type=org["provider_type"],
        accepts_imgs=org.get("accepts_imgs"), img_fit=org.get("img_friendliness_score"),
        priority=org.get("priority_score"), source_kind=details.get("source_kind"),
        do_not_contact=_do_not_contact(details.get("outreach_caution")),
        open_to_partnerships=bool((partnership or details.get("partnership") or {}).get("open")),
        contactable=(details.get("screen") or {}).get("contactable"),
        catch_all_domain=(details.get("email_domain") or {}).get("catch_all"))
    for row in emails:
        if row["status"] == "invalid":
            continue
        person = names.get(row.get("person_id"))
        if person:
            lead.contacts.append({"name": person["full_name"], "title": person.get("title"), "email": row["address"],
                                  "check": email_check(row["status"], row["kind"]), "kind": row["kind"]})
        else:
            lead.inboxes.append({"email": row["address"], "check": email_check(row["status"], row["kind"]),
                                 "kind": row["kind"]})
    return lead


def from_snapshot(org: dict) -> Lead:
    """Adapter for the dashboard snapshot (data/reports/<batch>-dashboard-data.json)."""
    titles = {person["name"]: person.get("title") for person in org.get("people", [])}
    lead = Lead(
        domain=org["domain"], name=org["name"], provider_type=org["type"], accepts_imgs=org.get("accepts_imgs"),
        img_fit=org.get("img_score"), priority=org.get("priority"), source_kind=org.get("source_kind"),
        do_not_contact=_do_not_contact(org.get("caution")),
        open_to_partnerships=bool((org.get("partnership") or {}).get("open")),
        contactable=org.get("contactable"), catch_all_domain=org.get("catch_all_domain"))
    for row in org.get("emails", []):
        if row["status"] == "invalid":
            continue
        if row.get("person"):
            lead.contacts.append({"name": row["person"], "title": titles.get(row["person"]), "email": row["address"],
                                  "check": email_check(row["status"], row["kind"]), "kind": row["kind"]})
        else:
            lead.inboxes.append({"email": row["address"], "check": email_check(row["status"], row["kind"]),
                                 "kind": row["kind"]})
    return lead


def _counts_as(contact: dict, allowed: set[str]) -> str | None:
    """The check result under which `contact` is usable, or None. "published" lets an unconfirmed address count
    when the provider printed it on its own site; a guessed one never does."""
    if contact["check"] in allowed:
        return contact["check"]
    if "published" in allowed and contact["check"] == "unconfirmed" and contact.get("kind") != "pattern_guess":
        return "published"
    return None


def screen_block(failures: list[str]) -> str | None:
    """Why a failed screen makes the provider not viable, or None. A screen that merely found no statement that the
    provider takes IMGs passes; profiles that need one check `accepts_imgs` themselves."""
    return "screen failed: " + ", ".join(failures) if failures else None


def profile_names(folder: Path = PROFILES) -> list[str]:
    return sorted(path.stem for path in folder.glob("*.json"))


def load_profile(name: str, folder: Path = PROFILES) -> dict:
    from .load import read_json, validate  # local import: load imports nothing from here

    path = folder / f"{name}.json"
    if not path.exists():
        available = ", ".join(sorted(p.stem for p in folder.glob("*.json"))) or "none"
        raise FileNotFoundError(f"no targeting profile {name!r} (available: {available})")
    profile = read_json(path)
    validate(profile, "targeting.schema.json")
    return profile


def evaluate(lead: Lead, profile: dict) -> dict:
    """Whether the lead is ready to email under `profile`, its score, and why."""
    require, prefer, exclude = (profile.get(key, {}) for key in ("require", "prefer", "exclude"))
    excluded = []
    if exclude.get("do_not_contact") and lead.do_not_contact:
        excluded.append("site forbids outreach")
    if lead.domain in exclude.get("domains", []):
        excluded.append("domain excluded by the profile")
    if exclude.get("refuses_imgs") and lead.accepts_imgs is False:
        excluded.append("does not take international graduates")

    allowed = set(require.get("email_check", ["verified", "likely", "unconfirmed"]))
    pool = lead.contacts if require.get("named_person") else lead.contacts + lead.inboxes
    usable = sorted(({**c, "check": _counts_as(c, allowed)} for c in pool if _counts_as(c, allowed)),
                    key=lambda c: CHECK_RANK[c["check"]])
    best = usable[0] if usable else None

    missing = []
    if require.get("accepts_imgs") and lead.accepts_imgs is not True:
        missing.append("not confirmed to accept IMGs")
    if require.get("named_person") and not lead.contacts:
        missing.append("no named person with an email")
    if not best and (lead.contacts or not require.get("named_person")):
        missing.append(f"no email that is {' or '.join(sorted(allowed, key=CHECK_RANK.get))}")
    if require.get("provider_types") and lead.provider_type not in require["provider_types"]:
        missing.append(f"provider type {lead.provider_type}")
    if require.get("min_img_fit") is not None and (lead.img_fit or 0) < require["min_img_fit"]:
        missing.append(f"IMG fit below {require['min_img_fit']}")

    # Reasons are shown to the outreach team, so they are written in plain words.
    score, reasons = 0, []
    if best:
        score += {"verified": 2, "likely": 1}.get(best["check"], 0)
        owner = "personal" if best.get("name") else "shared inbox"
        reasons.append(f"{best['check']} {owner} email")
    for matched, reason in (
            (lead.provider_type in prefer.get("provider_types", []), f"preferred type ({lead.provider_type.replace('_', ' ')})"),
            (lead.source_kind in prefer.get("sources", []), "found through a preferred source"),
            (prefer.get("open_to_partnerships") and lead.open_to_partnerships, "open to partnerships"),
            (prefer.get("contactable") and lead.contactable, "programme page names a coordinator"),
            (prefer.get("not_catch_all") and lead.catch_all_domain is False, "email domain can be verified"),
            (prefer.get("min_img_fit") is not None and (lead.img_fit or 0) >= prefer["min_img_fit"],
             f"IMG fit {prefer.get('min_img_fit')} or higher")):
        if matched:
            score += 1
            reasons.append(reason)
    return {"domain": lead.domain, "name": lead.name, "ready": not missing and not excluded, "excluded": excluded,
            "missing": missing, "score": score, "reasons": reasons, "best_contact": best, "priority": lead.priority}


def apply_exclusion(result: dict, reason: str | None, label: str = "on the exclusion list") -> dict:
    """Providers on config/exclusions.json (dead, paused, partner-only, outreach forbidden), or whose screen
    failed after a re-check, are never ready."""
    if reason:
        result["excluded"].append(f"{label}: {reason}")
        result["ready"] = False
    return result


def rank(results: list[dict]) -> list[dict]:
    """Ready leads first, then score, then the extraction's priority (1 = best), then name."""
    return sorted(results, key=lambda r: (bool(r["excluded"]), not r["ready"], -r["score"],
                                          r["priority"] if r["priority"] is not None else 9, r["name"]))

