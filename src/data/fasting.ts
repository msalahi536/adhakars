// Fasting Companion content. Every narration, du‘a and note below is copied
// from the "Fasting Companion" source document. Do not reword.
import type { SunnahItem } from "@/data/period-sunnah";

export const BUKHARI_2014: SunnahItem = {
  id: "bukhari-2014",
  title: "What fasting Ramadan earns",
  source: "Bukhari 2014 · Sahih (al-Bukhari)",
  arabic: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ، وَمَنْ قَامَ لَيْلَةَ الْقَدْرِ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ",
  transliteration: "Man ṣāma Ramaḍāna īmānan wa-ḥtisāban ghufira lahu mā taqaddama min dhanbih. Wa man qāma laylata ʾl-qadri īmānan wa-ḥtisāban ghufira lahu mā taqaddama min dhanbih.",
  translation: "Whoever fasts Ramadan out of faith and seeking reward, his past sins are forgiven. And whoever stands in prayer on Laylat al-Qadr out of faith and seeking reward, his past sins are forgiven.",
  narration: "Narrated Abu Hurairah from the Prophet (ﷺ).",
  notes: ["Two conditions: īmān and iḥtisāb — belief, and doing it for the reward from Allah rather than habit, culture or the group. A tracker can quietly reinforce the second by keeping the focus on the record between a person and Allah rather than on streaks shown to others."],
};

export const BUKHARI_1909: SunnahItem = {
  id: "bukhari-1909",
  title: "Starting and ending the month",
  source: "Bukhari 1909 · Sahih (al-Bukhari)",
  arabic: "صُومُوا لِرُؤْيَتِهِ، وَأَفْطِرُوا لِرُؤْيَتِهِ، فَإِنْ غُبِّيَ عَلَيْكُمْ فَأَكْمِلُوا عِدَّةَ شَعْبَانَ ثَلاَثِينَ",
  transliteration: "Ṣūmū li-ruʾyatihi wa afṭirū li-ruʾyatih. Fa-in ghubbiya ʿalaykum fa-akmilū ʿiddata Shaʿbāna thalāthīn.",
  translation: "Fast when you see it and break your fast when you see it. If it is obscured from you, then complete thirty days of Sha‘ban.",
  narration: "Narrated Abu Hurairah from the Prophet (ﷺ).",
  notes: ["The month is tied to sighting, with a thirty-day completion as the fallback."],
};

export const MON_THU: SunnahItem = {
  id: "mon-thu",
  title: "Monday and Thursday — weekly",
  source: "Tirmidhi 747 · Muslim 1162b · Hasan (Darussalam) · Sahih (Muslim)",
  arabic: "تُعْرَضُ الأَعْمَالُ يَوْمَ الاِثْنَيْنِ وَالْخَمِيسِ فَأُحِبُّ أَنْ يُعْرَضَ عَمَلِي وَأَنَا صَائِمٌ\nذَاكَ يَوْمٌ وُلِدْتُ فِيهِ وَيَوْمٌ بُعِثْتُ أَوْ أُنْزِلَ عَلَىَّ فِيهِ",
  transliteration: "Tuʿraḍu ʾl-aʿmālu yawma ʾl-ithnayni wa ʾl-khamīs, fa-uḥibbu an yuʿraḍa ʿamalī wa anā ṣāʾim. — Dhāka yawmun wulidtu fīh, wa yawmun buʿithtu aw unzila ʿalayya fīh.",
  translation: "Deeds are presented on Monday and Thursday, and I love that my deeds be presented while I am fasting. — [On Monday:] That is a day I was born, and a day I was sent, or on which revelation came to me.",
  narration: "The first from Abu Hurairah. The second from Abu Qatadah, when the Prophet (ﷺ) was asked about fasting on Monday.",
  notes: ["The easiest recurring fast — no Hijri conversion needed."],
};

export const BEED: SunnahItem = {
  id: "beed",
  title: "Ayyam al-Beed — the 13th, 14th and 15th",
  source: "Nasa'i 2424 · Hasan (Darussalam)",
  arabic: "إِذَا صُمْتَ شَيْئًا مِنَ الشَّهْرِ فَصُمْ ثَلاَثَ عَشْرَةَ وَأَرْبَعَ عَشْرَةَ وَخَمْسَ عَشْرَةَ",
  transliteration: "Idhā ṣumta shayʾan mina ʾsh-shahri fa-ṣum thalātha ʿashrata wa arbaʿa ʿashrata wa khamsa ʿashrah.",
  translation: "If you fast any part of the month, then fast the thirteenth, the fourteenth and the fifteenth.",
  narration: "Said by the Prophet (ﷺ) to Abu Dharr.",
  notes: ["Called the white days because the moon is full and the nights are bright."],
};

export const THREE_DAYS: SunnahItem = {
  id: "three-days",
  title: "Three days a month — equal to fasting always",
  source: "Muslim 1162a · Sahih (Muslim)",
  translation: "Fasting three days of every month, and Ramadan every year, is perpetual fasting.",
  narration: "Abu Qatadah reported that ‘Umar asked the Prophet (ﷺ) about various patterns of fasting, and among his answers was this.",
  notes: ["The three days of Ayyam al-Beed fulfil this. The reward is calculated on the principle that a good deed is multiplied tenfold — three days becomes thirty, which is the whole month."],
};

export const ASHURA: SunnahItem = {
  id: "ashura",
  title: "‘Ashura — 10th Muharram, with the 9th",
  source: "Muslim 1162b · Sahih (Muslim)",
  arabic: "يُكَفِّرُ السَّنَةَ الْمَاضِيَةَ",
  transliteration: "Yukaffiru ʾs-sanata ʾl-māḍiyah.",
  translation: "It expiates the previous year.",
  narration: "The Prophet (ﷺ) was asked about fasting the day of ‘Ashura and said it expiates the year that has passed.",
  notes: ["It is established that he intended to fast the ninth alongside it, saying that if he lived to the following year he would fast the ninth — to differ from the practice of the People of the Book."],
};

export const ARAFAH: SunnahItem = {
  id: "arafah",
  title: "‘Arafah — 9th Dhul-Hijjah, for those not on Hajj",
  source: "Muslim 1162b · Sahih (Muslim)",
  arabic: "يُكَفِّرُ السَّنَةَ الْمَاضِيَةَ وَالْبَاقِيَةَ",
  transliteration: "Yukaffiru ʾs-sanata ʾl-māḍiyata wa ʾl-bāqiyah.",
  translation: "It expiates the year that has passed and the year to come.",
  narration: "The Prophet (ﷺ) was asked about fasting the day of ‘Arafah and said this.",
  notes: ["The strongest single-day reward in the year. It is for those not performing Hajj — the pilgrim at ‘Arafah does not fast, since the Prophet ﷺ stood there not fasting."],
};

export const SHAWWAL: SunnahItem = {
  id: "shawwal",
  title: "Six days of Shawwal",
  source: "Muslim 1164a · Sahih (Muslim)",
  arabic: "مَنْ صَامَ رَمَضَانَ ثُمَّ أَتْبَعَهُ سِتًّا مِنْ شَوَّالٍ كَانَ كَصِيَامِ الدَّهْرِ",
  transliteration: "Man ṣāma Ramaḍāna thumma atbaʿahu sittan min Shawwālin kāna ka-ṣiyāmi ʾd-dahr.",
  translation: "Whoever fasts Ramadan then follows it with six days of Shawwal, it is as though he fasted all time.",
  narration: "Narrated Abu Ayyub al-Ansari from the Prophet (ﷺ).",
  notes: ["Any six days in Shawwal, consecutive or scattered — no sequence is specified. They are not fasted on ‘Eid al-Fitr itself. Those with missed Ramadan days to make up should generally complete the obligation first, since the wording ties the reward to having fasted Ramadan."],
};

export const MUHARRAM: SunnahItem = {
  id: "muharram",
  title: "Muharram — the best month for voluntary fasting",
  source: "Muslim 1163 · Sahih (Muslim)",
  arabic: "أَفْضَلُ الصِّيَامِ بَعْدَ رَمَضَانَ شَهْرُ اللَّهِ الْمُحَرَّمُ وَأَفْضَلُ الصَّلاَةِ بَعْدَ الْفَرِيضَةِ صَلاَةُ اللَّيْلِ",
  transliteration: "Afḍalu ʾṣ-ṣiyāmi baʿda Ramaḍāna shahru ʾllāhi ʾl-Muḥarram, wa afḍalu ʾṣ-ṣalāti baʿda ʾl-farīḍati ṣalātu ʾl-layl.",
  translation: "The best fasting after Ramadan is the month of Allah, Muharram; and the best prayer after the obligatory is the night prayer.",
  narration: "Narrated Abu Hurairah from the Prophet (ﷺ).",
  notes: ["Any fasting in Muharram, not only ‘Ashura."],
};

export const DAWUD: SunnahItem = {
  id: "dawud",
  title: "The fast of Dawud — the most beloved pattern",
  source: "Bukhari 1131 · Sahih (al-Bukhari)",
  arabic: "أَحَبُّ الصَّلاَةِ إِلَى اللَّهِ صَلاَةُ دَاوُدَ عَلَيْهِ السَّلاَمُ وَأَحَبُّ الصِّيَامِ إِلَى اللَّهِ صِيَامُ دَاوُدَ، وَكَانَ يَنَامُ نِصْفَ اللَّيْلِ وَيَقُومُ ثُلُثَهُ وَيَنَامُ سُدُسَهُ، وَيَصُومُ يَوْمًا وَيُفْطِرُ يَوْمًا",
  transliteration: "Aḥabbu ʾṣ-ṣiyāmi ila ʾllāhi ṣiyāmu Dāwūd… yaṣūmu yawman wa yufṭiru yawman.",
  translation: "The most beloved prayer to Allah is the prayer of Dawud, and the most beloved fasting to Allah is the fasting of Dawud. He would sleep half the night, stand a third of it, sleep a sixth, and he would fast a day and break a day.",
  narration: "The Prophet (ﷺ) said this to ‘Abdullah ibn ‘Amr ibn al-‘As.",
  notes: ["Alternate days. Described as the most beloved pattern, and also as the ceiling — in the same conversation the Prophet ﷺ refused to let ‘Abdullah fast more than this."],
};

export const EIDS_TEXT = "Fasting is forbidden on ‘Eid al-Fitr (1 Shawwal) and ‘Eid al-Adha (10 Dhul-Hijjah). This is by consensus.";

export const TASHRIQ: SunnahItem = {
  id: "tashriq",
  title: "The days of Tashriq — 11th, 12th, 13th Dhul-Hijjah",
  source: "Muslim 1141 · Sahih (Muslim)",
  arabic: "أَيَّامُ التَّشْرِيقِ أَيَّامُ أَكْلٍ وَشُرْبٍ",
  transliteration: "Ayyāmu ʾt-tashrīqi ayyāmu aklin wa shurb.",
  translation: "The days of Tashriq are days of eating and drinking.",
  narration: "Nubayshah al-Hudhali reported that the Messenger of Allah (ﷺ) said this.",
  notes: ["The 13th of Dhul-Hijjah is both a white day and a day of Tashriq — and the Tashriq ruling wins. In Dhul-Hijjah, the white days effectively do not apply. The only exception scholars mention is for a pilgrim performing tamattu‘ who cannot find a hady, who may fast them as part of the required fast."],
};

export const FRIDAY: SunnahItem = {
  id: "friday",
  title: "Friday alone — disliked",
  source: "Bukhari 1985 · Sahih (al-Bukhari)",
  arabic: "لاَ يَصُومَنَّ أَحَدُكُمْ يَوْمَ الْجُمُعَةِ، إِلاَّ يَوْمًا قَبْلَهُ أَوْ بَعْدَهُ",
  transliteration: "Lā yaṣūmanna aḥadukum yawma ʾl-jumuʿah, illā yawman qablahu aw baʿdah.",
  translation: "None of you should fast on Friday unless he fasts a day before it or a day after it.",
  narration: "Narrated Abu Hurairah from the Prophet (ﷺ).",
  notes: ["Singling out Friday is what is disliked. If Friday falls within Ayyam al-Beed, or is ‘Arafah or ‘Ashura, there is no issue at all — it is not being singled out for its own sake."],
};

export const DOUBT_TEXT = "Fasting the 30th of Sha‘ban as a precaution, intending it might be Ramadan, is not done. The month begins with sighting or by completing thirty days of Sha‘ban. Someone with an existing habit — a regular Monday or Thursday fast, for instance — continues it normally.";

export const SUHOOR: SunnahItem = {
  id: "suhoor",
  title: "Suhoor",
  source: "Bukhari 1923 · Sahih (al-Bukhari)",
  arabic: "تَسَحَّرُوا فَإِنَّ فِي السَّحُورِ بَرَكَةً",
  transliteration: "Tasaḥḥarū, fa-inna fi ʾs-saḥūri barakah.",
  translation: "Take suhoor, for in suhoor there is blessing.",
  narration: "Narrated Anas ibn Malik from the Prophet (ﷺ).",
  notes: ["The Sunnah is to delay it close to Fajr. The window ends at the start of Fajr — the same time the app already computes for the Fajr prayer."],
};

export const IMSAK_TEXT = "Stopping 10–15 minutes before Fajr as a precaution is an innovation. Shaykh Ibn ‘Uthaymin: “This is a form of innovation, and there is no basis for it in the Sunnah. Indeed, the Sunnah contradicts it.” The Qur’an permits eating until dawn becomes distinct, and Bilal called the adhan at night so that people would eat and drink until Ibn Umm Maktum’s adhan at actual Fajr.";

export const IFTAR: SunnahItem = {
  id: "iftar",
  title: "Hastening iftar",
  source: "Bukhari 1957 · Sahih (al-Bukhari)",
  arabic: "لاَ يَزَالُ النَّاسُ بِخَيْرٍ مَا عَجَّلُوا الْفِطْرَ",
  transliteration: "Lā yazālu ʾn-nāsu bi-khayrin mā ʿajjalu ʾl-fiṭr.",
  translation: "The people will remain upon good as long as they hasten the breaking of the fast.",
  narration: "Narrated Sahl ibn Sa‘d from the Prophet (ﷺ).",
  notes: ["Break at Maghrib without delay. The Sunnah is fresh dates, or dry dates, or water if neither is available."],
};

export const IFTAR_DUA: SunnahItem = {
  id: "iftar-dua",
  title: "The du‘a at iftar",
  source: "Abu Dawud 2357 · Hasan (al-Albani)",
  arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ",
  transliteration: "Dhahaba ʾẓ-ẓamaʾu wa-btallati ʾl-ʿurūqu wa thabata ʾl-ajru in shāʾa ʾllāh.",
  translation: "The thirst has gone, the veins are moistened, and the reward is certain, if Allah wills.",
  narration: "Ibn ‘Umar reported that when the Prophet (ﷺ) broke his fast he would say this.",
  notes: ["This is the authentic one, graded hasan."],
};

export const WEAK_IFTAR_TEXT = "“Allāhumma laka ṣumtu wa ʿalā rizqika afṭartu” is Sunan Abi Dawud 2358 and is graded da‘if by al-Albani. It is printed on almost every iftar card and built into most apps.";

export const INTENTION: SunnahItem = {
  id: "intention",
  title: "Intention",
  source: "Muslim 1154a · Sahih (Muslim)",
  arabic: "يَا عَائِشَةُ هَلْ عِنْدَكُمْ شَىْءٌ . قَالَتْ فَقُلْتُ يَا رَسُولَ اللَّهِ مَا عِنْدَنَا شَىْءٌ . قَالَ فَإِنِّي صَائِمٌ",
  translation: "‘Aisha reported that the Messenger of Allah (ﷺ) said to her one day: “O ‘Aisha, do you have anything?” She said: O Messenger of Allah, we have nothing. He said: “Then I am fasting.”",
  notes: ["For a voluntary fast the intention may be formed during the day, as long as nothing has been eaten or drunk since dawn. For an obligatory fast — Ramadan, or making up a missed day — the intention must be formed before Fajr."],
  callout: { tone: "grey", label: "No spoken formula", text: "The intention is in the heart. “Nawaytu ṣawma ghadin…” is not established from the Prophet ﷺ and should not be presented as a required step." },
};

export const FORGETFUL: SunnahItem = {
  id: "forgetful",
  title: "What does not break the fast",
  source: "Bukhari 1933 · Sahih (al-Bukhari)",
  arabic: "إِذَا نَسِيَ فَأَكَلَ وَشَرِبَ فَلْيُتِمَّ صَوْمَهُ، فَإِنَّمَا أَطْعَمَهُ اللَّهُ وَسَقَاهُ",
  transliteration: "Idhā nasiya fa-akala wa shariba fal-yutimma ṣawmah, fa-innamā aṭʿamahu ʾllāhu wa saqāh.",
  translation: "If he forgets and eats or drinks, let him complete his fast — for it was Allah who fed him and gave him drink.",
  narration: "Narrated Abu Hurairah from the Prophet (ﷺ).",
  notes: ["Eating or drinking forgetfully does not break the fast and nothing is owed."],
};

export const DOES_NOT_BREAK = [
  "Eating or drinking forgetfully",
  "Swallowing saliva",
  "The miswak or toothbrush",
  "Rinsing the mouth",
  "Tasting food without swallowing",
  "Bathing or swimming",
  "Unintentional vomiting",
  "A wet dream",
  "Blood tests and non-nutritive injections",
  "Kissing a spouse for one who can control himself",
];

export const EXCUSED_NOTE = "A broken streak after a legitimate excuse — illness, travel, menstruation — can make a person feel they have failed at something Allah exempted them from. These days are marked as excused without breaking anything, and recorded as days owed for later.";

export const ARAFAH_DIFF_NOTE = "‘Arafah follows the day the pilgrims stand at ‘Arafah, fixed by the Saudi declaration; scholars differ on whether a non-pilgrim follows that date or their own local 9 Dhul-Hijjah.";

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi‘ al-Awwal", "Rabi‘ al-Thani", "Jumada al-Ula", "Jumada al-Akhirah",
  "Rajab", "Sha‘ban", "Ramadan", "Shawwal", "Dhul-Qa‘dah", "Dhul-Hijjah",
];
