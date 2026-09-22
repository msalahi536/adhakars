# Adhkar content and navigation corrections

## Changes
- Remove emoji characters from all visible app text, replacing status marks and warnings with existing line icons or plain wording.
- Move the weak-narration indicator from the hadith reference pill to the Commentary heading, using a small outlined icon rather than an emoji.
- Add a short line beneath expanded Commentary explaining that the reference pill opens the complete hadith and breakdown.
- Rework pagination for the 23–24 card collections so all dots remain small, uniform, and usable within the available width while preserving arrows and drag selection.
- Replace both Morning and Evening Three Quls entries with the complete supplied Basmalah, all three surahs, transliterations, translations, English narration, Arabic narration, source, grading, and reward.

## Technical details
- Keep the existing card layout and theme unchanged.
- Model the Three Quls as structured multi-part content so every surah is displayed in full and remains independently readable.
- Verify Morning and Evening at the current 393×852 viewport, including expanded Commentary, source popup, weak entries, and pagination interaction.
- Confirm the app compiles without errors and scan all app-facing source content for remaining emoji characters.
