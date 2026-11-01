# Architecture Decisions

- Beta Hifz records attempts once; third clean lesson credits lines, page reviews need one. Results show mastery, hesitations and drift apart from self-marks. Ranges share a mic and cached models/keys. Quran voice memoizes Madani pages, reserves lesson-sized heading rows for Basmala, and mutates highlights directly. Search delegates stopping/confidence to engine sessions and meters their streams; all mics stop on exit.
- Daily editor uses encrypted, server-verified sessions; dated snapshots override only their UTC day with rotation fallback. Browsing reuses Quran/hadith clients with cancellable updates, preserving widget contracts.
- Hifz qari playback uses cancellable generation tokens and settled segment waits; stage changes invalidate playback before mic startup so repeat loops cannot restart audio after a stop.
- Hifz AI notices are runtime-independent and checking is free. Component-owned replay, retained mic, echo/tafsir, engine drills and local milestone keys preserve state/layouts.

- Hifz dialogs portal above navigation; practice uses engine exports and Quran-source ranges/names. Sleep previews save device-only passages for unrecorded recall.

- Hifz setup caches automatic pace candidates per plan when time selection opens, ranks the approved engine's effective finish dates with smaller-pace tie breaks, and keeps custom overrides in a bottom sheet; the selected summary reflects an active finish-date target with any engine time-limit warning. Immediate-goal and whole-Quran comparisons use the same chosen pace and engine with scope-only index ranges, excluding known pages and preserving selected-surah order before the remaining Quran.
- Hifz home and plan finish summaries share selectedFinishEstimate with the saved daily-minute budget; time-limit warnings compare displayed month/year so realistic dates never contradict or repeat themselves.

- Hifz known-surah and starting-order choices render one shared setup dialog with independent selections; pure tested surah-order helpers preserve tap order and handle reordering before saving to the engine, keeping review and learning goals separate.

- Hifz setup popups share a pointer-captured drag handle that moves only the dialog and dismisses via its controlled state; outside taps retain Radix dismissal, and advanced review choices use the shared Checkbox for reliable touch targets.

- Recitation meters share six frequency bands and one smoothing mapper for live spectra and decoded device envelopes, so lines follow actual tone.

- Personal appearance is manual and device-only, with independent phase defaults and page overrides in local storage and compressed photos in IndexedDB; no remote photo analysis is permitted.
- The appearance popup uses a fixed, non-interactive and non-scrollable home-screen composition with real adhkar data and shared palette tokens, so draft edits preview immediately without affecting progress or the saved theme.
- Personal palettes map editable roles onto shared semantic tokens with scoped priority over legacy preset CSS; clearing tracked personal tokens restores standard presets without changing their designs.

- Homepage and download share images use one CDN homepage capture in their leaf heads, never root, so other pages cannot inherit stale artwork.

- Main Settings and the Adhan Settings calculation popup use shared prayer settings, so location, Salah times, alerts, and widgets stay aligned.
- Salah's no-location countdown is display-only state, never prayer slots or notification input; the main content owns scrolling and setup cards cannot shrink, so location controls remain accessible.

- Native prayer widgets fetch their selected source directly; the bridge passes only location, source, calculation method and Asr school from shared prayer settings on changes, with no prayer-time handoff.
- JAKIM uses Waktu Solat monthly GPS-zone timetables with cached days and preserved Unix timestamps; no fallback to Aladhan is permitted for official times, so alerts remain exact across timezones.

- Website branding and installable home-screen icons use CDN asset pointers derived from the same supplied logo; the favicon remains a downscaled public file so browser icon discovery works.
- Homepage sections use native fragment links inside the shared marketing shell so navigation remains accessible and smoothly scrolls without client state.
- Homepage download content groups its actions with the copy and reuses the actual app-screen mockup, so the section stays coherent without fabricated screens.
- Legal copy (privacy, terms) lives only in `src/data/legal.ts`; the website and in-app legal screens both render from it.
- Scheduled notifications beyond basic reminders (prayer-based adhkar, Sunnah, period) live in `src/lib/smart-notifications.ts` and are rescheduled on every app open, because local notifications can only be planned a few days ahead.
- Adhan notifications have no master switch: each prayer is enabled independently and opens a reciter picker with native audio previews on the Salah page.
- Real prayer alerts derive native enabled prayers from Salah settings, preserve valid schedules on fetch failure, and re-arm on app resume; tests bypass these checks.
- Android prayer location uses `navigator.geolocation`, persists the fix for offline use, and every adhan schedule derives from the selected prayer source for that saved coordinate.
- More keeps its feature tools first; detailed consistency and lifetime statistics open from one compact summary so they never obscure feature discovery.

- App launch has no onboarding or guided tour; release notices use a versioned acknowledgment and bounded release window without resetting appearance or progress.
- Adhan consent is asked once (persisted) on the first location-less Salah visit or first notification grant, before location; "Yes" enables all prayers then asks location.
- Salah owns the once-per-install automatic location request; app launch, Settings entry, and widget synchronization only read saved coordinates so permissions never stack on launch.
- Explicit rating actions synchronously open the store review page, not the native review popup, which Apple can silently suppress.

- Preset day palettes are scoped to the morning visual phase, never a route alone; evening maps all shared surfaces and text roles to its own palette so Settings, tools and reading screens cannot inherit day colors.
- The Quran tab reads text, translation, transliteration and word-timed chapter audio directly from the public Quran.com v4 API in the browser; karaoke highlighting is derived only from the audio clock, so no Quran content is stored in the app.
- Quran playback uses one app-wide store outside routes so recitation survives page changes; repeat restarts manually, not audio.loop.
- Quran reading mode is an in-app body-portaled overlay, never the browser/native fullscreen API, which broke the reader.
- mp3quran.net only adds reciters Quran.com lacks (audio + verse timings); Quran text stays from Quran.com.
- Zakat rulings live only in `src/lib/zakat/rules.ts` and pure `calculate.ts` (integer cents, tested); data stays on device; evidence text is left for the owner to fill.
- AI search returns only references (verse keys, hadith ids); text comes from the source API.
- Read subdirectory AGENTS.md files before editing there.
- App AI uses the owner's GEMINI_API_KEY via `src/lib/gemini.server.ts`, by request.

- Open-source notices live only in `src/data/licenses.ts`.
- Every local-notification scheduler plans only a few days ahead, and `src/lib/notification-budget.ts` trims the furthest-away pending notifications (never prayer alerts) so iOS's 64-pending limit is never hit.
- Tajweed coloring parses Quran.com word tajweed markup through pure `src/lib/tajweed-rules.ts` (never raw HTML) and appears only where full text is meant to be read.
- Arabic Companion is a lesson engine: content in `src/lib/arabic/content.ts`, pure unlock/review/error rules in `engine.ts` replaying an append-only local log with independent intervals in `review.ts`; letter audio is recorded files only, never text-to-speech.
- Retired Hifz cleanup in the shared notification startup removes only `hifz:` storage keys and reserved Hifz alert IDs, so all other progress and schedules survive removal.
- Fresh Hifz uses independent `quran-recitation:v1` device storage and Quran.com page/line data with QPC v2 fonts, never retired scheduling data. Uploaded `components/mushaf` components and `public/mushaf` artwork stay immutable; route-only integration uses their provider tokens and shared visual-phase settings (lavender maps to twilight, dark-red to darkred). Unsupported mushaf editions stay disabled rather than relabeling Madani data.
- Hifz page gestures share pure tap/swipe/boundary rules with axis-locked dragging; adjacent query/font caches support animated turns, and page-container revealed-word exceptions keep marking and strip actions separate without modifying supplied components.
- Hifz mushaf rendering waits for its matching page font and fits all lines with one measured size; tajweed uses word-level indicators in QCF mode, preserving glyphs without claiming unverified character-to-glyph mappings.

- Hifz feedback uses one cancellable Capacitor pattern dispatcher with batched mistake priority and a 1500ms cooldown; native-unavailable feedback pulses the strip, and optional local effects never replace qari audio. Future microphone and recognition events use the same dispatcher without implying those features are active.
- Hifz entry and rendering share a hydration-safe device beta gate; defer recite queries until enabled and redirect disabled direct visits to More, so hidden access never flashes or clears progress.
- The Hifz program (plan setup, home, session flow) lives outside `src/lib/hifz/` and only calls the engine; `/app/hifz` is the program entry and `/app/hifz/recite` the mushaf page, so the parent route renders `<Outlet />` on child paths. Program state is `hifz_state_v1` (no `hifz:` prefix, so retired-Hifz cleanup never touches it); reminders use IDs 910000/911000, clear of the retired 900-range.
