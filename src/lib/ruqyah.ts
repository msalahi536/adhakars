const KEY = "adhkar:ruqyah:checklist";

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function readAll(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export const getRuqyahChecklist = (date = todayKey()): string[] => readAll()[date] ?? [];

export function toggleRuqyahCheck(id: string, date = todayKey()) {
  const all = readAll();
  const cur = new Set(all[date] ?? []);
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  all[date] = [...cur];
  localStorage.setItem(KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("adhkar:ruqyah-update"));
  window.dispatchEvent(new Event("adhkar:streak-update"));
}

/** Any protection checklist item done on a day counts toward the streak. */
export const ruqyahDayCounts = (date: string) => getRuqyahChecklist(date).length > 0;
