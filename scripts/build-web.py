"""Generate the hosted page (web/index.html, web/dashboard.js) from scripts/dashboard-template.html.

    uv run --frozen python scripts/build-web.py          # write the files
    uv run --frozen python scripts/build-web.py --check  # exit 1 when web/ is out of date (tests run this)

The template stays the single source of the dashboard's look and behaviour; this adds the sign-in screen, the batch
picker and sign-out, and moves the script into a file so the Content-Security-Policy (web/_headers) can forbid inline
scripts. web/app.js (sign-in and loading) is written by hand.
"""

import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TEMPLATE = REPO / "scripts" / "dashboard-template.html"
WEB = REPO / "web"

LOGIN_CSS = """/* Sign-in screen (hosted page only). */
[hidden] { display: none !important; }
.login { min-height: 100vh; display: grid; place-items: center; padding: var(--card-padding) var(--page-gutter); }
.login .card { width: 100%; max-width: 420px; padding: var(--card-padding); }
.login form { display: grid; gap: var(--space-3); margin-top: var(--space-4); }
.login input { width: 100%; }
.login .status { min-height: 1.5em; }
.picker { font: inherit; }
</style>"""

LOGIN_HTML = """<main class="login" id="login" hidden>
  <div class="card">
    <div class="caption">GooCampus</div>
    <h1 class="display-lg" style="margin:4px 0 0">Global clinical outreach</h1>
    <p id="loginHelp" class="body-sm muted" style="margin:8px 0 0">Private dashboard. Enter your email and we will send you a sign-in link.</p>
    <form id="loginForm">
      <label class="am-field-label" for="email">Email address</label>
      <input type="email" class="search" id="email" aria-describedby="loginHelp loginStatus" placeholder="you@goocampus.in" autocomplete="email" required>
      <button class="btn primary" type="submit" id="loginBtn">Email me a sign-in link</button>
      <div class="status caption" id="loginStatus" role="status" aria-live="polite"></div>
    </form>
  </div>
</main>

<div class="wrap" id="app" hidden>"""

SCRIPTS = """<div class="caption" id="bootStatus" style="padding:24px 16px" role="status" aria-live="polite">Loading…</div>
<script src="vendor/supabase-2.45.4.js"></script>
<script src="dashboard.js"></script>
<script src="outreach-model.js"></script>
<script src="outreach.js"></script>
<script src="app.js"></script>"""

# Public, stable metadata belongs only to the hosted page, never the offline batch reports.
# Keep the social image versioned so a new design gets a fresh crawler cache key.
SHARING_HEAD = """<title>Global Clinical Outreach | GooCampus</title>
<meta name="description" content="GooCampus's private workspace for researching clinical programmes, reviewing provider contacts, and preparing global outreach.">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="https://outreach.goocampusglobal.com/">
<meta name="application-name" content="GooCampus Outreach">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f0f11" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="GooCampus">
<meta property="og:locale" content="en_GB">
<meta property="og:title" content="Global Clinical Outreach | GooCampus">
<meta property="og:description" content="GooCampus's private workspace for researching clinical programmes, reviewing provider contacts, and preparing global outreach.">
<meta property="og:url" content="https://outreach.goocampusglobal.com/">
<meta property="og:image" content="https://outreach.goocampusglobal.com/assets/social-card-v1.png">
<meta property="og:image:secure_url" content="https://outreach.goocampusglobal.com/assets/social-card-v1.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="GooCampus Global clinical outreach, with a blue globe and connected points on a pale background.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Global Clinical Outreach | GooCampus">
<meta name="twitter:description" content="GooCampus's private workspace for researching clinical programmes, reviewing provider contacts, and preparing global outreach.">
<meta name="twitter:image" content="https://outreach.goocampusglobal.com/assets/social-card-v1.png">
<meta name="twitter:image:alt" content="GooCampus Global clinical outreach, with a blue globe and connected points on a pale background.">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48 64x64">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/site.webmanifest">"""


def replace_once(text: str, old: str, new: str) -> str:
    if text.count(old) != 1:
        raise SystemExit(f"template changed, expected exactly one: {old[:70]!r}")
    return text.replace(old, new)


def build(template: str) -> tuple[str, str]:
    page = replace_once(template, "<title>Clinical Outreach Pilot</title>", SHARING_HEAD)
    page = replace_once(page, "</style>", LOGIN_CSS + '\n<link rel="stylesheet" href="outreach.css">')
    page = replace_once(page, '  </nav>', '    <button class="tab" role="tab" id="tab-outreach" aria-controls="panel-outreach" aria-selected="false" tabindex="-1">Outreach</button>\n  </nav>')
    page = replace_once(page, '  <div id="panel-overview"', (WEB / "outreach-panel.html").read_text() + '\n  <div id="panel-overview"')
    page = replace_once(page, '    <section class="card figures-card section"><div class="figures" id="kpis"></div></section>',
                        (WEB / "outreach-overview.html").read_text() +
                        '    <section class="card figures-card section"><div class="figures" id="kpis"></div></section>')
    # The executive summary shows only when the batch has authored text (meta.summary).
    start = page.index('<section class="card section figures-card" aria-labelledby="exec-title">')
    end = page.index("</section>", page.index('<div class="summary" id="execSummary">', start))
    page = (page[:start] + '<section class="card section figures-card" aria-labelledby="exec-title" id="execSection" '
            'hidden>\n    <div class="card-head"><div><div class="caption">Executive summary</div><h2 class="title" '
            'id="exec-title">How much we can trust the data we collected</h2></div></div>\n    <div class="summary" '
            'id="execSummary"></div>\n  ' + page[end:])
    page = replace_once(page, '<div class="wrap">', LOGIN_HTML)
    page = replace_once(page, '        <span class="actions" id="batchPicker"></span>',
                        '        <span class="actions" id="batchPicker"><select class="btn picker" id="batchPick" '
                        'aria-label="Research detail batch"></select></span>')
    page = replace_once(page, '      <button class="btn primary" id="export">Download all ready emails</button>',
                        '      <button class="btn primary" id="export">Download all ready emails</button>\n'
                        '      <button class="btn" id="signOut">Sign out</button>')
    s0, s1 = page.index('<script id="data"'), page.index("</script>\n</body>") + len("</script>")
    inline = page[s0:s1]
    page = page[:s0] + SCRIPTS + page[s1:]

    script = inline[inline.index("<script>\n") + len("<script>\n"):inline.rindex("</script>")]
    script = replace_once(script, """(() => {
  const DATA = JSON.parse(document.getElementById("data").textContent);
  const OVERVIEW = DATA;
  const DETAIL = DATA;
  const DETAIL_LABEL = null;""", """// GENERATED by scripts/build-web.py from scripts/dashboard-template.html; edit the template, not this file.
// Renders the all-batches overview and one selected research detail snapshot after sign-in.
window.renderDashboard = (OVERVIEW_DATA, DETAIL_DATA, DETAIL_LABEL) => {
  const OVERVIEW = OVERVIEW_DATA;
  const DETAIL = DETAIL_DATA || OVERVIEW_DATA;
  const DATA = DETAIL;""")
    script = replace_once(script, "})();\n", "};\n")
    script = replace_once(script, """    if (S) {
      if (S.heading)""", """    if (S) {
      document.getElementById("execSection").hidden = false;
      if (S.heading)""")
    page = replace_once(page, "<!doctype html>", "<!doctype html>\n<!-- GENERATED by scripts/build-web.py from "
                        "scripts/dashboard-template.html; edit the template, not this file. -->")
    return page, script


def main() -> int:
    page, script = build(TEMPLATE.read_text())
    outputs = {WEB / "index.html": page, WEB / "dashboard.js": script}
    if "--check" in sys.argv:
        stale = [str(path.relative_to(REPO)) for path, text in outputs.items()
                 if not path.exists() or path.read_text() != text]
        if stale:
            print("out of date, run scripts/build-web.py:", ", ".join(stale))
            return 1
        return 0
    for path, text in outputs.items():
        path.write_text(text)
        print(f"wrote {path.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
