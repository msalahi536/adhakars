# Architecture Decisions

- Website branding and installable home-screen icons use CDN asset pointers derived from the same supplied logo; the favicon remains a downscaled public file so browser icon discovery works.
- Homepage sections use native fragment links inside the shared marketing shell so navigation remains accessible and smoothly scrolls without client state.
- Homepage download content groups its actions with the copy and reuses the actual app-screen mockup, so the section stays coherent without fabricated screens.
- Legal copy (privacy, terms) lives only in `src/data/legal.ts`; the website and in-app legal screens both render from it so the two can never drift.
- Scheduled notifications beyond basic reminders (prayer-based adhkar, Sunnah, period) live in `src/lib/smart-notifications.ts` and are rescheduled on every app open, because local notifications can only be planned a few days ahead.
- Adhan notifications have no master switch: each prayer is enabled independently and opens a reciter picker with native audio previews on the Salah page.
- Real prayer alerts derive native enabled prayers from Salah settings, preserve valid schedules on fetch failure, and re-arm on app resume; tests bypass these checks.
- Android prayer location uses `navigator.geolocation`, persists the fix for offline use, and every adhan schedule derives from Aladhan times for that saved coordinate.
- More keeps its feature tools first; detailed consistency and lifetime statistics open from one compact summary so they never obscure feature discovery.

- Onboarding renders through the shared body portal with a fixed frame and anchored actions; only step content fades so app transforms and varying copy cannot shift the welcome tour.
