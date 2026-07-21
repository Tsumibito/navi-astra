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
- Waves may divide major sections, but should not appear twice in close succession.
- Partner and certification logos are always shown on a white surface with sufficient clear space.
- Avoid pill-shaped containers for ordinary metadata and authors.

## Navigation and language menu

- Header remains light, sticky and restrained.
- Primary navigation prioritises yacht travel, charter, routes, the journal and the sailing encyclopedia. Training is contextual content, not a primary navigation category.
- Active navigation uses a thin orange underline.
- Nested menus use a fully filled white surface, consistent inset padding and clean rectangular edges.
- Language options must fill the menu width; inherited offsets or protruding backgrounds are not allowed.

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

## Accessibility and motion

- Maintain visible keyboard focus with the orange accent.
- Controls must have accessible names and at least 44 px practical hit areas.
- Body text must meet WCAG AA contrast.
- Honour `prefers-reduced-motion` and keep transitions short and functional.

## Change policy

- Keep visual experiments isolated in the evolution stylesheet and in small, reversible commits.
- Do not remove recognisable motifs or content unless explicitly approved.
- Verify desktop, tablet and mobile widths after changes to shared navigation, cards or footer geometry.
