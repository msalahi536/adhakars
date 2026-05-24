import { morningAdhkar, eveningAdhkar } from "@/data/adhkar";

export const todayKey = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

type CountMap = Record<string, number>;

const countsKey = (date: string, kind: "morning" | "evening") => `adhkar:${kind}:${date}`;

export const getCounts = (kind: "morning" | "evening", date = todayKey()): CountMap => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(countsKey(date, kind)) || "{}");
  } catch {
    return {};
  }
};

export const setCount = (kind: "morning" | "evening", id: string, value: number) => {
  const c = getCounts(kind);
  c[id] = value;
  localStorage.setItem(countsKey(todayKey(), kind), JSON.stringify(c));
  maybeUpdateStreak();
};

export const resetToday = () => {
  localStorage.removeItem(countsKey(todayKey(), "morning"));
  localStorage.removeItem(countsKey(todayKey(), "evening"));
};

export const isSetComplete = (kind: "morning" | "evening", date = todayKey()): boolean => {
  const c = getCounts(kind, date);
  const list = kind === "morning" ? morningAdhkar : eveningAdhkar;
  return list.every((d) => (c[d.id] ?? 0) >= d.target);
};

// Streak
type StreakData = {
  current: number;
  longest: number;
  lastCompleted: string | null; // YYYY-MM-DD
};
const STREAK_KEY = "adhkar:streak";

export const getStreak = (): StreakData => {
  if (typeof window === "undefined") return { current: 0, longest: 0, lastCompleted: null };
  try {
    return (
      JSON.parse(localStorage.getItem(STREAK_KEY) || "null") || {
        current: 0,
        longest: 0,
        lastCompleted: null,
      }
    );
  } catch {
    return { current: 0, longest: 0, lastCompleted: null };
  }
};

const saveStreak = (s: StreakData) => localStorage.setItem(STREAK_KEY, JSON.stringify(s));

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const maybeUpdateStreak = () => {
  const today = todayKey();
  if (!isSetComplete("morning", today) || !isSetComplete("evening", today)) return;
  const s = getStreak();
  if (s.lastCompleted === today) return;
  if (s.lastCompleted === yesterday()) {
    s.current += 1;
  } else {
    s.current = 1;
  }
  s.lastCompleted = today;
  if (s.current > s.longest) s.longest = s.current;
  saveStreak(s);
  window.dispatchEvent(new Event("adhkar:streak-update"));
};

// On app load, decay streak if missed days
export const reconcileStreak = () => {
  const s = getStreak();
  if (!s.lastCompleted) return;
  if (s.lastCompleted === todayKey() || s.lastCompleted === yesterday()) return;
  s.current = 0;
  saveStreak(s);
};
