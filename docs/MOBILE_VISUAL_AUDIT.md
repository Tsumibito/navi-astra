# Mobile visual audit

Date: 2026-07-26  
Viewport audited: 390 x 844  
Pages sampled: home, school, Inshore Skipper Sail, charter, yacht delivery, article, tag, course landing

## Executive finding

The site has a recognizable brand but not one enforced design system. Most inconsistencies are caused by page-local CSS redefining the same roles. The problem is structural rather than a set of isolated bad margins.

## Measured inconsistencies

- H1 ranges from 22 px to 50.7 px.
- H2 ranges from 18 px to 42 px.
- Section content begins 14, 16, 20, 24, or 30 px from the viewport edge.
- Buttons use 5, 8, and 9 px radii and several unrelated heights.
- Stacked sections use both 30 and 36 px mobile radii.
- Footer logo renders at approximately 142 x 155 px.
- Service pages use 32, 38, and 42 px H2 sizes on the same mobile page.
- The tag page uses a 42 px listing heading while article H2 uses 28 px.
- The course landing uses a 22 px H1, making it weaker than several H2 elements below it.

## Priority issues

### P0: mobile gutters

Some content starts 14-16 px from the viewport while neighboring sections use 24-30 px. Rounded stacked sections make the narrow cases look clipped.

Decision: 20 px is the standard mobile viewport gutter. Cards add their own internal padding.

### P0: heading hierarchy

Heading size currently depends more on page origin than semantic level.

Decision: standard H1 is 38-46 px and H2 is 28-32 px on mobile. Long translated H1 may use 34-38 px as a documented local override.

### P0: footer logo

The current image dimensions make the footer logo visually dominate the footer.

Decision: 96 px mobile, 104-142 px responsive desktop.

### P1: section geometry

Native sections use 30 px top corners while newer sections use 36 px. Desktop is mostly 60 px.

Decision: 60 px desktop, 36 px mobile, 60/36 px overlap.

### P1: button family

CTA styles are recognizably related by color but not by geometry.

Decision: 48 px minimum height, 8 px radius, 24-32 px horizontal padding. Primary, secondary, and text-link variants only.

### P1: tags

Tag navigation is often too large and too bright relative to nearby editorial content.

Decision: tags use muted/mist surfaces. Amber indicates the active state only.

### P1: encyclopedia block on home

The block is visually strong, but its 38 px mobile title, cartographic panel, mono coordinates, 14 px radius, and dark rectangular CTA form a separate visual dialect.

Decision:

- Keep the cartographic concept and marine content.
- Use the shared H2 scale and 20 px gutter.
- Use the shared 14 px image/media radius.
- Use the shared button height/radius.
- Reduce the chart height on mobile.
- Keep coordinates as quiet supporting detail, not a competing eyebrow.

### P2: editorial images and cards

Image radii and aspect ratios vary within comparable content families.

Decision: 14 px media, 18 px cards, one aspect ratio per grid.

## Rollout sequence

1. Shared tokens, footer, gutters, buttons, encyclopedia alignment.
2. Native home, school, course, and charter pages.
3. Blog, article, tag, and encyclopedia templates.
4. Yacht delivery and expertise services.
5. Legacy campaign landing pages.
6. Full responsive regression at 360/390/430/768/1024/1440 px.

