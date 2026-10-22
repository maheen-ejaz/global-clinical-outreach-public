# Attio Mono v2 across visual surfaces

The user-provided Downloads/Attio Mono v2 package is preserved in
`design/attio-mono-v2/`. Its palette, typography, spacing and shapes remain authoritative.
The six additions cover button states, accessible fields, responsive composition, named
layout/motion/focus tokens, floating surfaces and weight-400 long-form reading.

The dashboard template inlines the exact CSS so generated single-file research reports
still work offline. Its component adapters use the v2 roles for existing dynamic controls,
charts, record panels and tables. `scripts/build-web.py` generates the hosted sign-in and
research page; `web/outreach.css` styles the outreach editor, activity and saved versions.
The marketing source vendors the same package under `vendor/attio-mono-v2/` and scopes its selectors to
`.gc-clinical-partnerships` through `scripts/build-partnership-page.py`.

Content width includes gutters (1024px maximum); wide data tables scroll inside their
cards. Phone actions stack, fields stay 16px, card headers wrap and ordinary cards have
no shadow. Only floating tips/menus use `shadow-floating`. Status colour includes words.
Small secondary text uses `muted`, reserving `faint` for large text. Brand accent remains
opted in, including visible keyboard focus. Disabled controls use 40% opacity. Reduced
motion makes the v2 transitions instantaneous. Existing static sharing artwork retains
the unchanged v2 palette and typography.

Regenerate the hosted page after template edits:

```sh
uv run --frozen python scripts/build-web.py
python3 scripts/build-partnership-page.py
npm run test:design:ui
npm run test:outreach:ui
```

The design UI check uses synthetic research records, visits every research table,
expands records and checks sign-in/control states at 320, 390, 768 and 1440px in both themes.
It stores screenshots in `/tmp/attio-mono-v2/`. Outreach checks use synthetic clients
and cover editor/finalisation, viewer controls and self-demo isolation. No QA command
sends email or changes real prospect/correspondence data. Marketing QA lives under
`marketing/clinical-partnerships/qa/`; its source-only references are excluded from deploys.
