# Floating surface

`.am-floating` provides a `surface` fill, `line` border, `radius-md`, 12px padding
and `shadow-floating`. Use for dropdowns/popovers, not ordinary cards.

- Light: `0 1px 3px #0000000a, 0 0 2px #1c28402e`, detected by both extracts.
- Dark: `0 1px 3px rgba(0, 0, 0, 0.4), 0 0 2px rgba(0, 0, 0, 0.2)`, a local
  Attio Mono extension. The border maintains the surface edge in dark mode.
- The class styles the surface only. Consumers implement anchoring, collision
  handling, keyboard navigation, dismissal and focus behaviour for their UI.
- `preview.html` uses native `details`/`summary` to demonstrate disclosure without
  pretending to implement an accessible application menu.
