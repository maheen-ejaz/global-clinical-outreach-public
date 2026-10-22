import pytest

from pipeline import emails


class FakeReoon:
    def __init__(self, statuses):
        self.statuses = statuses
        self.checked = []

    def verify(self, address):
        self.checked.append(address)
        return self.statuses.get(address, "invalid")


def test_split_name_strips_titles_credentials_and_initials():
    name = emails.split_name("Dr. María J. Gómez-Ruiz, MD, MPH")
    assert name == emails.NameParts(first="maria", last="gomezruiz")
    assert emails.split_name("Prof Jane Doe PhD") == emails.NameParts("jane", "doe")
    assert emails.split_name("Madonna") is None
    assert emails.split_name("Linh Do") == emails.NameParts("linh", "do")
    assert emails.split_name("Wei Ma MD") == emails.NameParts("wei", "ma")


def test_infer_pattern_votes_on_published_pairs():
    known = [("Jane Doe", "jdoe@hosp.org"), ("John Smith, MD", "jsmith@hosp.org"), ("Ann Lee", "ann.lee@hosp.org")]
    assert emails.infer_pattern(known) == "{f}{last}"
    assert emails.infer_pattern([("Jane Doe", "info@hosp.org")]) is None


def test_candidates_put_inferred_pattern_first_and_cap_count():
    result = emails.candidates("Jane Doe", "hosp.org", "{f}{last}")
    assert result[0] == ("jdoe@hosp.org", "{f}{last}")
    assert len(result) == emails.MAX_CANDIDATES
    assert len({address for address, _ in result}) == len(result)
    assert emails.candidates("Cher", "hosp.org", None) == []


def test_classify_and_confidence():
    assert emails.classify_reoon("safe") == "valid"
    assert emails.classify_reoon("role_account") == "valid"
    assert emails.classify_reoon("spamtrap") == "invalid"
    assert emails.confidence("pattern_guess", "valid", False) == "high"
    assert emails.confidence("pattern_guess", "catch_all", True) == "medium"
    assert emails.confidence("pattern_guess", "catch_all", False) == "low"
    assert emails.confidence("published", "unknown", False) == "medium"
    assert emails.confidence("published", "invalid", False) is None


def test_resolve_person_stops_at_first_valid():
    reoon = FakeReoon({"jane.doe@hosp.org": "invalid", "jdoe@hosp.org": "safe"})
    row = emails.resolve_person("Jane Doe", "hosp.org", None, reoon)
    assert row["address"] == "jdoe@hosp.org" and row["confidence"] == "high"
    assert reoon.checked == ["jane.doe@hosp.org", "jdoe@hosp.org"]


def test_resolve_person_stops_on_catch_all_and_falls_back_to_unknown():
    reoon = FakeReoon({"jdoe@hosp.org": "catch_all"})
    row = emails.resolve_person("Jane Doe", "hosp.org", "{f}{last}", reoon)
    assert row["status"] == "catch_all" and row["confidence"] == "medium"
    assert reoon.checked == ["jdoe@hosp.org"]

    reoon = FakeReoon({"jane.doe@hosp.org": "unknown"})
    row = emails.resolve_person("Jane Doe", "hosp.org", None, reoon)
    assert row["address"] == "jane.doe@hosp.org" and row["confidence"] == "low"
    assert len(reoon.checked) == emails.MAX_CANDIDATES

    assert emails.resolve_person("Jane Doe", "hosp.org", None, FakeReoon({})) is None


class FakeResponse:
    is_error = False

    def __init__(self, body):
        self.body = body

    def json(self):
        return self.body


class FakeHttp:
    def __init__(self, body):
        self.body = body

    def get(self, url, params):
        return FakeResponse(self.body)


def test_reoon_error_bodies_raise_instead_of_becoming_results():
    with pytest.raises(RuntimeError, match="no_credits"):
        emails.Reoon("k", client=FakeHttp({"status": "error", "reason": "no_credits"})).verify("a@b.org")
    assert emails.Reoon("k", client=FakeHttp({"status": "safe"})).verify("a@b.org") == "safe"
