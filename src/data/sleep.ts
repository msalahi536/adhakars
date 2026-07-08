import type { Dhikr } from "./adhkar";
import type { SalahItem } from "./salah";

// ============ SLEEP ADHKAR ============
const sleepDisclaimer: Dhikr = {
  id: "sleep_disclaimer",
  title: "Physical Sunnan Before You Lie Down",
  arabic: "",
  transliteration: "",
  translation:
    "1. Make Wudu (as you would for Salah). 2. Dust the bed 3 times with the inside of your garment. 3. Lie on your RIGHT side. 4. Place your RIGHT hand under your right cheek. 5. Say Bismillah before lying down.",
  source: "Sahih al-Bukhari 247, 6320, 6312 · Sahih Muslim 2710a",
  commentary:
    "Do these physical adab BEFORE starting the adhkar. The Prophet ﷺ said: \"Whoever goes to sleep without remembering Allah, that will be a source of regret for him on the Day of Resurrection.\" Shaytan actively tries to make you fall asleep before finishing — begin as soon as you get into bed.",
  target: 1,
};

const sleepKafirun: Dhikr = {
  id: "sleep_kafirun",
  title: "Surah Al-Kafirun",
  arabic:
    "قُلْ يَا أَيُّهَا الْكَافِرُونَ، لَا أَعْبُدُ مَا تَعْبُدُونَ، وَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ، وَلَا أَنَا عَابِدٌ مَا عَبَدْتُمْ، وَلَا أَنْتُمْ عَابِدُونَ مَا أَعْبُدُ، لَكُمْ دِينُكُمْ وَلِيَ دِينِ",
  transliteration:
    "Qul ya ayyuhal-kafirun, laa a'budu maa ta'budun, wa laa antum 'aabidoona maa a'bud, wa laa ana 'aabidum-maa 'abattum, wa laa antum 'aabidoona maa a'bud, lakum deenukum wa liya deen",
  translation:
    "Say: O disbelievers, I do not worship what you worship, nor are you worshippers of what I worship. I will not be a worshipper of what you worship, nor will you be worshippers of what I worship. For you is your religion, and for me is my religion.",
  source: "Sunan Abi Dawud 5055 — Sahih",
  commentary:
    "The Prophet ﷺ said to Nawfal: \"Recite Qul ya ayyuhal-kafirun and then go to sleep at its end, for it is a declaration of freedom from shirk.\"",
  target: 1,
};

const sleepAyatKursi: Dhikr = {
  id: "sleep_ayat_kursi",
  title: "Ayat al-Kursi",
  arabic:
    "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
  transliteration:
    "Allahu laa ilaaha illaa huwal-Hayyul-Qayyoom, laa ta'khudhuhu sinatun wa laa nawm, lahu maa fis-samaawaati wa maa fil-ard, man dhal-ladhee yashfa'u 'indahu illaa bi-idhnih, ya'lamu maa bayna aydeehim wa maa khalfahum, wa laa yuheetoona bishay'im-min 'ilmihi illaa bimaa shaa', wasi'a kursiyyuhus-samaawaati wal-ard, wa laa ya'ooduhu hifdhuhumaa, wa huwal-'Aliyyul-'Adheem",
  translation:
    "Allah — there is no deity except Him, the Ever-Living, the Sustainer. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and earth. Who can intercede with Him except by His permission? He knows what is before them and after them, and they encompass nothing of His knowledge except what He wills. His Throne extends over the heavens and the earth, and their preservation does not tire Him. And He is the Most High, the Most Great.",
  source: "Sahih al-Bukhari 2311 · 5010",
  commentary:
    "Shaytan told Abu Hurayrah: \"When you go to bed, recite Ayat al-Kursi — Allah will appoint a guardian for you and no Shaytan will come near you until morning.\" The Prophet ﷺ said: \"He told you the truth — even though he is a liar.\"",
  target: 1,
};

const sleepBaqarahEnd: Dhikr = {
  id: "sleep_baqarah_end",
  title: "Last 2 Verses of Al-Baqarah (2:285-286)",
  arabic:
    "آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ. لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
  transliteration:
    "Aamanar-rasoolu bimaa unzila ilayhi mir-rabbihi wal-mu'minoon... (2:285-286)",
  translation:
    "The Messenger has believed in what was revealed to him from his Lord, and so have the believers... Our Lord, do not impose blame upon us if we forget or err. Our Lord, do not lay upon us a burden like that You laid upon those before us. Our Lord, do not burden us with what we have no ability to bear. Pardon us; forgive us; have mercy upon us. You are our Protector, so give us victory over the disbelieving people.",
  source: "Sahih al-Bukhari 5009",
  commentary:
    "The Prophet ﷺ said: \"Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him (protect him from all evil).\"",
  target: 1,
};

const sleepMuawwidhat: Dhikr = {
  id: "sleep_muawwidhat",
  title: "Al-Mu'awwidhat (Ruqyah Method) — ×3",
  arabic: "",
  transliteration: "",
  translation:
    "CUP HANDS TOGETHER → BLOW INTO THEM → RECITE Ikhlas, Falaq, Nas → RUB OVER YOUR BODY starting with head, face, front. REPEAT 3 TIMES.",
  source: "Sahih al-Bukhari 5017 · 5748",
  commentary:
    "A'ishah narrated: Whenever the Prophet ﷺ went to bed every night, he would cup his hands and blow into them after reciting Al-Ikhlas, Al-Falaq, and An-Nas, then rub his hands over as much of his body as he could reach, starting with his head, face and front. He did that three times.",
  target: 3,
  arabicMulti: [
    {
      label: "Surah Al-Ikhlas (×3)",
      arabic:
        "قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      transliteration:
        "Qul huwal-laahu ahad, Allaahus-samad, lam yalid wa lam yoolad, wa lam yakul-lahu kufuwan ahad",
      translation:
        "Say: He is Allah, the One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent.",
    },
    {
      label: "Surah Al-Falaq (×3)",
      arabic:
        "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      transliteration:
        "Qul a'oodhu birabbil-falaq, min sharri maa khalaq, wa min sharri ghaasiqin idhaa waqab, wa min sharrin-naffaathaati fil-'uqad, wa min sharri haasidin idhaa hasad",
      translation:
        "Say: I seek refuge in the Lord of daybreak from the evil of what He has created, from the evil of darkness when it settles, from the evil of the blowers in knots, and from the evil of an envier when he envies.",
    },
    {
      label: "Surah An-Nas (×3)",
      arabic:
        "قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
      transliteration:
        "Qul a'oodhu birabbin-naas, malikin-naas, ilaahin-naas, min sharril-waswaasil-khannaas, alladhee yuwaswisu fee sudoorin-naas, minal-jinnati wan-naas",
      translation:
        "Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the breasts of mankind, from among the jinn and mankind.",
    },
  ],
};

const sleepMulkSajdah: Dhikr = {
  id: "sleep_mulk_sajdah",
  title: "Surah As-Sajdah (32) & Surah Al-Mulk (67)",
  arabic: "",
  transliteration: "",
  translation:
    "Recite both surahs in full. Surah As-Sajdah (32) and Surah Al-Mulk (67). Al-Mulk is known as al-Mani'ah — the protector from the punishment of the grave.",
  source: "Jami' at-Tirmidhi 3404 — Hasan",
  commentary:
    "Jabir narrated: \"The Prophet ﷺ would not sleep until he recited Tanzil As-Sajdah (32) and Tabarak (Al-Mulk, 67).\" Ibn Mas'ud said: \"Surah Al-Mulk protects from the punishment of the grave — we used to call it al-Mani'ah.\"",
  target: 1,
};

const sleepIsraZumar: Dhikr = {
  id: "sleep_isra_zumar",
  title: "Surah Al-Isra (17) & Az-Zumar (39)",
  arabic: "",
  transliteration: "",
  translation:
    "Recite Surah Al-Isra (17, also called Banu Isra'il) and Surah Az-Zumar (39) in full — each once.",
  source: "Jami' at-Tirmidhi 3405 — verified authentic by al-Albani",
  commentary:
    "A'ishah narrated: \"The Prophet ﷺ would not sleep until he had recited Surah Az-Zumar and Banu Isra'il (Al-Isra).\"",
  target: 1,
};

const sleepTasbeeh: Dhikr = {
  id: "sleep_tasbeeh",
  title: "Bedtime Tasbeeh (Total = 100)",
  arabic: "",
  transliteration: "",
  translation:
    "SubhanAllah ×33, Alhamdulillah ×33, Allahu Akbar ×34. Note: this is DIFFERENT from the post-salah count (which is 33/33/33 + laa ilaaha).",
  source: "Sahih al-Bukhari 6318 · Sahih Muslim 2727a",
  commentary:
    "When Fatimah complained of blisters on her hand from grinding, the Prophet ﷺ said: \"Shall I not tell you of something better than a servant? When you go to bed, say Allahu Akbar 34 times, Subhan Allah 33 times, and Alhamdulillah 33 times — that is better for you than a servant.\"",
  target: 100,
  arabicMulti: [
    {
      label: "SubhanAllah ×33",
      arabic: "سُبْحَانَ اللَّهِ",
      transliteration: "SubhanAllah",
      translation: "Glory be to Allah",
    },
    {
      label: "Alhamdulillah ×33",
      arabic: "الْحَمْدُ لِلَّهِ",
      transliteration: "Alhamdulillah",
      translation: "All praise is for Allah",
    },
    {
      label: "Allahu Akbar ×34",
      arabic: "اللَّهُ أَكْبَرُ",
      transliteration: "Allahu Akbar",
      translation: "Allah is the Greatest",
    },
  ],
};

const sleepGratitude: Dhikr = {
  id: "sleep_gratitude",
  title: "Gratitude Dua",
  arabic:
    "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا فَكَمْ مِمَّنْ لَا كَافِيَ لَهُ وَلَا مُؤْوِيَ",
  transliteration:
    "Alhamdu lillahil-ladhi at'amana wa saqana wa kafana wa awana, fakam mimman laa kaafiya lahu wa laa mu'wiya",
  translation:
    "Praise is to Allah Who fed us and gave us drink, who sufficed us and gave us shelter — for how many are there with no provision and no home.",
  source: "Sahih Muslim 2715",
  commentary: "Anas reported that Allah's Messenger ﷺ said: \"When you go to bed, say this dua.\"",
  target: 1,
};

const sleepLordHeavens: Dhikr = {
  id: "sleep_lord_heavens",
  title: "Lord of the Heavens Dua",
  arabic:
    "اللَّهُمَّ رَبَّ السَّمَاوَاتِ وَرَبَّ الْأَرْضِ وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَى، وَمُنْزِلَ التَّوْرَاةِ وَالْإِنْجِيلِ وَالْفُرْقَانِ، أَعُوذُ بِكَ مِنْ شَرِّ كُلِّ شَيْءٍ أَنْتَ آخِذٌ بِنَاصِيَتِهِ. اللَّهُمَّ أَنْتَ الْأَوَّلُ فَلَيْسَ قَبْلَكَ شَيْءٌ، وَأَنْتَ الْآخِرُ فَلَيْسَ بَعْدَكَ شَيْءٌ، وَأَنْتَ الظَّاهِرُ فَلَيْسَ فَوْقَكَ شَيْءٌ، وَأَنْتَ الْبَاطِنُ فَلَيْسَ دُونَكَ شَيْءٌ، اقْضِ عَنَّا الدَّيْنَ وَأَغْنِنَا مِنَ الْفَقْرِ",
  transliteration:
    "Allahumma Rabbas-samawati wa Rabbal-ardi wa Rabbal-'arshil-'adheem, Rabbana wa Rabba kulli shay', faaliqal-habbi wan-nawa, wa munzilat-Tawraati wal-Injeeli wal-Furqaan, a'udhu bika min sharri kulli shay'in Anta aakhidhun binaasiyatih. Allahumma Antal-Awwalu falaysa qablaka shay', wa Antal-Aakhiru falaysa ba'daka shay', wa Antadh-Dhaahiru falaysa fawqaka shay', wa Antal-Baatinu falaysa doonaka shay', iqdi 'annad-dayna wa aghnina minal-faqr",
  translation:
    "O Allah, Lord of the Heavens and the Earth and the Magnificent Throne, our Lord and Lord of everything, Splitter of the seed and date-stone, Revealer of the Torah, the Injeel and the Furqan (Quran) — I seek refuge in You from the evil of everything You hold by the forelock. O Allah, You are the First, nothing is before You; the Last, nothing is after You; the Most High, nothing is above You; the Most Near, nothing is beyond You — settle our debts and free us from poverty.",
  source: "Sahih Muslim 2713a",
  commentary:
    "The Prophet ﷺ commanded that when intending to sleep, one should lie on the right side and say this. ⚠️ Lie on your RIGHT side before reciting.",
  target: 1,
};

const sleepShaytanProtection: Dhikr = {
  id: "sleep_shaytan_protection",
  title: "Protection from Shaytan",
  arabic:
    "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ",
  transliteration:
    "Allahumma 'Aalimal-ghaybi wash-shahaadati, faatiras-samaawaati wal-ard, Rabba kulli shay'in wa maleekah, ash-hadu an laa ilaaha illaa Anta, a'udhu bika min sharri nafsee, wa min sharrish-shaytaani wa shirkih",
  translation:
    "O Allah, Knower of the unseen and the seen, Creator of the heavens and earth, Lord of everything and its Sovereign — I bear witness that there is no god but You. I seek refuge in You from the evil of my soul, and from the evil of Shaytan and his shirk.",
  source: "Jami' at-Tirmidhi 3392 — Hasan Sahih · Sunan Abi Dawud 5067",
  commentary:
    "The Prophet ﷺ taught Abu Bakr as-Siddiq: \"Say this — when you reach morning, when you reach evening, AND WHEN YOU GO TO BED.\"",
  target: 1,
};

const sleepAngels: Dhikr = {
  id: "sleep_angels",
  title: "The Angels Dua",
  arabic:
    "بِسْمِ اللَّهِ وَضَعْتُ جَنْبِي، اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَأَخْسِئْ شَيْطَانِي، وَفُكَّ رِهَانِي، وَاجْعَلْنِي فِي النَّدِيِّ الْأَعْلَى",
  transliteration:
    "Bismillahi wadha'tu janbi, Allahummaghfir li dhanbi, wa akhsi' shaytaani, wa fukka rihaani, waj'alni fin-nadiyyil-a'la",
  translation:
    "In the name of Allah I lay down my side. O Allah, forgive me my sin, drive away my devil, free me from my responsibility, and place me in the highest assembly (among the angels).",
  source: "Sunan Abi Dawud 5054 — Sahih",
  commentary:
    "Abu'l-Azhar al-Anmari narrated: \"When the Messenger of Allah ﷺ went to his bed at night, he would say this.\"",
  target: 1,
};

const sleepPunishmentProtection: Dhikr = {
  id: "sleep_punishment_protection",
  title: "Protection from Punishment",
  arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
  transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibaadak",
  translation: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
  source: "Sunan Abi Dawud 5045",
  commentary:
    "Hafsah narrated: \"When the Messenger of Allah ﷺ wanted to sleep, he put his RIGHT hand under his cheek and said this.\" Al-Albani verified: say this ONCE — the narration of three times is unauthentic.",
  target: 1,
};

const sleepIbnUmar: Dhikr = {
  id: "sleep_ibn_umar",
  title: "Dua of Ibn Umar",
  arabic:
    "اللَّهُمَّ إِنَّكَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا. اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ",
  transliteration:
    "Allahumma innaka khalaqta nafsee wa Anta tawaffaaha, laka mamaatuhaa wa mahyaahaa, in ahyaytahaa fahfadhhaa, wa in amattahaa faghfir lahaa. Allahumma innee as'alukal-'aafiyah",
  translation:
    "O Allah, You created my soul and You take it back. Unto You is its death and its life. If You give it life, protect it; and if You cause it to die, forgive it. O Allah, I ask You for well-being.",
  source: "Sahih Muslim 2712",
  commentary:
    "Abdullah ibn Umar taught this dua saying he heard it \"from one better than Umar — from the Messenger of Allah ﷺ.\"",
  target: 1,
};

const sleepMain: Dhikr = {
  id: "sleep_main",
  title: "Main Sleep Dua",
  arabic:
    "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ",
  transliteration:
    "Bismika Rabbi wadha'tu janbee, wa bika arfa'uh, in amsakta nafsee farhamhaa, wa in arsaltahaa fahfadhhaa bimaa tahfadhu bihi 'ibaadakas-saaliheen",
  translation:
    "With Your Name my Lord I lay myself down, and with Your Name I rise. If You take my soul then have mercy on it, and if You send it back then protect it as You protect Your righteous servants.",
  source: "Sahih al-Bukhari 6320 · Sahih Muslim 2714a",
  commentary:
    "The Prophet ﷺ said: \"When any one of you goes to bed, shake out the bed with the inside of your garment — for you do not know what has come onto it — then lie on your right side and say this.\"",
  target: 1,
};

const sleepBismika: Dhikr = {
  id: "sleep_bismika",
  title: "Bismika Allahumma",
  arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
  transliteration: "Bismika Allahumma amootu wa ahyaa",
  translation: "In Your Name, O Allah, I die and I live.",
  source: "Sahih al-Bukhari 6312 · Sahih Muslim 2711",
  commentary:
    "Hudhayfah narrated: \"When the Prophet ﷺ went to bed, he put his RIGHT hand under his RIGHT cheek and said this.\"",
  target: 1,
};

const sleepLastWords: Dhikr = {
  id: "sleep_last_words",
  title: "LAST WORDS BEFORE SLEEP",
  arabic:
    "اللَّهُمَّ أَسْلَمْتُ وَجْهِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ",
  transliteration:
    "Allahumma aslamtu wajhee ilayka, wa fawwadtu amree ilayka, wa alja'tu dhahree ilayka, raghbatan wa rahbatan ilayka, laa malja'a wa laa manjaa minka illaa ilayk, aamantu bikitaabikal-ladhee anzalta, wa binabiyyikal-ladhee arsalta",
  translation:
    "O Allah, I have submitted my face to You, entrusted my affair to You, and laid my back against You — out of hope and fear of You. There is no refuge and no escape from You except to You. I believe in Your Book which You revealed and in Your Prophet whom You sent.",
  source: "Sahih al-Bukhari 6311 · Sahih Muslim 2710a",
  commentary:
    "⚠️ SAY THIS LAST — do not speak after it. The Prophet ﷺ said: \"If you die that night, you will die upon the Fitrah (upon Islam). Let these words be THE LAST THING YOU SAY.\" When al-Bara' repeated it saying \"wa birasulika\", the Prophet ﷺ corrected: \"No — say wa binabiyyika.\" Lie on right side, and go to sleep immediately after.",
  target: 1,
};

// ============ WAKE / MORNING WAKING ADHKAR ============
const wakeDisclaimer: Dhikr = {
  id: "wake_disclaimer",
  title: "Physical Sunnan of Waking Up",
  arabic: "",
  transliteration: "",
  translation:
    "1. Say the waking dua the INSTANT your eyes open — before your phone. 2. Wipe sleep from your face with your hand. 3. Use the miswak. 4. Wash both hands 3× before dipping into any vessel. 5. Blow water out of nose 3× in wudu. 6. Dhikr → Wudu → Salah undoes Shaytan's three knots.",
  source: "Sahih al-Bukhari 245 · 162 · 3295 · 6312 · 1142 · Sahih Muslim 763b · 2711",
  commentary:
    "The Prophet ﷺ said: \"Satan puts three knots at the back of the head of any of you if he is asleep... When one wakes up and remembers Allah, one knot is undone; and when one performs ablution, the second knot is undone, and when one prays the third knot is undone — one gets up energetic with a good heart in the morning; otherwise lazy and with a mischievous heart.\"",
  target: 1,
};

const wakeMain: Dhikr = {
  id: "wake_main",
  title: "The Waking Dua",
  arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
  transliteration: "Alhamdu lillahil-ladhi ahyanaa ba'da maa amaatanaa wa ilayhin-nushur",
  translation:
    "Praise is to Allah Who gave us life after having taken it from us, and unto Him is the resurrection.",
  source: "Sahih al-Bukhari 6312 · Sahih Muslim 2711",
  commentary:
    "⚠️ Say this the INSTANT you wake — before sitting up, before speaking, before your phone. Hudhayfah narrated: When the Prophet ﷺ went to bed he would say 'Bismika amootu wa ahyaa', and when he got up he would say this.",
  target: 1,
};

const wakeAlImran: Dhikr = {
  id: "wake_al_imran",
  title: "Wipe Face + Last 10 Verses of Aal 'Imran (3:190-200)",
  arabic: "",
  transliteration: "",
  translation:
    "✋ WIPE THE SLEEP FROM YOUR FACE WITH YOUR HAND → THEN RECITE Surah Aal 'Imran verses 190-200 in full. Imam an-Nawawi: it is mustahabb to recite these verses when getting up from sleep.",
  source: "Sahih Muslim 763b",
  commentary:
    "Ibn 'Abbas narrated that he spent a night in the house of Maimuna: \"The Messenger of Allah ﷺ slept till midnight or a little before or after, then got up and began to cast off the effects of sleep from his face by rubbing with his hand, and then recited the ten concluding verses of Surah Aal-'Imran. He then stood up near a hanging water-skin, performed ablution well, and then stood up and prayed.\"",
  target: 1,
};

const wakeNightWaking: Dhikr = {
  id: "wake_night_waking",
  title: "If You Wake Up During the Night",
  arabic:
    "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. الْحَمْدُ لِلَّهِ، وَسُبْحَانَ اللَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ. اللَّهُمَّ اغْفِرْ لِي",
  transliteration:
    "Laa ilaaha illallahu wahdahu laa shareeka lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli shay'in qadeer. Alhamdu lillahi, wa subhanallahi, wa laa ilaaha illallahu, wallahu akbar, wa laa hawla wa laa quwwata illaa billah. Allahummaghfir li",
  translation:
    "None has the right to be worshipped but Allah alone, no partner with Him. To Him belongs sovereignty and praise, and He has power over all things. All praise is for Allah, Glory be to Allah, none has the right to be worshipped but Allah, Allah is the Greatest, and there is no power and no might except with Allah. Then say: O Allah, forgive me.",
  source: "Sahih al-Bukhari 1154",
  commentary:
    "The Prophet ﷺ said: \"Whoever wakes up at night and says this, then says 'Allahummaghfir li' or makes any dua, it will be answered. And if he performs wudu and prays, his prayer will be accepted.\"",
  target: 1,
};

const wakeFrightened: Dhikr = {
  id: "wake_frightened",
  title: "If Frightened During Sleep",
  arabic:
    "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ",
  transliteration:
    "A'udhu bikalimaatillaahit-taammaati min ghadabihi wa 'iqaabihi, wa sharri 'ibaadih, wa min hamazaatish-shayaateeni wa an yahduroon",
  translation:
    "I seek refuge in Allah's Perfect Words from His anger, His punishment, the evil of His creatures, from the whisperings of the devils, and from their coming near me.",
  source: "Jami' at-Tirmidhi 3528 — authenticated by al-Albani (Sahih at-Tirmidhi 3/171)",
  commentary:
    "The Prophet ﷺ said: \"When one of you becomes frightened during sleep, then let him say this.\" ⚖️ Grading note: sunnah.com's Darussalam edition grades this Da'if, but al-Albani authenticated it and it is in Hisn al-Muslim. If cautious, use \"a'udhu billahi minash-shaytanir-rajim\" (from the Quran).",
  target: 1,
};

const wakeBadDream: Dhikr = {
  id: "wake_bad_dream",
  title: "If You Wake from a Bad Dream (5-Step Sunnah)",
  arabic: "",
  transliteration: "",
  translation:
    "1. Seek refuge in Allah from Shaytan and from the evil of what you saw (×3). 2. Spit dryly to your LEFT ×3 (a light puff). 3. Turn over onto your other side. 4. Do NOT tell ANYONE about it — not even to ask its meaning. 5. If still unsettled, get up and pray.",
  source: "Sahih Muslim 2261, 2262, 2263 · Sahih al-Bukhari 6986",
  commentary:
    "The Prophet ﷺ said: \"A good vision comes from Allah and a bad dream from the devil. So when one of you sees a bad dream, spit on his left side thrice and seek refuge with Allah from its evil — then it will not harm him.\" Abu Salama said: \"I used to see dreams heavier than a mountain — but since I heard this hadith I don't care for its burden.\"",
  target: 1,
};

const wakeGoodDream: Dhikr = {
  id: "wake_good_dream",
  title: "If You Wake from a Good Dream",
  arabic: "",
  transliteration: "",
  translation:
    "Praise Allah — it is from Him. Share it ONLY with someone you love. Do not disclose it to those who might be envious.",
  source: "Sahih al-Bukhari 7045 · Sahih Muslim 2261f",
  commentary:
    "The Prophet ﷺ said: \"If anyone of you saw a dream which he liked, then that was from Allah; he should thank Allah for it and tell it to others.\" And: \"If one sees a good vision one should feel pleased but should not disclose it to anyone but whom one loves.\"",
  target: 1,
};

// ============ Exports ============
export type SleepMode = "sleep" | "wake";

export const sleepItems: SalahItem[] = [
  { dhikr: sleepDisclaimer, isSpecial: true, specialLabel: "⚠️ Read the physical adab first" },
  { dhikr: sleepKafirun },
  { dhikr: sleepAyatKursi },
  { dhikr: sleepBaqarahEnd },
  { dhikr: sleepMuawwidhat, isSpecial: true, specialLabel: "Ruqyah method — blow into hands & rub body ×3" },
  { dhikr: sleepMulkSajdah },
  { dhikr: sleepIsraZumar },
  { dhikr: sleepTasbeeh },
  { dhikr: sleepGratitude },
  { dhikr: sleepLordHeavens, isSpecial: true, specialLabel: "Lie on your RIGHT side" },
  { dhikr: sleepShaytanProtection },
  { dhikr: sleepAngels },
  { dhikr: sleepPunishmentProtection, isSpecial: true, specialLabel: "Right hand under right cheek" },
  { dhikr: sleepIbnUmar },
  { dhikr: sleepMain, isSpecial: true, specialLabel: "Shake bed → lie on right side" },
  { dhikr: sleepBismika },
  { dhikr: sleepLastWords, isSpecial: true, specialLabel: "⚠️ LAST words — do not speak after" },
];

export const wakeItems: SalahItem[] = [
  { dhikr: wakeDisclaimer, isSpecial: true, specialLabel: "⚠️ Read the physical adab first" },
  { dhikr: wakeMain, isSpecial: true, specialLabel: "Say this the INSTANT you wake — before your phone" },
  { dhikr: wakeAlImran },
  { dhikr: wakeNightWaking },
  { dhikr: wakeFrightened },
  { dhikr: wakeBadDream },
  { dhikr: wakeGoodDream },
];
