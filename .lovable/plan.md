# Correct Morning and Evening Adhkar Screens

## Goal
Match the supplied Morning and Evening references using the existing shared screen, content, navigation, and behaviors.

## Changes
- Keep one shared Morning/Evening structure and switch only theme tokens and background opacity.
- Stabilize the centered header, 48px settings control, progress row, and page counter.
- Replace the rigid card stage with an auto-height card inside one scrollbar-free content region.
- Preserve all Arabic, transliteration, source, target, and counter content without clipping.
- Reserve fixed clearance for pagination and the floating navigation so neither overlaps the card.
- Refine the shared thin-line sun, moon, mosque, prayer-bead, ornament, and settings icons.
- Centralize Morning ivory/sage and Evening navy/lavender surfaces, text, borders, dots, and navigation colors.
- Use a 750ms crossfade without changing layout dimensions.

## Responsive behavior
- Lock the outer app viewport with no browser scrollbar.
- Keep the header and navigation fixed in place.
- Allow only the content region between them to scroll on short screens.
- Maintain the same hierarchy at 375, 390, 393, 402, 414, and 430px widths.

## Validation
- Compare both screens visually to the references after implementation.
- Check every requested mobile width for overlap, clipping, and horizontal overflow.
- Confirm transliteration, source, target, counter, pagination, and navigation remain fully reachable.
- Confirm Morning and Evening dimensions match and the build is clean.
