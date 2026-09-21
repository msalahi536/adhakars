# Adhkar card and Salah layout fix

## Scope
- Keep all routes, prayer calculations, counter behavior, swipe gestures, audio, overlays, and stored data unchanged.
- Make the existing settings control one shared `SettingsButton` and place it top-right on Morning, Evening, Salah, Tasbih, and More.
- Correct the shared Morning and Evening card geometry so all text wraps inside the card, short cards shrink to content, long cards scroll internally, the source truncates safely, and the counter remains fully visible.
- Add small previous and next controls around the existing dots and ornament while preserving swipe and dot navigation.
- Restyle the current Salah content to the supplied 390×844 measurements, using the Morning artwork and fitting every card above the shared tab bar without page scrolling at that size.

## Implementation details
- Replace the Arabic/transliteration width workaround with 100% width, zero offsets, normal wrapping, and a taller 24px Amiri line box.
- Make the card stage reserve bottom space for pagination and navigation while allowing the card itself to use content height up to the available maximum.
- Add a tappable source element that reveals the complete citation without changing the citation text.
- Reuse the existing prayer data, selected-prayer state, progress, dismiss toggle, notification mute toggle, and timeline overlay; change only their markup classes and presentation.
- Keep the clean no-location behavior intact and allow vertical page scrolling only below 780px height.

## Verification
- Check Morning at 390×844 for contained 5–6 line Arabic and readable transliteration.
- Navigate to Evening item 3 and confirm the card shrinks, the source ellipsizes, and the 84px counter is fully visible.
- Check Salah at 390×844 for zero page scroll, a top-right 36px settings button, a 48px play button, and the full Adhan card above the 60px tab bar.
- Confirm the current build log is clean after changes.
