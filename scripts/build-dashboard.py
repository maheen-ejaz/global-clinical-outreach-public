"""Rebuild a local single-file dashboard snapshot (no network, no credentials).

    uv run --frozen python scripts/build-dashboard.py [batch]

Reads scripts/dashboard-template.html (page with a single __DATA__ placeholder; web/ is generated from it) and,
from the gitignored data/ folder:
  reports/<batch>-dashboard-data.json      snapshot: generated_at, runs[], orgs[] with programs, people, emails
  extractions/<batch>/*.json               fee_status / window_status per program
  reports/<batch>-partnerships.json        optional "open to partnerships" findings per domain
  reports/<batch>-dashboard-meta.json      optional batch labels and executive summary
ranks providers with the bulk-send profile (pipeline/dashboard.py, the same code the hosted page uses) and writes
reports/<batch>-dashboard.html. The hosted dashboard (web/, `outreach publish`) builds its snapshots from the
database instead; this script is kept for offline copies.
"""

import glob
import json
import os
import sys

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
sys.path.insert(0, REPO)
from pipeline import dashboard  # noqa: E402

ROOT = os.path.join(REPO, "data")
batch = sys.argv[1] if len(sys.argv) > 1 else "us-pilot-01"
reports = os.path.join(ROOT, "reports")
data = json.load(open(os.path.join(reports, f"{batch}-dashboard-data.json")))

status = {}
for path in glob.glob(os.path.join(ROOT, "extractions", batch, "*.json")):
    document = json.load(open(path))
    for program in document["programs"]:
        status[(document["domain"], program["name"])] = (program.get("fee_status"), program.get("window_status"))
missing = 0
for org in data["orgs"]:
    for program in org["programs"]:
        found = status.get((org["domain"], program["name"]))
        if found:
            program["fee_status"], program["window_status"] = found
        else:
            missing += 1
print(f"programs without fee/window status: {missing}")

dashboard.enrich(data, dashboard.local_meta(batch), dashboard.local_partnerships(batch))
if "partnerships_checked_on" in data:
    print(f"open to partnerships: {sum(org['partnership']['open'] for org in data['orgs'])}")
print(f"ready to email ({dashboard.PROFILE}): {sum(org['target']['ready'] for org in data['orgs'])}")

# Escape so scraped text can never close the <script> block it is embedded in.
raw = json.dumps(data).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
template = open(os.path.join(REPO, "scripts", "dashboard-template.html")).read()
assert template.count("__DATA__") == 1, "template must contain exactly one __DATA__ placeholder"
out = os.path.join(reports, f"{batch}-dashboard.html")
open(out, "w").write(template.replace("__DATA__", raw))
print(f"wrote {out}")
