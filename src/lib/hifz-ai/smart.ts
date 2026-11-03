/**
 * Smart mic for the Quran reader: check the reciter against the page on screen, and notice when they
 * are actually reciting somewhere else ("You're reciting Al-Mulk 3, go there?"). Find-an-ayah, built in.
 *
 *   const s = await startSmartRecite({ passages, onUpdate, onElsewhere: (p) => offerJump(p) })
 *   await s.stop()
 */
import type { CheckResult } from "./checker";
import { startListening, type ListenSession } from "./listen";
import { fit, judgeSearch, loadQuranIndex, skel, type QuranIndex } from "./quran-index";

export type Passage = { sura: number; first: number; last: number };

export interface Elsewhere {
  sura: number;
  aya: number;
  word: number;
  samePhrase: { sura: number; aya: number; word: number }[]; // other places with exactly these words
}

/**
 * Said before reciting, but they are also words of the Quran: the isti'adha matches An-Nahl 16:98-99
 * and the basmala matches Al-Fatiha 1:1 / An-Naml 27:30. Cut them out before looking for "elsewhere",
 * or saying a'udhu billah jumps the reader to An-Nahl.
 */
const OPENERS = [
  "ءَعُۥۥذُبِللَااهِسسَمِۦۦعِلعَلِۦۦمِمِنَششَيطَاانِررَجِۦۦمِ", // a'udhu billahi s-sami'i l-'alimi mina sh-shaytani r-rajim
  "ءَعُۥۥذُبِللَااهِمِنَششَيطَاانِررَجِۦۦمِ", // a'udhu billahi mina sh-shaytani r-rajim
  "بِسمِللَااهِررَحمَاانِررَحِۦۦمِ", // bismillahi r-rahmani r-rahim
].map((o) => Array.from(skel(o)));

/** The heard sounds with any isti'adha / basmala removed. */
export function withoutOpeners(heard: string): string {
  let text = heard;
  for (let guard = 0; guard < 4; guard++) {
    const chars = Array.from(text);
    const sk: string[] = [];
    const at: number[] = []; // char index of each skeleton letter
    chars.forEach((c, i) => { const k = skel(c); if (k && sk[sk.length - 1] !== k) { sk.push(k); at.push(i); } });
    let cut: [number, number] | null = null;
    for (const o of OPENERS) {
      if (sk.length < o.length * 0.7) continue;
      const [cost, b, e] = fit(o, sk);
      if (e > b && cost <= Math.floor(o.length * 0.25)) { cut = [at[b], e < at.length ? at[e] : chars.length]; break; }
    }
    if (!cut) return text;
    text = chars.slice(0, cut[0]).join("") + chars.slice(cut[1]).join("");
  }
  return text;
}

const inside = (sura: number, aya: number, passages: Passage[]) =>
  passages.some((p) => p.sura === sura && aya >= p.first && aya <= p.last);

/**
 * Is this recitation happening somewhere other than the passages on screen? Pure function (testable).
 * Looks at the opening of the recitation, and at the latest words when the recent ones stop matching.
 */
export function detectElsewhere(ix: QuranIndex, result: CheckResult & { heard?: string }, passages: Passage[]): Elsewhere | null {
  const heard = result.heard ?? "";
  if (!heard) return null;
  const recited = result.words.filter((w) => w.status !== "pending" && w.status !== "in_progress");
  const recent = recited.slice(-6);
  const goodRecent = recent.filter((w) => w.status === "correct").length;
  const goodAll = recited.filter((w) => w.status === "correct").length;
  // 1) the opening: nothing (or almost nothing) on the page matched
  // 2) later: the last 6 words stopped matching -> look at the tail of what was heard
  const candidates: string[] = [];
  // 1) the opening: several words heard and almost none matched the page
  if (recited.length >= 4 && goodAll <= 1) candidates.push(heard);
  // 2) later: the last 6 words stopped matching -> look at the tail of what was heard
  if (recent.length >= 6 && goodRecent <= 1) candidates.push(heard.slice(-90));
  // 3) reached the last word of the page and kept going (next page, or another surah):
  //    the checker pins extra sounds onto the last word, so look at the most recent sounds
  const lastWord = result.words[result.words.length - 1];
  if (lastWord && lastWord.status !== "pending" && lastWord.at !== undefined && heard.length - lastWord.at >= 40) {
    candidates.push(heard.slice(-60));
  }
  for (const raw of candidates) {
    const text = withoutOpeners(raw);
    if (Array.from(skel(text)).length < 10) continue; // only the isti'adha / basmala: nothing to place yet
    const a = judgeSearch(ix, text);
    const top = a.matches[0];
    if (!a.confident || !top) continue;
    const all = [top, ...a.samePhrase];
    if (all.some((m) => inside(m.sura, m.aya, passages))) return null; // it IS on this page (a repeated phrase)
    // the page itself is nearly as good a match: the reciter is just making mistakes, stay here
    if (a.matches.some((m) => inside(m.sura, m.aya, passages) && m.score >= top.score - 0.15)) return null;
    // jump to where the reciter IS now (end of the match), not where the heard window began
    return { sura: top.now.sura, aya: top.now.aya, word: top.now.word, samePhrase: a.samePhrase };
  }
  return null;
}

/** startListening + elsewhere detection. onElsewhere fires once per new place. */
export async function startSmartRecite(opts: {
  passages: Passage[];
  onUpdate: (r: CheckResult) => void;
  onElsewhere: (p: Elsewhere) => void;
  onProgress?: (p: number) => void;
  onError?: (e: unknown) => void;
  stream?: MediaStream;
  keepStream?: boolean;
}): Promise<ListenSession> {
  const ix = await loadQuranIndex();
  let reported = "";
  let seen: Elsewhere | null = null; // must be found on two updates in a row (same surah, within an ayah)
  const [first] = opts.passages;
  return startListening({
    sura: first.sura,
    first: first.first,
    last: first.last,
    passages: opts.passages,
    stream: opts.stream,
    keepStream: opts.keepStream,
    finish: "reached", // free reading: stopping mid-page is not skipping the rest
    onProgress: opts.onProgress,
    onError: opts.onError,
    onUpdate: (r) => {
      opts.onUpdate(r);
      const found = detectElsewhere(ix, r as CheckResult & { heard?: string }, opts.passages);
      const agrees = !!found && !!seen && found.sura === seen.sura && Math.abs(found.aya - seen.aya) <= 1;
      seen = found;
      const e = agrees ? found : null;
      const key = e ? `${e.sura}:${e.aya}` : "";
      if (e && key !== reported) {
        reported = key;
        opts.onElsewhere(e);
      }
    },
  });
}
