import pytest

from pipeline import dashboard
from pipeline.load import InvalidFile

SCREEN = {"program_open": True, "outreach_allowed": True, "in_country": True, "contactable": True,
          "note": "IMG observership; coordinator named."}


def org_row(domain="hosp.org", batch="us-09", screen=SCREEN, emails=None, caution=None):
    details = {"source_kind": "img_directory", "email_domain": {"catch_all": False}}
    if screen is not None:
        details["screen"] = screen
    if caution:
        details["outreach_caution"] = caution
    return {
        "id": f"id-{domain}", "name": f"Hospital {domain}", "domain": domain, "website": f"https://{domain}/obs",
        "country": "US", "provider_type": "community", "street": "1 Main St", "city": "Town", "region": "NY",
        "postal_code": "10001", "main_phone": "555", "accepts_imgs": True, "img_friendliness_score": 4,
        "price_band": "free", "site_freshness": "current", "pitch_angle": "Pitch", "priority_score": 1,
        "img_requirements": None, "details": details, "batch": batch,
        "programs": [{"name": "Observership", "type": "observership", "fee_status": "free", "source_url": "u"}],
        "people": [{"id": "p1", "full_name": "Zed Coordinator", "credentials": None, "title": "Coordinator",
                    "role_tier": "coordinator", "is_outreach_target": True, "linkedin_url": None, "tenure": None,
                    "source_url": "u"},
                   {"id": "p2", "full_name": "Amy Chair", "credentials": "MD", "title": "Chair",
                    "role_tier": "decision_maker", "is_outreach_target": False, "linkedin_url": None, "tenure": None,
                    "source_url": "u"}],
        "emails": emails if emails is not None else [
            {"address": "zed@hosp.org", "kind": "published", "status": "valid", "confidence": "high",
             "person_id": "p1", "source_url": "u"},
            {"address": "old@hosp.org", "kind": "published", "status": "invalid", "confidence": None,
             "person_id": None, "source_url": "u"}],
        "pages": [{"count": 6}],
    }


RUN = {"id": "r1", "batch": "us-09", "step": "scrape", "started_at": "2026-10-09T01:00:00+00:00",
       "orgs_processed": 2, "firecrawl_credits": 0, "reoon_checks": 0, "errors": [{"domain": "x"}]}


class FakeDb:
    def __init__(self, orgs, runs=(), dashboards=None, viewers=(), users=()):
        self.orgs, self.runs = list(orgs), list(runs)
        self.dashboards = dict(dashboards or {})
        self.viewers, self.users = set(viewers), set(users)
        self.org_queries = []

    def select(self, table, params):
        if table == "organizations":
            if params.get("limit") == "1":  # distinct batch names, one per query
                skip = params.get("batch", "not.in.()")[len("not.in.("):-1]
                left = sorted({o["batch"] for o in self.orgs} - {b.strip('"') for b in skip.split(",") if b})
                return [{"batch": left[0]}] if left else []
            self.org_queries.append(params["batch"])
            return [o for o in self.orgs if params["batch"] == f"eq.{o['batch']}"]
        if table == "pipeline_runs":
            return [r for r in self.runs if params["batch"] == f"eq.{r['batch']}"]
        if table == "dashboards":
            rows = [{"batch": b, **row} for b, row in self.dashboards.items()]
            if "batch" in params:
                rows = [r for r in rows if params["batch"] == f"eq.{r['batch']}"]
            if params["select"] == "batch,data->meta":
                return [{"batch": r["batch"], "meta": r["data"].get("meta")} for r in rows]
            return [{"data": r["data"]} for r in rows]
        if table == "dashboard_viewers":
            return [{"email": email} for email in sorted(self.viewers)]
        raise AssertionError(table)

    def upsert(self, table, row, on_conflict):
        if table == "dashboards":
            self.dashboards[row["batch"]] = row
        elif table == "dashboard_viewers":
            self.viewers.add(row["email"])
        else:
            raise AssertionError(table)
        return row

    def delete(self, table, params):
        if table == "dashboards":
            self.dashboards.pop(params["batch"].removeprefix("eq."))
            return
        assert table == "dashboard_viewers"
        self.viewers.discard(params["email"].removeprefix("eq."))

    def create_confirmed_user(self, email):
        if email in self.users:
            return False
        self.users.add(email)
        return True


def test_snapshot_org_maps_database_rows():
    snap = dashboard.snapshot_org(org_row(caution="Contact only the inbox"))
    assert snap["type"] == "community" and snap["phone"] == "555" and snap["pages"] == 6
    assert snap["note"] == SCREEN["note"] and snap["contactable"] is True and snap["catch_all_domain"] is False
    assert snap["caution"] == "Contact only the inbox" and snap["source_kind"] == "img_directory"
    assert [e["address"] for e in snap["emails"]] == ["zed@hosp.org"]  # invalid addresses are dropped
    assert snap["emails"][0]["person"] == "Zed Coordinator"
    assert [p["name"] for p in snap["people"]] == ["Zed Coordinator", "Amy Chair"]  # targets first
    assert snap["screen_failures"] == [] and snap["screen_failed"] is False
    assert snap["programs"][0]["fee_status"] == "free"


def test_snapshot_org_records_a_failed_screen():
    snap = dashboard.snapshot_org(org_row(screen={**SCREEN, "program_open": False}))
    assert snap["screen_failures"] == ["program_open"] and snap["screen_failed"] is True


def test_enrich_ranks_with_bulk_send_and_exclusions():
    ready = dashboard.snapshot_org(org_row())
    paused = dashboard.snapshot_org(org_row(domain="paused.org"))
    no_email = dashboard.snapshot_org(org_row(domain="quiet.org", emails=[]))
    data = {"generated_at": "t", "runs": [], "orgs": [ready, paused, no_email]}
    dashboard.enrich(data, exclusions={"paused.org": "observership paused"})
    assert ready["target"]["ready"] is True
    assert paused["target"]["ready"] is False and "observership paused" in paused["target"]["excluded"][0]
    assert no_email["target"]["ready"] is False and no_email["target"]["missing"]
    assert data["targeting_profile"]["id"] == "bulk-send" and data["targeting_profile"]["partial"] is False


def test_enrich_applies_meta_and_run_estimates():
    data = {"generated_at": "t", "runs": [dashboard.snapshot_run(RUN)], "orgs": []}
    meta = {"batch": "us-09", "label": "US batch 9",
            "run_estimates": {"2026-10-09T01:00:00Z": {"firecrawl": 40, "note": "cut off before logging"}}}
    dashboard.enrich(data, meta=meta, exclusions={})
    assert data["meta"]["label"] == "US batch 9"
    assert data["runs"][0] == {"step": "scrape", "started_at": RUN["started_at"], "orgs": 2, "firecrawl": 40,
                               "reoon": 0, "errors": 1, "estimated": True, "estimate_note": "cut off before logging"}


def test_publish_stores_each_batch_and_all(monkeypatch):
    monkeypatch.setattr(dashboard, "local_meta", lambda batch: None)
    monkeypatch.setattr(dashboard, "local_partnerships", lambda batch: None)
    kept_meta = {"batch": "us-08", "label": "US batch 8", "summary": {"heading": "h"}}
    db = FakeDb([org_row(batch="us-08"), org_row(domain="b.org", batch="us-09")],
                runs=[{**RUN, "batch": "us-08"}],
                dashboards={"us-08": {"label": "US batch 8", "data": {"meta": kept_meta}}})
    stored = dashboard.publish(db)
    assert stored == [("us-08", 1, 1), ("us-09", 1, 1), ("all", 2, 2)]
    assert db.dashboards["us-08"]["data"]["meta"] == kept_meta  # published text survives without a local file
    assert db.dashboards["us-08"]["label"] == "US batch 8" and db.dashboards["us-09"]["label"] == "us-09"
    combined = db.dashboards["all"]["data"]
    assert [o["domain"] for o in combined["orgs"]] == ["hosp.org", "b.org"]
    assert combined["meta"]["batch"] == "all" and combined["targeting_profile"]["id"] == "bulk-send"


def test_publish_rejects_later_null_partnerships_before_any_writes(tmp_path, monkeypatch):
    monkeypatch.setattr(dashboard, "DATA_DIR", tmp_path)
    reports = tmp_path / "reports"
    reports.mkdir()
    (reports / "us-09-partnerships.json").write_text("null")
    saved = {"all": {"data": {"orgs": []}}, "old-batch": {"data": {"orgs": []}}}
    db = FakeDb([org_row(batch="us-08"), org_row(domain="b.org", batch="us-09")], dashboards=saved.copy())
    with pytest.raises(InvalidFile, match="expected a partnerships object"):
        dashboard.publish(db)
    assert db.dashboards == saved


def test_publish_one_batch_reuses_the_others(monkeypatch):
    monkeypatch.setattr(dashboard, "local_meta", lambda batch: None)
    monkeypatch.setattr(dashboard, "local_partnerships", lambda batch: None)
    db = FakeDb([org_row(batch="us-08"), org_row(domain="b.org", batch="us-09")])
    dashboard.publish(db)
    db.org_queries.clear()
    stored = dashboard.publish(db, only="us-09")
    assert db.org_queries == ["eq.us-09"]
    assert [row[0] for row in stored] == ["us-09", "all"] and stored[-1][1] == 2


def test_sync_viewers_adds_and_removes():
    db = FakeDb([], viewers={"old@goocampus.in", "keep@goocampus.in"}, users={"keep@goocampus.in"})
    result = dashboard.sync_viewers(db, ["keep@goocampus.in", "new@goocampus.in"])
    assert result == {"added": ["new@goocampus.in"], "removed": ["old@goocampus.in"],
                      "users_created": ["new@goocampus.in"]}
    assert db.viewers == {"keep@goocampus.in", "new@goocampus.in"}


def test_viewer_file_is_validated(tmp_path):
    good = tmp_path / "good.json"
    good.write_text('{"viewers": ["maheenejaz@goocampus.in"]}')
    assert dashboard.load_viewers(good) == ["maheenejaz@goocampus.in"]
    bad = tmp_path / "bad.json"
    bad.write_text('{"viewers": ["Someone@GooCampus.in"]}')
    with pytest.raises(InvalidFile):
        dashboard.load_viewers(bad)
    assert dashboard.load_viewers() == ["maheenejaz@goocampus.in", "ashwini.s@goocampus.in", "nandu@goocampus.in"]  # the tracked file


def test_full_publish_removes_dashboards_of_deleted_batches(monkeypatch):
    monkeypatch.setattr(dashboard, "local_meta", lambda batch: None)
    monkeypatch.setattr(dashboard, "local_partnerships", lambda batch: None)
    db = FakeDb([org_row(batch="us-09")], dashboards={"us-07": {"label": "gone", "data": {"meta": None}}})
    assert dashboard.publish(db, only="us-09")[-1][0] == "all" and "us-07" in db.dashboards  # partial keeps it
    stored = dashboard.publish(db)
    assert stored[-1] == ("us-07", 0, 0) and set(db.dashboards) == {"us-09", "all"}


def test_a_full_page_of_rows_stops_the_publish():
    class Full(FakeDb):
        def select(self, table, params):
            return [{}] * dashboard.MAX_ROWS if table == "organizations" and "limit" not in params else super().select(table, params)
    with pytest.raises(RuntimeError, match="API limit"):
        dashboard.fetch(Full([org_row()]), "us-09")


def test_publish_rejects_an_unknown_batch():
    with pytest.raises(dashboard.ConfigError, match="us-99"):
        dashboard.publish(FakeDb([org_row(batch="us-09")]), only="us-99")


def activity_fixture(checked_at="2026-10-15T16:00:00Z"):
    return {"version": 1, "checked_at": checked_at, "source": "Gmail/Attio session check", "counts": {
        "sent": 25, "responded": 0, "interested": 0, "rejected": 0, "other": 0,
        "awaiting": 25, "cold": 0, "automatic": 4, "delivery": 0, "scheduled": 60,
        "awaiting_review": 20, "total_contacts": 105}}


def test_activity_summary_is_private_aggregate_only_and_survives_research_refresh(tmp_path, monkeypatch):
    import json
    monkeypatch.setattr(dashboard, "DATA_DIR", tmp_path)
    monkeypatch.setattr(dashboard, "local_meta", lambda batch: None)
    monkeypatch.setattr(dashboard, "local_partnerships", lambda batch: None)
    path = tmp_path / "outreach" / "dashboard-activity-summary.json"
    path.parent.mkdir()
    summary = activity_fixture()
    path.write_text(json.dumps(summary))
    db = FakeDb([org_row()])
    dashboard.publish(db)
    assert db.dashboards['all']['data']['activity_summary'] == summary
    assert 'activity_summary' not in db.dashboards['us-09']['data']
    path.unlink()
    dashboard.publish(db)
    assert db.dashboards['all']['data']['activity_summary'] == summary


def test_activity_summary_rejects_private_fields_bad_totals_and_stale_capture_before_writes(tmp_path, monkeypatch):
    import json
    from pipeline.load import InvalidFile
    monkeypatch.setattr(dashboard, "DATA_DIR", tmp_path)
    path = tmp_path / "outreach" / "dashboard-activity-summary.json"
    path.parent.mkdir()
    saved = activity_fixture()
    db = FakeDb([org_row()], dashboards={'all': {'data': {'activity_summary': saved}}})
    for invalid in [{**saved, 'recipients': ['private@example.test']},
                    {**saved, 'counts': {**saved['counts'], 'sent': 26}},
                    activity_fixture('2026-10-14T16:00:00Z')]:
        path.write_text(json.dumps(invalid))
        with pytest.raises((InvalidFile, dashboard.ConfigError)):
            dashboard.publish(db)
        assert set(db.dashboards) == {'all'}
        assert db.dashboards['all']['data']['activity_summary'] == saved


def usage_fixture():
    return {"firecrawl": {"credits": 818, "checked_at": "2026-10-15T17:17:11Z", "api_key_name": "global-clinical-outreach-v1",
                         "period_start": "2026-07-15", "period_end": "2026-10-15", "source_url": "https://www.firecrawl.dev/app/t/example/usage"},
            "reoon": {"verifications": 388, "checked_at": "2026-10-16T01:09:59Z", "scope": "Lifetime usage statistics",
                      "source_url": "https://emailverifier.reoon.com/overview/", "daily_credits_remaining": 20,
                      "daily_credits_limit": 20, "instant_credits_remaining": 9843}}


def test_vendor_observations_stay_in_protected_snapshot_and_survive_research_refresh(tmp_path, monkeypatch):
    import json
    monkeypatch.setattr(dashboard, "DATA_DIR", tmp_path)
    monkeypatch.setattr(dashboard, "local_meta", lambda batch: None)
    monkeypatch.setattr(dashboard, "local_partnerships", lambda batch: None)
    path = tmp_path / "reports" / "dashboard-usage.json"
    path.parent.mkdir()
    usage = usage_fixture()
    path.write_text(json.dumps(usage))
    db = FakeDb([org_row()])
    dashboard.publish(db)
    assert db.dashboards['all']['data']['tool_usage'] == usage
    assert 'tool_usage' not in db.dashboards['us-09']['data']
    path.unlink()
    dashboard.publish(db)
    assert db.dashboards['all']['data']['tool_usage'] == usage


def test_private_vendor_fields_and_older_observations_rejected_before_writes(tmp_path, monkeypatch):
    import json
    from pipeline.load import InvalidFile
    monkeypatch.setattr(dashboard, "DATA_DIR", tmp_path)
    path = tmp_path / "reports" / "dashboard-usage.json"
    path.parent.mkdir()
    saved = usage_fixture()
    db = FakeDb([org_row()], dashboards={'all': {'data': {'tool_usage': saved}}})
    for invalid in [{**saved, 'api_secret': 'never-publish'},
                    {**saved, 'reoon': {**saved['reoon'], 'checked_at': '2026-10-12T10:36:00Z'}}]:
        path.write_text(json.dumps(invalid))
        with pytest.raises((InvalidFile, dashboard.ConfigError)):
            dashboard.publish(db)
        assert set(db.dashboards) == {'all'}


def test_public_dashboard_bundle_has_no_vendor_account_observations():
    from pathlib import Path
    bundle = (Path(__file__).resolve().parents[1] / 'web' / 'dashboard.js').read_text()
    assert 'OVERVIEW.tool_usage || null' in bundle
    assert 'global-clinical-outreach-v1' not in bundle
    assert 'YduQUzfnY3X' not in bundle
    assert '2548713' not in bundle
    assert '9843' not in bundle
