import json

import pytest

from pipeline import targeting
from pipeline.load import InvalidFile, validate

HIGH = targeting.load_profile("high-hit-rate")
BULK = targeting.load_profile("bulk-send")


def lead(**overrides):
    base = dict(domain="hosp.org", name="Hosp", provider_type="community", accepts_imgs=True, img_fit=4, priority=2,
                contacts=[{"name": "Ann Lee", "title": "Coordinator", "email": "ann@hosp.org", "check": "verified", "kind": "published"}])
    return targeting.Lead(**{**base, **overrides})


def test_tracked_profiles_are_valid():
    assert targeting.profile_names() == ["broad", "bulk-send", "high-hit-rate"]
    for name in targeting.profile_names():
        assert targeting.load_profile(name)["name"]
    with pytest.raises(FileNotFoundError, match="available: broad, bulk-send, high-hit-rate"):
        targeting.load_profile("nope")


def test_ready_needs_imgs_a_named_person_and_a_verified_or_likely_email():
    result = targeting.evaluate(lead(), HIGH)
    assert result["ready"] and result["best_contact"]["email"] == "ann@hosp.org"
    assert result["reasons"] == ["verified personal email", "preferred type (community)", "IMG fit 3 or higher"]
    assert targeting.evaluate(lead(accepts_imgs=None), HIGH)["missing"] == ["not confirmed to accept IMGs"]
    unconfirmed = lead(contacts=[{**lead().contacts[0], "check": "unconfirmed"}])
    assert targeting.evaluate(unconfirmed, HIGH)["missing"] == ["no email that is verified or likely"]
    inbox_only = lead(contacts=[], inboxes=[{"email": "info@hosp.org", "check": "verified"}])
    assert targeting.evaluate(inbox_only, HIGH)["missing"] == ["no named person with an email"]
    # The broad profile accepts the same inbox: profiles change ranking, never the data.
    assert targeting.evaluate(inbox_only, targeting.load_profile("broad"))["ready"]


def test_preferences_only_add_points_and_exclusions_win():
    plain = targeting.evaluate(lead(provider_type="academic", img_fit=2), HIGH)
    best = targeting.evaluate(lead(open_to_partnerships=True, contactable=True, catch_all_domain=False,
                                   source_kind="img_directory"), HIGH)
    assert plain["ready"] and best["score"] > plain["score"]
    blocked = targeting.evaluate(lead(do_not_contact=True), HIGH)
    assert blocked["excluded"] == ["site forbids outreach"] and not blocked["ready"]


def test_rank_puts_ready_then_score_then_priority():
    results = [targeting.evaluate(item, HIGH) for item in (
        lead(name="Excluded", do_not_contact=True), lead(name="Not ready", accepts_imgs=False),
        lead(name="Likely", contacts=[{**lead().contacts[0], "check": "likely"}]), lead(name="Verified"))]
    assert [r["name"] for r in targeting.rank(results)] == ["Verified", "Likely", "Not ready", "Excluded"]


def test_from_snapshot_and_from_db_agree():
    snapshot = {"domain": "hosp.org", "name": "Hosp", "type": "community", "accepts_imgs": True, "img_score": 4,
                "priority": 2, "caution": None, "people": [{"name": "Ann Lee", "title": "Coordinator"}],
                "emails": [{"address": "ann@hosp.org", "kind": "published", "status": "valid", "person": "Ann Lee"},
                           {"address": "x@hosp.org", "kind": "generic_inbox", "status": "invalid", "person": None}],
                "partnership": {"open": True}}
    org = {"domain": "hosp.org", "name": "Hosp", "provider_type": "community", "accepts_imgs": True,
           "img_friendliness_score": 4, "priority_score": 2, "details": {}}
    db_lead = targeting.from_db(org, [{"id": "p", "full_name": "Ann Lee", "title": "Coordinator"}],
                                [{"address": "ann@hosp.org", "kind": "published", "status": "valid", "person_id": "p"}],
                                {"open": True})
    assert targeting.from_snapshot(snapshot) == db_lead


def test_profile_schema_rejects_unknown_keys():
    with pytest.raises(InvalidFile):
        validate({"name": "x", "description": "y", "require": {"email_check": ["perfect"]}}, "targeting.schema.json")
    with pytest.raises(InvalidFile):
        validate({**json.loads(json.dumps(HIGH)), "block_scraping": True}, "targeting.schema.json")


def test_guessed_addresses_on_catch_all_servers_are_unconfirmed():
    assert targeting.email_check("catch_all", "pattern_guess") == "unconfirmed"
    assert targeting.email_check("catch_all", "published") == "likely"
    assert targeting.email_check("valid", "pattern_guess") == "verified"
    org = {"domain": "ace.md", "name": "ACE", "provider_type": "placement_company", "accepts_imgs": True,
           "img_friendliness_score": 5, "priority_score": 1, "details": {}}
    guess = targeting.from_db(org, [{"id": "p", "full_name": "Jon Bernad", "title": "Founder"}],
                              [{"address": "jon@ace.md", "kind": "pattern_guess", "status": "catch_all", "person_id": "p"}])
    assert targeting.evaluate(guess, HIGH)["missing"] == ["no email that is verified or likely"]


def test_named_person_ignores_inboxes_even_when_contacts_fail_the_check():
    weak = lead(contacts=[{**lead().contacts[0], "check": "unconfirmed"}], inboxes=[{"email": "info@hosp.org", "check": "verified"}])
    result = targeting.evaluate(weak, HIGH)
    assert not result["ready"] and result["best_contact"] is None


def test_bulk_send_takes_inboxes_and_published_emails_but_never_guesses():
    inbox = lead(contacts=[], accepts_imgs=None,
                 inboxes=[{"email": "observers@hosp.org", "check": "unconfirmed", "kind": "generic_inbox"}])
    result = targeting.evaluate(inbox, BULK)
    assert result["ready"] and result["best_contact"]["check"] == "published"
    assert result["reasons"][0] == "published shared inbox email"
    guess = lead(contacts=[{**lead().contacts[0], "check": "unconfirmed", "kind": "pattern_guess"}])
    assert targeting.evaluate(guess, BULK)["missing"] == ["no email that is verified or likely or published"]
    # A checked address beats a merely published one.
    both = lead(inboxes=[{"email": "info@hosp.org", "check": "unconfirmed", "kind": "generic_inbox"}])
    assert targeting.evaluate(both, BULK)["best_contact"]["email"] == "ann@hosp.org"


def test_bulk_send_leaves_off_only_providers_that_refuse_imgs_or_forbid_outreach():
    assert targeting.evaluate(lead(accepts_imgs=None), BULK)["ready"]
    refused = targeting.evaluate(lead(accepts_imgs=False), BULK)
    assert refused["excluded"] == ["does not take international graduates"] and not refused["ready"]
    assert targeting.evaluate(lead(do_not_contact=True), BULK)["excluded"] == ["site forbids outreach"]


def test_screen_block_names_the_failed_checks():
    assert targeting.screen_block([]) is None
    assert targeting.screen_block(["refuses_imgs", "program_open"]) == "screen failed: refuses_imgs, program_open"
