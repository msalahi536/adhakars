# Structural iPhone layout repair

## Diagnosis

- **Viewport:** `viewport-fit=cover` is already present, so safe-area values are available in Capacitor.
- **Overall height:** `html`, `body`, and `.app-shell` each stack `100%`, `-webkit-fill-available`, `100svh`, and `100dvh`, while `body` is also fixed. This creates competing containing-block heights in WKWebView.
- **Shared layout:** `.app-shell` is a flex column, but the route content and bottom navigation are not arranged as one normal flex stack. The navigation is `position: fixed`, so every page separately reserves space for it.
- **Header:** Morning/Evening use `AdhkarHeader`; Salah and Tasbih use separate fixed-height headers. Safe-area top padding is applied in several places: `.page-header`, `.adhkar-header-content`, `.salah-hero`, each Salah child, `.tasbih-header`, and responsive overrides. This double-counts or inconsistently counts the notch.
- **Card area:** `AdhkarPage → .scroll-area → inner flex column → .daily-swipe-stack → .adhkar-card-stage → .adhkar-card-motion → .adhkar-reference-card → .adhkar-reference-body → .adhkar-reference-content`. Nearly every level uses `flex: 1`/`min-height: 0`, but multiple ancestors also use `overflow: hidden`, `height: 100%`, and fixed bottom margins. WebKit resolves this chain differently from Chromium.
- **Card clipping:** the page, swipe stack, stage, motion wrapper, card, and card body all clip overflow. The inner text region can scroll, but its available height depends on a fragile chain of percentage heights. Long Arabic therefore gets visually cut while translation and commentary remain below the clipped region.
- **Salah overlap:** the hero has a fixed pixel height and every child is absolutely positioned. Safe-area offsets are applied to both the hero and its children, then altered again by height breakpoints.
- **Tasbih omission:** the header and counter area use fixed heights and bottom-nav compensation. The helper was positioned by an absolute pixel offset, so it could fall outside the clipped card on a shorter WKWebView.
- **Pagination:** dots currently use 12×30px buttons painted with radial gradients. Their appearance is coupled to interaction sizing and scrubbing state rather than a stable circle element.

## Implementation

1. Add one shared app frame inside the app shell. The shell owns top and bottom safe-area padding exactly once.
2. Use a single viewport-height source on the shell, with a WebKit fallback, and remove the fixed-body/competing max-height chain.
3. Keep the bottom navigation in normal flex flow at its fixed visual height; remove per-page bottom-nav margin calculations.
4. Make every route fill a shared `flex: 1; min-height: 0` content frame. Headers keep natural or explicit visual height without safe-area math.
5. Simplify the dhikr chain so the card fills the remaining area and only `.adhkar-reference-content` scrolls vertically. Keep heading and footer fixed inside the card.
6. Remove page-level safe-area top/bottom rules from Morning/Evening, Salah, Tasbih, and shared headers. Replace Salah's safe-area-adjusted offsets with offsets relative to the already-safe shared frame.
7. Keep Tasbih's counter and helper in flex flow so the helper cannot be clipped below the card.
8. Restore pagination visuals to small, equal-size circular dots while retaining a larger invisible interaction area for tapping and dragging.

## Validation

- Check 393×852, 402×874, 430×932, and 768×1024.
- Verify long Morning and Evening dhikr can scroll through Arabic, translation, commentary, source, and counter.
- Verify all headers clear the simulated safe region without duplicated spacing.
- Verify the Tasbih instruction remains visible and the nav does not overlap content.
- Confirm no horizontal overflow, runtime errors, or build errors.
