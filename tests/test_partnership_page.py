"""Protect the marketing/prospect boundary and the supplied CSS isolation."""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("partnership_build", ROOT / "scripts/build-partnership-page.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


def test_token_adaptation_does_not_emit_global_selectors():
    source = (build.PAGE / "vendor/attio-mono-v2/tokens.css").read_text()
    scoped = build.scoped_tokens(source)
    assert "\n:root {" not in scoped
    assert "\nbody {" not in scoped
    assert "\nh1, h2, h3, h4 {" not in scoped
    assert "\n:focus-visible {" not in scoped
    assert "\n.display-xl {" not in scoped
    assert "\n.am-button {" not in scoped
    assert ".gc-clinical-partnerships .gc-clinical-partnerships" not in scoped
    assert ".gc-clinical-partnerships .body { font-family:" in scoped
    assert ".gc-clinical-partnerships .am-button {" in scoped
    assert ".gc-clinical-partnerships .am-input {" in scoped
    assert ".gc-clinical-partnerships .am-floating {" in scoped
    assert ".gc-clinical-partnerships .am-reading {" in scoped
    assert '.gc-clinical-partnerships[data-theme="dark"] {' in scoped
    assert '.gc-clinical-partnerships:not([data-theme="light"]) {' in scoped
    assert ':is(.gc-clinical-partnerships, .gc-clinical-partnerships *)[data-accent="on"]' in scoped
    assert "@media (prefers-reduced-motion: reduce)" in scoped
    for line in source.splitlines():
        if line.strip().startswith("--"):
            assert line in scoped


def test_selector_scoping_handles_groups_and_nested_media():
    scoped = build.scoped_tokens(
        ':root { --ink: #18181b; }\n'
        '[data-accent="on"], .am-button:hover, .am-input:focus-visible { color: var(--ink); }\n'
        '@media (min-width: 768px) { body, h1, h2 { color: var(--ink); } }\n'
    )
    assert '.gc-clinical-partnerships { --ink: #18181b; }' in scoped
    assert ':is(.gc-clinical-partnerships, .gc-clinical-partnerships *)[data-accent="on"], ' in scoped
    assert '.gc-clinical-partnerships .am-button:hover, .gc-clinical-partnerships .am-input:focus-visible' in scoped
    assert '@media (min-width: 768px) { .gc-clinical-partnerships, .gc-clinical-partnerships h1, .gc-clinical-partnerships h2' in scoped


def test_publish_output_excludes_reference_and_research_files(tmp_path, monkeypatch):
    page = tmp_path / "page"
    (page / "vendor/attio-mono-v2").mkdir(parents=True)
    (page / "assets/css").mkdir(parents=True)
    (page / "vendor/attio-mono-v2/tokens.css").write_text(":root { --ink: #18181b; }")
    for name in ("index.html", "_headers", "robots.txt", "HANDOFF.md", "private-prospect.json"):
        (page / name).write_text(name)
    monkeypatch.setattr(build, "PAGE", page)
    monkeypatch.setattr(build, "ROOT", tmp_path)
    build.build()
    assert {p.name for p in (page / "dist").iterdir()} == {"index.html", "_headers", "robots.txt", "assets"}
