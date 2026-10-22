from pipeline.screen import excluded, scrape_block, screen_failures

PASSING = {"accepts_imgs": True, "program_open": True, "outreach_allowed": True, "in_country": True,
           "evidence_url": "https://hosp.org/obs", "checked_on": "2026-10-07"}


def test_excluded_matches_the_domain_and_its_subdomains_only():
    exclusions = {"yale.edu": "forbids outreach"}
    assert excluded("https://medicine.yale.edu/x", exclusions) == "forbids outreach"
    assert excluded("yale.edu", exclusions) == "forbids outreach"
    assert excluded("notyale.edu", exclusions) is None


def test_screen_failures_names_each_failed_check():
    assert screen_failures(PASSING) == []
    assert screen_failures(None) == ["not screened"]
    assert screen_failures({**PASSING, "in_country": False, "outreach_allowed": None}) == ["outreach_allowed", "in_country"]


def test_screen_passes_a_page_silent_about_imgs_and_fails_one_that_refuses_them():
    assert screen_failures({**PASSING, "accepts_imgs": False}) == []
    assert screen_failures({**PASSING, "accepts_imgs": False, "refuses_imgs": True}) == ["refuses_imgs"]
    assert screen_failures({**PASSING, "refuses_imgs": False}) == []


def test_scrape_block_needs_a_passing_screen_and_no_exclusion():
    org = {"domain": "hosp.org", "details": {"screen": PASSING}}
    assert scrape_block(org, {}) is None
    assert scrape_block({**org, "details": {}}, {}) == "screen failed: not screened"
    assert scrape_block({**org, "details": None}, {}) == "screen failed: not screened"
    assert scrape_block(org, {"hosp.org": "site is a 404"}) == "excluded: site is a 404"
