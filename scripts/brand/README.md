# Sharing artwork

`scripts/build-brand-assets.py` is the editable source for the social card and raster icons. It uses the
dashboard's Inter typography and blue/charcoal palette. The connected G is a workspace mark; the globe is
illustrative and contains no provider locations, counts, contacts or other private data.

Rebuild without production credentials:

```sh
uv run --no-project scripts/build-brand-assets.py
uv run --frozen python scripts/build-web.py
```

The renderer pins Pillow with inline script dependencies. `Inter.ttf` is the Inter 4.001 variable font from
[Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter), by Rasmus Andersson and the Inter Project
Authors; its SIL Open Font License is included in `OFL.txt`. The font and renderer are outside `web/` and are
not deployed. `web/favicon.svg` is the corresponding editable vector mark.

The public social image is `web/assets/social-card-v1.png` (1200 × 630, PNG). When replacing the design, bump
its filename and the URLs in `SHARING_HEAD` in `scripts/build-web.py` to avoid reusing the previous image's
cache key. The hosted metadata is inserted by `build-web.py`; offline batch reports retain their own titles.
The static head follows the [Open Graph protocol](https://ogp.me/) and includes an X large-image card.

Link previews may be cached by the sharing platform; an already-posted message may retain its original
preview. No robots.txt block is added: crawlers can read the public sign-in page and artwork, while the
existing noindex headers/meta and authenticated dashboard data boundary remain in place.
