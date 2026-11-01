# Al-Ikhlas preview debug recordings

These files are unmodified exports from browser microphone tests, not user recordings.

## Retained failed runs

- `al-ikhlas-skipped-run-2/recording.webm` and `debug.json`
- `al-ikhlas-skipped-run-3/recording.webm` and `debug.json`

Both runs reported word `112:2:1` (ٱللَّهُ) as `skipped`, with expected `لَاهُ` and heard `""`. Run 3 includes additional preceding-ayah context from the third lesson pass. The JSON preserves every emitted word result, raw phonemes, confidence values, extras, passage ranges and browser identification.

## Source microphone input

- `source/al-ikhlas.mp3`: the retained source clip from the previous preview tests.
- `source/al-ikhlas-microphone-input.wav`: its mono WAV conversion supplied to Chromium's fake microphone.

The original source URL and reciter attribution were not retained. Do not infer them from these filenames. These are development-only comparison assets, not app-served media.

## Perfect comparison unavailable

An earlier preview run displayed Perfect, but its ZIP was overwritten by a subsequent test before this preservation request. Its screenshot is not a substitute for the original diagnostics. Two new comparison attempts reproduced false mistakes rather than Perfect; no failed recording has been relabeled as a Perfect run.