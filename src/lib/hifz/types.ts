/** Shared types for the hifz engine. Everything is plain data so it can live in localStorage. */

export type Grade = 1 | 2 | 3 | 4; // 1 Again (blank), 2 Hard (mistakes), 3 Good (minor hesitation), 4 Easy (perfect, fluent)

/** Static Quran structure for the Madani 15-line mushaf, built once from Quran.com data. */
export interface QuranPage {
  page: number; // 1..604
  juz: number; // juz the page starts in
  lines: number; // text lines on the page (15 on most pages)
  verseKeys: string[]; // "sura:aya" in reading order, every ayah that starts or continues on the page
  surahStarts: number[]; // surahs that begin on this page
}

export interface QuranIndex {
  pages: QuranPage[]; // index 0 = page 1
  surahPages: Record<number, [number, number]>; // surah -> [firstPage, lastPage]
}

/** FSRS memory state for one page. */
export interface MemoryState {
  stability: number; // days until recall probability drops to 90%
  difficulty: number; // 1..10
  lastReview: string; // ISO date (yyyy-mm-dd)
  due: string; // ISO date
  reps: number;
  lapses: number;
}

export type PageStage = "new" | "learning" | "sabqi" | "manzil";

export interface PageRecord {
  page: number;
  stage: PageStage;
  linesLearned: number; // for the page currently being memorized
  memorizedOn?: string; // date the full page was first recited from memory
  memory?: MemoryState;
  history: ReviewLog[];
}

export interface ReviewLog {
  date: string;
  grade: Grade;
  kind: "sabaq" | "sabqi" | "manzil" | "drill" | "salah";
  mistakes: number;
  hesitations: number;
  seconds?: number;
}

/** A word or transition that keeps failing. Resurfaced more often than its page. */
export interface WeakSpot {
  key: string; // "sura:aya:word" or "t:sura:aya" for the transition INTO that ayah
  kind: "word" | "transition" | "mutashabih";
  page: number;
  fails: number;
  passes: number;
  lastFailed: string;
}

export type MemorizationOrder =
  | { kind: "juzAmmaFirst" } // Juz 30, then 29, 28 ... 1 (most common for beginners)
  | { kind: "forward"; fromPage: number } // Al-Fatiha / Al-Baqarah onward
  | { kind: "backwardJuz" } // Juz 30 down to Juz 1, pages in reading order inside each juz
  | { kind: "surahs"; surahs: number[] }; // a custom list, in the given order

export interface HifzPlan {
  startDate: string;
  order: MemorizationOrder;
  newLinesPerDay: number; // sabaq size: 3, 5, 7, 10, 15 (= 1 page), 22, 30 ...
  studyDays: number[]; // 0 = Sunday ... 6 = Saturday
  dailyMinutes: number; // time budget per day
  consolidateEvery: number; // after this many new pages, take review-only days (0 = never)
  consolidateDays: number;
  targetRetention: number; // 0.9 .. 0.97, how strong the hifz should be kept
  alreadyMemorized: number[]; // pages known before starting (go straight to manzil)
}

export interface HifzState {
  version: 1;
  plan: HifzPlan;
  pages: Record<number, PageRecord>;
  weakSpots: Record<string, WeakSpot>;
  dayLog: Record<string, { newLines: number; reviews: number; minutes: number }>;
}
