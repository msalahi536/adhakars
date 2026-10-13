# Architecture Decisions

- Homepage and download share-image metadata use one CDN-backed homepage capture in their leaf heads, never a root screenshot, so link previews stay deliberate and unrelated pages cannot inherit stale artwork.

- Prayer calculation controls live only in main Settings and use shared prayer settings, so Salah times and alerts stay aligned.
- Salah's no-location countdown is display-only state, never prayer slots or notification input; the main content owns scrolling and setup cards cannot shrink, so location controls remain accessible.

- Native prayer widgets fetch their selected source directly; the bridge passes only location, source, calculation method and Asr school from shared prayer settings on changes, with no prayer-time handoff.
- JAKIM uses Waktu Solat monthly GPS-zone timetables with cached days and preserved Unix timestamps; no fallback to Aladhan is permitted for official times, so alerts remain exact across timezones.
- Widget bridge and content rotation regression tests run with Bun next to their modules, so native handoff rules and UTC daily selection stay independently verifiable.

- Website branding and installable home-screen icons use CDN asset pointers derived from the same supplied logo; the favicon remains a downscaled public file so browser icon discovery works.
- Homepage sections use native fragment links inside the shared marketing shell so navigation remains accessible and smoothly scrolls without client state.
- Homepage download content groups its actions with the copy and reuses the actual app-screen mockup, so the section stays coherent without fabricated screens.
- Legal copy (privacy, terms) lives only in `src/data/legal.ts`; the website and in-app legal screens both render from it so the two can never drift.
- Scheduled notifications beyond basic reminders (prayer-based adhkar, Sunnah, period) live in `src/lib/smart-notifications.ts` and are rescheduled on every app open, because local notifications can only be planned a few days ahead.
- Adhan notifications have no master switch: each prayer is enabled independently and opens a reciter picker with native audio previews on the Salah page.
- Real prayer alerts derive native enabled prayers from Salah settings, preserve valid schedules on fetch failure, and re-arm on app resume; tests bypass these checks.
- Android prayer location uses `navigator.geolocation`, persists the fix for offline use, and every adhan schedule derives from the selected prayer source for that saved coordinate.
- More keeps its feature tools first; detailed consistency and lifetime statistics open from one compact summary so they never obscure feature discovery.

- App launch has no onboarding or guided tour; release notices use a versioned acknowledgment and bounded release window without resetting appearance or progress.
- The adhan consent prompt is offered once (persisted acknowledgment) right after Salah saves a location, or on the first notification grant; "Yes" requests notification access, enables all five prayers and opens Adhan Settings — nothing is auto-enabled.
- Salah owns the once-per-install automatic location request; app launch, Settings entry, and widget synchronization only read saved coordinates so permissions never stack on launch.
- Explicit rating actions synchronously open the store review destination rather than requesting the optional native review popup, because Apple can silently suppress it and browser plugin implementations can be no-ops.
