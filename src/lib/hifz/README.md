# Hifz engine

Pure TypeScript, no dependencies. The app's screens call these functions; all logic lives here.

- `fsrs.ts`     spaced repetition (FSRS v4.5), hifz-tuned: retention 0.93, no page waits > 30 days
- `quran.ts`    Madani 604-page structure, memorization order (Juz Amma first, forward, backward, custom surahs)
- `plan.ts`     timeline: finish date, juz milestones, minutes/day needed as hifz grows (review first, new lines get what's left)
- `engine.ts`   daily session (manzil -> sabqi -> weak spots -> sabaq -> link), grading, recording, stats
- `drills.ts`   active recall drills: cue, transition, random entry, before, page start, listen-and-continue, mutashabih
- `storage.ts`  localStorage load/save

Do not edit these files from the UI layer. Tests: `test/simulate.ts` (simulated students over 1 year).
