# Sprint 9.4C4 evidence report

## Environment

```bash
node -v  # v22.23.1
npx astro --version  # 7.1.0
npx playwright --version  # 1.61.1
```

Repository: `/Volumes/Crucial X8/windsurf/Navi/navi-astra`  
Branch: `preview/alimos-marina`  
No production deploy, no Neon mutation, no payment action.

## Fixtures and snapshots

- Demo fixture: `src/data/athens-alimos-pilot-fixture.json` — explicitly synthetic, `source: demo`, `lifecycle_status: demo`.
- Default catalogue fixture: `src/data/charter-fixture.json` — production-only; the demo bundle is never merged into it.
- Test fixture for non-exact offer: `test/fixture/future-catamaran.json`.
- Snapshot metrics on pages come from the committed `pack.catalogue_metrics`; demo-card counts are shown separately.
- Sitemap generator: `scripts/generate-sitemap.mjs`.

## Commands run

```bash
npx astro check              # 0 errors, 0 warnings, 0 hints
npm run build                # production build; demo yachts do not generate /yacht-charter/ detail pages
npm test                     # 154/154 pass
C4_SCREENSHOTS=1 npm test    # 154/154 pass, 24 screenshots written
```

## C3.3 real scoped inventory — blocked / pending real data

The Athens/Alimos rail currently renders an explicitly labelled demo sample because the real scoped inventory for base 13 is not yet available in the production fixture. This is a known blocker, not a passing gate.

- Demo cards are marked with `data-is-demo="true"`, a `Demo` badge, and a `data-demo-disclaimer`.
- Demo cards are non-clickable: no detail routes are generated for demo yachts.
- The default `loadFixture()` does not merge the demo bundle, so the shared search and `getAllFixtureYachts()` see only the real BVI fixture.
- Athens/Alimos pass the demo bundle explicitly to `getYachtInventory('fixture', undefined, athensAlimosFixture)`.

## Demo / catalogue split

- Geography pages show real `pack.catalogue_metrics` counts with a `snapshot` label, then a separate count of `demo cards` and `demo offers`.
- The `YachtRail` sections are prefixed `Демо:` / `Demo:`.
- ItemList JSON-LD contains the 3 demo cards but uses in-page anchors (`https://navi.training/draft/{locale}/athens/#demo-yacht-N`) instead of detail routes.

## Visual QA

24 viewport screenshots were captured outside Git:

```
../navi-astra-out/screenshots/c4/
├── athens/
│   ├── athens-ru-mobile.png
│   ├── athens-ru-tablet.png
│   ├── athens-ru-laptop.png
│   ├── athens-ru-desktop.png
│   ├── athens-ua-mobile.png
│   ├── athens-ua-tablet.png
│   ├── athens-ua-laptop.png
│   ├── athens-ua-desktop.png
│   ├── athens-en-mobile.png
│   ├── athens-en-tablet.png
│   ├── athens-en-laptop.png
│   └── athens-en-desktop.png
└── alimos-marina/
    ├── alimos-marina-ru-mobile.png
    ├── alimos-marina-ru-tablet.png
    ├── alimos-marina-ru-laptop.png
    ├── alimos-marina-ru-desktop.png
    ├── alimos-marina-ua-mobile.png
    ├── alimos-marina-ua-tablet.png
    ├── alimos-marina-ua-laptop.png
    ├── alimos-marina-ua-desktop.png
    ├── alimos-marina-en-mobile.png
    ├── alimos-marina-en-tablet.png
    ├── alimos-marina-en-laptop.png
    └── alimos-marina-en-desktop.png
```

Viewport Playwright assertions now cover:

- HTTP 200 for every page load
- Document matches requested viewport
- `html[lang]` matches locale
- `noindex, nofollow`
- Canonical link present
- Valid JSON-LD with `BreadcrumbList` and `ItemList`
- `ItemList` length equals rendered card count
- At least one `data-yacht-card`
- No broken images in the document
- No horizontal overflow
- Keyboard Tab reaches the `YachtSearch` location select

## SEO / hreflang / JSON-LD audit

- `BaseLayout` emits `link rel="alternate" hreflang` for `ru`/`uk`/`en` and `x-default`.
- Self-canonical is set per locale for Athens and Alimos.
- `BreadcrumbList` JSON-LD:
  - Athens: single self item.
  - Alimos: Athens parent + Alimos self.
- `ItemList` JSON-LD contains every yacht card rendered on the page.
- `public/sitemap.xml` and `dist/sitemap.xml` contain no `/draft/` or `?` URLs.
- Draft geography pages use `noindex, nofollow`.

## Private-field / availability audit

- `getYachtInventory` runs `guardNoPrivateFields` on every fixture.
- Pilot fixture uses `availability_state: "unknown"`; `YachtCard` hides price unless `exact`.
- Media credit uses `rel="license"` and `rel="external noopener"`.

## Child / sibling link audit

- Athens `Related marinas` link to Alimos now uses `/draft/{locale}/alimos-marina`.
- Alimos `BreadcrumbList` parent link to Athens uses `/draft/{locale}/athens`.

## Acceptance summary

| Gate | Status |
| --- | --- |
| C3.3 real scoped inventory + type rails | **blocked / pending real inventory** |
| Demo scoped inventory (isolated from catalogue) | pass |
| Demo cards non-clickable and clearly marked | pass |
| Main fixture remains production-only | pass |
| Snapshot metrics preserved | pass |
| Shared search not polluted by demo | pass |
| Dates/filters round-trip via URL | pass |
| No undated price as bookable | pass |
| Draft/query unindexed and not in sitemap | pass |
| Sibling/child links correct | pass |
| Photo attribution compact and localized | pass |
| Automated, build and visual checks pass | 154/154, 24 viewports clean |
| No production mutation | pass |

## Not in scope

- Mass geography page publication.
- Real payment / 48-hour option capture.
- Production Neon writes.
