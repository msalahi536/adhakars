# Architecture Decisions

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

- Hifz state is local-first in `src/lib/hifz/store.ts` with pure rules in `scheduler.ts` (tested); optional cloud backup stores one merged JSON row per user, so the app never requires an account.
- Open-source notices live only in `src/data/licenses.ts`.
