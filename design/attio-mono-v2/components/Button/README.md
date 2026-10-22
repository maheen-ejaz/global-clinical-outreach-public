# Button

One filled primary action per view, with outline secondary actions. Reusable v2
classes live in `tokens.css`; open `preview.html` for all five states in each variant.

- Base: `.am-button`, `label` type, padding 9px 14px, `radius-md`.
- Primary: `.am-button--primary`, `primary` / `on-primary`, `shadow-xs`.
- Secondary: `.am-button--secondary`, `surface` / `ink`, `line-strong` border.
- Accent: `.am-button--accent`, existing 135° gradient and `on-accent`.
- Hover: primary fill becomes `body`; secondary border becomes `muted`; accent
  gradient gets an 8% black overlay. Pressed: primary fill becomes `muted`, secondary
  uses `canvas` with `ink` border, accent gets a 16% black overlay.
- Keyboard focus: 2px ring with 2px offset. Default is `ink`; accent buttons and
  containers with `data-accent="on"` use `accent`.
- Disabled: use native `disabled`, 40% opacity and no hover/pressed treatment.
- Transitions: 150ms colour/background-colour/border-colour; reduced motion is 0ms.
  Gradient overlays switch immediately rather than animating the gradient.
- `data-preview-state` is only for specimens; do not set it on application controls.

Use `type="button"` unless the button submits a form. Keep labels in sentence case
and describe the action. No pills, multiple competing primary actions, coloured
secondary buttons or unlabelled icon buttons. Previews demonstrate appearance;
the consumer provides actions.
