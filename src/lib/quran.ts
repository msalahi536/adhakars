// Quran content from the public Quran.com API (v4). Fetched in the browser
// and cached in memory per session.
const API = "https://api.quran.com/api/v4";

export type Chapter = {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
  translated_name: { name: string };
};

export type Word = { position: number; text: string; isEnd: boolean };
export type Verse = {
  key: string;
  number: number;
  words: Word[];
  translation: string;
  transliteration: string;
};
export type Timing = { key: string; from: number; to: number; segments: [number, number, number][] };
export type ChapterAudio = { url: string; timings: Timing[] };

// Every recitation Quran.com serves. sync: word = word-by-word timings,
// verse = verse timings only, none = audio only. group: 1 Hafs,
// 2 Haramain Taraweeh, 3 Non-Hafs, 4 with translation.
export type Reciter = { id: number; name: string; sync: "word" | "verse" | "none"; group: 1 | 2 | 3 | 4 };
export const RECITERS: Reciter[] = [
  { id: 1, name: "AbdulBaset AbdulSamad (Mujawwad)", sync: "word", group: 1 },
  { id: 2, name: "AbdulBaset AbdulSamad (Murattal)", sync: "word", group: 1 },
  { id: 3, name: "Abdur-Rahman as-Sudais", sync: "word", group: 1 },
  { id: 4, name: "Abu Bakr al-Shatri", sync: "word", group: 1 },
  { id: 12, name: "Al-Husary (Teaching)", sync: "word", group: 1 },
  { id: 168, name: "Al-Minshawi (Kids repeat)", sync: "word", group: 1 },
  { id: 8, name: "Al-Minshawi (Mujawwad)", sync: "word", group: 1 },
  { id: 9, name: "Al-Minshawi (Murattal)", sync: "word", group: 1 },
  { id: 172, name: "Hadi Toure", sync: "word", group: 1 },
  { id: 5, name: "Hani ar-Rifai", sync: "word", group: 1 },
  { id: 170, name: "Khalid al-Jalil", sync: "word", group: 1 },
  { id: 161, name: "Khalifa al-Tunaiji", sync: "word", group: 1 },
  { id: 6, name: "Mahmoud Khalil al-Husary", sync: "word", group: 1 },
  { id: 7, name: "Mishary Rashid Alafasy", sync: "word", group: 1 },
  { id: 173, name: "Mishary Rashid Alafasy (Streaming)", sync: "word", group: 1 },
  { id: 10, name: "Sa'ud ash-Shuraim", sync: "word", group: 1 },
  { id: 174, name: "Yasser ad-Dossari", sync: "word", group: 1 },
  { id: 97, name: "Yasser ad-Dussary", sync: "word", group: 1 },
  { id: 158, name: "Abdullah Ali Jabir", sync: "verse", group: 1 },
  { id: 162, name: "Abdullah Awad al-Juhani", sync: "verse", group: 1 },
  { id: 163, name: "Abdullah Basfar", sync: "verse", group: 1 },
  { id: 124, name: "Abdullah Matroud", sync: "verse", group: 1 },
  { id: 11, name: "AbdulMuhsin al-Qasim", sync: "verse", group: 1 },
  { id: 126, name: "Ahmad Nauina", sync: "verse", group: 1 },
  { id: 19, name: "Ahmed ibn Ali al-Ajmy", sync: "verse", group: 1 },
  { id: 127, name: "Akram Al-Alaqmi", sync: "verse", group: 1 },
  { id: 128, name: "Ali Hajjaj Alsouasi", sync: "verse", group: 1 },
  { id: 44, name: "Aziz Alili", sync: "verse", group: 1 },
  { id: 160, name: "Bandar Baleela", sync: "verse", group: 1 },
  { id: 14, name: "Fares Abbad", sync: "verse", group: 1 },
  { id: 159, name: "Maher al-Muaiqly", sync: "verse", group: 1 },
  { id: 129, name: "Mahmood Ali Al-Bana", sync: "verse", group: 1 },
  { id: 122, name: "Mahmoud Khaleel Al-Husary", sync: "verse", group: 1 },
  { id: 95, name: "Mishari al-`Afasy - Taraweeh 1430", sync: "verse", group: 1 },
  { id: 91, name: "Mohammad Al-Tablawi", sync: "verse", group: 1 },
  { id: 88, name: "Mostafa Ismaeel", sync: "verse", group: 1 },
  { id: 169, name: "Muhammad Jibreel", sync: "verse", group: 1 },
  { id: 104, name: "Nasser Al Qatami", sync: "verse", group: 1 },
  { id: 13, name: "Saad al-Ghamdi", sync: "verse", group: 1 },
  { id: 17, name: "Sahl Yasin", sync: "verse", group: 1 },
  { id: 43, name: "Salah al-Budair", sync: "verse", group: 1 },
  { id: 18, name: "Salah Bukhatir", sync: "verse", group: 1 },
  { id: 66, name: "Abdullah Basfar with Ibrahim Walk [Saheeh Intl Translation]", sync: "verse", group: 4 },
  { id: 58, name: "Mishari ibn Rashid al-`Afasy with Ibrahim Walk [Saheeh Intl Translation]", sync: "verse", group: 4 },
  { id: 136, name: "Abdallah Abdal", sync: "none", group: 1 },
  { id: 108, name: "Abdul-Mun'im Abdul-Mubdi'", sync: "none", group: 1 },
  { id: 21, name: "AbdulAzeez al-Ahmad", sync: "none", group: 1 },
  { id: 15, name: "AbdulBari ath-Thubaity", sync: "none", group: 1 },
  { id: 106, name: "AbdulKareem Al Hazmi", sync: "none", group: 1 },
  { id: 69, name: "Abdullah Ali Jabir", sync: "none", group: 1 },
  { id: 24, name: "Abdullah Ali Jabir [Taraweeh]", sync: "none", group: 1 },
  { id: 72, name: "Abdullah Khayat", sync: "none", group: 1 },
  { id: 125, name: "AbdulWadood Haneef", sync: "none", group: 1 },
  { id: 40, name: "AbdulWadud Haneef", sync: "none", group: 1 },
  { id: 109, name: "Abdur-Rashid Sufi", sync: "none", group: 1 },
  { id: 68, name: "Abdur-Razaq bin Abtan al-Dulaimi [Mujawwad]", sync: "none", group: 1 },
  { id: 115, name: "Abu Bakr al-Shatri [Taraweeh]", sync: "none", group: 1 },
  { id: 81, name: "Adel Kalbani", sync: "none", group: 1 },
  { id: 138, name: "Adel Kalbani", sync: "none", group: 1 },
  { id: 55, name: "Al-Hussayni Al-'Azazy (with Children)", sync: "none", group: 1 },
  { id: 167, name: "Ali Abdur-Rahman al-Huthaify", sync: "none", group: 1 },
  { id: 135, name: "Asim Abdul Aleem", sync: "none", group: 1 },
  { id: 117, name: "Bandar Baleela", sync: "none", group: 1 },
  { id: 74, name: "Dr. Shawqy Hamed [Murattal]", sync: "none", group: 1 },
  { id: 134, name: "Fatih Seferagic", sync: "none", group: 1 },
  { id: 64, name: "Hamad Sinan", sync: "none", group: 1 },
  { id: 85, name: "Hatem Farid", sync: "none", group: 1 },
  { id: 139, name: "Hatem Farid - Taraweeh 1430", sync: "none", group: 1 },
  { id: 87, name: "Hatem Farid - Taraweeh 1431", sync: "none", group: 1 },
  { id: 86, name: "Hatem Farid - Taraweeh 1432", sync: "none", group: 1 },
  { id: 96, name: "Hatem Farid - Taraweeh 1433", sync: "none", group: 1 },
  { id: 140, name: "Hatem Farid - Taraweeh 1434", sync: "none", group: 1 },
  { id: 103, name: "Ibrahim Al Akhdar", sync: "none", group: 1 },
  { id: 116, name: "Idrees Akbar", sync: "none", group: 1 },
  { id: 93, name: "Imad Zuhair Hafez", sync: "none", group: 1 },
  { id: 166, name: "Khalid al-Qahtani", sync: "none", group: 1 },
  { id: 65, name: "Maher al-Muaiqly", sync: "none", group: 1 },
  { id: 52, name: "Maher al-Muaiqly [1422-1423]", sync: "none", group: 1 },
  { id: 141, name: "Mahmoud Khaleel Al-Husary (Muallam)", sync: "none", group: 1 },
  { id: 142, name: "Mahmoud Khaleel Al-Husary (with Children)", sync: "none", group: 1 },
  { id: 118, name: "Masjid Quba Taraweeh 1434", sync: "none", group: 1 },
  { id: 92, name: "Mohammad Ismaeel Al-Muqaddim", sync: "none", group: 1 },
  { id: 70, name: "Muhammad Abdul-Kareem", sync: "none", group: 1 },
  { id: 26, name: "Muhammad al-Mehysni", sync: "none", group: 1 },
  { id: 121, name: "Muhammad al-Mehysni - Taraweeh 1435", sync: "none", group: 1 },
  { id: 22, name: "Muhammad Ayyoob", sync: "none", group: 1 },
  { id: 107, name: "Muhammad Ayyoob [Taraweeh]", sync: "none", group: 1 },
  { id: 79, name: "Muhammad Hassan", sync: "none", group: 1 },
  { id: 90, name: "Muhammad Sulaiman Patel", sync: "none", group: 1 },
  { id: 71, name: "Mustafa al-`Azawi", sync: "none", group: 1 },
  { id: 165, name: "Nabil ar-Rifai", sync: "none", group: 1 },
  { id: 156, name: "Sa`ud ash-Shuraym [older recitation]", sync: "none", group: 1 },
  { id: 61, name: "Sadaqat `Ali", sync: "none", group: 1 },
  { id: 80, name: "Salah Al-Hashim", sync: "none", group: 1 },
  { id: 20, name: "Sudais and Shuraym", sync: "none", group: 1 },
  { id: 157, name: "Sudais and Shuraym [older recitation]", sync: "none", group: 1 },
  { id: 23, name: "Tawfeeq ibn Sa`id as-Sawa'igh", sync: "none", group: 1 },
  { id: 130, name: "Wadee Hammadi Al Yamani", sync: "none", group: 1 },
  { id: 25, name: "Madinah Taraweeh 1419", sync: "none", group: 2 },
  { id: 46, name: "Madinah Taraweeh 1423", sync: "none", group: 2 },
  { id: 30, name: "Madinah Taraweeh 1426", sync: "none", group: 2 },
  { id: 33, name: "Madinah Taraweeh 1427", sync: "none", group: 2 },
  { id: 73, name: "Madinah Taraweeh 1428", sync: "none", group: 2 },
  { id: 99, name: "Madinah Taraweeh 1429", sync: "none", group: 2 },
  { id: 100, name: "Madinah Taraweeh 1430", sync: "none", group: 2 },
  { id: 84, name: "Madinah Taraweeh 1431", sync: "none", group: 2 },
  { id: 101, name: "Madinah Taraweeh 1432", sync: "none", group: 2 },
  { id: 102, name: "Madinah Taraweeh 1433", sync: "none", group: 2 },
  { id: 143, name: "Madinah Taraweeh 1434", sync: "none", group: 2 },
  { id: 123, name: "Madinah Taraweeh 1435", sync: "none", group: 2 },
  { id: 144, name: "Madinah Taraweeh 1436", sync: "none", group: 2 },
  { id: 145, name: "Madinah Taraweeh 1437", sync: "none", group: 2 },
  { id: 146, name: "Madinah Taraweeh 1439", sync: "none", group: 2 },
  { id: 147, name: "Madinah Taraweeh 1440", sync: "none", group: 2 },
  { id: 148, name: "Madinah Taraweeh 1441", sync: "none", group: 2 },
  { id: 149, name: "Madinah Taraweeh 1442", sync: "none", group: 2 },
  { id: 63, name: "Makkah Taraweeh 1424", sync: "none", group: 2 },
  { id: 45, name: "Makkah Taraweeh 1425", sync: "none", group: 2 },
  { id: 29, name: "Makkah Taraweeh 1426", sync: "none", group: 2 },
  { id: 34, name: "Makkah Taraweeh 1427", sync: "none", group: 2 },
  { id: 59, name: "Makkah Taraweeh 1428", sync: "none", group: 2 },
  { id: 77, name: "Makkah Taraweeh 1429", sync: "none", group: 2 },
  { id: 82, name: "Makkah Taraweeh 1430", sync: "none", group: 2 },
  { id: 83, name: "Makkah Taraweeh 1431", sync: "none", group: 2 },
  { id: 94, name: "Makkah Taraweeh 1432", sync: "none", group: 2 },
  { id: 98, name: "Makkah Taraweeh 1433", sync: "none", group: 2 },
  { id: 120, name: "Makkah Taraweeh 1434", sync: "none", group: 2 },
  { id: 131, name: "Makkah Taraweeh 1435", sync: "none", group: 2 },
  { id: 132, name: "Makkah Taraweeh 1436", sync: "none", group: 2 },
  { id: 133, name: "Makkah Taraweeh 1437", sync: "none", group: 2 },
  { id: 150, name: "Makkah Taraweeh 1438", sync: "none", group: 2 },
  { id: 151, name: "Makkah Taraweeh 1439", sync: "none", group: 2 },
  { id: 152, name: "Makkah Taraweeh 1440", sync: "none", group: 2 },
  { id: 153, name: "Makkah Taraweeh 1441", sync: "none", group: 2 },
  { id: 154, name: "Makkah Taraweeh 1442", sync: "none", group: 2 },
  { id: 54, name: "AbdulBaset AbdulSamad [Warsh]", sync: "none", group: 3 },
  { id: 110, name: "Abdur-Rashid Sufi [Abi al-Haarith an al-Kasaa'ee]", sync: "none", group: 3 },
  { id: 111, name: "Abdur-Rashid Sufi [ad-Doori an Abi Amr]", sync: "none", group: 3 },
  { id: 62, name: "Abdur-Rashid Sufi [Khalaf]", sync: "none", group: 3 },
  { id: 112, name: "Abdur-Rashid Sufi [Shu'bah an Asim]", sync: "none", group: 3 },
  { id: 137, name: "Abdur-Rashid Sufi [Soosi, 2020]", sync: "none", group: 3 },
  { id: 60, name: "Abdur-Rashid Sufi [Soosi]", sync: "none", group: 3 },
  { id: 114, name: "Ali al-Huthaify [Qaloon]", sync: "none", group: 3 },
  { id: 78, name: "Mahmoud Khalil Al-Husary [Doori]", sync: "none", group: 3 },
  { id: 155, name: "Noreen Siddiq [ad-Doori an Abi Amr]", sync: "none", group: 3 },
  { id: 57, name: "AbdulBaset AbdulSamad with Ibrahim Walk [Saheeh Intl Translation]", sync: "none", group: 4 },
  { id: 47, name: "AbdulBaset AbdulSamad with Naeem Sultan [Pickthall Translation]", sync: "none", group: 4 },
  { id: 39, name: "Muhammad Ayyub with Mikaal Waters [Muhsin Khan Translation]", sync: "none", group: 4 },
  { id: 42, name: "Shakir Qasami with Aslam Athar [Pickthall Translation]", sync: "none", group: 4 },
  { id: 67, name: "Sudais and Shuraym [Urdu Translation]", sync: "none", group: 4 },
  { id: 36, name: "Sudais and Shuraym with Aslam Athar [Pickthall Translation]", sync: "none", group: 4 },
  { id: 48, name: "Sudais and Shuraym with Naeem Sultan [Pickthall Translation]", sync: "none", group: 4 },
];

export const RECITER_GROUPS: { label: string; match: (r: Reciter) => boolean }[] = [
  { label: "Word-by-word highlighting", match: (r) => r.group === 1 && r.sync === "word" },
  { label: "Verse-by-verse highlighting", match: (r) => r.group === 1 && r.sync === "verse" },
  { label: "Audio only", match: (r) => r.group === 1 && r.sync === "none" },
  { label: "Haramain Taraweeh", match: (r) => r.group === 2 },
  { label: "Other qira'at (non-Hafs)", match: (r) => r.group === 3 },
  { label: "With English translation", match: (r) => r.group === 4 },
];

const cache = new Map<string, Promise<unknown>>();
function get<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    const p = fetch(API + path).then((r) => {
      if (!r.ok) throw new Error("Quran request failed");
      return r.json();
    });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path) as Promise<T>;
}

export const stripTags = (s: string) => s.replace(/<sup[^>]*>.*?<\/sup>/g, "").replace(/<[^>]+>/g, "").trim();

export async function getChapters(): Promise<Chapter[]> {
  return (await get<{ chapters: Chapter[] }>("/chapters?language=en")).chapters;
}

export async function getVerses(chapter: number): Promise<Verse[]> {
  type Raw = { verse_key: string; verse_number: number; words: { position: number; text_uthmani: string; char_type_name: string }[]; translations: { text: string }[] };
  const raw: Raw[] = [];
  let page = 1;
  for (;;) {
    const res = await get<{ verses: Raw[]; pagination: { next_page: number | null } }>(
      `/verses/by_chapter/${chapter}?language=en&words=true&word_fields=text_uthmani&translations=20&per_page=50&page=${page}`,
    );
    raw.push(...res.verses);
    if (!res.pagination.next_page) break;
    page = res.pagination.next_page;
  }
  const translit = await get<{ translations: { text: string }[] }>(`/quran/translations/57?chapter_number=${chapter}`)
    .then((r) => r.translations).catch(() => []);
  return raw.map((v, i) => ({
    key: v.verse_key,
    number: v.verse_number,
    words: v.words.map((w) => ({ position: w.position, text: w.text_uthmani, isEnd: w.char_type_name === "end" })),
    translation: stripTags(v.translations[0]?.text ?? ""),
    transliteration: stripTags(translit[i]?.text ?? ""),
  }));
}

export async function getChapterAudio(reciter: number, chapter: number): Promise<ChapterAudio> {
  type Raw = { audio_file: { audio_url: string; timestamps: { verse_key: string; timestamp_from: number; timestamp_to: number; segments: number[][] }[] } };
  const r = await get<Raw>(`/chapter_recitations/${reciter}/${chapter}?segments=true`);
  return {
    url: r.audio_file.audio_url,
    timings: r.audio_file.timestamps.map((t) => ({
      key: t.verse_key,
      from: t.timestamp_from,
      to: t.timestamp_to,
      segments: (t.segments ?? []).filter((s) => s.length >= 3).map((s) => [s[0], s[1], s[2]] as [number, number, number]),
    })),
  };
}

/** Which verse and word are being recited at `ms` into the chapter audio. */
export function locate(timings: Timing[], ms: number): { key: string | null; word: number | null } {
  const t = timings.find((x) => ms >= x.from && ms < x.to);
  if (!t) return { key: null, word: null };
  const seg = t.segments.find((s) => ms >= s[1] && ms < s[2]);
  return { key: t.key, word: seg ? seg[0] : null };
}
