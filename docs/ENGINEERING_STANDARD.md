# Navi.training engineering standard

Status: current production contract  
Applies to: every new or changed public route, shared component and content sync

This document turns the completed modernization work into repeatable rules.
`AGENTS.md` makes it mandatory for SWE agents. `design.md` defines the visual
language; this file defines delivery, performance, SEO, accessibility and
verification.

## 1. Sources of truth

- Page shell: shared Astro layouts plus `Header.astro`, `Footer.astro` and
  `PhotoStrip.astro`.
- Visual tokens and primitives: `src/styles/design-system.css` and
  `src/components/design-system/`.
- Stacked landing geometry: `src/styles/stacked-pages.css`.
- Content: tracked `src/data/payload-content.json`,
  `payload-certificates.json` and `legal.json`.
- Global shell copy and destinations: `src/lib/site-shell.mjs`.
- Zaraz Consent custom CSS: `docs/zaraz-consent.css`.
- Routes and sitemap: `scripts/catalog-routes.mjs` and
  `scripts/generate-sitemap.mjs`.

Do not introduce a second source for any of these concerns. A new page composes
shared components and data; it does not clone the shell, tokens or forms.

## 2. New-page baseline

1. Start from the appropriate existing shared layout.
2. Add the explicit Astro route and include it through the route catalogue.
3. Use the shared header/footer and canonical language URLs.
4. Reuse an existing component for repeated cards, FAQs, forms, instructors,
   articles and section geometry.
5. Keep page-local CSS limited to composition. Promote reusable colour,
   radius, spacing or behavior into the design system.
6. Add or extend a contract test for every new invariant.

All internal page links point directly to the canonical trailing-slash URL.
Never knowingly create an internal 301/308 hop.

## 3. Performance contract

### LCP images

- Above-the-fold photographs are HTML image content, never CSS backgrounds.
- Use `HeroMedia.astro` or `design-system/Hero.astro`.
- Provide responsive AVIF and WebP candidates with correct intrinsic
  dimensions, `srcset` and `sizes`.
- The one LCP image is `loading="eager"` and `fetchpriority="high"`.
- Pass the exact same candidates to `BaseLayout.preloadImage`; preload and
  rendered image must match so the request is reused.
- Verify the approved crop at 390, 768, 1024 and 1440 px.

### Other media and code

- Below-fold images are lazy, asynchronously decoded and dimensioned.
- Use `Picture.astro` where the shared responsive behavior is sufficient.
- Do not add framework islands or a client library for static interaction.
- Prefer native `dialog`, `details`, Popover and CSS container queries with a
  tested progressive fallback where support is not universal.
- Do not add globally loaded icon/font/CSS packages for a page-local need.
- Respect `prefers-reduced-motion`; decorative animation must not block
  rendering or run in performance audits.

`npm run build` is offline and read-only. It must never call Payload, mutate
tracked data or generate media. Run `sync:payload-*` and `generate:webp`
explicitly, review their diffs, then commit the results.

## 4. Colour and accessibility contract

- Deep-sea ink: `--ds-ink:#073746`.
- Light orange action surface: `--ds-action:#ffb052`, with deep-sea text.
- Accessible orange text on white/light surfaces:
  `--ds-accent-text:#c2410c`.
- Orange on dark surfaces: `--ds-accent-on-dark:#ffb052`.
- Never use white text on the light orange action surface.
- Never use the light orange as small text on white.

Body and small text require at least 4.5:1 contrast. Large text and meaningful
UI boundaries require at least 3:1. Every control has an accessible name,
visible `:focus-visible`, keyboard operation and a practical 44 px target.
Images use meaningful `alt` text unless deliberately decorative (`alt=""`).

Do not remove focus outlines globally. Do not hide consent purposes on small
screens. Form labels remain visible and are programmatically connected to
their controls.

## 5. SEO and indexing contract

Every indexable route must have:

- exactly one self-referencing canonical URL;
- valid JSON-LD appropriate to the page type;
- `ru`, `uk`, `en` and `x-default` reciprocal hreflang when translations
  exist;
- `<html lang="uk">` for `/ua/` pages;
- inclusion in the generated sitemap;
- one route owner and no catch-all conflict.

Retired URLs receive one direct permanent redirect to the closest canonical
replacement. Do not redirect an obsolete page to another redirect. Status,
thank-you and payment-error routes remain noindex.

Author relations for all posts resolve to the active Alex Burlakov author
(`id=11`) until the editorial policy explicitly changes. The Payload validator
protects this rule.

## 6. Consent and analytics

GA4 and Cloudflare Web Analytics have distinct purposes and may both remain.
Zaraz tools must be assigned to the correct consent purpose and must not load
before the required consent.

When changing Consent:

1. edit `docs/zaraz-consent.css`;
2. publish that complete file in Zaraz Custom CSS;
3. test first visit and returning visit in an incognito profile;
4. verify Accept, Reject, Save, purpose expansion, keyboard focus and policy
   links at portrait and landscape mobile widths;
5. confirm the newsletter delay is still based on 30 seconds of visible,
   engaged browsing and is independent of Consent.

## 7. Required verification

Before committing:

```bash
npm test
npm run check
npm run build
node scripts/audit-route-ownership.mjs
git diff --check
```

Expected route audit: `conflicts: 0`, `missing: 0`.

For any visual/shared-component change, also inspect:

- 390 px phone portrait;
- 768 px tablet;
- 1024 px tablet/compact desktop;
- 1100 and 1101 px when Header behavior is involved;
- 1440 px desktop.

Capture boundaries above and below a changed stacked section. For hero changes,
verify the request priority and LCP chain in a throttled browser trace. For
accessibility changes, run Lighthouse or axe on at least the affected route and
manually test keyboard navigation.

## 8. Definition of done

A page is complete only when:

- it uses the shared shell and design tokens;
- it introduces no new redirect hop, route conflict or invalid SEO signal;
- responsive images and priorities follow the LCP contract;
- mobile and desktop layouts are visually checked;
- keyboard, contrast and reduced-motion behavior are checked;
- all required commands pass;
- the relevant contract test and documentation are updated if a new standard
  was introduced.
