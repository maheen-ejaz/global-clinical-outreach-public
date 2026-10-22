"""Combined final report of every batch: data/reports/final-report.html (local file, never published).

    uv run --frozen python scripts/build-final-report.py

The funnels and the comparison table below are written in by hand: update them after each batch. The ready table
is built from the local dashboard snapshots (data/reports/<batch>-dashboard-data.json) with the bulk-send rules.
The hosted page (web/, "All batches") computes its own figures from the database instead.
"""
import html, re
from pathlib import Path
REPO = Path(__file__).resolve().parent.parent
R = REPO / "data" / "reports"
tpl = (REPO / "scripts" / "dashboard-template.html").read_text()
style = tpl[tpl.index("<style>"):tpl.index("</style>") + len("</style>")]
head = tpl[:tpl.index("<style>")].replace("<title>Clinical Outreach Pilot</title>", "<title>Clinical Outreach: Final Report</title>")

def hl(t):  # **x** -> highlighted number; everything else escaped
    return re.sub(r"\*\*(.+?)\*\*", r'<mark class="hl">\1</mark>', html.escape(t))

def funnel(stages):
    top = stages[0][1]; out = []
    for i, (name, n) in enumerate(stages):
        lost = f'<span class="lost">−{stages[i-1][1]-n}</span>' if i and stages[i-1][1] > n else ""
        final = " final" if i == len(stages) - 1 else ""
        out.append(f'<div class="funnel-row{final}"><span class="ink body-sm">{html.escape(name)}</span>'
                   f'<span class="bar-zone"><span class="bar" style="width:{100*n/top:.1f}%"></span></span>'
                   f'<span class="count label">{n}{lost}</span></div>')
    return '<div class="funnel">' + "".join(out) + "</div>"

STAGES = ["Discovered", "Website read", "Has a usable email", "Ready to email"]
pilot_f = list(zip(STAGES, [24, 23, 16, 13]))
b2_f = list(zip(STAGES, [24, 23, 20, 18]))
b3_f = list(zip(STAGES, [50, 50, 48, 46]))

rows = [  # (measure, pilot, batch 2, batch 3)
 ("Providers researched", "24", "24", "50"),
 ("Kinds of provider", "8 universities, 6 placement companies, 5 community hospitals, 5 fellowships", "13 university teaching hospitals, 11 community hospitals", "42 university departments and teaching hospitals, 5 community providers, 3 fellowships"),
 ("Providers with a programme on record", "21", "21", "50"),
 ("Programmes captured", "44", "23", "66"),
 ("Programmes that state a fee (or say free)", "14 of 44", "11 of 23", "20 of 66"),
 ("Programmes that give an application window", "19 of 44", "20 of 23", "31 of 66"),
 ("Providers with a full address", "15", "11", "36"),
 ("People found", "58", "46", "89"),
 ("Providers with a chosen contact person", "10", "16", "43"),
 ("Email addresses collected", "33", "48", "100"),
 ("Addresses that passed our email check", "18", "13", "42"),
 ("Addresses on servers that accept every address", "6", "25", "34"),
 ("Providers with at least one verified email", "10", "11", "27"),
 ("Ready to email (current rules)", "13 of 24 (54%)", "18 of 24 (75%)", "46 of 50 (92%)"),
 ("Ready under the earlier, stricter rules", "3 of 24", "6 of 24", "27 of 50"),
 ("Web pages read", "195", "154", "about 300"),
 ("Emails checked", "61", "148", "187"),
]
table = "".join(f"<tr><td>{html.escape(a)}</td><td>{html.escape(b)}</td><td>{html.escape(c)}</td><td>{html.escape(d)}</td></tr>" for a, b, c, d in rows)

# The ready list comes from the dashboard snapshots, ranked by the same rules as the team dashboards.
import json, sys
sys.path.insert(0, str(REPO))
from pipeline import targeting
from pipeline.load import load_exclusions
from pipeline.screen import excluded
PROFILE = targeting.load_profile("bulk-send")
EXCLUSIONS = load_exclusions()
ready = []
for batch, label in (("us-03", "Batch 3"), ("us-02", "Batch 2"), ("us-pilot-01", "Pilot")):
    snap = json.loads((R / f"{batch}-dashboard-data.json").read_text())
    found = []
    for o in snap["orgs"]:
        r = targeting.apply_exclusion(targeting.evaluate(targeting.from_snapshot(o), PROFILE), excluded(o["domain"], EXCLUSIONS))
        failures = o.get("screen_failures") or (["screen"] if o.get("screen_failed") else [])
        failures = [f for f in failures if f != "accepts_imgs"]  # no longer gates the screen (2026-10-08)
        r = targeting.apply_exclusion(r, targeting.screen_block(failures), label="not viable")
        if r["ready"]:
            c = r["best_contact"]
            found.append((-r["score"], label, o["name"], o["programs"][0]["name"] if o["programs"] else "Not captured",
                          c.get("name") or "Shared inbox", c["check"].capitalize()))
    ready += [row[1:] for row in sorted(found)]
chip = {"Verified": "good", "Likely": "warn", "Published": "warn"}
ready_rows = "".join(f'<tr><td>{html.escape(a)}</td><td>{html.escape(b)}</td><td>{html.escape(c)}</td><td>{html.escape(d)}</td>'
                     f'<td><span class="chip {chip[e]} dot">{e}</span></td></tr>' for a, b, c, d, e in ready)

findings = [
 "With the current rules, **77 of 98** providers are ready to email: **13** pilot, **18** batch 2 and **46** batch 3",
 "Batch 3 was the strongest yet: **46 of 50** ready (**92%**), against **54%** and **75%** in the first two batches",
 "Two changes did most of that: we now read a provider when its page simply doesn't mention international graduates, and we started from specialty lists that name each programme's contacts",
 "A list of ENT observerships published by the specialty's national society gave **12** providers, every one with named contacts; **9 of 12** are ready even under the stricter rules",
 "Community hospitals are now scarce in the US: only **5 of 50** in batch 3, after about **75** checked in batch 2; most new leads are university departments",
 "**15** providers were turned away in batch 3 before we read their sites: a dead site, one that forbids contacting staff, ones that refuse international graduates, and ones open only to partners or invitees",
 "Emails are still the weak spot: **34 of 100** batch 3 addresses sit on mail servers that accept every address, so delivery can't be confirmed in advance",
 "Every name and email in batch 3 was checked against the page it came from: **164 of 164** match",
]
nexts = [
 "Start emailing the **77** ready providers, Verified first; watch for bounces from Published addresses",
 "Note two batch 3 cautions before writing: CHOP says its observerships must not be used toward US residency, and Children's Hospital Los Angeles takes only doctors practising or training abroad",
 "Choose the next target: more US specialty lists, or the first UK, Australia or New Zealand batch",
 "Decide whether placement companies are partners or competitors before including them again",
]
li = lambda xs: "".join(f"<li>{hl(x)}</li>" for x in xs)

body = f"""<body>
<div class="wrap">
  <header class="page-head">
    <div>
      <h1 class="display-lg">Global clinical outreach <span class="faint">Final report</span></h1>
      <div class="caption muted">All three research batches · 98 US providers · data as of 8 Oct 2026</div>
    </div>
    <div class="actions">
      <button class="btn" id="theme">Switch theme</button>
      <a class="btn" href="us-pilot-01-dashboard.html">Open pilot dashboard</a>
      <a class="btn" href="us-02-dashboard.html">Open batch 2 dashboard</a>
      <a class="btn primary" href="us-03-dashboard.html">Open batch 3 dashboard</a>
    </div>
  </header>

  <section class="card figures-card section"><div class="figures">
    <div class="figure"><div class="v">98</div><div class="l label">Providers researched</div><div class="caption muted">24, 24 and 50 across the three batches</div></div>
    <div class="figure"><div class="v">133</div><div class="l label">Programmes captured</div><div class="caption muted">Observerships, electives and fellowships</div></div>
    <div class="figure key"><div class="v">77</div><div class="l label">Ready to email: 13 pilot + 18 batch 2 + 46 batch 3</div></div>
    <div class="figure"><div class="v">193</div><div class="l label">People found</div><div class="caption muted">Each linked to its source page</div></div>
    <div class="figure"><div class="v">~650</div><div class="l label">Web pages read</div><div class="caption muted">About 13% of one month's allowance</div></div>
    <div class="figure"><div class="v">396</div><div class="l label">Emails checked</div><div class="caption muted">About $0.40 in total</div></div>
  </div></section>

  <section class="card section">
    <div class="card-head"><div><div class="caption">Summary</div><h2 class="title">What the three batches showed</h2></div></div>
    <div class="card-body"><ul class="why am-reading">{li(findings)}</ul></div>
  </section>

  <section class="two section">
    <div class="card">
      <div class="card-head"><div><div class="caption">Pilot · 6–7 Oct</div><h2 class="title">How far each provider got</h2><div class="caption muted">Each stage counts providers that passed every stage above it</div></div></div>
      <div class="card-body">{funnel(pilot_f)}</div>
    </div>
    <div class="card">
      <div class="card-head"><div><div class="caption">Batch 2 · 8 Oct</div><h2 class="title">How far each provider got</h2><div class="caption muted">Each stage counts providers that passed every stage above it</div></div></div>
      <div class="card-body">{funnel(b2_f)}</div>
    </div>
    <div class="card">
      <div class="card-head"><div><div class="caption">Batch 3 · 8 Oct</div><h2 class="title">How far each provider got</h2><div class="caption muted">Each stage counts providers that passed every stage above it</div></div></div>
      <div class="card-body">{funnel(b3_f)}</div>
    </div>
  </section>

  <section class="card section">
    <div class="card-head"><div><div class="caption">Side by side</div><h2 class="title">The three batches side by side</h2></div></div>
    <div class="card-body" style="overflow-x:auto"><table class="data"><thead><tr><th>Measure</th><th>Pilot</th><th>Batch 2</th><th>Batch 3</th></tr></thead><tbody>{table}</tbody></table></div>
  </section>

  <section class="card section">
    <div class="card-head"><div><div class="caption">Ready now</div><h2 class="title">The {len(ready)} providers ready to email</h2><div class="caption muted">Full contact details are in each batch dashboard's Team data tab (internal only)</div></div></div>
    <div class="card-body" style="overflow-x:auto"><table class="data"><thead><tr><th>Batch</th><th>Provider</th><th>Programme</th><th>Contact</th><th>Email check</th></tr></thead><tbody>{ready_rows}</tbody></table></div>
  </section>

  <section class="card section">
    <div class="card-head"><div><div class="caption">Next steps</div><h2 class="title">What happens next</h2></div></div>
    <div class="card-body"><ul class="why am-reading">{li(nexts)}</ul></div>
  </section>

  <footer class="caption">Ready to email: has an email we can use and has not said no to international graduates; providers that are not viable or forbid outreach are never included. Verified: passed our email check. Likely: printed on the provider's website, on a mail server that accepts every address. Published: printed on the provider's website, but our check gave no clear answer. Guessed addresses are never used. Internal document: share only inside the team.</footer>
</div>
<script>
(() => {{
  const root = document.documentElement;
  try {{ const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; }} catch {{}}
  document.getElementById("theme").onclick = () => {{
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try {{ localStorage.setItem("theme", root.dataset.theme); }} catch {{}}
  }};
}})();
</script>
</body>
</html>
"""
(R / "final-report.html").write_text(head + style + "\n</head>\n" + body)
print("wrote", R / "final-report.html")
