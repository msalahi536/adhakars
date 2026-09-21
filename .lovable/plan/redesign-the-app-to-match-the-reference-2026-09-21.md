# Redesign the app to match the reference

## Scope
- Apply the attached botanical background across the in-app experience while preserving user-selected light, dark, and custom color themes.
- Rebuild shared page headers with centered labels, titles, progress, and compact corner actions.
- Restyle adhkar screens around one clean, centered reading card with refined typography, generous spacing, source details, and an integrated counter.
- Replace the edge-to-edge bottom bar with a floating, rounded five-item navigation dock.
- Carry the same softer surfaces, borders, shadows, spacing, and controls through Salah, Tasbih, More, Settings, and nested pages without changing existing functionality.

## Implementation
- Store the supplied background through the project asset pipeline and expose it through app-level visual tokens.
- Update shared layout and theme styles so the botanical treatment responds gracefully to light and dark modes.
- Refine `AdhkarPage`, `SwipeStack`, `DhikrCard`, and shared controls to closely reproduce the supplied morning screen.
- Refine `BottomNav` into the floating dock while preserving active states for nested More pages and safe-area spacing.
- Adjust shared page chrome and route-specific containers where needed so every app screen feels part of the same design system.

## Validation
- Check Morning, Evening, Salah, Tasbih, More, Settings, and nested pages at the current iPhone viewport.
- Verify card scrolling, counters, swipe navigation, sheets, safe areas, and the floating navigation remain usable.
- Confirm the app builds without errors and the onboarding overlay still layers correctly.
