# Navi.training agent contract

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
- Before committing any public-page change run `npm test`, `npm run check`,
  `npm run build` and `node scripts/audit-route-ownership.mjs`; follow the
  screenshot matrix in `docs/ENGINEERING_STANDARD.md` for visual changes.
