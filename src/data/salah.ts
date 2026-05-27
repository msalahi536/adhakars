import type { Dhikr } from "./adhkar";

export type ComboPart = {
  id: string;
  arabic: string;
  transliteration: string;
  translation?: string;
  target: number;
};

export type ComboDhikr = {
  kind: "combo";
  id: string;
  title: string;
  parts: ComboPart[];
  source: string;
  commentary?: string;
};

export type SalahItem = {
  dhikr?: Dhikr;
  combo?: ComboDhikr;
  isSpecial?: boolean;
  specialLabel?: string;
  isPersonalDua?: boolean;
};

export type SalahPrayer = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "witr";

export const SALAH_PRAYERS: { id: SalahPrayer; label: string }[] = [
  { id: "fajr", label: "Fajr" },
  { id: "dhuhr", label: "Dhuhr" },
  { id: "asr", label: "Asr" },
  { id: "maghrib", label: "Maghrib" },
  { id: "isha", label: "Isha" },
  { id: "witr", label: "Witr" },
];

// ---------- Shared card factories (id prefixed per prayer) ----------

const cardA = (p: string): Dhikr => ({
  id: `${p}_A`,
  title: "Istighfar",
  arabic: "أَسْتَغْفِرُ اللَّهَ",
  transliteration: "Astaghfirullah",
  translation: "I seek forgiveness from Allah.",
  source: "Sahih Muslim 591",
  commentary:
    "When the Messenger of Allah ﷺ finished his prayer, he would seek forgiveness three times.",
  target: 3,
});

const cardB = (p: string): Dhikr => ({
  id: `${p}_B`,
  title: "Tasleem Dua",
  arabic:
    "اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ ذَا الْجَلاَلِ وَالإِكْرَامِ",
  transliteration:
    "Allahumma antas-salaam, wa minkas-salaam, tabaarakta dhaal-jalaali wal-ikraam",
  translation:
    "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Glory and Honour.",
  source: "Sahih Muslim 591",
  commentary:
    "This is said immediately after Astaghfirullah ×3 — both come from the same hadith of Thawban. The Prophet ﷺ said this after every obligatory prayer.",
  target: 1,
});

const cardC = (p: string): Dhikr => ({
  id: `${p}_C`,
  title: "Laa Ilaaha Illallah",
  arabic:
    "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  transliteration:
    "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli shay'in qadeer",
  translation:
    "There is no god but Allah, alone, with no partner. To Him belongs sovereignty and all praise, and He has power over all things.",
  source: "Sahih Muslim 594",
  commentary:
    "Narrated from Ibn az-Zubayr that the Prophet ﷺ would say this after every obligatory prayer.",
  target: 1,
});

const cardC2 = (p: string): Dhikr => ({
  id: `${p}_C2`,
  title: "Allahumma Laa Maani'a",
  arabic:
    "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
  transliteration:
    "Allahumma laa maani'a limaa a'tayta, wa laa mu'tiya limaa mana'ta, wa laa yanfa'u dhal-jaddi minkal-jadd",
  translation:
    "O Allah, none can withhold what You give, and none can give what You withhold, and no wealth or majesty can benefit anyone against You.",
  source: "Sahih al-Bukhari 844 | Sahih Muslim 593a",
  commentary:
    "Narrated from al-Mughira ibn Shu'ba that the Prophet ﷺ said this after every obligatory prayer. This is a separate narration from the previous card — both are said in sequence. Scholars such as Ibn Baz present them together as part of the same post-prayer adhkar sequence.",
  target: 1,
});

const cardD = (p: string): ComboDhikr => ({
  kind: "combo",
  id: `${p}_D`,
  title: "Tasbeeh",
  source: "Sahih Muslim 597a",
  commentary:
    "Whoever extols Allah 33 times, praises Him 33 times, and declares His Greatness 33 times after every prayer — 99 in all — and completes 100 with this statement, his sins will be forgiven even if they are as abundant as the foam of the sea.",
  parts: [
    {
      id: `${p}_D_subhan`,
      arabic: "سُبْحَانَ اللَّهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
      target: 33,
    },
    {
      id: `${p}_D_hamd`,
      arabic: "اَلْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is for Allah",
      target: 33,
    },
    {
      id: `${p}_D_akbar`,
      arabic: "اللَّهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
      target: 33,
    },
    {
      id: `${p}_D_final`,
      arabic:
        "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      transliteration:
        "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli shay'in qadeer",
      translation:
        "There is no god but Allah alone, with no partner. To Him belongs sovereignty and praise, and He has power over all things.",
      target: 1,
    },
  ],
});

const cardE = (p: string): Dhikr => ({
  id: `${p}_E`,
  title: "Ayatul Kursi",
  arabic:
    "ٱللَّهُ لَآ إِلَـٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌۭ وَلَا نَوْمٌۭ ۚ لَّهُۥ مَا فِى ٱلسَّمَـٰوَٰتِ وَمَا فِى ٱلْأَرْضِ ۗ مَن ذَا ٱلَّذِى يَشْفَعُ عِندَهُۥٓ إِلَّا بِإِذْنِهِۦ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَىْءٍۢ مِّنْ عِلْمِهِۦٓ إِلَّا بِمَا شَآءَ ۚ وَسَعَ كُرْسِيُّهُ ٱلسَّمَـٰوَٰتِ وَٱلْأَرْضَ ۖ وَلَا يَـُٔودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِىُّ ٱلْعَظِيمُ",
  transliteration:
    "Allahu laa ilaaha illaa huw, al-hayyul qayyoom, laa ta'khudhuhu sinatun wa laa nawm, lahu maa fis-samaawaati wa maa fil-ard, man dhal-ladhee yashfa'u 'indahu illaa bi-idhnih, ya'lamu maa bayna aydeehim wa maa khalfahum, wa laa yuheetoona bishay'im-min 'ilmihi illaa bimaa shaa', wasi'a kursiyyuhus-samaawaati wal-ard, wa laa ya'ooduhu hifdhuhuma, wa huwal 'aliyyul 'adheem",
  translation:
    "Allah! There is no god worthy of worship except Him, the Ever-Living, All-Sustaining. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on the earth. Who could possibly intercede with Him without His permission? He fully knows what is ahead of them and what is behind them, but no one can grasp any of His knowledge — except what He wills to reveal. His Seat encompasses the heavens and the earth, and the preservation of both does not tire Him. For He is the Most High, the Greatest.",
  source: "Bulugh al-Maram 324 · An-Nasa'i (Ibn Hibban authenticated)",
  commentary:
    "The Messenger of Allah ﷺ said: 'Whoever recites Ayat al-Kursi at the end of every obligatory prayer, nothing but death will prevent him from entering Paradise.'",
  target: 1,
});

const cardF = (p: string): Dhikr => ({
  id: `${p}_F`,
  title: "Du'a of Mu'adh ibn Jabal",
  arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
  transliteration: "Allahumma a'inni 'alaa dhikrika wa shukrika wa husni 'ibaadatik",
  translation:
    "O Allah, help me in remembering You, in giving You thanks, and in worshipping You well.",
  source: "Sunan Abi Dawud 1522 · Sunan an-Nasa'i 1303 — Sahih",
  commentary:
    "The Messenger of Allah ﷺ took the hand of Mu'adh ibn Jabal and said: 'By Allah, I love you, Mu'adh. I instruct you: never leave reciting this supplication after every prescribed prayer.'",
  target: 1,
});

const cardG = (p: string): Dhikr => ({
  id: `${p}_G`,
  title: "Closing Seal",
  arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
  transliteration: "Subhaanaka Allahumma wa bihamdika, astaghfiruka wa atoobu ilayk",
  translation:
    "Glory and praise be to You, O Allah. I seek Your forgiveness and I repent to You.",
  source: "Sunan an-Nasa'i 1344 — Hasan",
  commentary:
    "'Aishah reported that whenever the Messenger of Allah ﷺ finished a prayer or sat in a gathering, he would say these words. He said: if good words were spoken, this seals them until the Day of Resurrection; if anything else was said, this is an expiation for it.",
  target: 1,
});

// Mu'awwidhat — full surahs
const muawwidhatMulti = (times: 1 | 3) => {
  const suffix = times === 3 ? "(×3)" : "(×1)";
  return [
    {
      label: `Surah Al-Ikhlas ${suffix}`,
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      transliteration:
        "Qul huwal-laahu Ahad. Allaahus samad. Lam yalid wa lam yuwlad. Wa lam yakullahu kuf-fuw-wan Ahad.",
      translation:
        "Say, He is Allah, One and Indivisible. Allah, the Sustainer needed by all. He has never had offspring, nor was He born. And there is none comparable to Him.",
    },
    {
      label: `Surah Al-Falaq ${suffix}`,
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      transliteration:
        "Qul 'audhu birabbil falaq. Min sharri maa khalaq. Wa min sharri ghaasiqin idha waqab. Wa min sharrin naffa-thaati fil 'uqad. Wa min sharri haasidin idha hasad.",
      translation:
        "Say, I seek refuge in the Lord of the daybreak. From the evil of whatever He has created. And from the evil of the night when it grows dark. And from the evil of those witches casting spells by blowing onto knots. And from the evil of an envier when they envy.",
    },
    {
      label: `Surah An-Naas ${suffix}`,
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
      transliteration:
        "Qul 'audhu birabbin naas. Malikin-naas. Ilaahin-naas. Min sharril waswaasil khannaas. El-ledhi yuwas-wisu fee sudoorin-naas. Minal jin-nati wan-naas.",
      translation:
        "Say, I seek refuge in the Lord of humankind. The Master of humankind. The God of humankind. From the evil of the lurking whisper. Who whispers into the hearts of humankind. From among jinn and humankind.",
    },
  ];
};

const muawwidhatThrice = (p: string): Dhikr => ({
  id: `${p}_H_muawwidhat`,
  title: "Al-Mu'awwidhat — ×3",
  arabic: "",
  transliteration: "",
  translation: "Recite each surah 3 times — specific to Fajr and Maghrib",
  source: "Jami at-Tirmidhi 2903 — Hasan | Sunan Abi Dawud 1523 — Sahih",
  commentary:
    "Imam Ibn Baz stated: 'After Maghrib and Fajr, they should be recited three times each — and that is better.'",
  target: 9,
  arabicMulti: muawwidhatMulti(3),
});

const muawwidhatOnce = (p: string): Dhikr => ({
  id: `${p}_H_muawwidhat`,
  title: "Al-Mu'awwidhat — ×1",
  arabic: "",
  transliteration: "",
  translation: "Recite each surah once — Dhuhr, Asr, and Isha",
  source: "Jami at-Tirmidhi 2903 — Hasan | Sunan Abi Dawud 1523 — Sahih",
  commentary:
    "Imam Ibn Baz stated: 'It is legislated to recite Suratul-Ikhlas, Suratul-Falaq and Suratun-Naas once each after Dhuhr, Asr and Isha.'",
  target: 3,
  arabicMulti: muawwidhatMulti(1),
});

// Fajr-only cards
const fajrG2: Dhikr = {
  id: "fajr_G2",
  title: "Forgotten Sunnah — Before Speaking",
  arabic:
    "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  transliteration:
    "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul mulku wa lahul hamdu, yuhyee wa yumeetu, wa huwa 'alaa kulli shay'in qadeer",
  translation:
    "There is no god but Allah, alone, with no partner. To Him belongs sovereignty and all praise. He gives life and causes death, and He has power over all things.",
  source: "Jami at-Tirmidhi 3474 — Hasan Sahih (Darussalam)",
  commentary:
    "⚠️ Say this FIRST — before speaking to anyone, while your feet are still folded after Fajr salam. The Prophet ﷺ said: \"Whoever says this ten times at the end of Fajr prayer, while his feet are still folded, before speaking — ten good deeds will be written for him, ten sins erased, he will be raised ten degrees, he will be protected all that day from every disliked thing, guarded from Shaytan, and no sin will reach him that day except shirk.\" This dhikr is specific to Fajr only and is a largely forgotten sunnah — do not neglect it.",
  target: 10,
};

const fajrKnowledge: Dhikr = {
  id: "fajr_H_knowledge",
  title: "Morning Knowledge Dua",
  arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً",
  transliteration:
    "Allahumma inni as'aluka 'ilman naafi'aa, wa rizqan tayyibaa, wa 'amalan mutaqabbalaa",
  translation:
    "O Allah, I ask You for beneficial knowledge, goodly provision, and acceptable deeds.",
  source: "Sunan Ibn Majah 925 — Sahih (Darussalam)",
  commentary:
    "Narrated from Umm Salamah that when the Prophet ﷺ performed Fajr and said the Salam, he would say this. Placed here after the main adhkar and before the Mu'awwidhat — both positions have scholarly basis.",
  target: 1,
};

// Witr cards
const witr1: Dhikr = {
  id: "witr_1",
  title: "Subhanal Malikil Quddus",
  arabic: "سُبْحَانَ الْمَلِكِ الْقُدُّوسِ",
  transliteration: "Subhaanal-Malikil-Quddoos",
  translation: "Glory be to the Sovereign, the Most Holy.",
  source: "Sunan an-Nasa'i 1699 — Sahih | Sunan Abi Dawud 1430 — Sahih",
  commentary:
    "When the Messenger of Allah ﷺ finished the Witr prayer, he would say 'Subhanal-Malikil-Quddoos' three times, elongating and raising his voice on the last one. This is the only specific dhikr authentically established for after Witr.",
  target: 3,
};

const witr2: Dhikr = {
  id: "witr_2",
  title: "Dua of 'Ali ibn Abi Talib",
  arabic:
    "اللَّهُمَّ إِنِّي أَعُوذُ بِرِضَاكَ مِنْ سَخَطِكَ، وَبِمُعَافَاتِكَ مِنْ عُقُوبَتِكَ، وَأَعُوذُ بِكَ مِنْكَ، لَا أُحْصِي ثَنَاءً عَلَيْكَ أَنْتَ كَمَا أَثْنَيْتَ عَلَى نَفْسِكَ",
  transliteration:
    "Allahumma inni a'udhu biridhaaka min sakhatika, wa bimu'aafaatika min 'uqoobatika, wa a'udhu bika minka, laa uhsee thanaa'an 'alayka, anta kamaa athnayta 'alaa nafsik",
  translation:
    "O Allah, I seek refuge in Your pleasure from Your anger, and in Your pardon from Your punishment, and I seek refuge in You from You. I cannot enumerate Your praise — You are as You have praised Yourself.",
  source: "Sunan Abi Dawud 1427 — Sahih",
  commentary:
    "The Prophet ﷺ taught this to 'Ali ibn Abi Talib to say after Witr prayer. This is authentically established as specific to Witr.",
  target: 1,
};

const witr3: Dhikr = {
  id: "witr_3",
  title: "Personal Du'a",
  arabic: "",
  transliteration: "",
  translation:
    "This is a blessed time for personal supplication. Ask Allah for whatever you need — for yourself, your family, and the Muslims.",
  source: "General scholarly guidance",
  commentary:
    "After Witr is one of the most recommended times for personal dua. The Prophet ﷺ encouraged making dua after Witr and this time is especially blessed.",
  target: 1,
};

const sharedSequence = (p: string): SalahItem[] => [
  { dhikr: cardA(p) },
  { dhikr: cardB(p) },
  { dhikr: cardC(p) },
  { dhikr: cardC2(p) },
  { combo: cardD(p) },
  { dhikr: cardE(p) },
  { dhikr: cardF(p) },
  { dhikr: cardG(p) },
];

export function getSalahItems(prayer: SalahPrayer): SalahItem[] {
  if (prayer === "fajr") {
    return [
      {
        dhikr: fajrG2,
        isSpecial: true,
        specialLabel: "⚠️ Say this before speaking — feet still folded",
      },
      ...sharedSequence("fajr"),
      { dhikr: fajrKnowledge },
      { dhikr: muawwidhatThrice("fajr") },
    ];
  }
  if (prayer === "maghrib") {
    return [...sharedSequence("maghrib"), { dhikr: muawwidhatThrice("maghrib") }];
  }
  if (prayer === "dhuhr" || prayer === "asr" || prayer === "isha") {
    return [...sharedSequence(prayer), { dhikr: muawwidhatOnce(prayer) }];
  }
  // witr
  return [
    { dhikr: witr1 },
    { dhikr: witr2 },
    { dhikr: witr3, isPersonalDua: true },
  ];
}

export function itemId(item: SalahItem): string {
  return item.dhikr?.id ?? item.combo!.id;
}

export function itemTotalTarget(item: SalahItem): number {
  if (item.dhikr) return item.dhikr.target;
  return item.combo!.parts.reduce((s, p) => s + p.target, 0);
}

export function isItemComplete(item: SalahItem, counts: Record<string, number>): boolean {
  if (item.dhikr) {
    return (counts[item.dhikr.id] ?? 0) >= item.dhikr.target;
  }
  return item.combo!.parts.every((p) => (counts[p.id] ?? 0) >= p.target);
}
