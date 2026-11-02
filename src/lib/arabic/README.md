# Arabic Companion v2 (engine)

Pure logic for the Arabic Companion. Screens call `@/lib/arabic` (index.ts) and never re-implement rules.

| File | What it does |
|---|---|
| `phonetic.ts` | Vowelled Arabic -> the recitation model's sound alphabet. Matches the whole-Quran answer key on 97.9% of mid-ayah words (the rest are how words blend into their neighbours). |
| `judge.ts` | Compares what was expected with what the model heard, sound by sound: letter, vowel, length, shadda, missing/extra. Heavy/light swaps are "close" (a retry in letter lessons). Pure, tested. |
| `speech.ts` | `startSay()`: one attempt from the mic, auto-stops after the learner goes quiet, returns a `SayResult`. Shares the hifz model. Also `wordKeyPhonemes()`, `ayahWords()`. |
| `letters.ts` | 28 letters + hamza: names, sounds, tips, makhraj, heavy/qalqalah/sun, joined shapes, look-alike and sound-alike pairs. |
| `readable.ts` | Which letters and reading skills a written word needs (`canRead`). |
| `curriculum.ts` | Track 1: the 30 reading lessons, practice words picked automatically from Al-Fatiha + Juz Amma, the Al-Fatiha meter. |
| `vocab.ts` | Track 2: 578 word families (our own list: dictionary form, root, meaning, frequency), `analyzeWord()`, `understood()`, the 60-day plan. Top 100 families = 60% of Quran words, top 500 = 80%. |
| `scheduler.ts` | FSRS reviews (same model as hifz, 90% target, max 180 days), confusions. |
| `session.ts` | Today's plan, the concrete `Step`s of each lesson / vocabulary day / review, unlock rules, finishing. |
| `placement.ts` | The 3-minute placement test and where to start. |
| `progress.ts` | Overview (Al-Fatiha meter, Quran coverage, streak) and milestones. |
| `audio.ts` | Recorded clip paths (`public/arabic/audio/`, listed in `src/data/arabic/audio.json`), the recording list, Quran.com word audio. |
| `state.ts` | Device storage (`arabic_state_v2`). |

Data (`src/data/arabic/`): `words.json` (families + coverage curve), `forms.json` (bare form -> family), `practice.json` (Al-Fatiha + Juz Amma words), `audio.json` (recorded clips). Built from `public/hifz-ai/ayat` (the recitation model's Quran text); no third-party corpus. Meanings are short dictionary glosses and should be reviewed by a teacher before launch.

Old files `content.ts`, `engine.ts`, `review.ts`, `store.ts` (+ their tests) belong to the retired companion and are deleted together with the old screen.

Tests: `bun test src/lib/arabic/course.test.ts`.
