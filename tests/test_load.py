import pytest

from pipeline.load import InvalidFile, compact, load_discovery, load_exclusions, load_extraction


class FakeDb:
    def __init__(self, orgs=None, programs=None):
        self.tables = {"organizations": orgs or [], "programs": programs or []}
        self.calls = []

    def select(self, table, params):
        return self.tables.get(table, [])

    def update(self, table, match, values):
        self.calls.append(("update", table, values))

    def upsert(self, table, row, on_conflict):
        self.calls.append(("upsert", table, row, on_conflict))
        return {"id": f"{table}-{len(self.calls)}", **row}


def extraction(**overrides):
    document = {
        "domain": "Hosp.org",
        "organization": {"name": "Hosp", "city": "Boston", "region": None, "accreditations": [],
                         "details": {"new": 1}, "field_sources": {"city": "https://hosp.org/contact"}},
        "programs": [{"name": "IMG Observership", "type": "observership", "source_url": "https://hosp.org/obs",
                      "fee_status": "not_stated", "window_status": "rolling"}],
        "people": [{"full_name": "Jane Doe", "role_tier": "coordinator", "is_outreach_target": True,
                    "source_url": "https://hosp.org/staff"}],
        "news": [],
        "emails": [{"address": "JDoe@Hosp.org", "kind": "published", "person_name": "Jane Doe",
                    "source_url": "https://hosp.org/staff"}],
    }
    document.update(overrides)
    return document


def test_compact_keeps_false_and_drops_unknowns():
    assert compact({"a": None, "b": [], "c": {}, "d": False, "e": 0, "f": "x"}) == {"d": False, "e": 0, "f": "x"}


SCREEN = {"accepts_imgs": True, "program_open": True, "outreach_allowed": True, "in_country": True,
          "evidence_url": "https://hosp.org/observership", "checked_on": "2026-10-07"}


def discovered(website="https://www.hosp.org/", **screen):
    return {"name": "Hosp", "website": website, "country": "US", "provider_type": "community",
            "discovery_source": "https://search.example/q", "source_kind": "img_directory",
            "screen": {**SCREEN, **screen}}


def test_load_discovery_validates_and_derives_domain():
    db = FakeDb()
    outcome = load_discovery(db, [discovered()], "pilot", {})
    assert outcome["added"] == ["hosp.org"]
    row = db.calls[0][2]
    assert row["domain"] == "hosp.org" and row["batch"] == "pilot"
    assert row["details"] == {"screen": SCREEN, "source_kind": "img_directory"}
    with pytest.raises(InvalidFile):
        load_discovery(db, [{"name": "x", "website": "nope", "provider_type": "spa", "discovery_source": "y"}], "b", {})
    with pytest.raises(InvalidFile):  # the screen is required
        load_discovery(db, [{k: v for k, v in discovered().items() if k != "screen"}], "b", {})


def test_load_discovery_skips_excluded_and_failed_screens():
    db = FakeDb()
    outcome = load_discovery(db, [discovered("https://med.blocked.edu"), discovered(program_open=False)],
                             "pilot", {"blocked.edu": "forbids outreach"})
    assert outcome["excluded"] == ["med.blocked.edu (forbids outreach)"]
    assert outcome["failed"] == ["hosp.org (program_open)"]
    assert outcome["added"] == [] and db.calls == []


def test_load_discovery_rescreens_known_orgs_without_moving_them():
    db = FakeDb([{"id": "existing", "details": {"pilot_note": "kept"}}])
    outcome = load_discovery(db, [discovered()], "other", {})
    assert outcome["rescreened"] == ["hosp.org"]
    assert db.calls == [("update", "organizations", {"details": {
        "pilot_note": "kept", "screen": SCREEN, "source_kind": "img_directory"}})]


def test_tracked_exclusions_file_is_valid():
    exclusions = load_exclusions()
    assert "medicine.yale.edu" in exclusions and all(len(reason) >= 10 for reason in exclusions.values())


def test_load_extraction_merges_json_and_links_emails():
    db = FakeDb([{"id": "org-1", "details": {"old": 1}, "field_sources": {"street": "https://hosp.org/a"}}],
                programs=[{"name": "IMG Observership", "details": {"kept": True}}])
    counts = load_extraction(db, extraction())
    program = next(call[2] for call in db.calls if call[1] == "programs")
    assert program["details"] == {"kept": True}
    assert counts["programs"] == 1 and counts["emails"] == 1
    update = db.calls[0][2]
    assert "region" not in update and "accreditations" not in update
    assert update["details"] == {"old": 1, "new": 1}
    assert set(update["field_sources"]) == {"street", "city"}
    email = db.calls[-1][2]
    assert email["address"] == "jdoe@hosp.org"
    assert email["person_id"].startswith("people-")
    assert "status" not in email


def test_load_extraction_rejects_unknown_fields_and_undiscovered_orgs():
    with pytest.raises(InvalidFile, match="organization"):
        load_extraction(FakeDb([{"id": "o", "details": {}, "field_sources": {}}]),
                        extraction(organization={"name": "Hosp", "favourite_colour": "blue"}))
    with pytest.raises(InvalidFile, match="not discovered"):
        load_extraction(FakeDb([]), extraction())


@pytest.mark.parametrize("program, valid", [
    ({"program_fee": "$500", "fee_status": "stated", "window_status": "not_stated"}, True),
    ({"program_fee": "$0", "fee_status": "free", "window_status": "not_stated"}, True),
    ({"program_fee": "$500", "fee_status": "not_stated", "window_status": "not_stated"}, False),
    ({"program_fee": None, "fee_status": "stated", "window_status": "not_stated"}, False),
    ({"application_fee": "$100", "fee_status": "stated", "window_status": "not_checked"}, True),
    ({"program_fee": "Shown after account creation", "fee_status": "on_request", "window_status": "rolling"}, True),
    ({"fee_status": "paid_position", "window_status": "rolling"}, True),
    ({"application_window": "Rolling", "fee_status": "on_request", "window_status": "rolling"}, True),
    ({"application_window": "Dec 15", "fee_status": "on_request", "window_status": "not_stated"}, False),
    ({"fee_status": "on_request", "window_status": "fixed_dates"}, False),
    ({"fee_status": "on_request"}, False),
    ({"program_fee": "", "application_window": "", "fee_status": "not_stated", "window_status": "not_stated"}, True),
])
def test_fee_and_window_status_must_agree_with_the_values(program, valid):
    from pipeline.load import validate
    document = extraction(programs=[{"name": "P", "type": "observership", "source_url": "https://hosp.org/p", **program}])
    if valid:
        validate(document, "extraction.schema.json")
    else:
        with pytest.raises(InvalidFile):
            validate(document, "extraction.schema.json")
