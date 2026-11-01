# Roadmap

- [ ] Match memorization home references: remove top Hifz label, reveal mountains, restyle Today/progress/map/streak/actions; verify phone layout and existing flows.

- [x] Verify/improve Advanced checkbox, gradient choices, draggable Hifz popup handles and outside-tap dismissal; checkbox toggles, saved choices, advanced outside/drag dismissal and customization drag verified.
- [x] Remove duplicate finish summary for Juz Amma/selected-surah setup, keeping only side-by-side estimates; phone flow and 9 estimate tests pass.

- [x] Make Advanced options a reference-style popup, slim plan heading, and show all juz completion dates; phone screenshots checked, all 30 dates visible and advanced choices saved correctly.

- [x] Show separate Juz Amma/selected-surah and whole-Quran estimates on daily-time setup; 9 tests pass and both phone flows verified.

- [x] Match Your plan references: frosted heading, goal overview, milestone pills, time chart and rounded actions; phone screenshots compared, advanced toggle and plan saving verified, 6 tests pass.

- [x] Reflect the chosen finish date in the summary, retain time-limit warnings and center summary text; 6 tests pass, phone screenshot and date/pace switching verified.

- [x] Match the finish summary reference with calendar icon, stacked serif date and compact details; phone screenshot and customization verified.
- [x] Match Customize pace popup to the new reference images; phone top/bottom screenshots, both tabs, reachable Done and saved override verified.

- [x] Simplify Hifz to time-first automatic pace selection, cached effective finish estimates, selected summary and custom bottom sheet; 18 tests pass, phone visuals checked, automatic and custom saved choices verified.

- [x] Apply exact approved Hifz timeline engine and rebuild pace/date/custom selection before time-budget confirmation; calculation tests and complete phone setup/save verified, including both warning choices.

- [x] Match the daily-time setup to reference: frosted heading, no label, rounded time rows and fading bars; phone screenshot, all six options, Next, Back and retained selection verified.

- [x] Make custom surah memorization order visible and editable; 8 tests pass and phone checks verify numbered taps, reordering, reopening and saved plan order.

- [x] Reuse the Hifz known-surah popup for starting-point surah choices; phone screenshot, search, selection count, retention, Done and Next verified.

- [x] Match the Hifz back button’s frosted finish to Settings; phone visuals and back navigation verified.

- [x] Give the surah popup a calm, light theme-matched background; phone visual check passed.
- [x] Add the shared left-side back button to Hifz setup and home; return to More verified.

- [x] Replace Hifz known-surah dropdown with a searchable frosted selection popup; search, selection retention, Done and Next verified.
- [x] Move Hifz setup below Settings and respect phone top safe areas; phone-width visual check passed.

- [x] Improve the Hifz already-memorized setup step with reference-inspired readable choices, clear selected states and theme-aware surfaces.

- [x] Hifz program screens on the src/lib/hifz engine: 5-step plan setup, home dashboard (today card, timeline, streak/forecast, juz map, weak spots, salah logger, reminders, edit plan), session flow on the recite page (manzil/sabqi review with evidence grade sheet, sabaq listen/read/recite/correct/chain, drills, link, end screen), try-first reveal lock, morning/sleep reminders (910xxx/911xxx IDs). All behind hifz_beta; verified on phone-size browser; 49 hifz/recite tests pass.


- [x] Removed Hifz Sounds option and silenced saved sound preferences; reference-inspired Aa icon rows, switches, compact choices and fixed header verified on phone.

- [x] Hifz entry and direct page gated by exact hifz_beta="1"; phone checks confirm seventh-tap unlock/relock, hidden default, direct URL redirect and preserved progress; 51 targeted tests pass.

- [x] Hifz haptic-first dispatcher and saved Haptics/Sounds defaults, 13 local sound effects and strip fallback; 47 targeted tests pass and phone browser verifies reveal, wrong marks, pulses, sounds and persistence. Physical native haptic feel still needs a device check; future AI/microphone events have patterns but are not active features.

- [x] Hifz measured layout: 22px page-number clearance and equal inner padding; stationary overlays hide strip while controls show, verified on phone.
- [x] Title sheet page/surah/juz navigation; Arabic/reversed drag swipes, adjacent data/font caching, boundary resistance and saved reveal-state restoration verified; 26 targeted tests pass.

- [x] Hifz frame scale 0.5, 12px margins and no gap to strip; shared QCF V2 sizing, opacity 0.14 and 48px cartouche verified at 393/501/1280px; font failure shows loading without fallback; 20 targeted tests pass.

- [x] Smooth Hifz controls entrance; phone touch checks confirm an eased fade/slide, stationary page and reveal strip, partial tab-bar coverage, and working settings/toggle.

- [x] Fix Hifz pointer taps and word-mark exceptions; phone touch checks verified show/hide, Aa settings, 4-second idle timeout/settings hold, swipe navigation, strip isolation and no nav overlap; 20 targeted tests pass.

- [x] Integrate supplied immutable mushaf components/artwork only on Hifz; all 16 theme/phase pairs checked, 15 rows without overflow, reveal/grading/navigation and saved settings verified on phone and desktop; 16 targeted tests pass.

- [x] Replace only fresh recite page with themed ornamental Madani mushaf, hidden-word controls and settings; reveal/marks/auto-hide tested, 15 rows and no overflow in Rose, Ocean and evening

- [x] Fresh standalone Hifz recite page from uploaded brief, isolated from retired Hifz
- [x] Use existing artwork only; skip new background images, night mode and rising-sun effects
- [x] Verify self-check through all 12 ayahs of page 562, word marks, settings persistence, page navigation, qari playback and no clipped lines; 134 tests pass

- [done] Frosted backdrop for Quran search bar when scrolling up (verified at phone size)
- [done] Add reciter photos from user-uploaded Shuyookh_Profile_PNGs.zip (59 portraits wired via CDN assets)
- [x] Tapping the minimized Quran player must not restart recitation
- [x] Full screen Quran reading
- [x] Pink morning English verse highlight visibility

- [x] Ilm Guide giveaway (oaths, progress, referral link, entries in admin)
- [x] Hide Zakat calculator tile and due card from More (kept for a later revival)
- [x] Remove the selected-reciter sound-bar effect from the All Reciters list
- [x] Move Continue Reading clear of the Choose a Reciter panel
- [x] Favorites lead the home Choose a Reciter strip with no repeated names
- [x] Preload reciter portraits in the background so avatars never sit blank

- [x] Smarter hadith search + highlight
- [x] Stop over-scroll below hadith Prev/Next

- [x] Hadith loading pill -> animated progress bar with a patience line
- [x] Compact hadith title card (verified 161px, 14px padding)
- [x] Adhkar mini bar sits under the Quran player
- [x] Rose theme morning wallpaper replaced with the blush misty valley sunrise
- [x] Lavender (twilight) theme morning wallpaper replaced with the twilight mountain mist
- [x] Ocean theme morning wallpaper replaced with the ocean mist mountain valley
- [x] Emerald theme morning wallpaper replaced with the misty emerald valley sunrise
- [x] Sand theme morning wallpaper replaced with the golden misty valley at sunrise
- [x] Midnight theme morning wallpaper replaced with the moonlit mountain valley mist

- [x] Prayer timeline opens as a lower partial sheet; settings button hidden while it is open
- [x] Prayer timeline sheet a little taller (min(76dvh, 690px) — top edge ~24% down, 641px of 844px)
- [x] Player: with "Play entire Quran" on, the next surah keeps the player minimized
- [x] After-salah sheet: close button works with a finger tap; sheet a touch shorter
- [x] Prayer timeline: a tiny bit taller
- [x] Prayer timeline: open focused on today, not between days
- [x] Prayer timeline: swipe-to-close only from the top handle line
- [x] After-salah sheet: card drop shadow removed; sheet tinted deeper so the card reads




- [x] Player: shuffle/repeat engaged state clearly visible (accent tint + ring)
- [x] Salah dismiss button reads "Tap to mute next adhan"

- [x] Remove Hifz screens, navigation, reminders, local progress and code; preserve Arabic review rules and Quran tajweed (129 tests pass; browser checks pass)
- [ ] Permanently delete retired Hifz cloud backups — blocked by the backward-incompatible database migration safety setting; backups are inactive and marked deprecated
