# Navi.training UI contract

Before changing or creating any public-facing page, read `design.md` completely.

- Use the shared layouts and `src/components/Header.astro` / `src/components/Footer.astro` on native Astro routes.
- Never add a page-local header, footer, language selector, or competing colour/spacing tokens.
- Imported snapshot pages are normalised only in `scripts/optimize-page-html.mjs` and `public/navi-evolution-v1.css`; do not patch generated snapshot markup by hand.
- Any global navigation or footer change must be applied to both the native components and the snapshot normaliser, then checked at desktop and mobile widths.
