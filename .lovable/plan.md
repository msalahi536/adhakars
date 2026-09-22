# Unified day/night themes and prayer experience

## What will change

- Remove **Customize each section** from Settings, including its hidden color pickers and unused section-specific state.
- Make appearance mode apply to the **entire app**, not only the Morning or Evening tab:
  - **Light:** always use the selected theme’s morning artwork, light cards, controls, and navigation.
  - **Dark:** always use the selected theme’s evening artwork and evening palette on Morning, Evening, Salah, Tasbih, More, and related app pages.
  - **Auto:** switch the entire app to the evening artwork/palette at the saved location’s real Asr time, then return to morning styling at the next day’s Fajr. If prayer times are temporarily unavailable, use a safe time-of-day fallback until they load.
- Keep the selected navigation item correct while making the whole navigation bar follow the active day/night palette.

## Prayer timeline

- Replace the timeline sheet’s hardcoded cream/olive colors with semantic colors from the active preset and day/night state.
- Preserve strong contrast for prayer names, times, day labels, the “NOW” marker, and close control in every theme.
- Keep rows display-only and retain comfortable spacing and automatic focus on the next prayer.

## After-Salah adhkar redesign

- Rebuild the sheet to closely match the supplied reference: calm themed backdrop, polished rounded sheet, drag handle, clear “After [Prayer]” heading, prayer selector, centered card position control, and a spacious adhkar card.
- Restyle the adhkar card for the active preset and day/night state, including audio, Arabic, transliteration, translation, source, counter, commentary, arrows, and dots.
- Keep counting, swiping, prayer switching, completion progress, reset behavior, and stored progress working.
- Keep the main bottom navigation visible and readable while the sheet is open, with the sheet content ending safely above it.

## Validation

- Check Light, Dark, and Auto behavior across Morning, Evening, Salah, Tasbih, and More.
- Check all seven color presets for readable timeline and after-Salah content, correct artwork, and matching navigation.
- Verify the after-Salah flow at 390×844, including prayer switching, card navigation, counting, scrolling, and closing.
- Confirm there are no overflow, console, runtime, or build errors.

## Technical details

- Centralize a resolved visual phase (`morning` or `evening`) in the theme store and expose it on the document so existing preset CSS can key off the active phase instead of the current route.
- Read today’s cached prayer times for the configured location to resolve Auto mode at Asr; refresh the phase when prayer settings/times change and at the next boundary.
- Update background selection in the app layout to use the resolved phase, then migrate evening-only CSS selectors to respond to that phase across every app section.
- Use existing semantic theme tokens for both prayer overlays rather than embedding one palette’s literal colors.
