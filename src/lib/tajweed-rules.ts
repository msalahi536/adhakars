// Pure tajweed markup rules (no browser imports), shared by the reader and Hifz views.
/** Dar al-Ma'rifah color groups. Colors are CSS tokens in styles.css (--tj-*). */
export const TAJWEED_GROUPS = [
  { id: "necessary", label: "Necessary prolongation", sub: "6 vowels" },
  { id: "obligatory", label: "Obligatory prolongation", sub: "4 or 5 vowels" },
  { id: "permissible", label: "Permissible prolongation", sub: "2, 4 or 6 vowels" },
  { id: "normal", label: "Normal prolongation", sub: "2 vowels" },
  { id: "ghunnah", label: "Nasalization (ghunnah)", sub: "Ikhfa', iqlab, idgham with ghunnah, 2 vowels" },
  { id: "qalqalah", label: "Qalqalah", sub: "Echoing sound" },
  { id: "silent", label: "Not pronounced", sub: "Hamzat al-wasl, lam shamsiyyah, silent letters, idgham without ghunnah" },
] as const;
export type TajweedGroup = (typeof TAJWEED_GROUPS)[number]["id"];

/** Quran.com rule class → Dar al-Ma'rifah group. */
export const RULE_GROUP: Record<string, TajweedGroup> = {
  madda_necessary: "necessary",
  madda_obligatory: "obligatory",
  madda_obligatory_mottasel: "obligatory",
  madda_obligatory_monfasel: "obligatory",
  madda_permissible: "permissible",
  madda_normal: "normal",
  ghunnah: "ghunnah",
  ikhafa: "ghunnah",
  ikhafa_shafawi: "ghunnah",
  iqlab: "ghunnah",
  idgham_ghunnah: "ghunnah",
  idgham_shafawi: "ghunnah",
  qalaqah: "qalqalah",
  ham_wasl: "silent",
  laam_shamsiyah: "silent",
  slnt: "silent",
  idgham_wo_ghunnah: "silent",
  idgham_mutajanisayn: "silent",
  idgham_mutaqaribayn: "silent",
};

export type TajweedSegment = { text: string; group?: TajweedGroup };

/** `أَحَ<rule class=qalaqah>د</rule>ٌ` → [{text:"أَحَ"}, {text:"د", group:"qalqalah"}, {text:"ٌ"}]. Unknown classes stay plain. */
export function parseTajweed(markup: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  const re = /<(rule|tajweed)\s+class=["']?([a-z_]+)["']?\s*>([\s\S]*?)<\/\1>/g;
  const plain = (s: string) => s.replace(/<[^>]+>/g, "");
  let last = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(markup)); ) {
    if (m.index > last) out.push({ text: plain(markup.slice(last, m.index)) });
    out.push({ text: plain(m[3]), group: RULE_GROUP[m[2]] });
    last = re.lastIndex;
  }
  if (last < markup.length) out.push({ text: plain(markup.slice(last)) });
  return out.filter((s) => s.text);
}

