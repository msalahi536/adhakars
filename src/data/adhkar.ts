export type Dhikr = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  commentary?: string;
  target: number;
  arabicMulti?: { label: string; arabic: string; transliteration: string; translation: string }[];
};

const sayyidul: Dhikr = {
  id: "sayyidul-istighfar",
  title: "Sayyidul Istighfar",
  arabic:
    "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
  transliteration:
    "Allaahuma anta rabbee laailaaha illa ant, khalaqtanee wa ana 'abduk, wa ana 'ala 'ahdika wa w'adika masta-ta'tu, a'uthubika min sharri ma sana'tu, abu-u laka bi ni'matika 'alayya, wa abu-u bi-dhambi, faghfirlee finnahu laa yaghfiru-dhunooba illa ant",
  translation:
    "O Allah! You are my Lord; none has the right to be worshipped but You. You created me and I am Your slave and I am faithful to my covenant, and my commitment to You as far as I am able. I seek Your refuge from the evil of what I have done. I acknowledge before You all of the favours that You have bestowed upon me and I confess to you all my sins. Forgive me, for there is none who can forgive sins except You.",
  source: "Sahih al-Bukhari 6306",
  commentary:
    "This Du'a is also referred to as 'Sayyidul Istighfaar' (The Master Du'a of seeking repentance). Whoever recites it during the day with firm conviction in it, and dies on the same day before the evening, he will be from the people of Paradise; and whoever recites it at night with firm conviction in it, and dies before the morning, he will be from the people of Paradise.",
  target: 1,
};

const laaIlaaha: Dhikr = {
  id: "laa-ilaaha",
  title: "Laa ilaaha illallaah",
  arabic:
    "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
  transliteration:
    "Laa ilaaha illal-laahu wahdahu laa shareeka lahu, lahul mulku wa-lahul hamdu wa-huwa 'ala kulli shayin qadeer",
  translation:
    "None has the right to be worshipped but Allah alone Who has no partner. Sovereignty is His and all praise is for Him, and He has full power over all things.",
  source: "Sahih al-Bukhari 3293 & Sahih al-Muslim 2691",
  commentary:
    "The Prophet mentioned regarding the one who says this one hundred times in a day, \"...one will receive the reward of freeing ten slaves, and one hundred good deeds will be written in his account, and one-hundred bad deeds will be erased from his account, and on that day he will be protected from the morning till the evening from the Shaytan, and nobody will be better than him except for the one who recited this more than him.\"",
  target: 10,
};

const subhanShort: Dhikr = {
  id: "subhan-short",
  title: "Subhaanallaahi wa bi hamdihi",
  arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
  transliteration: "Subhaanallaahi wa bi hamdihi",
  translation: "Glory is to Allah and Praise is to Him",
  source: "Sahih al-Bukhari 6405 & Sahih al-Muslim 2691",
  commentary:
    "The Prophet mentioned regarding the one who says this one hundred times a day, \"...all of his sins will be forgiven even if they were as much as the foam of the sea.\"",
  target: 100,
};

const bismillaahProtection: Dhikr = {
  id: "bismillaah-protection",
  title: "Bismillaah protection",
  arabic:
    "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
  transliteration:
    "Bismillaahil-ladhi laa yadduru ma'a ismihi shayun fil-ardi walaa fis-samaai wa-huwas samee'ul 'aleem",
  translation:
    "In the Name of Allah, Who with His Name nothing can cause harm in the Earth nor in the Heavens, and He is the All-Hearing, the All-Knowing.",
  source: "Musnad Imam Ahmad 446 and Sunan al-Tirmidhi 3388",
  commentary:
    "The Prophet mentioned that whoever says this every morning and evening, nothing shall come to harm him on that day and evening (except that which Allah has decreed).",
  target: 1,
};

const aafiyah: Dhikr = {
  id: "aafiyah",
  title: "Du'a for 'Aafiyah",
  arabic:
    "اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اَللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ، وَأَهْلِي وَمَالِي، اَللَّهُمَّ اسْتُرْ عَوْرَتِي، وَآمِنْ رَوْعَاتِي، اَللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ، وَمِنْ خَلْفِي، وَعَنْ يَمِينِي، وَعَنْ شِمَالِي، وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
  transliteration:
    "Allaahuma inni asalukal aafiyata fid-dunya wal aakhirah, Allaahuma inni asalukal 'afwa wal 'aafiyata fee deenee wa dunyaay, wa ahlee wa maalee, Allahumas tur 'awratee, wa-aamin raw'atee, Allahumahfathnee min bayni yaday, wa-min khalfee, wa-'an yameenee, wa-'an shimaalee, wa-min fawqee, wa a'udhu bi-'adhamatika an ughtaala min tahtee",
  translation:
    "O Allah, I seek Your protection in this world and the next. O Allah, I seek Your forgiveness and Your protection in my religion, in my worldly affairs, in my family and in my wealth. O Allah, conceal my faults and safeguard me from the things which I fear. O Allah, guard me from what is in front of me and behind me, and from my right, and from my left, and from above me, and I seek refuge in Your Greatness from being struck down from beneath me.",
  source: "Sunan Abu Dawud 5074",
  commentary:
    "'Abdullah ibn 'Umar narrated that the Prophet would always recite this Du'a whenever he entered upon the morning and evening.",
  target: 1,
};

const threeSurahs: Dhikr = {
  id: "three-surahs",
  title: "Al-Ikhlas, Al-Falaq, An-Naas",
  arabic: "",
  transliteration: "",
  translation: "",
  source: "Sunan Abu Dawud / Musnad Imam Ahmad",
  commentary:
    "The Prophet mentioned that whoever recites Surahs Al-Ikhlas, Al-Falaq and An-Naas three times in both the morning and evening, then this will suffice him (as a protection) against everything.",
  target: 9,
  arabicMulti: [
    {
      label: "Surah Al-Ikhlas",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
      transliteration:
        "Bismillaah-hirahmaan-nirraheem. Qul huwal-laahu Ahad. Allaahus samad. Lam yalid wa lam yuwlad. Wa lam yakullahu kuf-fuw-wan Ahad",
      translation:
        "In the name of Allah, the Most Compassionate, Most Merciful. Say, He is Allah, One and Indivisible. Allah, the Sustainer needed by all. He has never had offspring, nor was He born. And there is none comparable to Him.",
    },
    {
      label: "Surah Al-Falaq",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
      transliteration:
        "Bismillaah-hirahmaan-nirraheem. Qul 'audhu birabbil falaq. Min sharri maa khalaq. Wa min sharri ghaasiqin idha waqab. Wa min sharrin naffa-thaati fil 'uqad. Wa min sharri haasidin idha hasad",
      translation:
        "In the name of Allah, the Most Compassionate, Most Merciful. Say, I seek refuge in the Lord of the daybreak. From the evil of whatever He has created. And from the evil of the night when it grows dark. And from the evil of those witches casting spells by blowing onto knots. And from the evil of an envier when they envy.",
    },
    {
      label: "Surah An-Naas",
      arabic:
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ",
      transliteration:
        "Bismillaah-hirahmaan-nirraheem. Qul 'audhu birabbin naas. Malikin-naas. Ilaahin-naas. Min sharril waswaasil khannaas. El-ledhi yuwas-wisu fee sudoorin-naas. Minal jin-nati wan-naas",
      translation:
        "In the name of Allah, the Most Compassionate, Most Merciful. Say, I seek refuge in the Lord of humankind. The Master of humankind. The God of humankind. From the evil of the lurking whisper. Who whispers into the hearts of humankind. From among jinn and humankind.",
    },
  ],
};

const radeetu: Dhikr = {
  id: "radeetu",
  title: "Radeetu billaah",
  arabic:
    "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
  transliteration:
    "Radeetu billaahi rabban, wa-bil islaami deenan, wa-bi muhammadin sallal-laahu 'alayhi wa sallama nabeeyyan",
  translation:
    "I am pleased with Allah as my Lord, and with Islam as my Religion, and with Muhammad (Peace and Blessings of Allah be Upon Him) as my Prophet.",
  source: "Musnad Imam Ahmad 18968",
  commentary:
    "The Prophet mentioned that whoever says this three times upon entering the morning and evening, then Allah has made it binding upon Himself to please him on the Day of Resurrection.",
  target: 3,
};

const abuBakr: Dhikr = {
  id: "abu-bakr",
  title: "Du'a of Abu Bakr As-Sideeq",
  arabic:
    "اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَشَرِّ الشَّيْطَانِ وَشِرْكِهِ، وَأَنْ أَقْتَرِفَ عَلَى نَفْسِي سُوءًا، أَوْ أَجُرَّهُ إِلَى مُسْلِمٍ",
  transliteration:
    "Allaahuma faatiras samaa-waati wal ard, 'aalimal ghaybi washa-haadah, rabba kulli shayin wa maleekah, ash-hadu allaa-ilaaha illa ant, a'udhu bika min sharri nafsee, wa sharrish shaytaani wa shirkih, wa-an aktarifa 'alaa nafsee sooan, aw ajjuruhu ila muslim",
  translation:
    "O Allah, Creator of the Heavens and the Earth, Knower of the unseen and evident. Lord of all things and its Possessor. I testify that there is no God worthy of worship except You. I seek refuge in You from the evil of my soul and from the evil of Satan and his helpers. From bringing evil (sins) upon my soul and from harming any Muslim.",
  source: "Sunan Abu Dawud 5067 and the addition is found in Sunan At-Tirmidhi 3529",
  commentary:
    "The Prophet taught this Du'a to his close companion Abu Bakr As-Sideeq to say every morning and evening.",
  target: 1,
};

const yaaHayyu: Dhikr = {
  id: "yaa-hayyu",
  title: "Yaa Hayyu Yaa Qayyoom",
  arabic:
    "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
  transliteration:
    "Yaa hayuu yaa qayyoom, bi-rahmatika astagheeth, uslih-lee sha-nee kullahu wa-laa takil-nee ila nafsee tarfata 'ayn",
  translation:
    "O Ever Living One, O All-Sustaining One, by Your mercy I call on You to set right all of my affairs. Do not place me in charge of my soul even for the blinking of an eye (i.e. a moment).",
  source: "Sunan An-Nasa'i (Al-Kubra) 10405",
  commentary: "The Prophet taught this Du'a to his daughter Fatima to say every morning and evening.",
  target: 1,
};

const subhanExpanded: Dhikr = {
  id: "subhan-expanded",
  title: "Subhaanallaahi wa-bihamdihi (expanded)",
  arabic:
    "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
  transliteration:
    "Subhaanallaahi wa-bihamdihi, 'adada khalqihi, wa ridaa nafsihi, wa zinata 'arshihi, wa midaada kalimaatih",
  translation:
    "Glory is to Allah and Praise is to Him, by the multitude of His creation, by His Pleasure, by the weight of His Throne, and by the extent of His Words.",
  source: "Muslim 2726",
  target: 3,
};

const hasbi: Dhikr = {
  id: "hasbi",
  title: "Hasbeeyal-laahu",
  arabic:
    "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
  transliteration:
    "Hasbeeyal-laahu laa ilaaha illa huwa 'alayhi tawakaltu wa-huwa rabbul 'arshil 'adheem",
  translation:
    "Sufficient for me is Allah; there is no deity except Him. Upon him I have relied, and He is the Lord of the Great Throne.",
  source: "Sunan Abu Dawud 5081 — Mawqoof from Abu Darda",
  commentary:
    "Allah will take care of all of the concerns and worries for the one who recites this seven times every morning and evening.",
  target: 7,
};

export const morningAdhkar: Dhikr[] = [
  sayyidul,
  laaIlaaha,
  subhanShort,
  bismillaahProtection,
  aafiyah,
  threeSurahs,
  radeetu,
  abuBakr,
  yaaHayyu,
  {
    id: "asbahnaa-mulk",
    title: "Asbahnaa wa-asbahal mulku",
    arabic:
      "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ، وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ، وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    transliteration:
      "Asbahnaa wa-asbahal mulku lillah, wal hamdu lillah, laa ilaaha ilal-laahu wahdahoo laa shareeka lah, lahul mulku, wa-lahul hamdu wa-huwa 'ala kulli shayin qadeer, rabbi as-aluka khayra maa fee hadhal yawm, wa khayra ma b'adah, wa 'audhu bika min sharri maa fee hadhal yawm, wa sharri maa b'adah, rabbi 'audhu bika minal kasal, wa-sooil kibar, rabbi 'audu bika min 'adhaabin fin-naari wa 'adhaabin fil qabr",
    translation:
      "We have entered a new day and the dominion belongs to Allah; Praise be to Allah; None has the right to be worshipped but Allah alone, Who has no partner. To Allah belongs the dominion, and to Him belongs all praise, and He is Able to do all things. My Lord, I ask You for the goodness of this day and that what comes after it, and I seek refuge in You from the evil of this day and that what comes after it. My Lord, I seek refuge in You from laziness and from the feebleness of old age. My Lord, I seek refuge in You from the punishment of the Hellfire, and from the punishment of the grave.",
    source: "Muslim 2723",
    target: 1,
  },
  {
    id: "bika-asbahnaa",
    title: "Allahumma bika asbahnaa",
    arabic:
      "اَللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration:
      "Allahumma bika asbahnaa, wa-bika amsaynaa, wa-bika nahyaa, wa-bika namootu, wa-ilaykan-nushoor",
    translation:
      "O Allah, by You we enter the morning and by You we enter the evening, and by You we live and by You we die and unto You is our final return.",
    source: "Sunan Abu Dawud 5068",
    target: 1,
  },
  subhanExpanded,
  {
    id: "fitratil-islam",
    title: "Asbahnaa 'ala fitratil islami",
    arabic:
      "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ وَعَلَى كَلِمَةِ الْإِخْلَاصِ وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ ﷺ وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    transliteration:
      "Asbahnaa 'ala fitratil islami wa-'ala kalimatil ikhlaas, wa-'ala deeni nabeeyyinaa Muhammadin sallal-laahu 'alayhi wa sallam, wa-'ala millati abeenaa ibraaheema haneefan musliman wa-maa kaana minal mushrikeen",
    translation:
      "We have entered a new day upon the natural religion of Islam, the word of sincere devotion, the religion of our Prophet Muhammad (Peace and Blessings of Allah be upon him) and the faith of our father Ibrahim. He was an upright (in worshipping Allah) Muslim and he was not of those who worship others besides Allah.",
    source: "Musnad Imam Ahmad 15360",
    target: 1,
  },
  hasbi,
];

export const eveningAdhkar: Dhikr[] = [
  sayyidul,
  laaIlaaha,
  subhanShort,
  bismillaahProtection,
  aafiyah,
  threeSurahs,
  radeetu,
  abuBakr,
  yaaHayyu,
  {
    id: "amsaynaa-mulk",
    title: "Amsaynaa wa-amsal mulku",
    arabic:
      "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ، وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ، وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    transliteration:
      "Amsaynaa wa-amsal mulku lillah, wal hamdu lillah, laa ilaaha ilal-laahu wahdahoo laa shareeka lah, lahul mulku, wa-lahul hamdu wa-huwa 'ala kulli shayin qadeer, rabbi as-aluka khayra maa fee hadhi-hil laylah, wa khayra ma b'adahaa, wa 'audhu bika min sharri maa fee hadhi-hil laylah, wa sharri maa b'adahaa, rabbi 'audhu bika minal kasal, wa-sooil kibar, rabbi 'audu bika min 'adhaabin fin-naari wa 'adhaabin fil qabr",
    translation:
      "We have entered the evening and the dominion belongs to Allah; Praise be to Allah; None has the right to be worshipped but Allah alone, Who has no partner. To Allah belongs the dominion, and to Him belongs all praise, and He is Able to do all things. My Lord, I ask You for the goodness of this night and that what comes after it, and I seek refuge in You from the evil of this night and that what comes after it. My Lord, I seek refuge in You from laziness and from the feebleness of old age. My Lord, I seek refuge in You from the punishment of the Hellfire, and from the punishment of the grave.",
    source: "Muslim 2723",
    target: 1,
  },
  {
    id: "bika-amsaynaa",
    title: "Allahumma bika amsaynaa",
    arabic:
      "اَللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
    transliteration:
      "Allahumma bika amsaynaa, wa-bika asbahnaa, wa-bika nahyaa, wa-bika namootu, wa-ilaykal-maseer",
    translation:
      "O Allah, by You we enter the evening and by You we enter the morning, and by You we live and by You we die and unto You is our final return.",
    source: "Sunan Ibn Maajah 3868",
    target: 1,
  },
  hasbi,
  {
    id: "kalimaat-evening",
    title: "A'udhu bikalimaatil-laah (Evening only)",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "A'udhu bikalimaatil-laahit taam-maati min sharri maa khalaq",
    translation: "I Seek refuge in the Perfect Words of Allah from the evil of what He has created",
    source: "Muslim 2708, 2709",
    commentary:
      "This Du'a is to be recited in the evening only. The Prophet advised reciting this Du'a when staying in a place during the evening/night. By doing so, nothing shall do him any harm until he moves from that place.",
    target: 1,
  },
];

export const baqarahLastTwo: Dhikr = {
  id: "baqarah-last-two",
  title: "Last Two Verses of Surah Al-Baqarah",
  arabic: "",
  transliteration: "",
  translation: "",
  source: "Sahih al-Bukhari 4008 & Sahih al-Muslim 807",
  commentary:
    "The Prophet mentioned that the one who recites the last two verses of Surah Al-Baqarah at night, it will 'suffice him'. The Scholars interpreted the word 'suffice' here to mean, suffice him as a means of protection from all types of evil and harm, including the Shaytan. These verses are to be recited after the sun has set, not during the regular evening adhkar.",
  target: 1,
  arabicMulti: [
    {
      label: "Ayah 285",
      arabic:
        "ءَامَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ كُلٌّ ءَامَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِّن رُّسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ",
      transliteration:
        "Aamanar rasoolu bimaa unzila ilayhi mir-rabbihi wal mu'minoon, kullun aamana billaahi wa malaa'ikatihi wa kutubihi wa rusulihi, laa nufarriqu bayna ahadim mir-rusulihi, wa qaaloo sami'naa wa ata'naa ghufraanaka rabbanaa wa ilaykal maseer",
      translation:
        "The Messenger has believed in what was revealed to him from his Lord, and so have the believers. All of them have believed in Allah and His angels and His books and His messengers, saying, \"We make no distinction between any of His messengers.\" And they say, \"We hear and we obey. We seek Your forgiveness, our Lord, and to You is the final destination.\"",
    },
    {
      label: "Ayah 286",
      arabic:
        "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
      transliteration:
        "Laa yukalliful-laahu nafsan illaa wus'ahaa, lahaa maa kasabat wa 'alayhaa mak-tasabat, rabbanaa laa tu'aakhidhnaa in naseenaa aw akhta'naa, rabbanaa wa laa tahmil 'alaynaa isran kamaa hamaltahu 'alal-latheena min qablinaa, rabbanaa wa laa tuhammilnaa maa laa taaqata lanaa bih, wa'fu 'annaa, waghfir lanaa, warhamnaa, anta mawlaanaa fansurnaa 'alal qawmil kaafireen",
      translation:
        "Allah does not burden a soul beyond that it can bear. It will have the consequence of what good it has gained, and it will bear the consequence of what evil it has earned. Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our Protector, so give us victory over the disbelieving people.",
    },
  ],
};
