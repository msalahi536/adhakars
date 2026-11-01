# Roadmap

- [ ] Follow the imam: cached word-position page lookup, locked-only synchronous turns, adjacent page/font prefetch; test Al-Bayyinah 598→599 with recorded audio.
- [ ] Follow mushaf: non-overlapping 15 fixed slots with general surah header/Basmala exceptions; inspect 598–604, 1, 2, 187, 50 and capture 598/187/turned page.

- [x] Replace Quran voice search with engine-managed confident/15-second sessions, live bars, repeated-phrase locations and uncertain guesses. Trimmed recorded Al-Ikhlas auto-stopped at confident 112:1; Open in mushaf reached page 604. Early mic stop showed the uncertain message; 9 focused tests passed. Repeated-location/Maybe rules passed unit tests; controlled browser fixtures did not load and are not claimed verified.
- [x] Restore lesson-matching 48px surah-heading rows before all three surahs on follow page 604; screenshots confirm three visible Basmala lines on phone and desktop. Preview has no browser errors and latest build is OK; actual-phone mic behavior remains unverified.

- [x] Add My Mushaf memory map and slipping review nudges; checked 604 buttons/30 juz rows and page 312 Review now opens manzil session.
- [x] Add optional Salah portions with source surah/ranges and saved engine light reviews; browser readback confirmed salah history.
- [x] Add prayer-time-gated sleep preview and unrecorded morning recall; real audio played three times, saved next-day passage, after-Fajr recall left Hifz state byte-identical. Recorded input scored Solid 99/100 and Good 80 on a later run with dropped opening words; accuracy/phone haptics remain unverified.
- [x] Add voice answers using drillRange and startListening to every drill, plus Quran-source 15-line position quizzes; real Al-Ikhlas voice answer advanced drill 1 to 2, position answer highlighted source line 13.
- [x] Capture each screen in walkthrough collection; phone-sized preview has no browser errors, latest build OK, 27 focused tests pass.

- [x] Add beta-only Quran Follow the imam and Find an ayah modes with themed Madani pages, direct word highlights, English crossfade/size, wake lock and eight-second/early-stop search. Browser recorded Al-Ikhlas follow locked to 112:2 and turned to page 604; search returned incorrect 2:60, an engine accuracy limitation (not claimed accurate). Both source-text result and Open in mushaf flows/screenshots checked; 25 tests pass. Real-phone recognition/wake lock unverified.

- [x] Connect AI mastery, hesitation and drift results to one-mic lessons/reviews; every attempt records bridge evidence, third clean lesson pass credits lines once, whole-page review passes once. Recorded Al-Ikhlas scored Solid 100 with saved history; controlled hesitation/drift fixtures verified Good, dots, comparison/source text/audio and completion. 36 tests pass, preview has no browser errors, page stays stationary; phone checks and naturally occurring drift remain unverified.

- [x] Daily pickers open with source content, surah/collection/topic browsing, optional search and Load more; compact hadith previews expand fully. Signed-in phone flow verifies both selections reach scheduling, 5 scheduling tests pass and build OK; widget behavior untouched.

- [x] Correct missing editor session in preview: encrypted Secure/HttpOnly SameSite=None partitioned cookie, cross-site write rejection and explicit lost-session error. Both real source saves/read-back, refresh and sign-out pass; defaults untouched and test assignments removed. Actual hosted iframe retry still needs user confirmation; local cross-site reproduction is unavailable.

- [x] Build restricted daily Quran/Sunnah editor: secure server session, source lookup, yearly calendar and date/week/range assignments. Seven tests pass; mobile source searches, both saved selections/read-back, refresh session, restore rotation and sign-out verified. Test assignments removed. Native same-day cache/refresh behavior unchanged; publish required.

- [x] Fix Hifz lesson flow: cancellable 3× qari/auto-Read/Skip, AI default and Self fallback, hidden/reached AI words, multi-surah correction/override/weak spots, resumed waveform and reachable action. 50 tests pass; actual recorded audio through browser mic verified live updates, stopped qari, Correct → override → Chain → saved sabaq. Skip, decline, denied mic, stationary page and fallback Session complete verified. Model flagged errors on qari recording, so accuracy/clean-pass end-to-end and actual iPhone microphone/haptics remain unverified; clean-pass rules covered by tests.

- [x] Connect hidden free on-device Hifz checker: consent/progress, cached model/runtime/114 answer keys, mic waveform, word feedback, safe Retry and attribution. 47 tests pass; actual Al-Mulk recorded audio through browser mic reaches final results and offline restart; unchanged mushaf/gestures checked. Installed-phone microphone/haptics and recognition accuracy remain device checks, not claimed verified.

- [x] Aligned Home and Your plan realistic estimates and suppressed repeated date warnings; 11 tests pass and saved 45-minute phone flow shows July 2034 / 7 yr 8 mo consistently.

- [x] Made reminder tracks/thumbs larger and clearly contrasted; added frosted Edit plan back arrow. Phone screenshots and return without saved-plan changes verified; native reminder activation remains device-only.

- [x] Matched action rows with larger dark text and soft circular icons; body-portaled Salah/Juz/reminder popups clear navigation, named surah choices replace page-only grids, Salah save and Start verified; 4 targeted tests and build pass.

- [x] Enlarged dark Your Hifz text; fixed partial learning pages counted as fully memorized in Juz stats, added exact page counts and kept proportional fill; 16 tests pass.

- [x] Softened Today to reference olive gradient and made heading frost slimmer/more transparent; phone screenshot and Start verified.

- [x] Darkened Today with an opaque deep gradient, raised home 8px further and added the frosted heading; phone screenshot, popups and Start verified; build OK.

- [x] Refined Today close-up with softer shaded gradient, relaxed lettering, tighter spacing and pale Start pill; moved content up 10px, reviewed phone screenshot and verified Start and popups.

- [x] Match memorization home references: removed top Hifz label, revealed mountains, restyled Today/progress/map/streak/actions; saved-plan phone screenshots, Juz/Salah/reminder popups and Start session verified.

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
