# Navi.training Design System

Status: visual standard v1  
Mode: redesign-preserve  
Scope: marketing pages, school/course pages, services, blog, tags, encyclopedia, shared shell

## Design direction

Navi.training is a practical sailing school and travel brand. The visual language is maritime, calm, experienced, and accessible. It should feel editorial enough for long-form learning and confident enough for paid courses and services.

The system preserves:

- Tenor Sans for display typography.
- Deep marine blue, mist, white, and one amber accent.
- Real sailing photography.
- Stacked sections with an overlap.
- Existing information architecture, copy, tracking hooks, and URLs.

The system removes:

- Independent font scales invented inside individual sections.
- Arbitrary mobile gutters.
- Unrelated button radii and heights.
- Oversized footer branding.
- Tags and labels that compete with headings.
- Different section overlap geometry between page families.

## Core principles

1. Global rules define the default. A page may override them only for a documented compositional reason.
2. A local override changes one property or one component, not the entire scale.
3. Background color does not create a new design system. Dark and light sections use the same typography, spacing, radius, and component geometry.
4. Mobile is a first-class layout, not a compressed desktop canvas.
5. Content must never sit closer than the mobile gutter to a viewport or card edge.

## Typography

| Role | Desktop | Mobile | Line height | Use |
| --- | --- | --- | --- | --- |
| Display H1 | 48-76 px | 38-46 px | 0.98-1.08 | One per page |
| Section H2 | 38-58 px | 28-32 px | 1.04-1.12 | Main section title |
| Local H3 | 24-32 px | 22-26 px | 1.15-1.3 | Card or subsection |
| Lead | 18-21 px | 17-18 px | 1.5-1.6 | One introductory paragraph |
| Body | 16-18 px | 16 px | 1.55-1.75 | Default prose |
| Small | 14 px | 14 px | 1.4-1.55 | Metadata and supporting text |
| Eyebrow | 12 px | 12 px | 1.3 | Rare category label |

Rules:

- Tenor Sans is used for H1-H3 and major display numerals.
- Body copy uses the shared sans stack.
- H1 may be smaller on pages with long translated titles, but never smaller than 34 px on mobile.
- H2 has light and dark color variants, not different sizes.
- A section-specific heading may vary by at most one step from the shared scale.
- Eyebrows are used no more than once per three sections.

## Color

- Ink: `#073746`
- Sea: `#0d4c5d`
- Paper: `#f7faf9`
- Mist: `#e9f2f1`
- Action surface: `#ffb052` (`--ds-action`)
- Accessible accent text on light surfaces: `#c2410c` (`--ds-accent-text`)
- Accent on dark surfaces: `#ffb052` (`--ds-accent-on-dark`)
- Muted text: `#52656b`

Orange is the only accent. The light orange is a surface with deep-sea text,
not small text on white. Bright blue is allowed only when it represents an
existing informational illustration, never as a competing CTA color.

## Spacing

The spacing base is 4 px.

- Mobile viewport gutter: 20 px.
- Desktop responsive gutter: 24-48 px.
- Narrow prose: maximum 760 px.
- Wide content: maximum 1180 px.
- Section vertical padding: 48-64 px mobile, 64-92 px desktop.
- Card padding: 20-24 px mobile, 24-40 px desktop.
- Minimum CTA separation: 16 px.
- Text must not touch the viewport, section clipping edge, image, or card edge.

Multi-column layouts collapse below 768 px. The mobile order follows reading priority: heading, explanation, visual, action.

## Shape and overlap

| Element | Radius |
| --- | --- |
| Inputs and buttons | 8 px |
| Images and media | 14 px |
| Cards | 18 px |
| Feature panels | 24 px |
| Stacked section top | 60 px desktop, 36 px mobile |

All standard content sections overlap the preceding section by 60 px desktop and 36 px mobile.

Exceptions:

- Header and navigation never overlap.
- Photo strip is a visual separator and never receives section rounding.
- Footer never overlaps the photo strip.
- Inline editorial images do not use section rounding.

## Buttons

Primary:

- Amber background, high-contrast label.
- Minimum height 48 px.
- Radius 8 px.
- Horizontal padding 24-32 px.

Secondary:

- Transparent or paper background.
- Visible border.
- Same height and radius as primary.

Text links remain text links and do not imitate buttons.

Button labels should normally fit one line. On narrow screens a long localized label may wrap to two lines while retaining at least 48 px height and 20 px side padding.

## Images

- Hero images: full-bleed with a controlled ink overlay for text contrast.
- Editorial images: natural ratio, 14 px radius, descriptive alt text.
- Cards: one consistent aspect ratio within one grid.
- Portraits: circular only for people; other imagery is never circular.
- Do not mix sharp, 8 px, 18 px, and 24 px images in the same component family.

## Tags

Tags are navigation, not primary calls to action.

- 14 px text.
- Compact 8-12 px vertical and 12-16 px horizontal padding.
- Mist or transparent background with ink text.
- Amber is reserved for active/selected state.
- Tag clouds wrap with an 8 px gap and must not visually outweigh the page heading.

## Mobile acceptance criteria

- No horizontal overflow at 360, 390, or 430 px.
- All content uses at least a 20 px viewport gutter.
- Tap targets are at least 44 px; primary actions are at least 48 px.
- H1 is 34-46 px unless an approved local exception exists.
- H2 is 28-32 px.
- Section radius is 36 px.
- Section overlap is 36 px.
- Footer logo is 96 px wide.
- No two-column content remains below 768 px unless it is a compact comparison with proven readability.
- No button or paragraph is clipped by rounded section edges.

## Creating a new page

1. Use a shared layout, components from `src/components/design-system/` and
   tokens from `src/styles/design-system.css`.
2. Start with shared H1, H2, body, button, section, card, and image scales.
3. Declare mobile collapse rules in the same component.
4. Add a local override only after checking the page at 390 px.
5. Verify the page at 390, 768, 1024, and 1440 px.
6. Run the gates and responsive matrix in `docs/ENGINEERING_STANDARD.md`.
