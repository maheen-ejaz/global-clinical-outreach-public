"""Choose which mapped URLs of a provider site are worth scraping."""

import hashlib
import re
from urllib.parse import urlparse

# (page kind, keywords matched against URL path + title + description); earlier kinds win ties.
PAGE_KINDS: list[tuple[str, tuple[str, ...]]] = [
    ("program", ("observership", "elective", "externship", "visiting-student", "visiting student",
                 "international-medical", "international medical", "img", "fellowship", "clinical-rotation",
                 "clinical rotation", "usce", "clerkship", "away-rotation", "vslo", "clinical-attachment",
                 "clinical attachment", "placement", "plab", "amc", "nzrex")),
    ("fees", ("fee", "tuition", "cost", "pricing", "price", "payment")),
    ("apply", ("apply", "application", "deadline", "key-dates", "important-dates", "eligibility", "requirement", "faq")),
    ("people", ("staff", "team", "leadership", "faculty", "directory", "our-people", "about-us/people",
                "program-director", "coordinator", "founder", "graduate-medical-education",
                "medical-education", "medical education", "gme")),
    ("contact", ("contact",)),
    ("international", ("international", "global-health", "global health")),
    ("news", ("news", "press", "media", "announcement")),
]
# Which pages to look for first, per provider type (us-pilot-01: fees, deadlines and staff were on
# deeper pages that the homepage-first pick missed). Kinds not listed follow in PAGE_KINDS order.
PAGE_PLAN: dict[str, tuple[str, ...]] = {
    "academic": ("program", "apply", "fees", "people", "contact", "international"),
    "community": ("program", "people", "apply", "fees", "contact"),
    "placement_company": ("program", "fees", "apply", "people", "contact"),
    "fellowship": ("program", "people", "apply", "fees", "contact"),
}
SKIP = re.compile(r"\.(pdf|jpg|jpeg|png|gif|zip|docx?)$|/(login|signin|cart|privacy|terms|careers|jobs)\b", re.I)


def domain_of(url: str) -> str:
    host = urlparse(url if "://" in url else f"https://{url}").hostname or ""
    return host.lower().removeprefix("www.")


def site_root(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def same_site(domain: str, home_domain: str) -> bool:
    return domain == home_domain or domain.endswith(f".{home_domain}")


def classify(link: dict) -> tuple[str, int] | None:
    text = " ".join(str(link.get(key) or "") for key in ("url", "title", "description")).lower()
    best: tuple[str, int] | None = None
    for kind, words in PAGE_KINDS:
        hits = sum(1 for word in words if word in text)
        if hits and (best is None or hits > best[1]):
            best = (kind, hits)
    return best


def _rank(kind: str) -> int:
    return next(i for i, (name, _) in enumerate(PAGE_KINDS) if name == kind)


def distance(url: str, home_url: str) -> int:
    """Path segments between `url` and the program page: pages near it on large sites rank first."""
    home = [part for part in urlparse(home_url).path.lower().split("/") if part]
    path = [part for part in urlparse(url).path.lower().split("/") if part]
    shared = 0
    for a, b in zip(home, path):
        if a != b:
            break
        shared += 1
    return len(home) - shared


def outside_section(url: str, home_url: str) -> bool:
    """True when the program page is inside a site section and `url` shares none of its path.

    Large institutional sites otherwise yield unrelated pages that merely match a keyword.
    """
    home = [part for part in urlparse(home_url).path.lower().split("/") if part]
    return bool(home) and distance(url, home_url) == len(home)


def plan_for(provider_type: str | None) -> list[str]:
    planned = list(PAGE_PLAN.get(provider_type or "", ()))
    return planned + [kind for kind, _ in PAGE_KINDS if kind not in planned]


def pick_urls(home_url: str, links: list[dict], limit: int = 8,
              provider_type: str | None = None) -> list[tuple[str, str]]:
    """Return up to `limit` (url, page_kind) pairs: the home page plus the best page of each kind first.

    Kinds are filled in the provider type's PAGE_PLAN order. Within a kind, pages closest to the
    program page win, then pages matching more keywords.
    """
    scored = _candidates(home_url, links)
    picked: list[tuple[str, str]] = [(home_url.rstrip("/"), "home")]
    # First pass: best page of each kind, in plan order. Second pass: fill remaining slots by score.
    for kind in plan_for(provider_type):
        best = next((url for _, _, _, url, found in scored if found == kind
                     and all(url != chosen for chosen, _ in picked)), None)
        if best and len(picked) < limit:
            picked.append((best, kind))
    for _, _, _, url, kind in scored:
        if len(picked) >= limit:
            break
        if all(url != chosen for chosen, _ in picked):
            picked.append((url, kind))
    return picked


def page_pick_record(home_url: str, links: list[dict], picked: list, limit: int) -> dict:
    """What the page limit cost on one site: matching pages found (home included) vs pages read."""
    matching = 1 + sum(1 for *_, url, _ in _candidates(home_url, links) if url != home_url.rstrip("/"))
    return {"limit": limit, "matching": matching, "read": len(picked), "unread": max(matching - len(picked), 0)}


def _candidates(home_url: str, links: list[dict]) -> list[tuple[int, int, int, str, str]]:
    """Same-site pages matching a page kind, best first: (kind rank, distance, -hits, url, kind)."""
    home_domain = domain_of(home_url)
    scored: list[tuple[int, int, int, str, str]] = []
    seen: set[str] = set()
    for link in links:
        url = str(link.get("url") or "").split("#")[0].rstrip("/")
        if not url or url in seen or SKIP.search(url) or not same_site(domain_of(url), home_domain):
            continue
        seen.add(url)
        if outside_section(url, home_url):
            continue
        match = classify(link)
        if match:
            scored.append((_rank(match[0]), distance(url, home_url), -match[1], url, match[0]))
    return sorted(scored)


def content_hash(markdown: str) -> str:
    return hashlib.sha256(markdown.encode()).hexdigest()


def storage_path(domain: str, url: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", urlparse(url).path.lower()).strip("-") or "home"
    return f"{domain}/{slug[:80]}-{hashlib.sha1(url.encode()).hexdigest()[:8]}.md"
