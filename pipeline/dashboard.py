"""Dashboard data: one snapshot per batch, built from the database and ranked with the bulk-send profile.

`outreach publish` stores each batch's snapshot (plus 'all', every batch together) in the `dashboards` table, where
the hosted page (web/index.html, outreach.goocampusglobal.com) reads it after sign-in. `scripts/build-dashboard.py`
uses `enrich` for the local single-file dashboards.

Snapshot shape: generated_at, runs[], orgs[] with nested programs, people and emails, then `enrich` adds meta,
partnerships, targeting results and the profile. Batch text (executive summary, labels) and run estimates are
authored locally in data/reports/<batch>-dashboard-meta.json; when that file is absent the published meta is kept.
"""

from datetime import UTC, datetime

from . import targeting
from .config import DATA_DIR, ConfigError
from .load import InvalidFile, load_exclusions, read_json
from .screen import excluded, screen_failures

PROFILE = "bulk-send"
ALL = "all"
EMBED = ("*,programs(name,type,audience,duration,application_fee,program_fee,exam_requirements,visa_types,hands_on,"
         "application_window,apply_url,source_url,fee_status,window_status),"
         "people(id,full_name,credentials,title,role_tier,is_outreach_target,linkedin_url,tenure,source_url),"
         "emails(address,kind,status,confidence,person_id,source_url),pages(count)")


def snapshot_org(org: dict) -> dict:
    """One organization row with embedded programs, people, emails and a page count, in snapshot form."""
    details = org.get("details") or {}
    screen = details.get("screen")
    names = {person["id"]: person["full_name"] for person in org.get("people", [])}
    failures = screen_failures(screen) if screen else []
    return {
        "name": org["name"], "domain": org["domain"], "website": org["website"], "country": org["country"],
        "type": org["provider_type"], "street": org.get("street"), "city": org.get("city"), "region": org.get("region"),
        "postal_code": org.get("postal_code"), "phone": org.get("main_phone"), "accepts_imgs": org.get("accepts_imgs"),
        "img_score": org.get("img_friendliness_score"), "price_band": org.get("price_band"),
        "freshness": org.get("site_freshness"), "pitch": org.get("pitch_angle"), "priority": org.get("priority_score"),
        "img_requirements": org.get("img_requirements"), "caution": details.get("outreach_caution"),
        "note": (screen or {}).get("note"), "source_kind": details.get("source_kind"),
        "contactable": (screen or {}).get("contactable"),
        "catch_all_domain": (details.get("email_domain") or {}).get("catch_all"),
        "partnership": details.get("partnership"),
        "pages": (org.get("pages") or [{"count": 0}])[0]["count"],
        "programs": sorted(org.get("programs", []), key=lambda p: p["name"]),
        "people": [{"name": p["full_name"], "credentials": p.get("credentials"), "title": p.get("title"),
                    "tier": p["role_tier"], "target": p["is_outreach_target"], "linkedin": p.get("linkedin_url"),
                    "tenure": p.get("tenure"), "source_url": p["source_url"]}
                   for p in sorted(org.get("people", []), key=lambda p: (not p["is_outreach_target"], p["full_name"]))],
        "emails": [{"address": e["address"], "kind": e["kind"], "status": e["status"], "confidence": e.get("confidence"),
                    "person": names.get(e.get("person_id")), "source_url": e.get("source_url")}
                   for e in sorted(org.get("emails", []), key=lambda e: e["address"]) if e["status"] != "invalid"],
        "screen_failures": failures, "screen_failed": bool(failures),
    }


def snapshot_run(run: dict) -> dict:
    return {"step": run["step"], "started_at": run["started_at"], "orgs": run["orgs_processed"],
            "firecrawl": run["firecrawl_credits"], "reoon": run["reoon_checks"], "errors": len(run.get("errors") or [])}


# The REST API returns at most 1,000 rows per request by default; a full page means rows may be missing.
MAX_ROWS = 1000


def select_all(db, table: str, params: dict[str, str]) -> list[dict]:
    rows = db.select(table, params)
    if len(rows) >= MAX_ROWS:
        raise RuntimeError(f"{table}: {len(rows)} rows returned, the API limit; add paging before publishing")
    return rows


def fetch(db, batch: str) -> dict:
    """The batch's snapshot straight from the database (service role, read-only)."""
    orgs = select_all(db, "organizations", {"batch": f"eq.{batch}", "select": EMBED, "order": "domain"})
    runs = select_all(db, "pipeline_runs", {"batch": f"eq.{batch}", "select": "*", "order": "started_at"})
    return {"generated_at": datetime.now(UTC).isoformat(), "runs": [snapshot_run(run) for run in runs],
            "orgs": [snapshot_org(org) for org in orgs]}


def local_meta(batch: str) -> dict | None:
    path = DATA_DIR / "reports" / f"{batch}-dashboard-meta.json"
    return read_json(path) if path.exists() else None


def local_partnerships(batch: str) -> dict | None:
    path = DATA_DIR / "reports" / f"{batch}-partnerships.json"
    if not path.exists():
        return None
    document = read_json(path)
    if not isinstance(document, dict):
        raise InvalidFile(f"{path}: expected a partnerships object")
    return document


def apply_run_estimates(data: dict, estimates: dict) -> None:
    """Runs cut off before logging their credits, from meta `run_estimates`: started_at -> {firecrawl, note}.
    Times are compared as instants, so any ISO 8601 spelling of the run's start matches."""
    by_time = {datetime.fromisoformat(key): value for key, value in estimates.items()}
    for run in data["runs"]:
        estimate = by_time.get(datetime.fromisoformat(run["started_at"]))
        if estimate:
            run.update(firecrawl=estimate["firecrawl"], estimated=True, estimate_note=estimate.get("note"))


def enrich(data: dict, meta: dict | None = None, partnerships: dict | None = None,
           exclusions: dict | None = None) -> dict:
    """Add batch text, partnership findings and bulk-send targeting results to a snapshot (in place)."""
    if partnerships:
        for org in data["orgs"]:
            org["partnership"] = partnerships["providers"].get(org["domain"], {"open": False})
        data["partnerships_checked_on"] = partnerships["checked_on"]
    if meta:
        data["meta"] = meta
        apply_run_estimates(data, meta.get("run_estimates") or {})
    profile = targeting.load_profile(PROFILE)
    exclusions = load_exclusions() if exclusions is None else exclusions
    for org in data["orgs"]:
        result = targeting.apply_exclusion(targeting.evaluate(targeting.from_snapshot(org), profile),
                                           excluded(org["domain"], exclusions))
        # Same rule as `outreach shortlist`: a provider whose re-screen failed is not viable. Older snapshots carry
        # only `screen_failed`, so without `screen_failures` every check is treated as failed. A missing IMG
        # statement (`accepts_imgs`) stopped gating the screen on 2026-10-08, so older snapshots that list it drop it.
        failures = org.get("screen_failures") or (["screen"] if org.get("screen_failed") else [])
        failures = [check for check in failures if check != "accepts_imgs"]
        result = targeting.apply_exclusion(result, targeting.screen_block(failures), label="not viable")
        org["target"] = {key: result[key] for key in ("ready", "score", "reasons", "missing", "excluded")}
    partial = not any(org.get(key) is not None for org in data["orgs"]
                      for key in ("source_kind", "contactable", "catch_all_domain"))
    data["targeting_profile"] = {"id": PROFILE, "name": profile["name"], "description": profile["description"],
                                 "partial": partial}
    return data


def combine(snapshots: dict[str, dict]) -> dict:
    """Every batch in one snapshot, oldest batch first (by first run; batches without runs last), for 'All batches'."""
    ordered = sorted(snapshots.items(), key=lambda item: (min((r["started_at"] for r in item[1]["runs"]), default="~"),
                                                          item[0]))
    data = {"generated_at": max(s["generated_at"] for s in snapshots.values()),
            "runs": sorted((r for _, s in ordered for r in s["runs"]), key=lambda r: r["started_at"]),
            "orgs": [org for _, s in ordered for org in s["orgs"]],
            "meta": {"batch": ALL, "label": "All batches", "tab": "All batches report",
                     "title": "Clinical Outreach: all batches"}}
    profiles = [s["targeting_profile"] for s in snapshots.values() if s.get("targeting_profile")]
    if profiles:
        data["targeting_profile"] = {**profiles[0], "partial": any(p["partial"] for p in profiles)}
    return data


def label_of(batch: str, data: dict) -> str:
    return (data.get("meta") or {}).get("label") or batch


def batches(db) -> list[str]:
    # One row per batch name (PostgREST has no DISTINCT); the page limit applies to organizations, not batches.
    names: set[str] = set()
    while True:
        exclude = ",".join(f'"{name}"' for name in sorted(names))
        params = {"select": "batch", "order": "batch", "limit": "1"}
        if exclude:
            params["batch"] = f"not.in.({exclude})"
        rows = db.select("organizations", params)
        if not rows:
            return sorted(names)
        names.add(rows[0]["batch"])


def validate_activity_summary(document):
    """Accept aggregate counts only; never export correspondence or identifiers."""
    from .load import validate
    validate(document, "dashboard-activity-summary.schema.json")
    counts = document["counts"]
    checked = datetime.fromisoformat(document["checked_at"].replace("Z", "+00:00"))
    if checked.utcoffset() is None or checked > datetime.now(UTC):
        raise ConfigError("activity summary requires a non-future timezone-bearing check time")
    if counts["responded"] != counts["interested"] + counts["rejected"] + counts["other"]:
        raise ConfigError("activity response counts do not reconcile")
    if counts["sent"] != counts["responded"] + counts["awaiting"] + counts["cold"] + counts["delivery"]:
        raise ConfigError("activity sent outcomes do not reconcile")
    if counts["automatic"] > counts["sent"] or counts["total_contacts"] < counts["sent"] + counts["scheduled"] + counts["awaiting_review"]:
        raise ConfigError("activity participant counts do not reconcile")
    return document


def activity_summary(db):
    path = DATA_DIR / "outreach" / "dashboard-activity-summary.json"
    previous = db.select("dashboards", {"batch": "eq.all", "select": "data"})
    saved = (previous[0]["data"].get("activity_summary") if previous else None)
    latest = validate_activity_summary(saved) if saved else None
    if path.exists():
        candidate = validate_activity_summary(read_json(path))
        if latest and datetime.fromisoformat(candidate["checked_at"].replace("Z", "+00:00")) < datetime.fromisoformat(latest["checked_at"].replace("Z", "+00:00")):
            raise ConfigError("local activity summary is older than the published check")
        latest = candidate
    return latest


def validate_tool_usage(document):
    from .load import validate
    from urllib.parse import urlparse
    validate(document, "dashboard-usage.schema.json")
    for vendor in ("firecrawl", "reoon"):
        checked = datetime.fromisoformat(document[vendor]["checked_at"].replace("Z", "+00:00"))
        if checked.utcoffset() is None or checked > datetime.now(UTC):
            raise ConfigError("tool usage requires a non-future timezone-bearing check time")
    url = urlparse(document["firecrawl"]["source_url"])
    if url.scheme != "https" or url.hostname != "www.firecrawl.dev" or url.username or url.password:
        raise ConfigError("unexpected Firecrawl usage source")
    if document["firecrawl"]["period_end"] < document["firecrawl"]["period_start"]:
        raise ConfigError("usage period is reversed")
    return document


def tool_usage(db):
    path = DATA_DIR / "reports" / "dashboard-usage.json"
    previous = db.select("dashboards", {"batch": "eq.all", "select": "data"})
    saved = previous[0]["data"].get("tool_usage") if previous else None
    latest = validate_tool_usage(saved) if saved else None
    if path.exists():
        candidate = validate_tool_usage(read_json(path))
        if latest:
            for vendor in ("firecrawl", "reoon"):
                if datetime.fromisoformat(candidate[vendor]["checked_at"].replace("Z", "+00:00")) < datetime.fromisoformat(latest[vendor]["checked_at"].replace("Z", "+00:00")):
                    raise ConfigError("local vendor observation is older than the published check")
        latest = candidate
    return latest


def publish(db, only: str | None = None) -> list[tuple[str, int, int]]:
    """Rebuild and store the dashboard of every batch (or only `only`) and refresh 'all'. Returns
    (batch, providers, ready) per stored row. A full publish also deletes dashboards of batches no longer in the
    database, so removed contact data leaves the page; after a removal request run a full publish."""
    summary = activity_summary(db)  # Validate before any snapshot writes.
    usage = tool_usage(db)
    exclusions = load_exclusions()
    published = {row["batch"]: row for row in db.select("dashboards", {"select": "batch,data->meta"})}
    names = batches(db)
    if only and only not in names:
        raise ConfigError(f"no organizations in batch {only!r} (batches: {', '.join(names) or 'none'})")
    partnerships = {batch: local_partnerships(batch) for batch in names if not only or batch == only}
    snapshots, stored = {}, []
    for batch in names:
        if only and batch != only:
            stored_data = db.select("dashboards", {"batch": f"eq.{batch}", "select": "data"})
            if stored_data:
                snapshots[batch] = stored_data[0]["data"]
            continue
        meta = local_meta(batch) or (published.get(batch) or {}).get("meta")
        data = enrich(fetch(db, batch), meta, partnerships[batch], exclusions)
        snapshots[batch] = data
        stored.append(store(db, batch, data))
    if snapshots:
        overview = combine(snapshots)
        if summary is not None:
            overview["activity_summary"] = summary
        if usage is not None:
            overview["tool_usage"] = usage
        stored.append(store(db, ALL, overview))
    if not only:
        for batch in sorted(set(published) - set(snapshots) - {ALL}):
            db.delete("dashboards", {"batch": f"eq.{batch}"})
            stored.append((batch, 0, 0))
    return stored


def store(db, batch: str, data: dict) -> tuple[str, int, int]:
    db.upsert("dashboards", {"batch": batch, "label": label_of(batch, data), "data": data,
                             "published_at": data["generated_at"]}, on_conflict="batch")
    return batch, len(data["orgs"]), sum(bool((org.get("target") or {}).get("ready")) for org in data["orgs"])


VIEWERS = DATA_DIR.parent / "config" / "dashboard-viewers.json"


def load_viewers(path=VIEWERS) -> list[str]:
    from .load import validate

    document = read_json(path)
    validate(document, "dashboard-viewers.schema.json")
    return document["viewers"]


def sync_viewers(db, viewers: list[str]) -> dict[str, list[str]]:
    """Make the database viewer list match `viewers`: add missing addresses (creating a confirmed sign-in user for
    each), and remove addresses no longer listed, which ends their access at once. Auth users are never deleted."""
    current = {row["email"] for row in db.select("dashboard_viewers", {"select": "email"})}
    added, removed, created = sorted(set(viewers) - current), sorted(current - set(viewers)), []
    for email in viewers:
        if db.create_confirmed_user(email):
            created.append(email)
        if email in added:
            db.upsert("dashboard_viewers", {"email": email}, on_conflict="email")
    for email in removed:
        db.delete("dashboard_viewers", {"email": f"eq.{email}"})
    return {"added": added, "removed": removed, "users_created": created}
