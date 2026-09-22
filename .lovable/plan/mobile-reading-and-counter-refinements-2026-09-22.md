# Mobile reading and counter refinements

## Changes
- Correct the Three Quls target to 9 total taps, representing three recitations of each of the three surahs.
- Rebalance Morning and Evening vertically: move the shared navigation slightly lower, raise the heading/progress/count indicator group, and give the card more remaining height.
- Apply the navigation adjustment once in the shared app layout so every tab moves consistently.
- Allow horizontal card swipes to begin from the scrollable text body while preserving vertical scrolling.
- Prevent iOS text selection, callouts, and gesture zoom on cards and pagination scrubbing without disabling card controls.
- Restore the Tasbih counter to a true circle at every supported phone height by sizing it from the smaller available dimension.

## Technical details
- Update the Three Quls data target only; retain the supplied Arabic, transliteration, translation, and hadith details.
- Resolve swipe intent by axis: horizontal movement changes cards and vertical movement scrolls the card body.
- Keep pagination dots small and evenly distributed; suppress selection/callout behavior on the interactive reading surface.
- Adjust shared layout variables and existing Morning/Evening/Tasbih selectors rather than adding page-specific safe-area workarounds.

## Verification
- Check Morning, Evening, Tasbih, and another tab at 393×852.
- Confirm the Three Quls shows a target of 9, text-body swiping works, long text still scrolls vertically, pagination scrubs without selection, the nav moves consistently, and the Tasbih ring remains circular.
