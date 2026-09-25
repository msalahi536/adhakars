// "Hajj & Umrah Companion". Every hadith, du'a, ruling and scholarly position
// below is copied from the source document the owner supplied. Do not reword it.
import type { SunnahItem } from "@/data/period-sunnah";

export const RETURN_DUA_AR = "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ";

export const MUSLIM_1297: SunnahItem = {
  id: "muslim-1297",
  title: "The command that governs the whole journey",
  source: "Muslim 1297  ·  Sahih (Muslim)",
  arabic: "لِتَأْخُذُوا مَنَاسِكَكُمْ فَإِنِّي لاَ أَدْرِي لَعَلِّي لاَ أَحُجُّ بَعْدَ حَجَّتِي هَذِهِ",
  transliteration: "Li-taʾkhudhū manāsikakum, fa-innī lā adrī laʿallī lā aḥujju baʿda ḥajjatī hādhih.",
  translation: "Take your rites from me, for I do not know whether I will perform Hajj after this Hajj of mine.",
  narration: "Jabir reported that the Prophet (ﷺ) said this during the Farewell Hajj, while throwing the pebbles from atop his camel.",
  notes: ["Said while performing the rites, so the people would watch and copy. This is the standard for the entire journey: what he did is what is done."],
};

export const BUKHARI_1521: SunnahItem = {
  id: "bukhari-1521",
  title: "What Hajj erases",
  source: "Bukhari 1521  ·  Sahih (al-Bukhari)",
  arabic: "مَنْ حَجَّ لِلَّهِ فَلَمْ يَرْفُثْ وَلَمْ يَفْسُقْ رَجَعَ كَيَوْمِ وَلَدَتْهُ أُمُّهُ",
  transliteration: "Man ḥajja lillāhi fa-lam yarfuth wa lam yafsuq, rajaʿa ka-yawmi waladat-hu ummuh.",
  translation: "Whoever performs Hajj for Allah and does not commit rafath or fusuq returns as on the day his mother bore him.",
  narration: "Abu Hurairah reported this from the Prophet (ﷺ).",
};

export const BUKHARI_1773: SunnahItem = {
  id: "bukhari-1773",
  title: "What it earns",
  source: "Bukhari 1773  ·  Sahih (al-Bukhari)",
  arabic: "العُمْرَةُ إِلَى الْعُمْرَةِ كَفَّارَةٌ لِمَا بَيْنَهُمَا، وَالْحَجُّ الْمَبْرُورُ لَيْسَ لَهُ جَزَاءٌ إِلَّا الْجَنَّةُ",
  translation: "‘Umrah to ‘Umrah is expiation for what is between them, and an accepted Hajj has no reward but Paradise.",
  notes: ["Note the two conditions attached: no rafath and no fusuq. The reward is not automatic on arrival; it is tied to conduct. Which is exactly what the verse in the next entry legislates."],
};

export const QURAN_2_197: SunnahItem = {
  id: "quran-2-197",
  title: "The conduct the Qur’an requires",
  source: "Qur’an 2:197",
  arabic: "الْحَجُّ أَشْهُرٌ مَّعْلُومَاتٌ ۚ فَمَن فَرَضَ فِيهِنَّ الْحَجَّ فَلَا رَفَثَ وَلَا فُسُوقَ وَلَا جِدَالَ فِي الْحَجِّ ۗ وَمَا تَفْعَلُوا مِنْ خَيْرٍ يَعْلَمْهُ اللَّهُ ۗ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ۚ وَاتَّقُونِ يَا أُولِي الْأَلْبَابِ",
  transliteration: "Al-ḥajju ashhurun maʿlūmāt. Fa-man faraḍa fīhinna ʾl-ḥajja fa-lā rafatha wa lā fusūqa wa lā jidāla fi ʾl-ḥajj…",
  translation: "Hajj is during well-known months, so whoever has made Hajj obligatory upon himself therein, there is to be no sexual relations, no disobedience and no disputing during Hajj. And whatever good you do — Allah knows it. And take provisions, but indeed the best provision is taqwa. And fear Me, O you of understanding.",
  callout: { tone: "grey", label: "No disputing", text: "Hajj is crowded, hot, exhausting and full of people pushing. The verse names arguing as a thing to be avoided, which is worth keeping in front of a pilgrim at the moment tempers fray." },
};

export const TRAVEL_DUA: SunnahItem = {
  id: "travel-dua",
  title: "The travel du‘a",
  source: "Muslim 1342  ·  Sahih (Muslim)",
  arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الأَهْلِ اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ",
  transliteration: "Subḥāna ʾlladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā Rabbinā la-munqalibūn. Allāhumma innā nasʾaluka fī safarinā hādha ʾl-birra wa ʾt-taqwā, wa mina ʾl-ʿamali mā tarḍā. Allāhumma hawwin ʿalaynā safaranā hādhā wa-ṭwi ʿannā buʿdah. Allāhumma anta ʾṣ-ṣāḥibu fi ʾs-safar, wa ʾl-khalīfatu fi ʾl-ahl. Allāhumma innī aʿūdhu bika min waʿthāʾi ʾs-safar, wa kaʾābati ʾl-manẓar, wa sūʾi ʾl-munqalabi fi ʾl-māli wa ʾl-ahl.",
  translation: "Glory to Him who has subjected this to us, for we could never have accomplished it ourselves, and to our Lord we shall surely return. O Allah, we ask You on this journey of ours for righteousness and piety, and for deeds that please You. O Allah, make this journey easy for us and fold up its distance. O Allah, You are the Companion on the journey and the Guardian over the family. O Allah, I seek refuge in You from the hardship of travel, from a sorrowful sight, and from an evil return to wealth and family.",
  narration: `Ibn ‘Umar reported that when the Prophet (ﷺ) mounted his camel setting out on a journey, he would say Allahu akbar three times, then say this. On returning he would add: “${RETURN_DUA_AR}” — We return, repenting, worshipping and praising our Lord.`,
};

export const RETURN_DUA: SunnahItem = {
  id: "return-dua",
  title: "The du‘a of return",
  source: "Muslim 1342  ·  Sahih (Muslim)",
  arabic: RETURN_DUA_AR,
  translation: "We return, repenting, worshipping and praising our Lord.",
};

export const PREP_CHECKLIST = [
  "Sincere repentance, and returning rights or property taken from others.",
  "Settle debts, or make arrangements and inform the creditor.",
  "Write a will.",
  "Seek the pardon of family and those you have wronged.",
  "Ensure the wealth funding the journey is lawful.",
  "Learn the rites before you arrive. This is the single most useful preparation.",
  "A woman travels with a mahram.",
  "Intend Hajj for Allah alone, not for the title or the photographs.",
];

export const MIQAT: SunnahItem = {
  id: "miqat",
  title: "The mawaqit — where ihram begins",
  source: "Bukhari 1524  ·  Sahih (al-Bukhari)",
  arabic: "وَقَّتَ لأَهْلِ الْمَدِينَةِ ذَا الْحُلَيْفَةِ، وَلأَهْلِ الشَّأْمِ الْجُحْفَةَ، وَلأَهْلِ نَجْدٍ قَرْنَ الْمَنَازِلِ، وَلأَهْلِ الْيَمَنِ يَلَمْلَمَ",
  translation: "Ibn ‘Abbas reported that the Messenger of Allah (ﷺ) appointed Dhu’l-Hulayfah for the people of Madinah, al-Juhfah for the people of Sham, Qarn al-Manazil for the people of Najd, and Yalamlam for the people of Yemen. “These are for them and for anyone who comes through them intending Hajj or ‘Umrah. Whoever is within them assumes ihram from where he begins, and the people of Makkah from Makkah.”",
  callout: { tone: "grey", label: "Flying in", text: "Those flying in cross a miqat in the air. Ihram is assumed before crossing it, which in practice means changing and making the intention at the airport of departure or on the aircraft when the crew announce it. Passing the miqat without ihram requires going back or offering a sacrifice." },
};

export const MIQAT_LIST = [
  { name: "Dhu’l-Hulayfah", for: "People of Madinah" },
  { name: "Al-Juhfah", for: "People of Sham" },
  { name: "Qarn al-Manazil", for: "People of Najd" },
  { name: "Yalamlam", for: "People of Yemen" },
];

export const TALBIYAH: SunnahItem = {
  id: "talbiyah",
  title: "The talbiyah",
  source: "Muslim 1218a  ·  Sahih (Muslim)",
  arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ لَبَّيْكَ لاَ شَرِيكَ لَكَ لَبَّيْكَ إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ لاَ شَرِيكَ لَكَ",
  transliteration: "Labbayka ʾllāhumma labbayk. Labbayka lā sharīka laka labbayk. Inna ʾl-ḥamda wa ʾn-niʿmata laka wa ʾl-mulk, lā sharīka lak.",
  translation: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Truly all praise and favour are Yours, and the dominion. You have no partner.",
  narration: "From Jabir’s narration of the Prophet’s ﷺ Hajj.",
  notes: ["Men raise the voice with it; women say it audibly to themselves. It continues from entering ihram until the first pebble is thrown at Jamrat al-‘Aqabah on the tenth for Hajj, or until beginning tawaf for ‘Umrah. Said individually, not chanted in unison by the group — al-Albani lists collective talbiyah as an innovation."],
};

export const PROHIBITIONS: SunnahItem = {
  id: "prohibitions",
  title: "The prohibitions of ihram",
  source: "Bukhari 1542  ·  Sahih (al-Bukhari)",
  arabic: "لاَ يَلْبَسُ الْقُمُصَ وَلاَ الْعَمَائِمَ وَلاَ السَّرَاوِيلاَتِ وَلاَ الْبَرَانِسَ وَلاَ الْخِفَافَ، إِلاَّ أَحَدٌ لاَ يَجِدُ نَعْلَيْنِ فَلْيَلْبَسْ خُفَّيْنِ، وَلْيَقْطَعْهُمَا أَسْفَلَ مِنَ الْكَعْبَيْنِ، وَلاَ تَلْبَسُوا مِنَ الثِّيَابِ شَيْئًا مَسَّهُ الزَّعْفَرَانُ أَوْ وَرْسٌ",
  translation: "A man asked: O Messenger of Allah, what should a muhrim wear? He said: “He should not wear a shirt, turban, trousers, hooded cloak or leather socks — unless he cannot find sandals, in which case he may wear khuffs cut below the ankles. And do not wear any garment touched by saffron or wars.”",
  notes: ["The full list: no stitched fitted clothing for men, no covering the head for men, no perfume after ihram, no cutting hair or nails, no hunting, no marriage contract, no intimacy. Women do not cover the face with a niqab or wear gloves in ihram, though a woman may drape a cloth over her face when men pass, as ‘Aisha described. Unintentional breaches, and those out of ignorance or forgetfulness, carry no penalty."],
};

export const UMAR_STONE: SunnahItem = {
  id: "umar-stone",
  title: "‘Umar at the Black Stone",
  source: "Muslim 1218a  ·  Bukhari 1597  ·  Sahih",
  arabic: "إِنِّي أَعْلَمُ أَنَّكَ حَجَرٌ لاَ تَضُرُّ وَلاَ تَنْفَعُ، وَلَوْلاَ أَنِّي رَأَيْتُ النَّبِيَّ صلى الله عليه وسلم يُقَبِّلُكَ مَا قَبَّلْتُكَ",
  translation: "‘Umar came to the Black Stone and kissed it, then said: “I know that you are a stone that neither harms nor benefits. Had I not seen the Prophet (ﷺ) kissing you, I would not have kissed you.”",
};

export const TWO_CORNERS: SunnahItem = {
  id: "two-corners",
  title: "Between the two corners",
  source: "Abu Dawud 1892  ·  Hasan (al-Albani)",
  arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
  transliteration: "Rabbanā ātinā fi ʾd-dunyā ḥasanatan wa fi ʾl-ākhirati ḥasanatan wa qinā ʿadhāba ʾn-nār.",
  translation: "Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
  narration: "‘Abdullah ibn as-Sa’ib said: I heard the Messenger of Allah (ﷺ) saying between the two corners: “Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.”",
  notes: ["The one du‘a tied to a specific place in tawaf — the stretch between the Yemeni corner and the Black Stone, in each circuit."],
};

export const QURAN_2_125: SunnahItem = {
  id: "quran-2-125",
  title: "The standing place of Abraham",
  source: "Qur’an 2:125",
  arabic: "وَاتَّخِذُوا مِن مَّقَامِ إِبْرَاهِيمَ مُصَلًّى",
  transliteration: "Wa-ttakhidhū min maqāmi Ibrāhīma muṣallā.",
  translation: "And take from the standing place of Abraham a place of prayer.",
};

export const SAFA_OPENING: SunnahItem = {
  id: "safa-opening",
  title: "Sa‘i — beginning at Safa",
  source: "Muslim 1218a  ·  Qur’an 2:158  ·  Sahih (Muslim)",
  arabic: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ\n\nأَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ",
  transliteration: "Inna ʾṣ-Ṣafā wa ʾl-Marwata min shaʿāʾiri ʾllāh. Then: Abdaʾu bimā badaʾa ʾllāhu bih.",
  translation: "Indeed, as-Safa and al-Marwah are among the symbols of Allah. — I begin with what Allah began with.",
  narration: "Jabir reported that when the Prophet (ﷺ) drew near to Safa he recited “Indeed, as-Safa and al-Marwah are among the symbols of Allah,” and said: “I begin with what Allah began with.” So he began with Safa.",
  notes: ["Seven circuits: Safa to Marwah is one, Marwah to Safa is the second, ending at Marwah. Men run between the two green markers; women walk throughout."],
};

export const SAFA_DHIKR: SunnahItem = {
  id: "safa-dhikr",
  title: "The du‘a on Safa and Marwah",
  source: "Muslim 1218a  ·  Sahih (Muslim)",
  arabic: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ أَنْجَزَ وَعْدَهُ وَنَصَرَ عَبْدَهُ وَهَزَمَ الأَحْزَابَ وَحْدَهُ",
  transliteration: "Lā ilāha illa ʾllāhu waḥdahu lā sharīka lah, lahu ʾl-mulku wa lahu ʾl-ḥamdu wa huwa ʿalā kulli shayʾin qadīr. Lā ilāha illa ʾllāhu waḥdah, anjaza waʿdah, wa naṣara ʿabdah, wa hazama ʾl-aḥzāba waḥdah.",
  translation: "There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things competent. There is no god but Allah alone. He fulfilled His promise, gave victory to His servant, and defeated the confederates alone.",
  narration: "Jabir reported that the Prophet (ﷺ) climbed Safa until he could see the House, faced the qiblah, declared the oneness of Allah and magnified Him, and said this — repeating it three times, making du‘a in between. He then did the same on Marwah.",
  notes: ["Said three times on Safa and again on Marwah, facing the qiblah with hands raised, with personal du‘a in between. Ascending only enough to see the Ka‘bah; climbing higher onto the structure is listed among the innovations."],
};

export const BUKHARI_1728: SunnahItem = {
  id: "bukhari-1728",
  title: "Ending ‘Umrah — halq or taqsir",
  source: "Bukhari 1728  ·  Sahih (al-Bukhari)",
  arabic: "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ . قَالُوا وَلِلْمُقَصِّرِينَ . قَالَ اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ . قَالُوا وَلِلْمُقَصِّرِينَ . قَالَهَا ثَلاَثًا . قَالَ وَلِلْمُقَصِّرِينَ",
  translation: "The Messenger of Allah (ﷺ) said: “O Allah, forgive those who shave.” They said: And those who shorten? He said: “O Allah, forgive those who shave.” They said: And those who shorten? He said it three times, then said: “And those who shorten.”",
  notes: ["Shaving is better, and he asked forgiveness for them three times before including those who shorten. If shortening, hair is taken from all around the head, not a few strands. Women shorten only — a fingertip’s length from the end of the hair. With this, ‘Umrah is complete and ihram ends."],
};

export const TIRMIDHI_889: SunnahItem = {
  id: "tirmidhi-889",
  title: "The day Hajj is",
  source: "Tirmidhi 889  ·  Sahih (Darussalam)",
  arabic: "الْحَجُّ عَرَفَةُ مَنْ جَاءَ لَيْلَةَ جَمْعٍ قَبْلَ طُلُوعِ الْفَجْرِ فَقَدْ أَدْرَكَ الْحَجَّ",
  transliteration: "Al-ḥajju ʿArafah. Man jāʾa laylata Jamʿin qabla ṭulūʿi ʾl-fajri fa-qad adraka ʾl-ḥajj.",
  translation: "Hajj is ‘Arafah. Whoever arrives on the night of Jam‘ (Muzdalifah) before the break of dawn has caught the Hajj.",
  narration: "‘Abdur-Rahman ibn Ya‘mar reported that people from Najd came to the Messenger of Allah (ﷺ) while he was at ‘Arafah and asked him, so he ordered a caller to announce this.",
};

export const ARAFAH_DHIKR: SunnahItem = {
  id: "arafah-dhikr",
  title: "The dhikr of ‘Arafah",
  source: "Tirmidhi 3585  ·  Da'if (Darussalam)  ·  widely acted upon",
  arabic: "خَيْرُ الدُّعَاءِ دُعَاءُ يَوْمِ عَرَفَةَ وَخَيْرُ مَا قُلْتُ أَنَا وَالنَّبِيُّونَ مِنْ قَبْلِي لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  transliteration: "Lā ilāha illa ʾllāhu waḥdahu lā sharīka lah, lahu ʾl-mulku wa lahu ʾl-ḥamdu wa huwa ʿalā kulli shayʾin qadīr.",
  translation: "The best supplication is the supplication of the Day of ‘Arafah, and the best of what I and the Prophets before me have said is: There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things competent.",
  notes: ["The dhikr itself is established beyond doubt — this tahlil appears throughout the authentic collections. What carries a weak grading on this page is the specific narration tying it to ‘Arafah as “the best supplication.” It is acted upon very widely, and nothing is lost by saying it, but it should not be presented as though it were unanimously graded sahih."],
  callout: { tone: "amber", label: "Grading note", text: "Darussalam grades this narration da‘if on the sunnah.com page. Scholars have differed over its chain. The tahlil itself is sahih by other routes; it is only the “best supplication of ‘Arafah” framing that rests on this chain." },
};

export const MUSLIM_1327: SunnahItem = {
  id: "muslim-1327",
  title: "Tawaf al-Wada‘",
  source: "Muslim 1327  ·  Sahih (Muslim)",
  arabic: "لاَ يَنْفِرَنَّ أَحَدٌ حَتَّى يَكُونَ آخِرُ عَهْدِهِ بِالْبَيْتِ",
  transliteration: "Lā yanfiranna aḥadun ḥattā yakūna ākhiru ʿahdihi bi-ʾl-bayt.",
  translation: "None of you should depart until his last act is at the House.",
  narration: "Ibn ‘Abbas reported that the people were ordered to make their last act one at the House, except that it was waived for the menstruating woman.",
};

export const BUKHARI_1189: SunnahItem = {
  id: "bukhari-1189",
  title: "The three masjids",
  source: "Bukhari 1189  ·  Sahih (al-Bukhari)",
  arabic: "لاَ تُشَدُّ الرِّحَالُ إِلاَّ إِلَى ثَلاَثَةِ مَسَاجِدَ الْمَسْجِدِ الْحَرَامِ، وَمَسْجِدِ الرَّسُولِ صلى الله عليه وسلم وَمَسْجِدِ الأَقْصَى",
  transliteration: "Lā tushaddu ʾr-riḥālu illā ilā thalāthati masājid: al-Masjidi ʾl-Ḥarām, wa masjidi ʾr-Rasūli ﷺ, wa masjidi ʾl-Aqṣā.",
  translation: "Do not set out on a journey except to three masjids: al-Masjid al-Haram, the Masjid of the Messenger (ﷺ), and al-Masjid al-Aqsa.",
  notes: ["Visiting Madinah is not a rite of Hajj and has no connection to its validity. The journey is made to the Masjid of the Prophet ﷺ — that is what the hadith permits — and once there, one gives salam at his grave and at the graves of Abu Bakr and ‘Umar, and visits Quba and al-Baqi‘. The distinction matters: the journey is to the masjid, not to the grave."],
};

export const BUKHARI_1520: SunnahItem = {
  id: "bukhari-1520",
  title: "The best jihad",
  source: "Bukhari 1520  ·  Sahih (al-Bukhari)",
  arabic: "يَا رَسُولَ اللَّهِ، نَرَى الْجِهَادَ أَفْضَلَ الْعَمَلِ، أَفَلاَ نُجَاهِدُ قَالَ لاَ، لَكِنَّ أَفْضَلَ الْجِهَادِ حَجٌّ مَبْرُورٌ",
  translation: "‘Aisha said: O Messenger of Allah, we consider jihad the best of deeds — should we not go out to fight? He said: “No. But the best jihad is an accepted Hajj.”",
};

export type Station = {
  id: string;
  name: string;
  subtitle: string;
  location: string;
  source?: string;
  intro?: string;
  checklist: string[];
  items: SunnahItem[];
  notes?: string[];
  notSunnah?: string;
  counter?: "tawaf" | "sai" | "wada";
  miqat?: boolean;
  hajj?: boolean;
  day?: string;
};

export const STATIONS: Station[] = [
  {
    id: "ihram", name: "Ihram", subtitle: "Entering the sacred state", location: "At the Miqat", source: "Muslim 1218a",
    miqat: true,
    checklist: [
      "Trim nails, remove underarm and pubic hair, trim the moustache — done before, since these become prohibited.",
      "Ghusl. The Prophet ﷺ did this at Dhu’l-Hulayfah, and it is recommended even for a menstruating woman, who enters ihram and does everything except tawaf.",
      "Men: two unstitched white cloths, izar and rida’. Women: ordinary modest clothing, no set colour, face and hands uncovered in ihram.",
      "Perfume on the body — not the garments — before entering ihram. ‘Aisha said she used to perfume him before he entered ihram.",
      "Pray two rak‘ahs if it is a time of prayer, otherwise make the intention without a dedicated prayer.",
      "Make the intention in the heart and begin the talbiyah.",
    ],
    items: [TALBIYAH, PROHIBITIONS],
    notSunnah: "Pronouncing the intention aloud is an innovation — al-Albani lists “making the intention by words” among the additions. The intention is in the heart. What is said aloud is the talbiyah.",
  },
  {
    id: "tawaf", name: "Tawaf", subtitle: "Seven circuits around the House", location: "At the Ka‘bah", source: "Muslim 1218a · Bukhari 1597",
    intro: "Seven circuits, anticlockwise, beginning and ending at the Black Stone.",
    counter: "tawaf",
    checklist: [
      "Face the Black Stone and say Allahu akbar. Kiss it if you can reach it without harming anyone; otherwise touch it and kiss your hand; otherwise point to it from a distance and say Allahu akbar — do not kiss your hand in that case, and do not fight the crowd for it.",
      "Men only, and only in the first three circuits of the arrival tawaf: raml, walking briskly with short steps.",
      "Men only, throughout this tawaf: idtiba‘, passing the rida’ under the right armpit.",
      "Touch the Yemeni corner with the right hand if you can, without crowding, and without kissing it.",
      "Between the Yemeni corner and the Black Stone say the du‘a below.",
      "Otherwise say whatever du‘a and dhikr you wish. No specific du‘a is prescribed for any particular circuit.",
    ],
    items: [TWO_CORNERS, UMAR_STONE],
    notSunnah: "Assigning a set du‘a to each of the seven circuits; wiping the walls or covering of the Ka‘bah; kissing the Yemeni corner; raising both hands as in prayer when pointing to the Black Stone; reciting collectively behind a guide. Al-Albani lists each of these among the innovations of tawaf.",
  },
  {
    id: "maqam", name: "Maqam Ibrahim & Zamzam", subtitle: "After tawaf", location: "Behind Maqam Ibrahim", source: "Qur’an 2:125",
    checklist: [
      "Pray two rak‘ahs behind Maqam Ibrahim if possible, or anywhere in the Haram if it is crowded. The Prophet ﷺ recited al-Kafirun in the first and al-Ikhlas in the second.",
      "Drink Zamzam. The Prophet ﷺ drank it and poured it over his head.",
      "Return to the Black Stone and touch it if you can, then proceed to Safa.",
    ],
    items: [QURAN_2_125],
    notSunnah: "Touching or wiping the Maqam Ibrahim itself, or praying inside the enclosure when it causes harm to those making tawaf.",
  },
  {
    id: "sai", name: "Sa‘i", subtitle: "Between Safa and Marwah", location: "Safa → Marwah", source: "Muslim 1218a · Qur’an 2:158",
    counter: "sai",
    checklist: [
      "Begin at Safa, ascending only enough to see the Ka‘bah.",
      "Face the qiblah with hands raised and say the du‘a below three times, with personal du‘a in between.",
      "Walk to Marwah. Men run between the two green markers; women walk throughout.",
      "On Marwah, do the same: the du‘a three times, with personal du‘a in between.",
      "Seven circuits: Safa to Marwah is one, Marwah to Safa is the second, ending at Marwah.",
    ],
    items: [SAFA_OPENING, SAFA_DHIKR],
    notSunnah: "Climbing higher onto the structure than needed to see the Ka‘bah is listed among the innovations.",
  },
  {
    id: "halq", name: "Halq or Taqsir", subtitle: "Completing ‘Umrah", location: "End of ‘Umrah", source: "Bukhari 1728",
    checklist: [
      "Men: shave, which is better, or shorten.",
      "If shortening, hair is taken from all around the head, not a few strands.",
      "Women shorten only — a fingertip’s length from the end of the hair.",
    ],
    items: [BUKHARI_1728],
  },
  {
    id: "tarwiyah", hajj: true, day: "8th", name: "Yawm at-Tarwiyah", subtitle: "8th Dhul-Hijjah", location: "Mina", source: "Muslim 1218a",
    checklist: [
      "Enter ihram again from your accommodation in Makkah if you did ‘Umrah first (tamattu‘).",
      "Resume the talbiyah.",
      "Go to Mina before Zuhr.",
      "Pray Zuhr, ‘Asr, Maghrib, ‘Isha and Fajr in Mina — each at its own time, the four-rak‘ah prayers shortened to two, not combined.",
      "Stay overnight in Mina.",
    ],
    items: [],
  },
  {
    id: "arafah", hajj: true, day: "9th", name: "Yawm ‘Arafah", subtitle: "9th Dhul-Hijjah — the day Hajj is", location: "‘Arafah", source: "Tirmidhi 889",
    checklist: [
      "After sunrise, travel from Mina to ‘Arafah.",
      "Pray Zuhr and ‘Asr combined and shortened at the time of Zuhr.",
      "Ensure you are within the boundaries of ‘Arafah — check the signs. Standing outside them invalidates the Hajj.",
      "Face the qiblah, raise the hands, and make du‘a until sunset. This is the point of the entire journey.",
      "Do not fast on this day while at ‘Arafah; the Prophet ﷺ stood there not fasting.",
      "Depart for Muzdalifah only after sunset, with calmness.",
    ],
    items: [TIRMIDHI_889, ARAFAH_DHIKR],
    notSunnah: "Climbing Jabal ar-Rahmah or praying there; touching or seeking blessing from the pillar; lighting candles; standing at ‘Arafah on the eighth; facing the mountain rather than the qiblah; spending the day silent instead of supplicating. All are listed among the innovations of ‘Arafah.",
  },
  {
    id: "muzdalifah", hajj: true, day: "Night of 10th", name: "Muzdalifah", subtitle: "Night of the 10th", location: "Muzdalifah", source: "Muslim 1218a",
    checklist: [
      "Arrive and pray Maghrib and ‘Isha combined at the time of ‘Isha, with one adhan and two iqamahs.",
      "Sleep. The Prophet ﷺ did not pray voluntary prayers through this night.",
      "Pray Fajr early.",
      "Stand at al-Mash‘ar al-Haram facing the qiblah, making du‘a and takbir until it is almost fully light.",
      "Depart for Mina before sunrise.",
    ],
    notes: ["The weak, women and children may leave after midnight."],
    items: [],
    notSunnah: "Washing the pebbles; believing the pebbles must be collected specifically at Muzdalifah — they may be taken from anywhere; delaying Maghrib while searching for stones; dismounting to enter Muzdalifah on foot out of reverence.",
  },
  {
    id: "nahr", hajj: true, day: "10th", name: "Yawm an-Nahr", subtitle: "10th — the busiest day", location: "Mina", source: "Muslim 1218a",
    intro: "Four acts, in this order where possible — though the Prophet ﷺ was asked about doing them out of order and each time replied, “Do it, and there is no harm.”",
    checklist: [
      "1. Stone Jamrat al-‘Aqabah with seven pebbles, saying Allahu akbar with each. Stop the talbiyah at the first pebble.",
      "2. Slaughter the hady, if you are performing tamattu‘ or qiran.",
      "3. Shave or shorten. After this, everything becomes permitted except intimacy.",
      "4. Tawaf al-Ifadah, followed by sa‘i for those performing tamattu‘. After this, everything is permitted including intimacy.",
      "Return to Mina for the night.",
    ],
    items: [],
    notSunnah: "Believing you are stoning actual devils; throwing shoes, sandals or large objects; washing the pebbles beforehand; insulting or shouting at the pillars; particular finger positions when throwing. The pebbles are small, the size of a chickpea, and the act is a symbol of obedience and remembrance of Allah.",
  },
  {
    id: "tashriq", hajj: true, day: "11th–13th", name: "Days of Tashriq", subtitle: "11th, 12th and 13th", location: "Mina", source: "Tirmidhi 889",
    checklist: [
      "Stay overnight in Mina.",
      "Each day after Zuhr, stone all three jamarat in order: the small, the middle, then al-‘Aqabah — seven pebbles each, saying Allahu akbar with every throw.",
      "After the small jamrah and after the middle one, move aside, face the qiblah and make a long du‘a. There is no du‘a after the third.",
      "Say the takbir abundantly; these are the days Allah is remembered.",
    ],
    notes: ["You may leave after the 12th if you depart Mina before sunset — “whoever hastens in two days, there is no sin upon him.” Otherwise stay for the 13th."],
    items: [],
  },
  {
    id: "wada", hajj: true, day: "Farewell", name: "Tawaf al-Wada‘", subtitle: "Before leaving Makkah", location: "At the Ka‘bah — your last act in Makkah", source: "Muslim 1327",
    counter: "wada",
    checklist: [
      "Seven circuits, no sa‘i, no raml, no idtiba‘.",
      "It is the last thing done in Makkah.",
    ],
    notes: ["A menstruating woman is exempt and departs without it."],
    items: [MUSLIM_1327],
    notSunnah: "Walking backwards out of the Haram to keep the Ka‘bah in view; standing at the door of the mosque to make a farewell du‘a; weeping performatively for the crowd.",
  },
];

export const MADINAH_NOT_SUNNAH = "Travelling specifically to visit the grave rather than the masjid; facing the grave when supplicating instead of the qiblah; asking the Prophet ﷺ for needs or for intercession; wiping the grille or seeking blessing from it; visiting the grave after every prayer; and the notion that one must pray forty consecutive prayers in the masjid to earn a guarantee. Al-Albani lists each of these among the innovations of the visit.";

export const MADINAH_TODO = [
  "Pray in the Masjid of the Prophet ﷺ",
  "Give salam at his grave and at the graves of Abu Bakr and ‘Umar",
  "Visit Quba",
  "Visit al-Baqi‘",
];

export const ACCEPTED_HAJJ = "The salaf spoke of the sign of acceptance being that a person’s state after is better than before — that the worship continues, the sins left behind stay behind, and the attachment to the dunya is looser than it was. A Hajj followed immediately by a return to what was abandoned is the one to worry about. Hajj mabrur is defined by what it leaves behind in a person, not by the certificate or the photographs.";

export const AFTER_RETURN = `Taking the title “Hajji” as an honorific, decorating the house to mark it, holding celebrations for the returning pilgrim, or announcing it for reputation. None of this is from the Prophet ﷺ or the Companions, and some of it works directly against the sincerity the journey was meant to build. What is reported on returning is the du‘a of return — ${RETURN_DUA_AR} — and praying two rak‘ahs in the masjid on arriving home.`;

export const WOMEN_TEXT = "A menstruating woman does everything in Hajj except tawaf, on the Prophet’s ﷺ own instruction to ‘Aisha at Sarif. She enters ihram, stands at ‘Arafah, stays at Muzdalifah, stones, and performs sa‘i. She delays tawaf until she is pure, and is exempt from the farewell tawaf entirely.";

export const WOMEN_GROUPS: { title: string; items: string[] }[] = [
  { title: "During menstruation", items: ["She enters ihram", "She stands at ‘Arafah", "She stays at Muzdalifah", "She stones the jamarat", "She performs sa‘i", "She delays tawaf until she is pure", "She is exempt from the farewell tawaf entirely"] },
  { title: "Ihram", items: ["Ordinary modest clothing, no set colour, face and hands uncovered in ihram", "She does not cover the face with a niqab or wear gloves, though she may drape a cloth over her face when men pass, as ‘Aisha described", "Ghusl is recommended even for a menstruating woman"] },
  { title: "Talbiyah", items: ["Women say it audibly to themselves"] },
  { title: "Sa‘i", items: ["Women walk throughout"] },
  { title: "Hair", items: ["Women shorten only — a fingertip’s length from the end of the hair"] },
];

export const INNOVATIONS: { place: string; text: string }[] = [
  { place: "At ihram", text: "Pronouncing the intention aloud; collective talbiyah in unison." },
  { place: "At tawaf", text: STATIONS[1].notSunnah! },
  { place: "At Maqam Ibrahim", text: STATIONS[2].notSunnah! },
  { place: "At Safa and Marwah", text: STATIONS[3].notSunnah! },
  { place: "At ‘Arafah", text: STATIONS[6].notSunnah! },
  { place: "At Muzdalifah", text: STATIONS[7].notSunnah! },
  { place: "At the jamarat", text: STATIONS[8].notSunnah! },
  { place: "At departure", text: STATIONS[10].notSunnah! },
  { place: "In Madinah", text: MADINAH_NOT_SUNNAH },
  { place: "After returning", text: AFTER_RETURN },
];

export const QUICK_DUAS = [TRAVEL_DUA, TALBIYAH, TWO_CORNERS, SAFA_DHIKR, ARAFAH_DHIKR, RETURN_DUA];
