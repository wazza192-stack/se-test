# Responsive Standards

## Purpose

These standards define how the site should behave across mobile, tablet, laptop, and desktop screens. Mobile must be treated as a first-class experience, not a reduced or broken version of desktop.

## Responsive philosophy

- Design and build mobile-first.
- Enhance layouts progressively for larger screens.
- Prioritise readability, usability, and clarity on smaller screens.
- Keep content parity between mobile and desktop wherever possible.
- Do not hide important content on mobile unless there is a strong usability reason.

## Supported viewport checks

All key pages and components should be reviewed at:

- 375px mobile
- 768px tablet
- 1024px small laptop
- large desktop

## Layout rules

- Use fluid containers and responsive spacing.
- Avoid fixed-width page sections.
- Avoid layouts that depend on hover for key actions.
- Avoid side-by-side columns on small screens unless both remain clearly usable.
- Stack content vertically on smaller screens where appropriate.
- Use consistent spacing between sections, cards, controls, and text blocks.

## Typography rules

- Text must remain readable on small screens without zooming.
- Headings must scale appropriately and not wrap awkwardly where avoidable.
- Line lengths should remain comfortable to read.
- Avoid text overlapping buttons, images, or containers.

## Navigation rules

- Navigation must remain clear and usable on small screens.
- Menus must be easy to open, close, and tap.
- Important navigation options must not become hidden or inaccessible on mobile.
- Sticky headers must not take excessive vertical space on smaller screens.

## Forms and controls

- Forms must be usable on mobile without awkward zooming or misaligned fields.
- Inputs, buttons, and dropdowns must be touch-friendly.
- Labels and validation messages must remain readable on all screen sizes.
- Form layouts should stack cleanly on smaller screens.

## Tables and data-heavy content

- Large tables must not break page layout on mobile.
- Provide a mobile-friendly solution such as:
  - stacked card layout
  - prioritised columns
  - controlled horizontal scrolling
- Important data must remain accessible on smaller screens.

## Images and media

- Images must scale within their containers.
- Media must not overflow the viewport.
- Avoid oversized assets that hurt mobile performance.
- Use appropriate aspect ratios to reduce awkward cropping or layout jumps.

## Accessibility and usability

- Touch targets must be comfortably tappable.
- Colour contrast and readability must remain strong on mobile.
- Interactive elements must remain usable without precision clicking.
- Users must be able to complete key tasks from a phone.

## Performance considerations

- Mobile layouts should avoid unnecessary heavy assets and large visual effects.
- Prioritise fast loading and smooth interaction on smaller devices.
- Responsive design must not depend on excessive client-side hacks.

## Consistency

- Similar components should behave similarly across the site.
- Reuse established responsive patterns instead of inventing new ones per page.
- Fix root layout and component issues rather than applying repeated one-off overrides.
