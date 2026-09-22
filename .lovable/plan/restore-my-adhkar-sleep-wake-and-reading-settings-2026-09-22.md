# Restore My Adhkar, Sleep, Wake, and Reading Settings

## What will change
- Repair My Adhkar end to end: empty state, add/edit/delete, saved cards, targets, counters, and restored position.
- Rebuild My Adhkar with the same header, card proportions, swipe transition, arrows, dot scrubber, source badge, and counter treatment as Morning Adhkar.
- Rebuild Sleep and Wake with that same card system while retaining their selector, separate progress, physical Sunnah cards, completion flow, and saved positions.
- Apply the selected color preset consistently: My Adhkar and Wake use its Morning artwork/palette; Sleep uses its Evening artwork/palette.
- Fix “Show transliteration” and “Large Arabic text” so changes save immediately and update every supported adhkar card without reopening the page.
- Polish the add/edit form and card actions so they remain accessible without crowding the card experience.

## Technical details
- Reuse `AdhkarHeader`, `SwipeStack`, `DhikrCard`, `Pagination`, and existing semantic theme tokens instead of maintaining separate legacy layouts.
- Add a dedicated visual phase override for Sleep/Wake so switching modes updates artwork and palette without reviving global dark/auto modes.
- Make reading preferences drive conditional transliteration rendering and Arabic sizing, including multi-part adhkar.
- Normalize and validate locally saved My Adhkar rows so malformed older data cannot break the page.
- Preserve all existing local data and count keys.

## Validation
- Test adding, editing, deleting, counting, restarting, swiping, and restoring My Adhkar.
- Test Sleep/Wake switching, swipe navigation, counters, progress, and completion links.
- Test both reading toggles live across Morning, Evening, My Adhkar, Sleep, Wake, and After-Salah.
- Visually inspect all seven color presets at 393×852 and confirm a clean build with no runtime errors.