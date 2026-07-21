# MCC implementation design system

Source concepts:

- `docs/design-concepts/editorial-concept.png` — primary visual system.
- `docs/design-concepts/services-concept.png` — homepage service-band structure.
- `docs/design-concepts/hero-concept.png` — first-viewport composition and outcome-led hero.

## Approved user adjustments

- Primary navigation is exactly: **Home, Services, Gallery, About, Contact**.
- Remove Education and Approach from navigation. Educational content remains on the homepage and service pages.
- Do not use “The difference is in the relationship between colors” as a major heading.
- Do not use “When the repair works but the color does not” as a major heading.
- Remove the Problem/Material/Approach/Result annotation rail.
- Keep the minimal editorial layout, rounded frames, generous negative space, brick comparison treatment, and the three service bands.
- Keep “Change the color without hiding the masonry” as a homepage educational section.
- Keep the top navigation unchanged. Link the deeper “What is masonry staining?” explainer from contextual page links and the footer.
- State the service boundary plainly: MCC performs post-construction color work and does not lay brick, rebuild walls, or perform structural masonry repair.

## Component checkpoint

**Intent:** A homeowner, mason, or builder is looking at work that is structurally complete but visually distracting. They must quickly understand the specialty, see credible service categories, and call or start an estimate. The interface should feel like a quiet material sample room: exacting, tactile, premium, and approachable.

**Palette:** Limestone and pale mortar create the base; soot charcoal carries type; fired-clay red marks action and the correction seam; weathered umber and buff create masonry variation. These colors come directly from the work rather than from a generic contractor palette.

**Depth:** Surface-color shifts and whisper-light borders only. This keeps attention on typography and material fields and preserves the approved minimal quality.

**Surfaces:** `limestone` base, `mortar` inset, `sample` raised by tone only, `soot` footer. Inputs sit slightly darker than their surrounding form panel.

**Typography:** Manrope is loaded through `next/font` and paired with a conservative system fallback stack. Tight display tracking and sturdy medium-to-bold weights create the precise contemporary tone; body copy remains neutral and readable.

**Spacing:** 8px base unit. Major page gutters and section spacing use multiples of 8. The correction seam may create intentional masonry-derived offsets.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--limestone` | `#ece6dc` | Page background |
| `--mortar` | `#e3dbcf` | Inset fields and bands |
| `--mortar-deep` | `#d7cec0` | Comparison and image fields |
| `--sample` | `#f8f5ef` | Primary framed surfaces |
| `--soot` | `#1f201e` | Primary text and footer |
| `--smoke` | `#5c5954` | Secondary text |
| `--ash` | `#716c64` | Metadata and quiet labels |
| `--clay` | `#a93622` | Primary action and seam |
| `--clay-dark` | `#842719` | Hover/active action |
| `--buff` | `#b79a77` | Masonry variation and horizontal course line |
| `--umber` | `#705040` | Masonry variation |
| `--joint` | `rgba(63, 54, 45, .17)` | Standard border |
| `--joint-soft` | `rgba(63, 54, 45, .09)` | Quiet separation |

## Type scale

- Display: `clamp(3.65rem, 5.6vw, 6rem)`, weight 720, line-height .94, tracking -.07em.
- Section title: generally `clamp(2.7rem, 4.8vw, 5rem)`, weight 720, line-height .95.
- Card/service title: 1.02rem to 1.55rem, weight 700–750.
- Body lead: `clamp(1rem, 1.18vw, 1.18rem)`, line-height 1.65.
- Body: 1rem, line-height 1.6–1.7.
- Navigation/control: .88rem, weight 650–750.
- Utility/metadata: .75rem to .82rem, uppercase only when structural.

## Geometry

- Page max-width: 1480px.
- Page gutter: 12px mobile and 20px desktop at the outer canvas.
- Main radius: 30px desktop, 21–24px mobile.
- Secondary radius: 16px desktop, 12–14px mobile.
- Button radius: 8px to 10px, not pill-shaped.
- Border: 1px using `--joint`.
- No decorative drop shadows.

## Core components

### Header

- Three-course masonry mark and full company name.
- Desktop nav: Home, Services, Gallery, About, Contact.
- Primary estimate button.
- Mobile menu with the same information order, estimate action, Escape dismissal, and focus restoration.

### Hero

- H1: “Make mismatched masonry belong.”
- 42/58 copy/photo split at large sizes.
- One dominant authorized MCC “after” photograph with a smaller layered “before” inset.
- The service pathways form the lower course of the same integrated composition.
- No eyebrow, badge, rating, or metric.

### Service bands

- Three aligned horizontal running-course pathways.
- Compact copy, service number, and directional affordance remain within one integrated strip.
- Titles: Repair and addition color matching; Brick and masonry staining; Specialty material color matching.
- The third service remains visibly marked as scope-dependent in internal content, but public preview copy stays conservative.

### Education split

- Heading: “Change the color without hiding the masonry.”
- Compare “Paint covers” with “Color correction” beside a layered original before-and-after project pair.
- No unsupported technical claims.

### Process

- The homepage close uses three concise steps inside one soot-colored conversion panel.
- Services provide additional process and fit guidance without duplicating a long homepage timeline.

### Contact panel

- Two-column editorial panel with a material field and an accessible estimate form.
- During the first build, submission opens a pre-addressed email because a production form provider has not been selected.
- Do not display a fake successful upload state.

### Footer

- Soot surface, structured columns, full NAP, and privacy link.
- No fake certifications or review badges.

## Responsive behavior

- Mobile navigation and route compositions collapse at 900px.
- Hero stacks copy above a side-by-side project comparison while preserving CTA order.
- Service pathways become open stacked rows rather than equal cards.
- The education split becomes one narrative column.
- Process becomes vertical with the joint on the left.
- Form controls remain at least 44px high.
- No horizontal overflow at 360px.

## Project photography policy

The site uses five authorized original MCC before-and-after sets. The repository preserves the supplied JPEGs without editorial retouching; responsive crops and framing are handled in code. No stock photographs, generated project results, or invented testimonials appear on the public site.
