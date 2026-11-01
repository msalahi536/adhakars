/**
 * Glue between the hifz engine (src/lib/hifz) and the screens: Quran index query,
 * session flattening, the performance tracker used by the recite page, plan-draft
 * helpers and reminder text. Pure where possible so it can be tested.
 */
import { queryOptions } from "@tanstack/react-query";
import { buildQuranIndex, juzPages, type HifzState, type QuranIndex, type Session, type WeakSpot } from "./index";
import type { Grade } from "./types";
import type { Performance } from "./engine";
import type { RecitePage, ReciteWord } from "@/lib/recite/model";

const API = "https://api.quran.com/api/v4";

/** The 604-page Madani structure, built once from Quran.com chapters and cached forever. */
export const quranIndexOptions = queryOptions({
  queryKey: ["hifz-quran-index"],
  staleTime: Infinity,
  queryFn: async (): Promise<QuranIndex> => {
    const res = await fetch(`${API}/chapters?language=en`);
    if (!res.ok) throw new Error("The Quran index could not be loaded. Please check your connection.");
    const data = (await res.json()) as { chapters: { id: number; pages: [number, number] }[] };
    return buildQuranIndex(data.chapters.map((c) => ({ id: c.id, pages: c.pages })));
  },
});

// ---------- plan draft helpers ----------

/** Pages marked as already memorized from picked juz and surahs. */
export function knownPages(q: QuranIndex, juz: number[], surahs: number[]): number[] {
  const out = new Set<number>();
  for (const j of juz) {
    const [a, b] = juzPages(j);
    for (let p = a; p <= b; p++) out.add(p);
  }
  for (const s of surahs) {
    const range = q.surahPages[s];
    if (range) for (let p = range[0]; p <= range[1]; p++) out.add(p);
  }
  return [...out].sort((a, b) => a - b);
}

// ---------- session items ----------

export type SessionItem =
  | { kind: "review"; stage: "manzil" | "sabqi"; page: number }
  | { kind: "drills"; spots: WeakSpot[] }
  | { kind: "sabaq"; page: number; fromLine: number; lines: number }
  | { kind: "link"; pages: number[] };

/** Flatten a built session into one screen per item, in engine order. */
export function flattenSession(session: Session): SessionItem[] {
  const items: SessionItem[] = [];
  for (const step of session.steps) {
    if (step.type === "manzil" || step.type === "sabqi")
      for (const page of step.pages) items.push({ kind: "review", stage: step.type, page });
    else if (step.type === "weakSpots") items.push({ kind: "drills", spots: step.spots });
    else if (step.type === "sabaq") items.push({ kind: "sabaq", page: step.page, fromLine: step.fromLine, lines: step.lines });
    else if (step.type === "link") items.push({ kind: "link", pages: step.pages });
  }
  return items;
}

export interface ActiveSession {
  date: string;
  items: SessionItem[];
  done: number; // items completed
  seconds: number;
}

const SESSION_KEY = "hifzSessionActive";

export function saveActiveSession(s: ActiveSession | null): void {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* private mode: session just won't survive a reload */ }
}

export function loadActiveSession(): ActiveSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ActiveSession;
    return Array.isArray(s.items) && typeof s.date === "string" ? s : null;
  } catch {
    return null;
  }
}

// ---------- performance tracking on the recite page ----------

export const HESITATION_WINDOW_MS = 2000;
export const TRY_FIRST_MS = 3000;

/**
 * Records what actually happened while reciting one item. Hesitations are peeks,
 * first-letter hints and reveals pressed within 2s of the previous word.
 */
export function createTracker() {
  let wrong: string[] = [];
  let skipped: string[] = [];
  let small = 0;
  let hesitations = 0;
  let blank = false;
  let lastRevealAt = 0;
  return {
    recordReveal(now: number) {
      if (lastRevealAt && now - lastRevealAt < HESITATION_WINDOW_MS) hesitations++;
      lastRevealAt = now;
    },
    recordPeek() {
      hesitations++;
    },
    recordMark(key: string, state: "wrong" | "skipped" | "unsure" | "correct") {
      if (state === "wrong" && !wrong.includes(key)) wrong.push(key);
      if (state === "skipped" && !skipped.includes(key)) skipped.push(key);
      if (state === "unsure") small++;
      if (state === "correct") {
        wrong = wrong.filter((k) => k !== key);
        skipped = skipped.filter((k) => k !== key);
      }
    },
    recordBlank() {
      blank = true;
    },
    /** Build the engine Performance object. `words` = the page's real words (no end markers). */
    toPerformance(words: ReciteWord[], seconds: number, selfGrade?: Grade): Performance {
      const failedKeys = [...wrong, ...skipped];
      const firstOfVerse = new Map<string, string>();
      for (const w of words) if (!firstOfVerse.has(w.verse)) firstOfVerse.set(w.verse, w.key);
      const failedTransitions = failedKeys
        .filter((k) => [...firstOfVerse.values()].includes(k))
        .map((k) => k.split(":").slice(0, 2).join(":"));
      return {
        words: words.length,
        wrong: wrong.length,
        skipped: skipped.length,
        small,
        hesitations,
        blank,
        seconds,
        failedKeys,
        failedTransitions: [...new Set(failedTransitions)],
        selfGrade,
      };
    },
    evidence(words: ReciteWord[]): string {
      const parts: string[] = [];
      const mistakes = wrong.length + skipped.length;
      if (mistakes) parts.push(`${mistakes} mistake${mistakes > 1 ? "s" : ""}`);
      if (hesitations) parts.push(`${hesitations} hint${hesitations > 1 ? "s" : ""}`);
      if (small) parts.push(`${small} small mark${small > 1 ? "s" : ""}`);
      if (!parts.length) return words.length ? "Clean recitation" : "";
      return parts.join(", ");
    },
  };
}

export type Tracker = ReturnType<typeof createTracker>;

/** Map the grade sheet choice to an engine grade. */
export const SELF_GRADES: { label: "Easy" | "Okay" | "Hard"; grade: Grade }[] = [
  { label: "Easy", grade: 4 },
  { label: "Okay", grade: 3 },
  { label: "Hard", grade: 2 },
];

// ---------- drills ----------

/** PageVerses the drill builder needs, from recite page data. */
export function pageVersesFrom(page: RecitePage): { page: number; verses: { key: string; words: string[] }[] } {
  return {
    page: page.page,
    verses: page.verses.map((v) => ({ key: v.key, words: v.words.filter((w) => !w.end).map((w) => w.text) })),
  };
}

/** Pages worth loading for a drill session: weak-spot pages first, then the weakest memorized pages. */
export function drillPages(s: HifzState, q: QuranIndex, today: string, limit = 10): number[] {
  const spotPages = Object.values(s.weakSpots).map((w) => w.page);
  const memorized = Object.values(s.pages)
    .filter((r) => r.memory)
    .map((r) => r.page);
  return [...new Set([...spotPages, ...memorized])].filter((p) => p >= 1 && p <= q.pages.length).slice(0, limit);
}

// ---------- reminders ----------

export function morningReminderBody(session: Session): string {
  const pages = session.steps.reduce(
    (a, s) => a + (s.type === "manzil" || s.type === "sabqi" ? s.pages.length : 0),
    0,
  );
  return `Review is ready: ${pages} page${pages === 1 ? "" : "s"}, about ${session.totalMinutes} min`;
}

export const SLEEP_REMINDER_BODY = "Recite today's new lines once more before you sleep";

export const hasSabaq = (session: Session) => session.steps.some((s) => s.type === "sabaq");
