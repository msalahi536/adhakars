# Refine Morning and Evening Adhkar Reader

## Scope
Preserve the current artwork, palette, typography, theme behavior, content, and navigation. Adjust only the shared Morning and Evening reader geometry and interactions.

## Changes
- Remove the card's large minimum height and let each card follow its content, with a viewport-aware maximum.
- Keep the app viewport locked while allowing unusually long card content to scroll within the card.
- Tighten responsive Arabic sizing, internal spacing, footer layout, source wrapping, and counter sizing.
- Add subtle previous and next controls around the existing pagination dots, with correct disabled states.
- Keep the page counter above the card and make the lower active indicator more visible.
- Reserve clear spacing between card, pagination controls, and the fixed safe-area-aware bottom navigation.
- Keep swipe navigation and use the existing restrained horizontal slide/fade transition.

## Validation
Test Morning card 1, card 2, a long Morning card, a short Evening card, Evening card 2, both theme transitions, arrows, dots, swipes, and layouts at small and large phone widths. Verify no outer-page scrolling, clipping, or bottom-navigation overlap.
