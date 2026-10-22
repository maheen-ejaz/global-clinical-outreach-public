import subprocess
import sys
import json
import struct
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

REPO = Path(__file__).resolve().parent.parent


def test_web_page_matches_the_template():
    result = subprocess.run([sys.executable, str(REPO / "scripts" / "build-web.py"), "--check"],
                            capture_output=True, text=True)
    assert result.returncode == 0, result.stdout


def test_page_loads_only_its_own_scripts():
    page = (REPO / "web" / "index.html").read_text()
    assert "<script>" not in page and "__DATA__" not in page
    headers = (REPO / "web" / "_headers").read_text()
    assert "script-src 'self';" in headers and "frame-ancestors 'none'" in headers


def test_share_preview_and_icons_are_available_without_javascript():
    class Head(HTMLParser):
        def __init__(self):
            super().__init__()
            self.meta = {}
            self.links = {}

        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            if tag == "meta":
                self.meta[attrs.get("property", attrs.get("name"))] = attrs.get("content")
            elif tag == "link":
                self.links.setdefault(attrs.get("rel"), []).append(attrs.get("href"))

    head = Head()
    head.feed((REPO / "web/index.html").read_text().split("</head>")[0])
    meta = head.meta
    assert meta["og:type"] == "website"
    assert meta["og:title"] == meta["twitter:title"] == "Global Clinical Outreach | GooCampus"
    assert meta["description"] == meta["og:description"] == meta["twitter:description"]
    assert 50 < len(meta["description"]) < 160
    assert meta["og:url"] == head.links["canonical"][0] == "https://outreach.goocampusglobal.com/"
    assert meta["og:image"] == meta["og:image:secure_url"] == meta["twitter:image"]
    url = urlparse(meta["og:image"])
    assert url.scheme == "https" and url.netloc == "outreach.goocampusglobal.com"
    png = (REPO / "web" / url.path.lstrip("/")).read_bytes()
    assert png[:8] == b"\x89PNG\r\n\x1a\n"
    assert struct.unpack(">II", png[16:24]) == (int(meta["og:image:width"]), int(meta["og:image:height"])) == (1200, 630)
    assert len(png) < 1_000_000
    assert meta["og:image:type"] == "image/png" and meta["og:image:alt"] == meta["twitter:image:alt"]
    assert meta["twitter:card"] == "summary_large_image"
    assert meta["robots"] == "noindex, nofollow"
    for rel in ["icon", "apple-touch-icon", "manifest"]:
        for href in head.links[rel]:
            assert (REPO / "web" / href.lstrip("/")).is_file()
    manifest = json.loads((REPO / "web/site.webmanifest").read_text())
    assert manifest["start_url"] == "/"
    for icon in manifest["icons"]:
        png = (REPO / "web" / icon["src"].lstrip("/")).read_bytes()
        assert struct.unpack(">II", png[16:24]) == tuple(int(n) for n in icon["sizes"].split("x"))
    assert "manifest-src 'self';" in (REPO / "web/_headers").read_text()
    assert "/site.webmanifest\n  Content-Type: application/manifest+json; charset=utf-8" in (REPO / "web/_headers").read_text()


def test_dashboard_inlines_authoritative_v2_tokens_for_offline_reports():
    source = (REPO / "design/attio-mono-v2/tokens.css").read_text()
    template = (REPO / "scripts/dashboard-template.html").read_text()
    assert source in template
    assert source in (REPO / "web/index.html").read_text()
