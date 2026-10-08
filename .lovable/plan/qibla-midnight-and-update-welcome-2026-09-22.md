# Qibla, Midnight, and update welcome

## What will change
- Replace the calibration “dot game” with a clear figure-eight demonstration and simple completion action, so it no longer snaps into corners.
- Keep the sensor check, but ask the user to physically move the phone in the demonstrated motion rather than steer an on-screen dot.
- Repair the Midnight palette across cards, text, controls, navigation, dialogs, and both Morning and Evening views.
- Add a polished one-time “What’s New” popup for returning users.
- On the first launch of this update, return appearance to Original while preserving all reading progress, streaks, reminder settings, and custom adhkar.

## Update popup content
- Expanded Morning and Evening collections.
- Complete Three Quls and detailed hadith references.
- New appearance themes and repaired Midnight styling.
- Clearer Qibla calibration.

## Technical details
- Use a versioned local marker so the popup and appearance reset happen once for this update only.
- Only theme-related saved values are reset; no progress or adhkar storage keys are touched.
- Use existing dialog and button components with semantic theme colors.
- Verify at 393×852 and confirm saved progress/custom adhkar remain unchanged.
