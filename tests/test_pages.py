from pipeline.pages import domain_of, pick_urls, plan_for, site_root, storage_path


def test_domain_of_strips_www_and_case():
    assert domain_of("https://WWW.Example.org/path") == "example.org"
    assert domain_of("example.org") == "example.org"


def test_pick_urls_prefers_one_page_per_kind_and_skips_noise():
    links = [
        {"url": "https://example.org/observership-program", "title": "International Observership"},
        {"url": "https://example.org/observership-fees"},
        {"url": "https://example.org/contact-us"},
        {"url": "https://example.org/about/leadership", "title": "Leadership team"},
        {"url": "https://example.org/files/brochure.pdf"},
        {"url": "https://other.com/observership"},
        {"url": "https://notexample.org/observership"},
        {"url": "https://example.org/careers"},
        {"url": "https://example.org/news"},
    ]
    picked = pick_urls("https://example.org/", links, limit=6)
    urls = [url for url, _ in picked]
    assert picked[0] == ("https://example.org", "home")
    assert ("https://example.org/observership-program", "program") in picked
    assert any(kind == "contact" for _, kind in picked)
    assert any(kind == "people" for _, kind in picked)
    assert "https://example.org/files/brochure.pdf" not in urls
    assert "https://other.com/observership" not in urls
    assert "https://notexample.org/observership" not in urls
    assert "https://example.org/careers" not in urls
    assert len(picked) <= 6


def test_pick_urls_allows_subdomains_and_respects_limit():
    links = [{"url": f"https://med.example.edu/elective-{n}"} for n in range(10)]
    assert len(pick_urls("https://example.edu", links, limit=3)) == 3


def test_storage_path_is_stable_and_scoped_to_domain():
    first = storage_path("example.org", "https://example.org/Observership/Apply")
    assert first == storage_path("example.org", "https://example.org/Observership/Apply")
    assert first.startswith("example.org/observership-apply-") and first.endswith(".md")


def test_pick_urls_prefers_pages_near_the_program_page():
    home = "https://med.example.edu/md/visitors/intl"
    links = [
        {"url": "https://med.example.edu/contact"},
        {"url": "https://med.example.edu/md/visitors/contact-us"},
        {"url": "https://med.example.edu/admissions/apply"},
        {"url": "https://med.example.edu/md/visitors/intl/apply"},
    ]
    picked = {kind: url for url, kind in pick_urls(home, links, limit=3)}
    assert picked["contact"] == "https://med.example.edu/md/visitors/contact-us"
    assert picked["apply"] == "https://med.example.edu/md/visitors/intl/apply"


def test_site_root_drops_path_and_query():
    assert site_root("https://www.example.org/a/b?c=1") == "https://www.example.org"


def test_pick_urls_stays_inside_the_program_section_on_large_sites():
    home = "https://www.hosp.org/hospital-medicine/education/observership"
    links = [
        {"url": "https://www.hosp.org/health/conditions/contact-dermatitis"},
        {"url": "https://www.hosp.org/wilmer/about/employees"},
        {"url": "https://www.hosp.org/hospital-medicine/contact"},
        {"url": "https://www.hosp.org/hospital-medicine/education/observership/faculty"},
    ]
    urls = [url for url, _ in pick_urls(home, links)]
    assert "https://www.hosp.org/health/conditions/contact-dermatitis" not in urls
    assert "https://www.hosp.org/wilmer/about/employees" not in urls
    assert "https://www.hosp.org/hospital-medicine/contact" in urls
    assert "https://www.hosp.org/hospital-medicine/education/observership/faculty" in urls
    # Homepage starts keep the whole site.
    assert "https://www.hosp.org/health/conditions/contact-dermatitis" in [u for u, _ in pick_urls("https://www.hosp.org", links)]


def test_pick_urls_follows_the_provider_type_plan():
    links = [
        {"url": "https://co.example/clinical-rotations"},
        {"url": "https://co.example/our-team"},
        {"url": "https://co.example/pricing"},
        {"url": "https://co.example/how-to-apply"},
        {"url": "https://co.example/contact"},
    ]
    # With room for three pages, a placement company gets pricing; a community hospital gets its staff.
    assert [kind for _, kind in pick_urls("https://co.example", links, 3, "placement_company")] == ["home", "program", "fees"]
    assert [kind for _, kind in pick_urls("https://co.example", links, 3, "community")] == ["home", "program", "people"]
    assert len(pick_urls("https://co.example", links)) == 6  # default limit 8 takes every match


def test_plan_lists_every_kind_once_and_fee_pages_are_their_own_kind():
    from pipeline.pages import PAGE_KINDS, classify
    for provider_type in ("academic", "community", "placement_company", "fellowship", None):
        assert sorted(plan_for(provider_type)) == sorted(kind for kind, _ in PAGE_KINDS)
    assert classify({"url": "https://x.org/observership/tuition-and-fees"})[0] == "fees"
    assert classify({"url": "https://x.org/tuition-and-fees"})[0] == "fees"
    assert classify({"url": "https://x.org/news-updates"})[0] == "news"
    assert classify({"url": "https://x.org/observership/contact"}) == ("program", 1)


def test_page_pick_record_counts_matching_pages_left_unread():
    from pipeline.pages import page_pick_record
    links = [{"url": f"https://h.org/observership-{n}"} for n in range(5)] + [{"url": "https://h.org/careers"}]
    picked = pick_urls("https://h.org", links, 3)
    assert page_pick_record("https://h.org", links, picked, 3) == {"limit": 3, "matching": 6, "read": 3, "unread": 3}
    picked = pick_urls("https://h.org", links, 8)
    assert page_pick_record("https://h.org", links, picked, 8) == {"limit": 8, "matching": 6, "read": 6, "unread": 0}
