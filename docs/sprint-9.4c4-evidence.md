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

- Athens/Alimos pilot fixture: `src/data/athens-alimos-pilot-fixture.json`
- Default catalogue fixture: `src/data/charter-fixture.json`
- Test fixture for non-exact offer: `test/fixture/future-catamaran.json`
- Sitemap generator: `scripts/generate-sitemap.mjs`

## Commands run

```bash
npx astro check              # 0 errors, 0 warnings, 2 hints (unused locals)
npm run build                # 551 pages built, Navi Astro validation passed
npm test                     # 154/154 pass
C4_SCREENSHOTS=1 npm test    # 154/154 pass, 24 screenshots written
```

## Visual QA

24 viewport screenshots were captured outside Git:

```
../navi-astra-out/screenshots/c4/
├── athens-ru-mobile.png
├── athens-ru-tablet.png
├── athens-ru-laptop.png
├── athens-ru-desktop.png
├── athens-ua-mobile.png
├── athens-ua-tablet.png
├── athens-ua-laptop.png
├── athens-ua-desktop.png
├── athens-en-mobile.png
├── athens-en-tablet.png
├── athens-en-laptop.png
├── athens-en-desktop.png
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

All 24 viewport Playwright assertions passed with zero horizontal overflow.  
Keyboard Tab navigation reached the `YachtSearch` location select on both pages.

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
- `YachtCard` detail links preserve `loc`, `t`, `s`, `e`, `g`, `sv` search context.
- Media credit uses `rel="license"` and `rel="external noopener"`.

## Acceptance summary

| Gate | Status |
| --- | --- |
| Shared search with correct base scope | pass |
| Real scoped inventory + type rails | pass (pilot fixture) |
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
