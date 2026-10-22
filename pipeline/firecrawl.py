"""Firecrawl v2 client: plain markdown scrapes only (1 credit per page; JSON mode is never used)."""

from typing import Any

import httpx

API = "https://api.firecrawl.dev/v2"


class Firecrawl:
    def __init__(self, api_key: str, client: httpx.Client | None = None):
        self._http = client or httpx.Client(timeout=120)
        self._headers = {"Authorization": f"Bearer {api_key}"}

    def _post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        response = self._http.post(f"{API}{path}", json=body, headers=self._headers)
        if response.is_error:
            raise RuntimeError(f"Firecrawl {path} failed: {response.status_code} {response.text[:300]}")
        return response.json()

    def map(self, url: str, limit: int = 5000) -> list[dict[str, Any]]:
        """List site URLs (1 credit regardless of `limit`). Firecrawl's `search` option filters by text
        match rather than ranking, so relevance is handled locally by `pages.pick_urls`."""
        return self._post("/map", {"url": url, "limit": limit}).get("links", [])

    def scrape_markdown(self, url: str) -> tuple[str, dict[str, Any]]:
        # Full page (headers/footers hold addresses and phones); basic proxy keeps the cost at 1 credit.
        data = self._post("/scrape", {"url": url, "formats": ["markdown"], "onlyMainContent": False,
                                         "proxy": "basic"})["data"]
        return data.get("markdown") or "", data.get("metadata") or {}
