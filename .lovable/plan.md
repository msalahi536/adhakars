# Dark red theme and palette audit

## Build
- Add a new Dark Red appearance preset using the supplied sunrise artwork for Morning and supplied moon artwork for Evening.
- Use a restrained oxblood, burgundy, warm blush, and parchment palette with readable text and official-looking translucent surfaces.
- Apply the preset consistently across Morning, Evening, Salah, Tasbih, More, settings, dialogs, cards, counters, pagination, and navigation.
- Add the preset to the appearance selector with both artwork previews.

## Theme verification
- Audit every existing preset across Morning and Evening for card foreground/background contrast, navigation active/inactive contrast, counter readability, controls, and dialogs.
- Correct shared semantic token gaps so themes inherit complete card and navigation colors instead of stale colors from another preset.
- Preserve each existing preset’s artwork and established visual identity.

## Validation
- Check all eight presets at 393×852 on Morning and Evening.
- Check Dark Red on Salah, Tasbih, More, Settings, and a popup.
- Confirm no missing artwork, unreadable text, stale theme flashes, or build errors.
