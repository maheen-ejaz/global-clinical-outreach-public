# Clinical programme partnerships

GOO-1539: standalone marketing-page source for the current GooCampusWorld website team.
Review destination: https://partners-preview.goocampusglobal.com/.
The final route is proposed as `/partners`; the website team confirms it. This repository is
the source and handoff location, not the current main-site application.

## Run and edit

The page is semantic HTML with local fonts, page-scoped CSS and small clipboard, motion and carousel scripts. No runtime
packages, database, form, account or server application are needed. Edit `index.html` and
`assets/css/partnership-page.css`. The intact original v1 references and ZIP remain in
`vendor/attio-mono/`; the supplied v2 design system is retained in `vendor/attio-mono-v2/`.
The build scopes the v2 token and recipe selectors for this page. Do not load their global CSS into another website.

From this repository's root:

```sh
python3 scripts/build-partnership-page.py
python3 -m http.server 8793 --bind 127.0.0.1 --directory marketing/clinical-partnerships/dist
```

The build adapts the v2 token selectors into `assets/css/attio-mono-scoped.css` and copies
only `index.html`, `assets/`, `_headers` and `robots.txt` into the ignored `dist/`. It never
publishes the outreach application, prospect data, vendor previews, QA or this handoff.
The included source can also be served directly without the repository build script.
The current v2 publish build measures 707,236 bytes uncompressed; use a 780KB working size budget.

For the repository-hosted review, deploy from clean canonical `main` with
`netlify deploy --prod --cwd marketing/clinical-partnerships --dir dist --site c6f69133-aea0-4f88-8e7d-78d7c4332e24 --no-build`.
The page-specific working directory selects this page's configuration and headers. A `--dir` override
alone still allows the repository's dashboard configuration to be serialized by the CLI.
`RELEASE.json` records the published source revision and deploy; the attached package also includes
its own full repository revision in `SOURCE_REVISION.txt`.

`asset-manifest.json` records provenance, licences, dimensions, alt text and checksums.
`asset-sources.json` holds the dated main-site observations. The genuine logo is retained unchanged;
its white backing preserves its original colours and legibility in dark mode. The October 12
presentation revision retains the architectural hero and pathology laboratory and introduces
medical mentorship, small-group teaching, simulation and an overhead learning-desk still life.
Four originals and their exact built-in prompts are in `qa/presentation-imagery/`; responsive
exports are under `assets/images/editorial/`. Replaced architectural exports remain archived
in `qa/superseded-images/institutional/`. Original earlier generations remain in their QA folders.
The user requested removal of repeated public AI-image captions; accurate alt descriptions,
Example badges and the fictional-listing/illustrative-image disclaimer remain. The source
manifest records generated provenance; none depicts an actual provider relationship.
Inter 400/500 and Inter Tight 600 are bundled as WOFF2; their OFL licences travel with the fonts.

## Integrate into the current website

1. Translate the native structure into the site's component stack if needed. Keep one
   `.gc-clinical-partnerships` root around the page. Place the skip link and landmarks appropriately
   if the main site already supplies a header, main or footer; avoid duplicate landmarks/H1s.
2. Import only `attio-mono-scoped.css` and `partnership-page.css` in that layout. Font names are
   namespaced as `GC Inter` and `GC Inter Tight`. Keep variables and system dark preference inside
   the partnership root. Do not paste global Attio `:root`, `body`, heading or focus rules.
3. Preserve the source copy: existing offerings are live; the additional clinical collection is
   planned. Partnership discussions, eligibility, routing, support and commercial terms remain
   provider-specific. Preserve the fictional-data and illustrative-image disclaimer; sample fees
   are examples, not public provider rates. Describe audience relevance and provider-confirmed
   eligibility without guaranteeing applicants, free listings or clinical access.
4. Preserve the semantic CTA to the published company contact `info@goocampus.in`, with encoded subject
   `Clinical programme partnership enquiry`. It opens an email client. Keep the separate selectable
   email address, copy-success status and unavailable-clipboard fallback. Mount the tiny script
   after the markup, or implement the same behavior in the site's lifecycle.
5. Confirm `/partners` or the actual route. Set the final title, description, canonical, sharing URL
   and image URL to that route/domain. Change asset paths as needed. Keep the 1200 × 630 sharing image.
6. Remove `Review version`, the `noindex, nofollow` meta and preview `robots.txt`/`X-Robots-Tag` from
   the final main-site route. The temporary Netlify review stays unindexed. Apply final security
   headers through the existing site's configuration; do not overwrite its whole policy.
7. Add a visible homepage entry headed **Clinical programme partnerships**. Suggested text:
   “We’re expanding our clinical-programme offering and inviting providers to discuss potential
   partnerships.” Link: **Explore clinical partnerships →**. Add a stable navigation/footer link.
   Preserve the existing homepage, courses, mentorship and login flows.

Main-site URLs verified from the live homepage on 9 October 2026: services `/mentorship`, courses
`/courses`, contact `/contact-us`, privacy `/privacy`, terms `/tnc`. The page's services and legal links
use those exact destinations. `/courses` returned 200 with a client-loading view in the fetched HTML;
this is not evidence that the existing courses are prelaunch. Their live status is Maheen's confirmed
baseline in GOO-1539. Check the actual course flow during final integration.

## Review and QA

### Marketing-page polish

The requested marketing treatment retains the section order and original Attio Mono tokens. The
benefits use an asymmetric bento grid with one image panel, one wider discovery card and two detail
cards; process steps use three equal cards on desktop. Both layouts stack on small screens and
contain only one nested card level. The new listing-preview link is a native anchor.

Original inline SVG symbols use the reference system's 16px grid, 1.5px outline and muted role.
They are decorative (`aria-hidden`, `focusable=false`), with visible text carrying the meaning.
No icon font or external library is loaded. Images have intrinsic dimensions; the hero loads eagerly
and the supporting image is lazy. Existing contact, carousel and motion scripts are unchanged.

### Illustrative programme carousel

The new listing preview follows the programme categories. Four fictional observership, elective,
attachment and fellowship cards show institution/location, start/end dates, duration, delivery,
eligibility and fee units, including separate application fees and an on-request example. Maheen's
9 October request authorises this static preview, superseding the original brief's no-sample-cards
boundary. It does not authorise live listings, bookings or representing actual partnerships.

Cached provider pages inform the field selection and fee formats; `qa/card-research.json` preserves
the source URLs and distinctions between tuition, application fees and expense support. All public
names, dates and prices are fictional (`qa/demo-card-data.json`), not quoted offers or market averages.
Keep the “Example” badges and visible disclaimer with the cards until replaced with provider-approved
information. The fellowship fee is monthly self-funded tuition, not a salary or stipend.

The card images combine clinical teaching, simulation, still life and a retained laboratory view.
Three new card originals/prompts live in `qa/presentation-imagery/`, with responsive exports in
`assets/images/editorial/`. The retained fellowship image's source lives in
`qa/institutional-imagery/`, with exports under `assets/images/institutional/`. No provider logos
or patient records are shown. Earlier generations and direction studies remain in QA for
provenance. The build excludes all QA, research, prompts and original PNGs.

`carousel.js` enhances native horizontal scrolling and CSS scroll snap. Previous/Next and track
Arrow/Home/End keys preserve focus; boundary controls use `aria-disabled`. All four slides remain
available to assistive technology. There is no autoplay. Smooth scrolling stops on a live reduced-motion
change; reduced-motion, no-JS and missing-API modes retain immediate/native scrolling. In a component
port, install listeners on mount and remove them on unmount. Test with `node qa/carousel-checks.mjs
<preview-url>`, alongside the existing browser and motion suites.

### Attio Mono motion adaptation

The requested motion layer is confined to this page; original vendor tokens/references stay intact.
It preserves the monochrome palette, hairlines, typography, card geometry and full text opacity.

| Interaction | Motion |
|---|---|
| Section first enters the viewport | Settles from the system's 4px spacing unit to its natural position over 420ms, once per visit |
| Link/CTA hover or keyboard focus | Directional arrow moves 1–2px over the system's 150ms interaction rhythm |
| Button press | 1px tactile movement; action happens immediately |
| Native FAQ disclosure | 1.5px outline cross becomes a minus in 150ms; answer settles 2px over 200ms |

Local timing/easing variables live on `.gc-clinical-partnerships` in `partnership-page.css`, with
`cubic-bezier(0.2, 0.7, 0.2, 1)` for a quiet ease-out. `motion.js` enhances the `main > .gc-card`
sections using native [Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
and [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
It does not set hidden/opacity states or intercept native FAQ, navigation, email or clipboard actions.
Keep the section selector aligned with the layout if translating to the team's component stack.
The static script owns preference/visibility/page/focus listeners; component ports should install
them on mount, remove them on unmount and disconnect/cancel the observer/animations during cleanup.

Reduced motion disables all added movement, including on first load, and a live preference change
cancels active section motion. Focused sections stay stable; gaining focus stops current settling.
Touch has press feedback without persistent hover movement. Section motion suspends in a hidden page and
does not replay sections already seen. Content remains readable with JavaScript disabled or missing
animation APIs. There are no loops, parallax, card shadows, animated layout dimensions or text fades.

Motion checks: `node qa/motion-checks.mjs <preview-url>`. Short desktop/mobile recordings can be
reproduced with `node qa/capture-motion.mjs <preview-url>`. Evidence and clips are under
`qa/evidence/motion-local/`; the general responsive/keyboard/FAQ/clipboard/no-JS suite remains applicable.

Observable requirements: full section sequence, truthful offer and stage wording, supplied token/type
values, isolated styles, correct mailto, accessible clipboard states and native exclusive FAQ (shared `details` name, one open answer including without JS); no overflow at
320/375/390/768/1024/1440px or 200% text; both themes, keyboard/no-JS and Chromium/WebKit/Firefox checks;
performance/accessibility Lighthouse targets at least 90; dedicated HTTPS review host with noindex.

Reproduce browser checks with Node 22+:

```sh
cd marketing/clinical-partnerships/qa
npm ci --ignore-scripts
npx playwright install chromium firefox webkit
node browser-checks.mjs http://127.0.0.1:8793/
node render-social.mjs http://127.0.0.1:8793/
npx lighthouse http://127.0.0.1:8793/ --only-categories=performance,accessibility --output=json --output-path=evidence/lighthouse-mobile.json --chrome-flags="--headless"
npx lighthouse http://127.0.0.1:8793/ --preset=desktop --only-categories=performance,accessibility --output=json --output-path=evidence/lighthouse-desktop.json --chrome-flags="--headless"
```

The browser script exercises both successful clipboard writing and API-unavailable fallback using
test doubles, without opening an email application or sending anything. Native clipboard and deployed
headers are checked separately. Evidence and actual command durations are in `qa/QA.md` and `qa/evidence/`.
Deploy identities and source revisions are recorded in `docs/project-status.md` and the Linear update.

Published review: https://partners-preview.goocampusglobal.com/.
Fallback review URL: https://goocampus-clinical-partners-preview.netlify.app/.
`RELEASE.json` records the latest published revision. The surgical copy revision reduced the original
narrative from 607 to 547 words; later motion, carousel and marketing additions are recorded separately in
`qa/QA.md`. Earlier evidence is retained as history.
The current marketing revision's custom hostname resolves through native local DNS. Live browser
matrices and source/header checks use that host directly with normal certificate verification;
fresh evidence is under `qa/evidence/marketing-deployed/` and the corresponding carousel/motion folders.
Earlier releases used public DNS-over-HTTPS and exact-IP captures while this Mac retained NXDOMAIN;
those observations and artifacts remain historical. No local DNS/OS/browser settings were changed.

## Final verification and owner boundary

The current GooCampusWorld website team owns final integration. After Maheen's page review, confirm
the final deployed route, homepage and stable entry points on desktop/mobile, email CTA, dark mode,
keyboard behavior and continued course/mentorship operation. Record the final URL and evidence in
GOO-1539. The rollout ticket remains open until these criteria pass.

The user approved the temporary preview for the five-provider pilot and scheduled those emails
in the completed 12 October 2026 session. Main-site integration remains a separate owner task.
Future email approval/readiness follows `docs/outreach-plan.md`; the preview alone grants no
sending authority. This page never sends, schedules, tracks or collects correspondence.
No automatic team notification or preview-site retirement is part of this handoff.

The introduction now features the GooCampus network: UK medical career guidance, Australian
medical career guidance and ALS training in India, with direct links to the three operated sites.
The user confirmed more than a decade in business. No exclusivity or accreditation claim is added.

The page opts into the original Attio Mono v2 navy-to-blue accent layer. Primary CTAs and
process numbers use the original themed gradient; key headings, focus rings and actions use
blue/navy roles. Network cards use accent tint. Final contact has buttons only; copy action
uses the visible company email in the introduction, which also remains the no-JS fallback.
