# Navi.training UI contract

Before changing or creating any public-facing page, read `design.md` completely.

- Use the shared layouts and `src/components/Header.astro` / `src/components/Footer.astro` on native Astro routes.
- Never add a page-local header, footer, language selector, or competing colour/spacing tokens.
- Imported snapshot pages are normalised only in `scripts/optimize-page-html.mjs` and `public/navi-evolution-v1.css`; do not patch generated snapshot markup by hand.
- Any global navigation or footer change must be applied to both the native components and the snapshot normaliser, then checked at desktop and mobile widths.
- Major homepage/page-flow sections use the stacked-section contract from `design.md`: one full-width surface, rounded top corners only, a negative top overlap, and one non-visual inner content container. Never place a rounded coloured or white "section card" inside another rounded section surface.
- Before styling a new section, inspect the preceding and following rendered sections. Reuse their stacking geometry and choose a contrasting approved surface token; do not invent margins, radii or shadows from a screenshot in isolation.
- Shared section/card geometry changes require a rendered desktop and mobile screenshot. DOM/CSS inspection alone is not sufficient. Verify which element owns the visible surface, not merely which selector contains the content.
