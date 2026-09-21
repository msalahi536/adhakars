# Reconstruct Morning and Evening Adhkar

## Scope
- Preserve all routes, adhkar data, counters, audio behavior, swipe gestures, persistence, and theme settings.
- Rebuild only the shared Morning and Evening presentation to the supplied pixel measurements.

## Implementation
- Load Cormorant Garamond, Jost, and Amiri through the app document head, and register them in the existing Tailwind v4 CSS theme rather than adding an unsupported Tailwind config file.
- Apply the exact Morning and Evening color variables, existing background artwork, overlays, typography, safe-area spacing, progress row, page pill, and settings-button geometry.
- Convert the shared card to one continuous 32px-radius surface with a fixed header, one scrollable body containing Arabic, transliteration, and existing translation, plus a pinned seamless footer.
- Resize the speaker, ornament, source pill, and functional counter to the requested dimensions without changing their behavior.
- Remove pagination chevrons while retaining swipe and tappable dots; restyle dots, ornament, and the five-tab navigation to the specified dimensions.
- Keep Morning and Evening on the same shared components, driven only by section-specific CSS variables.

## Verification
- Capture Morning and Evening at 390px width and compare against both references.
- Check card scrolling, complete Arabic/translation rendering, pinned footer, counter taps, dot navigation, swipe navigation, tab routes, safe-area clearance, and the absence of the Evening footer seam.
- Confirm the preview build has no errors.
