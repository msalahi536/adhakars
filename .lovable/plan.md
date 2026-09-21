# Morning, Evening, Salah, and Tasbih fix pass

## Scope
- Keep all routes, prayer calculations, stored progress, counters, audio, notifications, swipe behavior, overlays, and existing copy unchanged except the explicitly supplied Tasbih helper text.
- Treat the three attached images and the 390×844 measurements as the visual specification.

## Implementation
1. **Shared app controls**
   - Keep one `BottomNav` mounted by the `/app` layout and remove any page-level duplicates.
   - Lock its geometry to 60px height, 18px radius, 28px side margins, and 14px safe-area offset on every tab.
   - Normalize all five icons to 22px, 1.5px outline strokes and redraw Salah/Tasbih custom SVGs at matching optical weight.
   - Keep one shared top-right `SettingsButton` on the five main screens and remove conflicting page-specific gear placement.

2. **Morning and Evening reader**
   - Remove the completed-count label and center a 220×7px progress bar.
   - Shift the header, progress, page pill, and card down 10px while preserving pagination and tab positions.
   - Restore one fixed card height for every dhikr; keep short content top-aligned and long content internally scrollable.
   - Darken Evening with the supplied navy token set, bottom-right sunset glow, and multiplied night artwork.
   - Align arrows and dots in one 24px row and remove the ornament.
   - Add dot tapping plus a 250ms hold-drag scrubber with instant index changes and light haptics; retain animated card swipes.
   - Replace completion feedback with the specified ring, single scale pulse, soft glow, check cross-fade, medium haptic, and normal auto-advance.

3. **Tasbih reconstruction**
   - Apply the Morning artwork and green palette.
   - Match the supplied heading, chips, fixed card, corner controls, 280px neumorphic counter disc, typography, and helper text.
   - Keep the full card tappable and preserve undo, 2.5-second reset, targets, persistence, and haptics.

4. **Verification**
   - Check Morning card 1, Evening card 3, Tasbih, and Salah at 390×844.
   - Confirm identical tab-bar geometry, fixed equal adhkar card heights, level arrow/dot alignment, no trailing ornament, near-black Evening, green Tasbih, and no clipping or unexpected page scroll.
   - Confirm the preview build has no errors.
