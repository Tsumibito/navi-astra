# Navi.training design system

## Direction

Navi.training is first presented as a gateway to yacht travel, charter and independent voyages, supported by practical seamanship expertise. The visual language should feel maritime, competent and adventurous—from Jules Verne to modern blue-water sailing—without becoming theatrical or nostalgic.

Evolution is preferred to replacement. Preserve recognisable assets: the logo, sea photography, wave motifs, rounded logbook-like cards, orange accent and deep marine blue.

## Core principles

1. Content remains readable before it becomes decorative.
2. Maritime details support orientation: coordinates, route lines, compass and helm references, anchors and logbook labels.
3. Use one strong decorative maritime gesture per viewport. Avoid stacking several large wave treatments.
4. White space must clarify hierarchy. It must not create unexplained empty areas inside cards.
5. Components must remain stable across viewport widths. Fixed aspect ratios and explicit gaps are mandatory for image collections.

## Colour

- Deep sea / primary ink: `#073746`
- Secondary sea: `#0d4c5d`
- Paper: `#f7faf9`
- Mist: `#e9f2f1`
- Review sea background: `#dceff4`
- Accent orange: `#d97706`
- Structural line: `rgba(7, 55, 70, 0.16)`
- Muted text: `#52656b`

Orange is an accent, not a text colour for paragraphs. Use it for primary actions, active navigation, coordinates and short labels. Body text and links must retain strong contrast.

## Typography

- Display headings: Tenor Sans where available.
- Navigation, controls and compact metadata: Arial/Helvetica/system sans-serif.
- Body copy: the existing site sans-serif stack.
- Article body: 18–20 px, line-height approximately 1.75.
- Large page headings use balanced wrapping and compact line-height; they must never shrink below comfortable reading size.
- Eyebrows and coordinate labels may use uppercase with increased tracking.

## Spacing

Use a base rhythm of 4 px. Preferred component spacing: 8, 12, 16, 24, 32, 48, 64 and 76 px.

- Card internal padding: normally 20–28 px.
- Card content gap: normally 12–18 px.
- Never use fixed or minimum card heights unless equal-height comparison is essential.
- Remove inherited `height`, `min-height` and distributed alignment when content should define a card’s height.

## Shape and surfaces

- Standard card radius: 14–18 px.
- Feature/logbook card radius: up to 24 px.
- Major page-section cards overlap the previous section by 60 px, use `60px 60px 0 0`, and carry the standard upward section shadow. This is the deliberate asymmetric shape inherited from the original site.
- Content cards inside those sections use the standard radius on all four corners.
- The photo strip and global footer are terminal page chrome and always have `border-radius: 0`.
- A rounded white transition immediately before the footer is forbidden.
- Waves may divide major sections, but should not appear twice in close succession.
- Partner and certification logos are always shown on a white surface with sufficient clear space.
- Avoid pill-shaped containers for ordinary metadata and authors.

### Non-negotiable section anatomy

A major section in the page flow is a single full-width surface. It is not a centred card. Its inner element is a width constraint only and must remain visually transparent.

```text
page/root background
└─ section surface: 100% width, colour, top radius, overlap, shadow
   └─ content container: max-width 1180 px, layout and gaps only
      ├─ copy
      └─ optional content component (chart, image, cards)
```

Rules:

1. The outer section owns `background`, `border-radius`, `box-shadow`, overlap and vertical padding.
2. The outer section uses `width: 100%`; never `calc(100% - 2px)`, a centred `max-width`, or side margins to expose a second frame around it.
3. Stacked sections overlap the previous section by 60 px on desktop and 36 px on mobile. They use `60px 60px 0 0` (mobile: `36px 36px 0 0`). Bottom corners remain square.
4. The inner content container owns only `max-width`, horizontal centring, grid/flex layout and gaps. It must not receive a background, border, shadow or radius.
5. A nested visual card is allowed only when it is a real content object (article, yacht, testimonial, chart). It must not repeat the section’s whole composition or become a second section surface.
6. Consecutive section surfaces need visible contrast. Do not place a white section between two white sections. Choose `paper`, `mist`, `sea` or photography based on neighbouring surfaces.
7. The grey/root background may show only as an intentional overlap or transition. A uniform frame around all four sides of a section indicates incorrect width or margins.
8. Never round the bottom corners of an intermediate page-flow section. Four-corner radii belong to content cards, dialogs and standalone panels—not stacked sections.

Required review before shipping:

- inspect the actual rendered parent/child DOM and identify which element paints the visible background;
- compare the new section with both immediate neighbours at desktop and mobile widths;
- capture a screenshot that includes the boundaries above and below, not only the section’s centre;
- confirm RU, UA and EN use the same structure and shared CSS rather than language-specific copies.

Forbidden pattern:

```html
<section class="rounded-white-section">
  <div class="rounded-mist-section-card">...</div>
</section>
```

Canonical pattern:

```astro
<Section surface="mist" width="wide" radius="feature" stacked>
  <!-- Content only; no second section surface. -->
</Section>
```

## Navigation and language menu

- Header remains light, sticky and restrained.
- Primary navigation prioritises yacht travel, charter, routes, the journal and the sailing encyclopedia. Training is contextual content, not a primary navigation category.
- Active navigation uses a thin orange underline.
- Nested menus use a fully filled white surface, consistent inset padding and clean rectangular edges.
- Language options must fill the menu width; inherited offsets or protruding backgrounds are not allowed.

### Shared-component contract

- Native Astro pages must render `src/components/Header.astro` and `src/components/Footer.astro` through a shared layout. A page-level copy of either component is not allowed.
- Imported snapshot pages receive the equivalent `navi-evo-menu` and `navi-evo-footer` markup only through `scripts/optimize-page-html.mjs`; never edit generated snapshot markup to change global navigation.
- The two implementations must use the same information architecture, labels, URLs, colour tokens, breakpoint (`1100px`) and stacking rules. A change to navigation or footer content is incomplete until both sources are updated.
- Header, dropdowns and the mobile drawer must remain above every hero and page overlay. Header layer: `10020`; dropdown layer: `10030`.
- New native page types must start from an existing shared layout. Creating a route with a standalone header or footer is a design-system violation.

## Component catalogue

The canonical implementation lives in `src/components/design-system/` and its tokens/styles in `src/styles/design-system.css`. Page-specific CSS may change content placement, but must not redefine component radius, colour, shadow or breakpoint values.

### Page shell

- `Header.astro`: the only native desktop header, language switcher and mobile-menu trigger.
- `Footer.astro`: the only native global footer.
- `PhotoStrip.astro`: the only native transition into the footer. It renders square photographs with a fixed 4 px gap and no radius.
- Imported snapshots receive structurally equivalent shared markup from `scripts/optimize-page-html.mjs`. The normalizer must assign canonical component classes; selectors based on `section[data-evo-section="N"]` are migration-only and must not define geometry.

### Hero

Use `design-system/Hero.astro`. Allowed variants:

1. `cinematic`: full-width atmospheric photograph with centred or left-aligned overlay copy.
2. `editorial`: paper background for journal, tag and encyclopedia indexes.
3. `split`: copy and image in two columns; collapses to one column on mobile.
4. `compact`: short contextual header for utility pages.

Every hero accepts content and an image, but page code must not replace its typography, overlay or responsive behaviour.

### Sections and panels

Use `design-system/Section.astro` for page rhythm and surfaces. The component always renders a full-width outer surface plus a transparent inner content container. The `width` variants (`content`, `wide`, and `full`) apply to that inner container—not to the surface. Surface variants are `paper`, `mist`, `sea`, and `photo`. Radius is explicit: `none`, `standard`, or `feature`; page-flow sections normally use `feature` together with `stacked`.

Do not wrap `Section` in another decorative container and do not add a surface to its generated `.ds-section__content`. If a section needs a custom two-column composition, apply the grid to the content container or a transparent child layout wrapper.

Use `design-system/StatPanel.astro` for numerical proof. It is a deep-sea page-section card, so it uses the same rounded upper edge, overlap and shadow as neighbouring sections. It must not become a smaller freestanding card inside a white section.

### Cards

Use `design-system/Card.astro`. The prepared set is:

- `media`: image-led destination, yacht type or service card. The image fills the card and the title sits on a restrained bottom gradient; do not add a separate white title strip;
- `article`: journal/tag card with 16:9 image and quiet metadata;
- `logbook`: editorial card with the larger 24 px radius;
- `stat`: metric cell used only inside `StatPanel`;
- `logo`: certification/partner mark on a white surface.

All cards use the shared 18 px radius unless their named variant explicitly changes it. Content may vary freely. A page must not create a new radius or shadow merely to make one card look different.

### Migration rule

Legacy snapshot pages are migrated incrementally. During migration, `optimize-page-html.mjs` maps legacy blocks to the same canonical classes (`navi-hero--cinematic`, `navi-card--media`, `navi-panel--stats`, and so on). Once a route is native Astro, positional selectors for that route must be deleted.

## Cards

- Testimonials retain their original editorial character and natural width. Their section background must begin at the top edge of the section.
- Course and certificate cards are content-sized. Titles, descriptions, requirements and actions follow a compact vertical rhythm.
- Related article metadata is secondary. Author and reading time must never compete with the article title or image.

## Photography

- Hero photography should carry atmosphere and adventure while keeping text readable.
- The footer photo strip is a sequence of true squares (`aspect-ratio: 1`).
- The strip uses a fixed 4 px gap. Cell count is calculated from available width with a preferred size near 116 px; cell size is then `(container width - total gaps) / cell count`.
- When a wide display needs more cells than available photographs, repeat the sequence cyclically. Never stretch photographs into rectangles and never leave a blank remainder.
- Crop square cells with `object-fit: cover`.

## Footer

- The footer uses deep sea blue with a thin orange separator.
- Footer messaging invites the visitor toward a voyage or a new horizon. Do not use training-focused slogans or calls to action in the global footer.
- The symbol logo is restrained (approximately 140 px on desktop) and aligns visually with the top of the navigation columns.
- Preserve the photo strip above the footer: it brings movement and lived sailing experience.
- Coordinates identify the La Rochelle base: `46.1603° N 1.1511° W`.

## Articles and encyclopedia

- Articles use a strong editorial hierarchy, comfortable line length and understated metadata.
- Inline links use marine ink with a fine orange underline; hover may shift toward a darker orange.
- Encyclopedia language blocks describe the term, not the page: show both language name and the translated term.
- Related topics should contain at least three useful entries when data is available.
- Use Phosphor icons selectively for navigation and comprehension, not as decoration.

## Forms and lead capture

- Contact and newsletter dialogs belong to the same maritime editorial system as the site: deep-sea surfaces, a restrained route/coordinate detail and one atmospheric photograph where it adds meaning.
- A dialog must state its purpose in the first screenful. Keep fields compact, labels visible and the primary action singular; never hide essential consent behind placeholder text.
- Contact forms are task-focused and may use a compact logbook panel. Newsletter forms may use a split image-and-copy composition on desktop and a single-column sheet on mobile.
- Newsletter invitations appear after 20 seconds of engaged browsing, never on legal, thank-you or error pages. Dismissal is respected for seven days; a successful subscription is not requested again.
- Success, loading and error states remain inside the dialog and preserve its dimensions. Keyboard focus is trapped within the active dialog, Escape closes it and reduced-motion preferences are honoured.
- Leads are submitted to the first-party Payload endpoint with explicit consent, locale and source-page context. Honeypot protection is required; duplicate newsletter subscriptions must resolve as success rather than an error.

## Accessibility and motion

- Maintain visible keyboard focus with the orange accent.
- Controls must have accessible names and at least 44 px practical hit areas.
- Body text must meet WCAG AA contrast.
- Honour `prefers-reduced-motion` and keep transitions short and functional.

## Change policy

- Keep visual experiments isolated in the evolution stylesheet and in small, reversible commits.
- Do not remove recognisable motifs or content unless explicitly approved.
- Verify desktop, tablet and mobile widths after changes to shared navigation, cards or footer geometry.
- For section work, screenshots must include both adjacent boundaries. A close crop of the content is not proof that stacking, contrast or radii are correct.
