# Dark Red reference styling and selector repair

## What will change
- Keep the Dark Red preset and tune its Morning and Evening card, navigation, arrows, dots, progress, and counter colors to match the supplied references.
- Use translucent warm brown-red glass for Morning and deeper oxblood glass for Evening, with muted rose borders and readable cream/pink text.
- Preserve the existing Dark Red background artwork and all current layouts, spacing, typography, and content.

## Selector diagnosis and fix
- Remove the blanket pointer cancellation that currently prevents dot buttons from receiving normal taps on iPhone.
- Keep iOS text selection and callouts disabled using CSS, without suppressing the selector's pointer events.
- Separate tap selection from drag scrubbing so a tap selects one dot and a horizontal drag continuously scrubs through cards.
- Verify arrows, individual dots, and dragging all work without triggering page selection or zoom.

## Verification
- Check Morning and Evening at the current iPhone viewport.
- Confirm selector taps, drags, and arrow navigation work.
- Confirm the Dark Red card and navigation colors match both references and remain readable.
