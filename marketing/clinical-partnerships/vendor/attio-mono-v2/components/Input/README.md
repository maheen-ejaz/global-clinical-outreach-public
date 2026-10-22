# Input

A native input with a visible label and associated help or error text. Uses the
existing `surface`, `ink`, `muted`, `line-strong`, `bad` and `radius-md` tokens.

```html
<div class="am-field">
  <label class="am-field-label" for="email">Email address</label>
  <input class="am-input" id="email" type="email" autocomplete="email"
         aria-describedby="email-help" placeholder="you@example.com">
  <p class="am-field-help" id="email-help">We'll use this for your saved results.</p>
</div>
```

- Input type: Inter 500, 16px/22px; padding 10px 12px. Mobile text stays at 16px.
- Hover border: `muted`. Keyboard focus: global 2px ring, default `ink`.
- Error: `aria-invalid="true"`, a `bad` border and `.am-field-error` message.
  Set `aria-describedby` to the message ID; add required semantics when applicable.
- Disabled: native `disabled`, 40% opacity. Keep its label/help fully readable.
- `readonly` keeps a field focusable/copyable; do not substitute disabled for it.
- Placeholder is an example, never the only label. IDs must be unique per page.
- The application handles validation and announces newly inserted errors when needed;
  the preview shows static examples and does not submit or store anything.
