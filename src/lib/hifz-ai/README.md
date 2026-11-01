# hifz-ai — on-device recitation checking

Runs fully on the phone (no server, no per-use cost). Free feature only (model license NPL-1.2).

## Files
- `listen.ts` — `startListening({ sura, first, last, onUpdate })` → mic → model → word statuses; `session.stop()` gives the final result.
- `recognizer.ts` — streaming model runner (onnxruntime-web, WASM). Resets its memory after a 1 s pause so repeats/restarts are caught.
- `checker.ts` — compares what was heard with the answer key, per word.
- `fbank.ts` — audio features (bit-identical to the reference Python).
- `public/hifz-ai/ayat/NNN.json` — answer key per surah (loaded on demand, ~10–60 KB gzipped).
- `public/hifz-ai/model/` — `model-config.json` and `tokens.txt`; the 73 MB model is hosted through `model.onnx.asset.json` and cached on device. Matching ORT 1.20.1 WASM uses `runtime.wasm.asset.json`; its companion module is in `public/hifz-ai/runtime/`.

Dependency: `"onnxruntime-web": "1.20.1"` (keep `ORT_VERSION` in recognizer.ts the same).

## Word statuses
- `correct` — matched.
- `unsure` — sounded different but not confidently wrong (vowels, unclear audio). Show subtly or not at all.
- `wrong` — a different word / changed letters, model confident. This is the "mistake" (haptic + optional sound).
- `skipped` — left out.
- `pending` / `in_progress` — not reached yet / being recited now (live mode).
- `extras[]` — repeated (`repeat`) or added (`extra`) speech, attached to a word key.

Policy: it is built to never accuse a correct reciter (0 false ❌ in all tests). When unsure, it says ❓, not ❌.

## Test results (Al-Mulk 1–4, real phone recordings)
- Correct recitation: 0 wrong, 0 skipped (live and offline).
- Recitation with mistakes: skipped بِيَدِهِ caught; repeat caught; 0 false wrong.
- Planted mistakes: 7/7 (wrong word ×2, added letter الذين, swapped word سنبلات, 2-word skip, whole-ayah skip, clean = no marks).

## Required in the UI
Show `AI_DISCLAIMER` near AI feedback, and `AI_CREDIT` in Settings → Acknowledgements.
Never sell, gate, or advertise a paid plan around this feature.

## Native notes (later)
- The recite integration dynamically imports the runtime after download consent; `prepareChecker` caches the model, runtime, configuration, tokens and all 114 answer keys. Cache eviction/restricted storage can require another download. Speech is never uploaded.
- Pages containing several surahs expose a passage selector; one listener checks one surah range at a time. AI results are transient and do not rewrite self-check progress.
- iOS: `NSMicrophoneUsageDescription`; haptics are muted while recording unless `setAllowHapticsAndSystemSoundsDuringRecording(true)` is set natively.
- Android: `RECORD_AUDIO` permission; WebView must grant `onPermissionRequest` for audio capture.
- Long term: move the model file to Cloudflare R2 (free egress) and pass its URL as `modelUrl`.
