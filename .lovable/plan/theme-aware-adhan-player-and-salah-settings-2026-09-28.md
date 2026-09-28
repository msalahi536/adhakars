# Theme-aware Adhan Player and Salah settings

## Build
- Restyle the full-screen and minimized Adhan player using the active theme’s surfaces, text, accent, borders, and shadows while keeping the mosque motif and playback controls.
- Replace the current “Adhan notifications on / mute today” card on the Salah page with an “Adhan Settings” entry that opens a compact themed sheet.
- Put notification enablement, five prayer toggles, sound choice, and per-prayer reciter dropdowns in that sheet; show it only in the native app.
- Migrate existing global reciter preferences to per-prayer choices and schedule each prayer with its chosen reciter sound.
- Remove the duplicate adhan notification, sound, and test controls from the general Settings page while retaining calculation method, location, and ordinary reminder controls.

## Verification
- Check the default and Midnight themes at phone size, including the player, the minimized pill, and the Salah settings sheet.
- Confirm the app builds cleanly and existing saved adhan choices migrate safely.
