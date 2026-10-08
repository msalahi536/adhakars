# Responsive sizing fix

## Goal
Make the installed app feel properly sized and comfortably spaced on iPhone 17 Pro while preserving smaller phones, tablets, and desktop.

## Changes
- Harden the mobile viewport so iOS cannot render the app at an unintended page scale.
- Replace rigid phone spacing with width- and height-aware sizing for cards, headers, navigation, Salah, and Tasbih.
- Keep safe-area spacing correct around the Dynamic Island and home indicator.
- Cap expansion on tablets and desktop so content remains readable rather than stretching too wide.
- Verify Morning, Evening, Salah, Tasbih, More, My Adhkar, and Qibla at representative phone, tablet, and desktop sizes.

## Technical details
- Use `svh`/`dvh` viewport bounds and explicit iOS text sizing.
- Add a modern-phone breakpoint around 400px width without affecting compact phones.
- Test for clipping, horizontal overflow, and navigation overlap.
