# Qibla and My Adhkar polish

## What will change
- Increase the bottom navigation corner radius by a very small amount without changing its height or position.
- Rebalance the Qibla page so its heading sits lower and the compass is visually centered in the usable screen.
- Simplify compass calibration into a clearer guided figure-eight: stronger path, obvious moving marker, visible next target, short instructions, and forgiving completion.
- Move the My Adhkar add button into the correct header position and match the active theme.
- Rebuild the add/edit sheet so its scrolling content never shows through or beneath the fixed action area.
- Replace the browser delete prompt with a polished, theme-aware in-app confirmation dialog.

## Technical details
- Preserve current compass sensor, bearing, permissions, custom-adhkar storage, swipe, edit, and delete behavior.
- Use existing semantic theme colors and shared controls so all seven appearance presets remain consistent.
- Validate Qibla calibration states and My Adhkar add/edit/delete at the current mobile viewport, then check the latest app diagnostics.
