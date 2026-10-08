# Make Period Companion calm, clear, and predictive

## What will change

- Remove the privacy line from the header and keep the existing privacy reassurance at the bottom of the tracker.
- Keep the Today layout stable when symptoms are selected. Tapping a symptom will only select it; relevant guidance, such as the cramps dua, will open in a small themed overlay instead of inserting a card above the cycle summary.
- Add a subtle “View relief dua” action to the selected cramps tile so guidance remains easy to reopen without surprise popups.
- Replace the calendar’s ambiguous “Start Period” and “Add End Date” actions with a single clear “Log period” flow.
- Let users enter both start and end dates, including past dates, so they can add cycle history and improve predictions.
- Let users edit or delete existing logged periods from History using the same date-range flow.
- Improve empty states and prediction messaging so users understand that estimates become more accurate after multiple logged cycles.
- Keep transitions smooth and prevent new content from shifting the page unexpectedly.

## Technical details

- Add a validated date-range save/update function while preserving the existing local-only storage format and all current data.
- Use the existing themed dialog system for symptom guidance and period-date entry.
- Reject invalid ranges, future dates, and overlapping periods with clear inline messages.
- Recalculate average cycle length, average period length, next period, and ovulation estimates from valid historical ranges.
- Verify Today, Cycle, and Learn at iPhone dimensions and confirm no horizontal overflow or layout jumps.
