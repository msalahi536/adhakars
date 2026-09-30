# Architecture Decisions

- Homepage sections use native fragment links inside the shared marketing shell so navigation remains accessible and smoothly scrolls without client state.
- Legal copy (privacy, terms) lives only in `src/data/legal.ts`; the website and in-app legal screens both render from it so the two can never drift.
- Scheduled notifications beyond basic reminders (prayer-based adhkar, Sunnah, period) live in `src/lib/smart-notifications.ts` and are rescheduled on every app open, because local notifications can only be planned a few days ahead.
- Adhan notifications have no master switch: each prayer is enabled independently and opens a reciter picker with native audio previews on the Salah page.
- Real prayer alerts resync native preferences before scheduling and re-arm whenever the installed app resumes, because test alerts bypass prayer preferences.
- More keeps its feature tools first; detailed consistency and lifetime statistics open from one compact summary so they never obscure feature discovery.
