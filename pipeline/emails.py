"""Email pattern inference, candidate generation and Reoon verification."""

import re
import unicodedata
from dataclasses import dataclass

import httpx

# Most common institutional formats first; used when no pattern can be inferred.
PATTERNS = ["{first}.{last}", "{f}{last}", "{first}{last}", "{first}", "{f}.{last}",
            "{first}_{last}", "{last}{f}", "{first}{l}", "{last}.{first}", "{first}-{last}"]
MAX_CANDIDATES = 5
CREDENTIALS = {"md", "do", "phd", "mba", "mph", "mbbs", "facp", "faap", "rn", "ms", "ma", "bsn", "msn", "dnp",
               "jr", "sr", "ii", "iii"}
HONORIFICS = re.compile(r"^(dr|mr|mrs|ms|prof|professor)\.?\s+", re.I)


@dataclass(frozen=True)
class NameParts:
    first: str
    last: str


def split_name(full_name: str) -> NameParts | None:
    text = unicodedata.normalize("NFKD", full_name).encode("ascii", "ignore").decode()
    text = HONORIFICS.sub("", text.split(",")[0].strip())  # credentials usually follow a comma
    tokens = [re.sub(r"[^a-z-]", "", token.lower()) for token in text.split()]
    # Strip trailing credentials only, so surnames such as "Do" or "Ma" survive.
    while len(tokens) > 2 and tokens[-1] in CREDENTIALS:
        tokens.pop()
    tokens = [token for token in tokens if len(token) > 1]  # drops middle initials
    if len(tokens) < 2:
        return None
    return NameParts(first=tokens[0].replace("-", ""), last=tokens[-1].replace("-", ""))


def render(pattern: str, name: NameParts) -> str:
    return pattern.format(first=name.first, last=name.last, f=name.first[0], l=name.last[0])


def infer_pattern(known: list[tuple[str, str]]) -> str | None:
    """Infer the domain's local-part pattern from (full_name, email) pairs published on the site."""
    votes: dict[str, int] = {}
    for full_name, address in known:
        name = split_name(full_name)
        if not name:
            continue
        local = address.split("@")[0].lower()
        for pattern in PATTERNS:
            if render(pattern, name) == local:
                votes[pattern] = votes.get(pattern, 0) + 1
                break
    if not votes:
        return None
    return max(votes, key=lambda pattern: (votes[pattern], -PATTERNS.index(pattern)))


def candidates(full_name: str, domain: str, pattern: str | None) -> list[tuple[str, str]]:
    """Return up to MAX_CANDIDATES (address, pattern) pairs, the inferred pattern first."""
    name = split_name(full_name)
    if not name:
        return []
    order = ([pattern] if pattern else []) + [p for p in PATTERNS if p != pattern]
    result: list[tuple[str, str]] = []
    for item in order:
        address = f"{render(item, name)}@{domain}"
        if address not in (existing for existing, _ in result):
            result.append((address, item))
        if len(result) == MAX_CANDIDATES:
            break
    return result


# Reoon power-mode statuses -> our email_status enum.
REOON_STATUS = {
    "safe": "valid", "role_account": "valid",
    "catch_all": "catch_all",
    "unknown": "unknown", "inbox_full": "unknown",
    "invalid": "invalid", "disabled": "invalid", "disposable": "invalid", "spamtrap": "invalid",
}


def classify_reoon(provider_status: str) -> str:
    return REOON_STATUS[provider_status]


def confidence(kind: str, status: str, pattern_inferred: bool) -> str | None:
    if status == "invalid":
        return None
    if kind in ("published", "generic_inbox"):
        return "high" if status in ("valid", "catch_all", "unchecked") else "medium"
    if status == "valid":
        return "high"
    if status == "catch_all":
        return "medium" if pattern_inferred else "low"
    return "low"


class Reoon:
    URL = "https://emailverifier.reoon.com/api/v1/verify"

    def __init__(self, api_key: str, client: httpx.Client | None = None):
        self._key = api_key
        self._http = client or httpx.Client(timeout=180)
        self.checks = 0

    def verify(self, address: str) -> str:
        """Return Reoon's raw power-mode status for one address."""
        response = self._http.get(self.URL, params={"email": address, "key": self._key, "mode": "power"})
        self.checks += 1
        if response.is_error:
            raise RuntimeError(f"Reoon verify failed: {response.status_code}")
        body = response.json()
        status = str(body.get("status"))
        if status not in REOON_STATUS:  # e.g. {"status": "error", "reason": "..."}: never store as a result
            raise RuntimeError(f"Reoon verify error: {status} {str(body.get('reason', ''))[:200]}")
        return status


def resolve_person(full_name: str, domain: str, pattern: str | None, reoon: Reoon) -> dict | None:
    """Check candidates in order and return the best email row, or None if every candidate is invalid.

    Stops at the first valid address. A catch-all domain accepts every address, so checking further
    candidates spends credits without new information; the first candidate is kept instead.
    """
    fallback: dict | None = None
    for address, used in candidates(full_name, domain, pattern):
        provider_status = reoon.verify(address)
        status = classify_reoon(provider_status)
        row = {"address": address, "kind": "pattern_guess", "pattern_used": used, "status": status,
               "provider_status": provider_status,
               "confidence": confidence("pattern_guess", status, pattern_inferred=pattern is not None)}
        if status in ("valid", "catch_all"):
            return row
        if status == "unknown" and fallback is None:
            fallback = row
    return fallback
