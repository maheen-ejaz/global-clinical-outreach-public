"""Screen providers before paying to read their sites, and keep a list of providers not to research.

Lessons from us-pilot-01: about a third of the batch was low-value or not viable (applications
suspended, partner-schools only, outreach forbidden, dead site, wrong country), and each one cost map
and scrape credits before anyone noticed. Every provider now needs a passing screen, made from one
page, before `outreach scrape` will touch it.
"""

from .pages import domain_of, same_site

# These must be true, each judged from the page at `evidence_url`. `accepts_imgs` is recorded but does not gate:
# since bulk sending (2026-10-08) a page that is silent about IMGs passes, and only `refuses_imgs` fails.
SCREEN_CHECKS = ("program_open", "outreach_allowed", "in_country")


def excluded(domain: str, exclusions: dict[str, str]) -> str | None:
    """Reason when `domain` (or a parent domain) is excluded, else None."""
    domain = domain_of(domain)
    return next((reason for blocked, reason in exclusions.items() if same_site(domain, blocked)), None)


def screen_failures(screen: dict | None) -> list[str]:
    """Names of the checks that did not pass; ["not screened"] when there is no screen at all."""
    if not screen:
        return ["not screened"]
    failures = [check for check in SCREEN_CHECKS if screen.get(check) is not True]
    return failures + ["refuses_imgs"] if screen.get("refuses_imgs") is True else failures


def scrape_block(org: dict, exclusions: dict[str, str]) -> str | None:
    """Why `outreach scrape` must not read this provider's site, or None when it may."""
    reason = excluded(org["domain"], exclusions)
    if reason:
        return f"excluded: {reason}"
    failures = screen_failures((org.get("details") or {}).get("screen"))
    if failures:
        return "screen failed: " + ", ".join(failures)
    return None
