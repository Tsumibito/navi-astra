# Navi.training agent contract

## Non-negotiable release contract

- Production secrets use dotenvx/encrypted `.env` or platform secrets. Never add 1Password or print decrypted values.
- `npm run build` is deterministic and offline. A production release must use `npm run release:production`, which refreshes Payload snapshots before tests, checks, build, and Cloudflare deployment.
- Keep `ZarazLoader`, `ZarazConsentBootstrap`, and `AnalyticsBootstrap` in every public layout, in that order near the start of `<head>`. Removing or reordering them is a release blocker.
- The Zaraz consent dialog must initially focus `Accept All`; privacy/legal links remain keyboard-accessible but are not the primary action.
- Never change a published slug without a Payload redirect and route-parity test. Payload `publicSlug` is immutable after publication.
- Do not replace shared Header, Footer, Section, Hero, modal, tokens, or rounded page-section shells with page-local copies.
- Content snapshots are generated artifacts, not a second CMS. Never hand-edit them.
- Before production: `npm test`, `npm run check`, `npm run build`; after production verify canonical routes, sitemap, Zaraz loader, GA collection, and the newest Payload content.

Infrastructure detail: `docs/INFRASTRUCTURE_CONTRACT.md`. Visual rules: `design.md`.

Before changing or creating any public-facing page, read `design.md` and
`docs/ENGINEERING_STANDARD.md` completely. They are the current source of
truth; `docs/modernization-plan.md` is historical and must not be used as an
implementation checklist.

- Use the shared layouts and `src/components/Header.astro` / `src/components/Footer.astro` on native Astro routes.
- Never add a page-local header, footer, language selector, or competing colour/spacing tokens.
- Use `src/styles/design-system.css`, `stacked-pages.css` and existing shared
  components. Public `navi-*.css` files are retained only where an existing
  landing layout explicitly imports them; a new native page must not depend on
  them.
- Any global navigation or footer change must be applied to `src/components/Header.astro` and `src/components/Footer.astro` (and their `src/lib/site-shell.mjs` source), then checked at desktop and mobile widths.
- Major homepage/page-flow sections use the stacked-section contract from `design.md`: one full-width surface, rounded top corners only, a negative top overlap, and one non-visual inner content container. Never place a rounded coloured or white "section card" inside another rounded section surface.
- Before styling a new section, inspect the preceding and following rendered sections. Reuse their stacking geometry and choose a contrasting approved surface token; do not invent margins, radii or shadows from a screenshot in isolation.
- Shared section/card geometry changes require a rendered desktop and mobile screenshot. DOM/CSS inspection alone is not sufficient. Verify which element owns the visible surface, not merely which selector contains the content.
- Above-the-fold photographic heroes must follow the LCP contract in `design.md`: use `HeroMedia.astro` or `design-system/Hero.astro`, responsive AVIF/WebP sources, and the matching `BaseLayout` preload. CSS `background-image` is forbidden for an LCP candidate.
- Internal links must point directly to canonical trailing-slash routes. Every
  indexable page needs one self-canonical, valid JSON-LD and reciprocal
  `ru`/`uk`/`en`/`x-default` hreflang where translations exist.
- Keep `npm run build` offline and read-only. Payload synchronization and image
  generation are explicit maintenance commands, never implicit build steps.
- Consent Mode is a shared infrastructure contract. Every public layout must
  render `ZarazConsentBootstrap.astro` near the start of `<head>`. Purpose
  `amuB` maps to Google Analytics storage and `ICtY` maps to Google advertising
  storage. Do not add page-local GA4 scripts or consent bridges. Zaraz must keep
  exactly one standard GA4 `Pageviews` action; locale-specific pageview actions
  would double-count the same navigation.
- Before committing any public-page change run `npm test`, `npm run check`,
  `npm run build` and `node scripts/audit-route-ownership.mjs`; follow the
  screenshot matrix in `docs/ENGINEERING_STANDARD.md` for visual changes.
