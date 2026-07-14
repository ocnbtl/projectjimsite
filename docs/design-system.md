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

## Component checkpoint

**Intent:** A homeowner, mason, or builder is looking at work that is structurally complete but visually distracting. They must quickly understand the specialty, see credible service categories, and call or start an estimate. The interface should feel like a quiet material sample room: exacting, tactile, premium, and approachable.

**Palette:** Limestone and pale mortar create the base; soot charcoal carries type; fired-clay red marks action and the correction seam; weathered umber and buff create masonry variation. These colors come directly from the work rather than from a generic contractor palette.

**Depth:** Surface-color shifts and whisper-light borders only. This keeps attention on typography and material fields and preserves the approved minimal quality.

**Surfaces:** `limestone` base, `mortar` inset, `sample` raised by tone only, `soot` footer. Inputs sit slightly darker than their surrounding form panel.

**Typography:** Arial/Helvetica fallback during the first build for zero external font dependency, using compact heavy display settings and readable neutral body settings. A final licensed/self-hosted type pairing can replace it after visual QA if needed.

**Spacing:** 8px base unit. Major page gutters and section spacing use multiples of 8. The correction seam may create intentional masonry-derived offsets.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--limestone` | `#f2efe8` | Page background |
| `--mortar` | `#e7e0d4` | Inset fields and bands |
| `--sample` | `#f8f5ef` | Primary framed surfaces |
| `--soot` | `#222321` | Primary text and footer |
| `--smoke` | `#5f5c56` | Secondary text |
| `--ash` | `#817c73` | Metadata and quiet labels |
| `--clay` | `#a93622` | Primary action and seam |
| `--clay-dark` | `#842719` | Hover/active action |
| `--buff` | `#c7a57c` | Masonry variation |
| `--umber` | `#745443` | Masonry variation |
| `--lichen` | `#737565` | Restrained service-area accent |
| `--joint` | `rgba(63, 54, 45, .17)` | Standard border |
| `--joint-soft` | `rgba(63, 54, 45, .09)` | Quiet separation |

## Type scale

- Display: `clamp(3.2rem, 7vw, 7.5rem)`, weight 700, line-height .92, tracking -.065em.
- Section title: `clamp(2.2rem, 4.7vw, 5.2rem)`, weight 700, line-height .96.
- Card/service title: `clamp(1.45rem, 2.2vw, 2.5rem)`, weight 700, line-height 1.02.
- Body lead: `clamp(1.1rem, 1.45vw, 1.35rem)`, line-height 1.55.
- Body: 1rem, line-height 1.65.
- Navigation/control: .92rem, weight 650.
- Utility/metadata: .75rem to .82rem, uppercase only when structural.

## Geometry

- Page max-width: 1500px.
- Page gutter: 24px mobile, 40px tablet, 56px desktop.
- Main radius: 32px desktop, 24px mobile.
- Secondary radius: 20px desktop, 16px mobile.
- Button radius: 8px to 10px, not pill-shaped.
- Border: 1px using `--joint`.
- No decorative drop shadows.

## Core components

### Header

- Text-based MCC mark and full company name.
- Desktop nav: Home, Services, Gallery, About, Contact.
- Primary estimate button.
- Mobile menu with the same information order and visible call action.

### Hero

- H1: “Make mismatched masonry belong.”
- 42/58 copy/material split at large sizes.
- One dominant abstract masonry color study until real project imagery is supplied.
- Correction seam divides old/new color fields.
- No eyebrow, badge, rating, or metric.

### Service bands

- Three differently proportioned horizontal running-course bands.
- Alternating copy and abstract material fields.
- Titles: Repair and addition color matching; Brick and masonry staining; Fireplace, stone, and mortar correction.
- The third service remains visibly marked as scope-dependent in internal content, but public preview copy stays conservative.

### Education split

- Heading: “Change the color without hiding the masonry.”
- Compare “Paint covers” with “Color correction” using texture-preserving abstract material treatments.
- No unsupported technical claims.

### Process

- A single mortar-joint line with five steps, not five cards.
- Collapses to a vertical joint on mobile.

### Contact panel

- Two-column editorial panel with a material field and an accessible estimate form.
- During the first build, submission opens a pre-addressed email because a production form provider has not been selected.
- Do not display a fake successful upload state.

### Footer

- Soot surface, structured columns, full NAP, and privacy link.
- No fake certifications or review badges.

## Responsive behavior

- Mobile navigation collapses at 860px.
- Hero stacks copy above the material study while preserving CTA order.
- Service bands become open stacked sections rather than equal cards.
- The education split becomes one narrative column.
- Process becomes vertical with the joint on the left.
- Form controls remain at least 44px high.
- No horizontal overflow at 360px.

## Intentional temporary deviation

Original project photography has not yet been supplied. The first build uses a code-native abstract masonry study instead of generated or stock photography so the preview cannot be mistaken for MCC’s completed work. Replace these studies with authorized original before/after images before production launch.
