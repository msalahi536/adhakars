# Compact hadith details popup

## What will change
- Replace the current bottom sheet/full-page presentation with a centered modal dialog.
- Keep the hadith title, reference, Arabic, transliteration, translation, grading, reward, narration, and notes unchanged.
- Give the popup a restrained official appearance using the current theme, subtle border, backdrop dimming, and a clear close control.
- Limit the popup height so longer hadith details scroll inside the dialog without moving the page beneath it.
- Size it comfortably on iPhone while keeping wider screens compact rather than full-width.

## Technical details
- Update the hadith details presentation component to use the existing dialog primitive instead of the drawer primitive.
- Use semantic theme tokens and existing typography; no new colors or visual redesign of the cards.
- Preserve focus handling, keyboard dismissal, tap-outside dismissal, and accessible labels.
- Verify the popup at the current 393×852 phone size and confirm the build remains clean.
