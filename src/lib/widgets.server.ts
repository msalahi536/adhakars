import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const WIDGET_TYPE_TO_CATEGORY: Record<string, string> = {
  quran_verse: "quran_verse",
  daily_dhikr: "daily_dhikr",
  morning_adhkar: "morning_adhkar",
  evening_adhkar: "evening_adhkar",
  daily_dua: "daily_dua",
  name_of_allah: "names_of_allah",
  sunnah: "sunnah_of_day",
};

export type ContentRow = {
  id: string;
  category: string;
  arabic_text: string;
  transliteration: string | null;
  translation: string;
  reference: string | null;
  reward_note: string | null;
  is_active: boolean;
  display_order: number | null;
};

function dayOfYear(d: Date) {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86400000);
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickIndex(
  items: ContentRow[],
  mode: string,
  currentId: string | null,
  widgetType: string,
  now = new Date(),
): number {
  if (!items.length) return -1;
  if (mode === "manual" && currentId) {
    const i = items.findIndex((x) => x.id === currentId);
    if (i >= 0) return i;
  }
  if (mode === "random") {
    const key = `${now.toISOString().slice(0, 10)}:${widgetType}`;
    return hash(key) % items.length;
  }
  return dayOfYear(now) % items.length;
}

export async function buildWidgetPayload(now = new Date()) {
  const [{ data: content }, { data: schedule }] = await Promise.all([
    supabaseAdmin
      .from("widget_content")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabaseAdmin.from("widget_schedule").select("*"),
  ]);
  const rows = (content ?? []) as ContentRow[];
  const byCat = (c: string) => rows.filter((r) => r.category === c);
  const sched = (t: string) => (schedule ?? []).find((s) => s.widget_type === t);

  const pick = (t: string) => {
    const items = byCat(WIDGET_TYPE_TO_CATEGORY[t]);
    const s = sched(t);
    const i = pickIndex(items, s?.rotation_mode ?? "sequential", s?.current_content_id ?? null, t, now);
    return { items, i, item: i >= 0 ? items[i] : null };
  };
  const list = (t: string) => {
    const { items, i } = pick(t);
    const rotated = i > 0 ? [...items.slice(i), ...items.slice(0, i)] : items;
    return rotated.map((r) => ({
      arabic: r.arabic_text,
      transliteration: r.transliteration,
      translation: r.translation,
      reference: r.reference,
      reward: r.reward_note,
    }));
  };

  const q = pick("quran_verse").item;
  const dh = pick("daily_dhikr").item;
  const du = pick("daily_dua").item;
  const n = pick("name_of_allah").item;
  const su = pick("sunnah").item;

  return {
    date: now.toISOString().slice(0, 10),
    quran_verse: q && { arabic: q.arabic_text, translation: q.translation, reference: q.reference },
    daily_dhikr: dh && {
      arabic: dh.arabic_text,
      transliteration: dh.transliteration,
      translation: dh.translation,
      reward: dh.reward_note,
      reference: dh.reference,
    },
    morning_adhkar: list("morning_adhkar"),
    evening_adhkar: list("evening_adhkar"),
    daily_dua: du && { arabic: du.arabic_text, translation: du.translation, reference: du.reference },
    name_of_allah: n && { arabic: n.arabic_text, transliteration: n.transliteration, meaning: n.translation },
    sunnah_of_day: su && { arabic: su.arabic_text, translation: su.translation, reference: su.reference },
  };
}
