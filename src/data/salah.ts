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

// -------- Shared cards --------

const istighfar: Dhikr = {
  id: "salah-istighfar",
  title: "Istighfar",
  arabic: "أَسْتَغْفِرُ اللَّهَ",
  transliteration: "Astaghfirullah (×3)",
  translation: "I seek forgiveness from Allah.",
  source: "Sahih Muslim 591",
  commentary:
    "When the Messenger of Allah ﷺ finished his prayer, he would seek forgiveness three times then say: 'Allahumma antas-salaam, wa minkas-salaam, tabaarakta dhaal-jalaali wal-ikraam.'",
  target: 3,
  arabicMulti: [
    {
      label: "Astaghfirullah (×3)",
      arabic: "أَسْتَغْفِرُ اللَّهَ",
      transliteration: "Astaghfirullah",
      translation: "I seek forgiveness from Allah.",
    },
    {
      label: "Then say (×1)",
      arabic:
        "اللَّهُمَّ أَنْتَ السَّلاَمُ وَمِنْكَ السَّلاَمُ تَبَارَكْتَ ذَا الْجَلاَلِ وَالإِكْرَامِ",
      transliteration:
        "Allahumma antas-salaam, wa minkas-salaam, tabaarakta dhaal-jalaali wal-ikraam",
      translation:
        "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Glory and Honour.",
    },
  ],
};

const laaIlaahaMaani: Dhikr = {
  id: "salah-laailaaha-maani",
  title: "Laa ilaaha illallah + Allahumma laa maani'",
  arabic: "",
  transliteration: "",
  translation: "",
  source: "Sahih Muslim 593a · Sahih al-Bukhari 844",
  commentary: "The Prophet ﷺ used to say this after every obligatory prayer.",
  target: 1,
  arabicMulti: [
    {
      label: "Laa ilaaha illallah",
      arabic:
        "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      transliteration:
        "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli shay'in qadeer",
      translation:
        "There is no god but Allah, alone, with no partner. To Him belongs the dominion and to Him belongs praise, and He has power over all things.",
    },
    {
      label: "Allahumma laa maani'",
      arabic:
        "اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
      transliteration:
        "Allahumma laa maani'a limaa a'tayta, wa laa mu'tiya limaa mana'ta, wa laa yanfa'u dhal-jaddi minkal-jadd",
      translation:
        "O Allah, none can withhold what You give, and none can give what You withhold, and no wealth or majesty can benefit anyone against You.",
    },
  ],
};

const tasbeehCombo: ComboDhikr = {
  kind: "combo",
  id: "salah-tasbeeh-combo",
  title: "Tasbeeh after Salah",
  source: "Sahih Muslim 597a",
  commentary:
    "Whoever extols Allah 33 times, praises Allah 33 times, and declares His Greatness 33 times after every prayer — 99 in all — and completes 100 with this statement, his sins will be forgiven even if they are as abundant as the foam of the sea.",
  parts: [
    {
      id: "salah-combo-subhanallah",
      arabic: "سُبْحَانَ اللَّهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
      target: 33,
    },
    {
      id: "salah-combo-alhamdulillah",
      arabic: "اَلْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is for Allah",
      target: 33,
    },
    {
      id: "salah-combo-allahuakbar",
      arabic: "اللَّهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
      target: 33,
    },
    {
      id: "salah-combo-final",
      arabic:
        "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
      transliteration:
        "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul mulku wa lahul hamdu wa huwa 'alaa kulli shay'in qadeer",
      translation:
        "There is no god but Allah alone, with no partner. To Him belongs sovereignty and praise, and He has power over all things.",
      target: 1,
    },
  ],
};

const ayatulKursi: Dhikr = {
  id: "salah-ayatul-kursi",
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
};

const muadhDua: Dhikr = {
  id: "salah-muadh",
  title: "Du'a of Mu'adh ibn Jabal",
  arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
  transliteration: "Allahumma a'inni 'alaa dhikrika wa shukrika wa husni 'ibaadatik",
  translation:
    "O Allah, help me in remembering You, in giving You thanks, and in worshipping You well.",
  source: "Sunan Abi Dawud 1522 · Sunan an-Nasa'i 1303 — Sahih",
  commentary:
    "The Messenger of Allah ﷺ took the hand of Mu'adh ibn Jabal and said: 'By Allah, I love you, Mu'adh. I instruct you: never leave reciting this supplication after every prescribed prayer.'",
  target: 1,
};

const closingSeal: Dhikr = {
  id: "salah-closing",
  title: "Closing Seal",
  arabic: "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
  transliteration: "Subhaanaka Allahumma wa bihamdika, astaghfiruka wa atoobu ilayk",
  translation: "Glory and praise be to You, O Allah. I seek Your forgiveness and I repent to You.",
  source: "Sunan an-Nasa'i 1344 — Hasan",
  commentary:
    "'Aishah reported that whenever the Messenger of Allah ﷺ finished a prayer or sat in a gathering, he would say these words. He said: if good words were spoken, this seals them until the Day of Resurrection; if anything else was said, this is an expiation for it.",
  target: 1,
};

// Mu'awwidhat — same surahs, varying target
const surahsThrice: Dhikr = {
  id: "salah-mu-awwidhat-3",
  title: "Al-Ikhlas, Al-Falaq, An-Naas — Recite each 3×",
  arabic: "",
  transliteration: "",
  translation: "",
  source:
    "Jami at-Tirmidhi 2903 — Hasan · Sunan Abi Dawud 1523 — Sahih · Imam Ibn Baz: 'After Maghrib and Fajr, they should be recited three times each.'",
  commentary: "Recite each surah 3 times after Fajr and Maghrib.",
  target: 9,
  arabicMulti: [
    {
      label: "Surah Al-Ikhlas (×3)",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      transliteration:
        "Qul huwal-laahu Ahad. Allaahus samad. Lam yalid wa lam yuwlad. Wa lam yakullahu kuf-fuw-wan Ahad.",
      translation:
        "Say, He is Allah, One and Indivisible. Allah, the Sustainer needed by all. He has never had offspring, nor was He born. And there is none comparable to Him.",
    },
    {
      label: "Surah Al-Falaq (×3)",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      transliteration:
        "Qul 'audhu birabbil falaq. Min sharri maa khalaq. Wa min sharri ghaasiqin idha waqab. Wa min sharrin naffa-thaati fil 'uqad. Wa min sharri haasidin idha hasad.",
      translation:
        "Say, I seek refuge in the Lord of the daybreak. From the evil of whatever He has created. And from the evil of the night when it grows dark. And from the evil of those witches casting spells by blowing onto knots. And from the evil of an envier when they envy.",
    },
    {
      label: "Surah An-Naas (×3)",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
      transliteration:
        "Qul 'audhu birabbin naas. Malikin-naas. Ilaahin-naas. Min sharril waswaasil khannaas. El-ledhi yuwas-wisu fee sudoorin-naas. Minal jin-nati wan-naas.",
      translation:
        "Say, I seek refuge in the Lord of humankind. The Master of humankind. The God of humankind. From the evil of the lurking whisper. Who whispers into the hearts of humankind. From among jinn and humankind.",
    },
  ],
};

const surahsOnce: Dhikr = {
  ...surahsThrice,
  id: "salah-mu-awwidhat-1",
  title: "Al-Ikhlas, Al-Falaq, An-Naas — Recite each 1×",
  target: 3,
  commentary:
    "Imam Ibn Baz stated: 'It is legislated to recite Suratul-Ikhlas, Suratul-Falaq and Suratun-Naas once each after Dhuhr, Asr and Isha.'",
  arabicMulti: surahsThrice.arabicMulti?.map((p) => ({
    ...p,
    label: p.label.replace("(×3)", "(×1)"),
  })),
};

const morningDuaFajr: Dhikr = {
  id: "salah-fajr-morning-dua",
  title: "Morning Du'a (Fajr only)",
  arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلاً مُتَقَبَّلاً",
  transliteration: "Allahumma inni as'aluka 'ilman naafi'aa, wa rizqan tayyibaa, wa 'amalan mutaqabbalaa",
  translation: "O Allah, I ask You for beneficial knowledge, goodly provision, and acceptable deeds.",
  source: "Sunan Ibn Majah 925 — Sahih",
  commentary:
    "It was narrated from Umm Salamah that when the Prophet ﷺ performed the Fajr prayer and said the Salam, he would say this.",
  target: 1,
};

const subhanalMalikQuddoos: Dhikr = {
  id: "salah-witr-subhanal-malik",
  title: "Subhanal Malikil Quddoos",
  arabic: "سُبْحَانَ الْمَلِكِ الْقُدُّوسِ",
  transliteration: "Subhaanal-Malikil-Quddoos (×3)",
  translation: "Glory be to the Sovereign, the Most Holy.",
  source: "Sunan an-Nasa'i 1699 — Sahih · Sunan Abi Dawud 1430 — Sahih",
  commentary:
    "When the Messenger of Allah ﷺ finished the Witr prayer, he would say 'Subhanal-Malikil-Quddoos' three times, elongating and raising his voice on the last one.",
  target: 3,
};

const witrFinalDua: Dhikr = {
  id: "salah-witr-khayrat",
  title: "Du'a after Witr",
  arabic:
    "اللَّهُمَّ إِنِّي أَسْأَلُكَ فِعْلَ الْخَيْرَاتِ وَتَرْكَ الْمُنْكَرَاتِ وَحُبَّ الْمَسَاكِينِ وَإِذَا أَرَدْتَ بِعِبَادِكَ فِتْنَةً فَاقْبِضْنِي إِلَيْكَ غَيْرَ مَفْتُونٍ",
  transliteration:
    "Allahumma inni as'aluka fi'lal-khayraat, wa tarkal-munkaraat, wa hubbal-masaakeen, wa idhaa aradta bi'ibaadika fitnatan faqbidni ilayka ghayra maftoon",
  translation:
    "O Allah, I ask You for the doing of good deeds, the avoiding of evil deeds, and the love of the poor. And when You have willed Fitnah (tribulation) for Your servants, then take me to You without being afflicted by it.",
  source: "Jami at-Tirmidhi 3233 — Hasan",
  commentary:
    "The Prophet ﷺ was told by his Lord in a dream: 'O Muhammad! When you have performed Salah then say this.'",
  target: 1,
};

const sharedAll: SalahItem[] = [
  { dhikr: istighfar },
  { dhikr: laaIlaahaMaani },
  { combo: tasbeehCombo },
  { dhikr: ayatulKursi },
  { dhikr: muadhDua },
  { dhikr: closingSeal },
];

export function getSalahItems(prayer: SalahPrayer): SalahItem[] {
  if (prayer === "fajr") {
    return [...sharedAll, { dhikr: surahsThrice }, { dhikr: morningDuaFajr }];
  }
  if (prayer === "maghrib") {
    return [...sharedAll, { dhikr: surahsThrice }];
  }
  if (prayer === "dhuhr" || prayer === "asr" || prayer === "isha") {
    return [...sharedAll, { dhikr: surahsOnce }];
  }
  // witr: subhanalMalik first, then shared cards 1, 3, 5, 6, then khayrat
  return [
    { dhikr: subhanalMalikQuddoos },
    { dhikr: istighfar },
    { combo: tasbeehCombo },
    { dhikr: muadhDua },
    { dhikr: closingSeal },
    { dhikr: witrFinalDua },
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
