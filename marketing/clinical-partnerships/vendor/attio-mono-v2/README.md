# Attio Mono v2

Monochrome UI tokens inspired by attio.com, with an optional navy-to-blue accent layer.

## Files

- `tokens.css`: drop-in CSS custom properties (light + dark), type-style classes and defaults. Link it, then use `var(--ink)`, `var(--surface)`, `class="display-lg"` and so on.
- `tokens.json`: the same tokens as data, for build tools or Tailwind config.
- `components/`: reference previews for Button, StatusChip, Card and Citation (open the `.html` files in a browser), each with a usage README.
- `cover.html`: the system's cover.
- `preview.html`: v2 gallery with light/dark controls and all six additions.
- `components/Input`, `Layout`, `Floating` and `Reading`: new reference recipes.
- Original v1 online reference (does not include these v2 additions): https://claude.ai/artifact/4uGY27ni6AQ7Z9Q3BLi39Y

## Quick start

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Inter+Tight:wght@500;600&display=swap">
<link rel="stylesheet" href="tokens.css">
```

Tailwind v4: import `tokens.css`, then map tokens in `@theme inline { --color-ink: var(--ink); ... }`.

To use without the accent: give the primary button `background: var(--primary); color: var(--on-primary)` and use `--ink` for focus. To add it: `background: var(--accent-gradient); color: var(--on-accent)`.

---

Quiet, monochrome product UI: a white canvas, near-black type, hairline borders and greys doing almost all the work. Colour appears only to say something: a status, or (optionally) one accent for the action and the number that matter most.

## Principles

- **Neutrals first.** Build every screen in `surface`, `canvas`, `ink`, `body`, `muted` and `line` before reaching for any colour. If a screen looks right in greys alone, it is right.
- **Borders, not shadows.** Separate things with a 1px `line` border and `radius-lg` cards. Use `shadow-xs` only on the primary button.
- **Emphasis by greying, not shrinking.** De-emphasise the second half of a heading by setting it in `faint` (24px and up only) or `muted`, at the same size. "Uttar Pradesh <faint>NEET PG 2026</faint>".
- **One primary action per view.** Everything else is an outline button.
- **Status colour is meaning, never decoration.** `good`, `warn` and `bad` appear only on status chips and always with a word ("Eligible", "Watch out", "Critical").

## Content fundamentals

- Plain, direct sentences in the second person: "You'll need to pay upfront", "Add your profile to see your verdict".
- Sentence case everywhere: headings, buttons, nav. No ALL CAPS except tiny eyebrow labels, and prefer `caption` in `muted` even there.
- Buttons say exactly what happens: "Save & see my results", "Verify & next", "Open guide →".
- No emoji. Use the plain glyphs ✓ ! ✕ → ↗ when an icon is needed.
- Numbers are written in full with local grouping (₹2,03,000) and set with `tabular-nums` when they line up.

## Colour

- Page and cards: `surface`. Insets, footers and chips: `canvas`.
- Text: headings and values in `ink`, running text in `body`, labels and secondary text in `muted`. `faint` is for 24px+ only.
- Dividers and card borders: `line`. Outline controls (secondary buttons, inputs, selectable chips): `line-strong`, darkening to `muted` on hover.
- Status chips: `good` on `good-tint`, `warn` on `warn-tint`, `bad` on `bad-tint`, each with a leading dot and a word.
- Both themes are first-class. Every pair above holds 4.5:1 or better in light and dark (`faint` holds 3:1+ and is large-text only).

## Accent layer (optional)

The system works fully without an accent: the primary button is `primary` on `on-primary`, focus rings are `ink`, and selected states use `canvas`. To add brand colour, apply the accent tokens and nothing else changes:

- Primary button and the single key figure per page (a total, a headline number): a 135° gradient from `accent-from` to `accent-to`, text in `on-accent`.
- Links and link-like text: `accent-strong`. Active nav item, selected option, recommended row: `accent-strong` text on `accent-tint` with a `accent` border at half strength.
- Focus ring: 2px solid `accent`, 2px offset.
- Never use the gradient on large backgrounds, section headers or more than one block per view.

To swap the accent hue, replace the six `accent*` tokens and keep the same roles. Check that `on-accent` holds 4.5:1 on `accent-to` in both themes.

## Typography

- Body copy in `body` (Inter, weight 500, slightly tightened). Dense UI in `body-sm`; buttons and nav in `label`; hints and eyebrows in `caption`; citation tags in `micro`.
- Headings use the display family (Inter Tight) at weight 600 with negative tracking: `display-xl` for a hero, `display-lg` for page titles, `heading` for section titles and verdicts, `title` for card headers, `subhead` for small headings inside cards.
- Load both faces from Google Fonts: `Inter:wght@400;500;600` and `Inter+Tight:wght@500;600`.
- Headings get `text-wrap: balance`. Keep running text near 65 characters wide.

## Layout and spacing

- Content column max 1024px, side gutter `space-4` on phones.
- Sections are cards: a header row (`caption` eyebrow in `muted`, `title` heading) separated from the body by a `line` divider, body padded `space-5` on phones and `space-6` on desktop.
- Lists of facts are rows separated by `line` dividers inside one bordered card, not separate cards.
- Gaps: `space-2` between buttons, `space-3` between stacked cards, `space-6` between sections.

## Shape

- `radius-md` for buttons, inputs, chips and rows. `radius-lg` for cards. `radius-sm` for citation tags.
- No pill-shaped buttons. `radius-full` is reserved for status dots and progress bars.

## States

- Hover: outline controls darken their border to `muted`, cards to `line-strong`. The primary button deepens its gradient slightly.
- Focus: visible 2px ring, never removed.
- Disabled: 40% opacity, no colour change.
- Respect `prefers-reduced-motion`; transitions are 150ms colour/border only.

## Iconography

No icon set is defined. Use the glyphs ✓ ! ✕ → ↗ in the current text colour, or a small leading dot on status chips. If you add an icon set, use a 1.5px-stroke outline set at 16px in `muted`.


## v2 additions

The original palette, type classes, spacing and radius values are preserved. These
six additions complete the system without changing the default visual foundation.
The reusable recipes are in `tokens.css` with `am-` class names; existing custom
components can continue using the original tokens.

1. **Button states.** `.am-button` with `--primary`, `--secondary` or `--accent`
   variants covers default, hover, keyboard focus, pressed and native disabled states.
   Monochrome focus now uses `ink`; set `data-accent="on"` on a container (or use
   `.am-button--accent`) for accent focus. Previews include static state specimens.
2. **Input fields.** Label, placeholder, helper text, validation and disabled recipes
   retain `radius-md`. Associate labels and helper/error text with native inputs;
   use `aria-invalid="true"` for errors. Inputs use 16px text for phone readability.
3. **Responsive recipes.** Opt into `.am-container`, `.am-grid`, `.am-actions`,
   `.am-card` and `.am-responsive` headings. Below 768px, grids/actions stack and
   display-xl/display-lg become 40px/32px. At 768px they return to original sizes,
   grids use two columns and actions wrap horizontally. Card headers wrap at either
   size. Content max-width includes gutters. Existing type classes remain unchanged
   unless `.am-responsive` is added. Breakpoints are mirrored in JSON; custom
   properties cannot be used inside CSS media-query conditions.
4. **Layout and motion tokens.** `content-max`, `reading-max`, `page-gutter`,
   `card-padding`, `motion-duration`, `motion-easing`, `focus-width`, `focus-offset`,
   `focus-color` and `disabled-opacity` make existing rules reusable. New recipe
   transitions become instantaneous under `prefers-reduced-motion`.
5. **Floating elevation.** `shadow-floating` / `.am-floating` are only for menus,
   dropdowns and popovers. Cards retain their borders and no shadow. The light
   shadow was found in both extracts; the dark counterpart is a local extension.
   The class supplies appearance, not overlay positioning or menu interaction.
6. **Long-form reading.** `.am-reading` adds Inter 400, 16px/1.5 and a 65ch maximum
   width for guides. Existing `.body` and `.body-sm` remain Inter 500. Load Inter
   weight 400 using the updated quick-start font URL already shown above.

### Usage

```html
<main class="am-container">
  <h1 class="display-lg am-responsive">Your guide</h1>
  <div class="am-actions">
    <button type="button" class="am-button am-button--primary">Save profile</button>
    <button type="button" class="am-button am-button--secondary">Cancel</button>
  </div>
  <div class="am-field">
    <label class="am-field-label" for="email">Email address</label>
    <input class="am-input" id="email" type="email" aria-describedby="email-help">
    <p class="am-field-help" id="email-help">We'll use this for your saved results.</p>
  </div>
</main>
```

### Evidence and scope

These are curated Attio Mono extensions, not a claim to reproduce Attio's full
production system. Source leads: [GetDesignMD](https://getdesignmd.net/design/attio-the-crm-for-agentic-revenue-8d15da/)
and [MyDesignMD](https://www.mydesignmd.com/brand/attio-the-crm-for-agentic-revenue).
Their inferred font, component-role and width assignments disagree, so existing
Attio Mono values remain authoritative. Neither extract supplies a complete dark
system. No extra colours, fonts, ghost buttons, decorative effects or pill styles
were introduced. This is a local static asset package; no application deployment
or external publishing is required.
