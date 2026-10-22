# Responsive layout

Opt-in recipes in `tokens.css`, built around the existing 1024px content width.

- `.am-container`: centred, border-box maximum width 1024px including gutters.
  Gutters are 16px below 768px and 24px at/above it.
- `.am-grid`: one column below 768px; two equal columns at/above it. Gap 12px.
- `.am-actions`: full-width stacked buttons on phones; wrapping horizontal actions
  at/above 768px. One primary action per group/view.
- `.am-card`, `.am-card-header`, `.am-card-body`: existing border-only card recipe;
  padding 20px on phones / 24px on desktop. Header actions wrap when needed.
- Add `.am-responsive` to `.display-xl` or `.display-lg` to use phone sizes
  40px/44px and 32px/36px respectively. Original desktop styles remain intact.
- Keep long data tables in a labelled horizontal scroll region in the consuming app;
  do not squeeze column contents into unreadable widths or hide important data.

Named layout and motion values are mirrored in `tokens.json`. The media query uses
literal 768px because CSS variables cannot define its condition. Edit both sources
when changing this breakpoint. Reduced motion removes new recipe transitions.
