# Update both Ruqyah guides from the supplied document

## Changes
- Replace the current nine Self-Ruqyah steps with the document’s corrected nine-step sequence, preserving its wording, citations, counts, and adaptation label.
- Turn “Ruqyah for Others” into a seven-step walkthrough using the document’s wording, Arabic, transliteration, translation, narrations, and notes.
- Preserve the existing themed step-by-step presentation and medical-care notice; only the two requested guide flows and their supporting content will change.
- Verify every displayed step against the uploaded document and check both guides on the phone-sized preview.

## Technical details
- Keep the guide content centralized in `src/data/ruqyah.ts`.
- Reuse the existing recitation and sourced-dua cards where their text already matches the document.
- Extend the “Ruqyah for Others” screen to use the same navigable step pattern as Self-Ruqyah.
