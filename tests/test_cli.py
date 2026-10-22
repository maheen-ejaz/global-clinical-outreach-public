from pipeline import cli


class FakeReoon:
    def __init__(self):
        self.checks = 0

    def verify(self, address):
        self.checks += 1
        return "invalid"


class FakeDb:
    def __init__(self, people):
        self.people = people
        self.updates = []

    def select(self, table, params):
        return {"emails": [], "people": self.people}[table]

    def update(self, table, match, values):
        self.updates.append((table, match["id"], values))

    def upsert(self, table, row, on_conflict):
        raise AssertionError("no deliverable guess should not be stored")


def test_people_without_a_deliverable_guess_are_not_retried():
    org = {"id": "o", "domain": "hosp.org"}
    person = {"id": "p", "full_name": "Jane Doe", "is_outreach_target": True, "email_resolved_at": None}
    db, reoon = FakeDb([person]), FakeReoon()
    cli.resolve_org_emails(db, org, reoon)
    assert reoon.checks == 5
    assert db.updates[0][:2] == ("people", "p")

    db, reoon = FakeDb([{**person, "email_resolved_at": "2026-10-06T00:00:00Z"}]), FakeReoon()
    cli.resolve_org_emails(db, org, reoon)
    assert reoon.checks == 0


def test_load_extra_pages_groups_by_domain_and_validates(tmp_path, monkeypatch):
    import json

    import pytest

    from pipeline.load import InvalidFile

    monkeypatch.setattr(cli, "DATA_DIR", tmp_path)
    assert cli.load_extra_pages("b") == {}
    (tmp_path / "extra-pages").mkdir()
    (tmp_path / "extra-pages" / "b.json").write_text(json.dumps([
        {"domain": "Hosp.org", "url": "https://hosp.org/im/leadership", "kind": "people", "reason": "PD"},
        {"domain": "hosp.org", "url": "https://hosp.org/contact", "kind": "contact"},
    ]))
    assert cli.load_extra_pages("b") == {"hosp.org": [("https://hosp.org/im/leadership", "people"),
                                                      ("https://hosp.org/contact", "contact")]}
    (tmp_path / "extra-pages" / "b.json").write_text(json.dumps([{"domain": "hosp.org", "url": "nope", "kind": "x"}]))
    with pytest.raises(InvalidFile):
        cli.load_extra_pages("b")


def test_yield_lines_rank_sources_by_send_ready_share():
    records = [
        {"source_kind": "web_search", "provider_type": "academic", "pages": 8, "send_ready": False},
        {"source_kind": "web_search", "provider_type": "academic", "pages": 6, "send_ready": True, "verified_personal": True},
        {"source_kind": "img_directory", "provider_type": "community", "pages": 5, "send_ready": True},
    ]
    assert cli.yield_lines(records) == [
        "yield img_directory / community: 1 orgs, 1 send-ready, 0 with a verified personal email, 5 pages, 5.0 pages per send-ready lead",
        "yield web_search / academic: 2 orgs, 1 send-ready, 1 with a verified personal email, 14 pages, 14.0 pages per send-ready lead",
    ]
    assert cli.yield_lines([{**records[0]}])[0].endswith("n/a pages per send-ready lead")


def test_record_page_pick_keeps_details_written_since_the_batch_was_listed():
    class Db:
        def __init__(self):
            self.updates = []

        def select(self, table, params):
            assert params["id"] == "eq.o"
            return [{"details": {"screen": {"accepts_imgs": True}, "source_kind": "img_directory"}}]

        def update(self, table, match, values):
            self.updates.append(values["details"])

    db = Db()
    cli.record_page_pick(db, "o", {"limit": 8, "matching": 3, "read": 3, "unread": 0})
    details = db.updates[0]
    assert details["screen"] == {"accepts_imgs": True} and details["source_kind"] == "img_directory"
    assert details["page_pick"]["read"] == 3 and "recorded_at" in details["page_pick"]


def test_page_limit_line_separates_capped_short_and_unrecorded_sites():
    pick = lambda read, unread: {"details": {"page_pick": {"limit": 8, "matching": read + unread, "read": read, "unread": unread}}}
    orgs = [pick(8, 4), pick(8, 0), pick(3, 0), {"details": {}}, {"details": None}]
    assert cli.page_limit_line(orgs) == ("page limit 8: 1 of 3 providers had more matching pages than the limit "
                                         "(4 pages left unread); 1 ran out of matching pages first (pages planned, before fetch errors); 2 not recorded")
    assert cli.page_limit_line([]).startswith("page limit n/a: 0 of 0")


def test_status_line_counts_unclassified_programs():
    programs = [{"fee_status": "stated"}, {"fee_status": "stated"}, {"fee_status": None}]
    assert cli.status_line("fee status", programs, "fee_status") == "fee status: stated 2, unclassified 1"


def test_email_domain_prefers_published_mail_over_the_website():
    org = {"domain": "hopkinsmedicine.org"}
    emails = [{"address": "a@jhmi.edu", "kind": "published"}, {"address": "b@jhmi.edu", "kind": "generic_inbox"},
              {"address": "c@hopkinsmedicine.org", "kind": "pattern_guess"}]
    assert cli.email_domain_of(org, emails) == "jhmi.edu"
    assert cli.email_domain_of(org, []) == "hopkinsmedicine.org"


def test_probe_domain_reads_a_made_up_address():
    class Reoon:
        def __init__(self, status):
            self.status, self.asked = status, []

        def verify(self, address):
            self.asked.append(address)
            return self.status

    for status, catch_all in (("safe", True), ("catch_all", True), ("invalid", False), ("unknown", None)):
        reoon = Reoon(status)
        assert cli.probe_domain("hosp.org", reoon) == {"catch_all": catch_all, "probe_status": cli.email_lib.classify_reoon(status)}
        assert reoon.asked[0].startswith("no-such-person-") and reoon.asked[0].endswith("@hosp.org")


def test_shortlist_rejects_null_partnerships_instead_of_treating_them_as_missing(tmp_path, monkeypatch):
    import types

    import pytest

    from pipeline.load import InvalidFile

    monkeypatch.setattr(cli, "DATA_DIR", tmp_path)
    monkeypatch.setattr(cli.dashboard, "DATA_DIR", tmp_path)
    assert cli.dashboard.local_partnerships("b") is None
    reports = tmp_path / "reports"
    reports.mkdir()
    path = reports / "b-partnerships.json"
    path.write_text('{"providers": {"hosp.org": {"open": true}}}')
    assert cli.dashboard.local_partnerships("b") == {"providers": {"hosp.org": {"open": True}}}
    path.write_text("null")
    with pytest.raises(InvalidFile, match="expected a partnerships object"):
        cli.cmd_shortlist(None, types.SimpleNamespace(batch="b", profile="broad"))
    assert not list(reports.glob("*-shortlist-*.csv"))


def test_shortlist_writes_one_ranked_csv_per_profile(tmp_path, monkeypatch):
    import csv as csv_lib
    import types

    monkeypatch.setattr(cli, "DATA_DIR", tmp_path)
    monkeypatch.setattr(cli.dashboard, "DATA_DIR", tmp_path)
    orgs = [
        {"id": "1", "domain": "comm.org", "name": "Comm", "provider_type": "community", "accepts_imgs": True,
         "img_friendliness_score": 4, "priority_score": 2, "details": {}},
        {"id": "2", "domain": "uni.edu", "name": "Uni", "provider_type": "academic", "accepts_imgs": True,
         "img_friendliness_score": 2, "priority_score": 1, "details": {"outreach_caution": "Do not contact: forbids it"}},
    ]
    tables = {
        ("people", "1"): [{"id": "p1", "full_name": "Ann Lee", "title": "Coordinator"}],
        ("emails", "1"): [{"address": "ann.lee@comm.org", "kind": "published", "status": "valid", "person_id": "p1"}],
        ("people", "2"): [], ("emails", "2"): [{"address": "info@uni.edu", "kind": "generic_inbox", "status": "valid", "person_id": None}],
    }

    class Db:
        def select(self, table, params):
            if table == "organizations":
                return orgs
            return tables[(table, params["org_id"].removeprefix("eq."))]

    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile=None))
    rows = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-high-hit-rate.csv").open()))
    assert [(r["domain"], r["ready"], r["email_check"]) for r in rows] == [("comm.org", "yes", "verified"), ("uni.edu", "", "")]
    assert "site forbids outreach" in rows[1]["missing"]
    monkeypatch.setattr(cli, "load_exclusions", lambda: {"comm.org": "applications suspended"})
    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile="broad"))
    excluded_rows = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-broad.csv").open()))
    comm = next(row for row in excluded_rows if row["domain"] == "comm.org")
    assert comm["ready"] == "" and "on the exclusion list: applications suspended" in comm["missing"]
    assert not any(row["ready"] for row in excluded_rows)
    monkeypatch.setattr(cli, "load_exclusions", lambda: {})
    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile="broad"))
    broad = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-broad.csv").open()))
    assert broad[0]["domain"] == "comm.org" and broad[1]["missing"] == "site forbids outreach"
    orgs[0]["details"] = {"screen": {"accepts_imgs": True, "program_open": False, "outreach_allowed": True, "in_country": True}}
    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile="broad"))
    paused = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-broad.csv").open()))
    comm = next(row for row in paused if row["domain"] == "comm.org")
    assert comm["ready"] == "" and "not viable: screen failed: program_open" in comm["missing"]
    orgs[0]["details"] = {"screen": {"accepts_imgs": False, "program_open": True, "outreach_allowed": True, "in_country": True}}
    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile=None))
    bulk = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-bulk-send.csv").open()))
    assert [(r["domain"], r["ready"]) for r in bulk] == [("comm.org", "yes"), ("uni.edu", "")]
    orgs[0]["details"]["screen"]["refuses_imgs"] = True
    cli.cmd_shortlist(Db(), types.SimpleNamespace(batch="b", profile="bulk-send"))
    bulk = list(csv_lib.DictReader((tmp_path / "reports" / "b-shortlist-bulk-send.csv").open()))
    assert "not viable: screen failed: refuses_imgs" in next(r for r in bulk if r["domain"] == "comm.org")["missing"]


def test_email_domain_reuses_decided_domains_and_retries_undecided(monkeypatch):
    import types

    orgs = [
        {"id": "1", "domain": "a.org", "website": "https://a.org", "details": {"email_domain": {"domain": "a.org", "catch_all": False}}},
        {"id": "2", "domain": "a-sister.org", "website": "https://a-sister.org", "details": {}},
        {"id": "3", "domain": "b.org", "website": "https://b.org", "details": {"email_domain": {"domain": "b.org", "catch_all": None}}},
        {"id": "4", "domain": "c.org", "website": "https://c.org", "details": {}},
    ]
    emails = {"2": [{"address": "Info@A.org", "kind": "generic_inbox", "status": "valid"}, {"address": "broken", "kind": "published", "status": "valid"}],
              "3": [], "4": []}
    writes = []

    class Db:
        def select(self, table, params):
            if table == "organizations" and params.get("select") == "details":
                return [{"details": next(o["details"] for o in orgs if f"eq.{o['id']}" == params["id"])}]
            if table == "organizations":
                return orgs
            return emails[params["org_id"].removeprefix("eq.")]

        def update(self, table, match, values):
            writes.append((match["id"], values["details"]["email_domain"]))

    class Reoon:
        def __init__(self, key):
            self.checks = 0

        def verify(self, address):
            self.checks += 1
            if address.endswith("@c.org"):
                raise RuntimeError("Reoon verify failed: 500")
            return "catch_all"

    monkeypatch.setattr(cli.email_lib, "Reoon", Reoon)
    monkeypatch.setattr(cli, "start_run", lambda db, batch, step: "run")
    finished = {}
    monkeypatch.setattr(cli, "finish_run", lambda db, run_id, **values: finished.update(values))
    cli.cmd_email_domain(Db(), types.SimpleNamespace(batch="b", domain=None, refresh=False),
                         types.SimpleNamespace(reoon_api_key="k"))
    by_org = dict((org_id, record) for org_id, record in writes)
    assert "1" not in by_org  # decided, skipped
    assert by_org["2"]["domain"] == "a.org" and by_org["2"]["catch_all"] is False  # reused, not re-probed
    assert by_org["2"]["differs_from_website"] is True
    assert by_org["3"]["catch_all"] is True  # undecided before, retried
    assert finished["reoon_checks"] == 2 and finished["errors"][0]["domain"] == "c.org"


def test_email_domain_on_the_website_parent_is_not_different(monkeypatch):
    import types

    org = {"id": "1", "domain": "meded.griffinhealth.org", "website": "https://meded.griffinhealth.org/obs", "details": {}}
    writes = []

    class Db:
        def select(self, table, params):
            if table == "organizations":
                return [{"details": {}}] if params.get("select") == "details" else [org]
            return [{"address": "obs@griffinhealth.org", "kind": "generic_inbox", "status": "valid"}]

        def update(self, table, match, values):
            writes.append(values["details"]["email_domain"])

    class Reoon:
        def __init__(self, key):
            self.checks = 0

        def verify(self, address):
            self.checks += 1
            return "invalid"

    monkeypatch.setattr(cli.email_lib, "Reoon", Reoon)
    monkeypatch.setattr(cli, "start_run", lambda *a: "run")
    monkeypatch.setattr(cli, "finish_run", lambda *a, **k: None)
    cli.cmd_email_domain(Db(), types.SimpleNamespace(batch="b", domain=None, refresh=False), types.SimpleNamespace(reoon_api_key="k"))
    assert writes[0]["domain"] == "griffinhealth.org" and writes[0]["differs_from_website"] is False
