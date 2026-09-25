// "The Period in the Sunnah". Every hadith, du'a, ruling and scholarly position
// below is copied from the source document the owner supplied. Do not reword it.

export type SunnahItem = {
  id: string;
  title: string;
  source: string;
  arabic?: string;
  transliteration?: string;
  translation?: string;
  narration?: string;
  notes?: string[];
  callout?: { tone: "amber" | "grey"; label: string; text: string };
};

export type SunnahSection = {
  id: string;
  title: string;
  intro?: string;
  items: SunnahItem[];
};

const bukhari305: SunnahItem = {
  id: "decreed",
  title: "“This is something Allah has decreed for the daughters of Adam”",
  source: "Bukhari 305  ·  Sahih (al-Bukhari)",
  arabic: `فَإِنَّ ذَلِكَ شَىْءٌ كَتَبَهُ اللَّهُ عَلَى بَنَاتِ آدَمَ، فَافْعَلِي مَا يَفْعَلُ الْحَاجُّ، غَيْرَ أَنْ لاَ تَطُوفِي بِالْبَيْتِ حَتَّى تَطْهُرِي`,
  transliteration: `Fa-inna dhālika shayʾun katabahu ʾllāhu ʿalā banāti Ādam. Fa-fʿalī mā yafʿalu ʾl-ḥājj, ghayra an lā taṭūfī bi-ʾl-bayti ḥattā taṭhurī.`,
  translation: `This is a thing which Allah has decreed for the daughters of Adam. So do what the pilgrims do, except that you do not perform tawaf around the House until you are pure.`,
  narration: `Narrated ‘Aisha: We set out with the Prophet (ﷺ) with no intention but to perform Hajj. When we reached Sarif I got my period. The Prophet (ﷺ) came to me while I was weeping and said: “What makes you weep?” I said: By Allah, I wish I had not performed Hajj this year. He said: “Perhaps you have got your period?” I said: Yes. He said: “This is a thing which Allah has decreed for the daughters of Adam. So do what all the pilgrims do, except that you do not perform tawaf round the Ka‘bah till you are pure.”`,
  notes: [
    `She was crying and wished she had not come. He did not tell her she was impure or that her worship was ruined. He told her the period is something Allah wrote for every woman, and then narrowed the restriction to a single act — tawaf. Everything else in the greatest act of worship she was performing continued exactly as before.`,
  ],
};

export const PAIN_DUA: SunnahItem = {
  id: "pain",
  title: "For pain anywhere in the body — hand on the place",
  source: "Hisn al-Muslim 243  ·  Muslim 2202  ·  Sahih (Muslim)",
  arabic: `بِسْمِ اللَّهِ — ثَلاَثاً\nأَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ — سَبْعَ مَرَّاتٍ`,
  transliteration: `Bismillāh (3x). Then: Aʿūdhu billāhi wa qudratihi min sharri mā ajidu wa uḥādhir (7x).`,
  translation: `In the name of Allah (three times). I seek refuge in Allah and in His Power from the evil of what I find and of what I guard against (seven times).`,
  narration: `‘Uthman ibn Abi al-‘As complained to the Messenger of Allah (ﷺ) of pain in his body. The Messenger of Allah (ﷺ) said to him: “Put your hand on the place where you feel pain in your body and say ‘Bismillah’ three times, and say seven times: ‘I seek refuge in Allah and in His Power from the evil of what I find and of what I guard against.’”`,
  notes: [
    `This is the closest thing in the Sunnah to a du‘a for cramps: it is prescribed for pain anywhere in the body, with the hand placed on the painful spot.`,
  ],
  callout: {
    tone: "grey",
    label: "Wording variant",
    text: `sunnah.com prints the refuge phrase as “aʿūdhu billāhi wa qudratihi.” Several other printed editions of Muslim have “aʿūdhu bi-ʿizzatillāhi wa qudratihi” (“by the Might of Allah and His Power”), which is the version most widely circulated. Both are narrated; the text above is the one on the page cited.`,
  },
};

export const EARNING_HADITH: SunnahItem = {
  id: "still-written",
  title: "The reward for what she normally does is still written",
  source: "Bukhari 2996  ·  Sahih (al-Bukhari)",
  arabic: `إِذَا مَرِضَ الْعَبْدُ أَوْ سَافَرَ، كُتِبَ لَهُ مِثْلُ مَا كَانَ يَعْمَلُ مُقِيمًا صَحِيحًا`,
  transliteration: `Idhā mariḍa ʾl-ʿabdu aw sāfar, kutiba lahu mithlu mā kāna yaʿmalu muqīman ṣaḥīḥan.`,
  translation: `When a servant falls ill or travels, there is written for him the like of what he used to do when he was resident and healthy.`,
  narration: `Narrated Abu Musa al-Ash‘ari: The Prophet (ﷺ) said this.`,
  notes: [
    `The principle is that when a valid excuse stops a person from an act of worship they were regular in, the reward continues to be recorded. Scholars apply this to the menstruating woman who was regular in her prayers: the habit she has built is still being credited while the obligation itself is lifted.`,
  ],
};

const nailsNote = `There is no prohibition on any of this. Shaykh Ibn ‘Uthaymin addressed the belief directly and said the view widely held among some women “has no basis in the Shari‘ah.” The associated idea — that hair or nails removed during the period will somehow return impure on the Day of Resurrection — is described in the fatwa as “a false notion and an illusion which is not correct at all.” Ibn Taymiyyah and Shafi‘i jurists are cited to the same effect. Washing, showering and washing her hair are likewise unrestricted; nothing needs to be saved for the ghusl.`;
const householdNote = `These narrations are preserved in the two most rigorous collections precisely because they overturn a widespread idea. Sharing a cup at the same spot, sharing food, physical closeness, touching his hair — the Prophet ﷺ deliberately did all of this during his wives’ periods. Any culture that treats a menstruating woman as contaminated is contradicted by his own household practice.`;
const eidNote = `She is not told to stay home. She is told to come, to be present for the gathering and the du‘a of the Muslims, and only to stand clear of the prayer lines themselves. The distinction is between not praying and not participating — Islam asks the first, not the second.`;
const dhikrNote = `None of these require wudu or ghusl at all, so nothing about them changes during the period. Subhanallah, alhamdulillah, Allahu akbar, la ilaha illallah, istighfar, salawat on the Prophet ﷺ, and every du‘a she wishes to make are all unaffected. The morning and evening adhkar continue in full. In practice this means the days of her period can be among her most consistent days of dhikr, not her emptiest.`;

export const DUAS_NOTE = `There is no dua in the Sunnah specific to menstruation. The Prophet ﷺ did not teach one. What follows are the established duas for pain, illness, anxiety and distress, which apply during the period exactly as they apply at any other time.`;

export const SUNNAH_SECTIONS: SunnahSection[] = [
  {
    id: "framed",
    title: "How the Prophet ﷺ Framed It",
    intro: `Before any ruling, two narrations set the tone. Both were said to a woman who thought her period was a problem, and in both the Prophet ﷺ told her it was not.`,
    items: [
      bukhari305,
      {
        id: "not-in-hand",
        title: "“Your menstruation is not in your hand”",
        source: "Muslim 298a  ·  Sahih (Muslim)",
        arabic: `قَالَتْ قَالَ لِي رَسُولُ اللَّهِ صلى الله عليه وسلم نَاوِلِينِي الْخُمْرَةَ مِنَ الْمَسْجِدِ . قَالَتْ فَقُلْتُ إِنِّي حَائِضٌ . فَقَالَ إِنَّ حَيْضَتَكِ لَيْسَتْ فِي يَدِكِ`,
        transliteration: `Inna ḥayḍataki laysat fī yadik.`,
        translation: `Your menstruation is not in your hand.`,
        narration: `‘Aisha reported: The Messenger of Allah (ﷺ) said to me: “Get me the mat from the mosque.” I said: I am menstruating. He said: “Your menstruation is not in your hand.”`,
        notes: [
          `She assumed the period made her untouchable and that she should not handle something belonging to the mosque. He corrected the assumption directly. The period is a specific state with specific rules; it does not make her body, her hands or the things she touches impure. Al-Albani built much of his position on menstruating women and the masjid on this very sentence.`,
        ],
      },
    ],
  },
  {
    id: "pauses",
    title: "What Pauses",
    intro: `These are the things scholars agree are set aside during the period. Note which ones are made up later and which are simply not owed at all.`,
    items: [
      {
        id: "prayer",
        title: "Prayer — paused, and never made up",
        source: "Bukhari 321  ·  Muslim 335c  ·  Sahih (al-Bukhari, Muslim)",
        arabic: `قَالَتْ سَأَلْتُ عَائِشَةَ فَقُلْتُ مَا بَالُ الْحَائِضِ تَقْضِي الصَّوْمَ وَلاَ تَقْضِي الصَّلاَةَ فَقَالَتْ أَحَرُورِيَّةٌ أَنْتِ قُلْتُ لَسْتُ بِحَرُورِيَّةٍ وَلَكِنِّي أَسْأَلُ قَالَتْ كَانَ يُصِيبُنَا ذَلِكَ فَنُؤْمَرُ بِقَضَاءِ الصَّوْمِ وَلاَ نُؤْمَرُ بِقَضَاءِ الصَّلاَةِ`,
        translation: `Mu‘adha said: I asked ‘Aisha, “Why does the menstruating woman make up the fast but not the prayer?” She said: “Are you a Haruriyyah?” I said: I am not a Haruriyyah, but I am asking. She said: “That used to happen to us, and we were ordered to make up the fast and were not ordered to make up the prayer.”`,
        narration: `The same question reaches ‘Aisha in al-Bukhari 321: “We used to get our periods with the Prophet (ﷺ) and he never ordered us to make them up.”`,
        notes: [
          `This is the single most reassuring ruling in the chapter, and it is often misunderstood as a loss. She is not sinning by not praying — praying is actually not permitted for her. And the prayers are not a debt she owes; they are simply not required. Nothing is missing from her record. The contrast with fasting, which is made up, shows this is deliberate and not an oversight.`,
        ],
      },
      {
        id: "fasting",
        title: "Fasting — paused, and made up later",
        source: "Muslim 335c  ·  Sahih (Muslim)",
        notes: [
          `Obligatory fasts missed during the period are made up after Ramadan, at her own pace, before the next Ramadan. Voluntary fasts are simply not kept during the period and carry no make-up. If the period begins during a fasting day, the fast breaks at that moment and that day is made up.`,
        ],
      },
      {
        id: "tawaf",
        title: "Tawaf — paused; every other rite continues",
        source: "Bukhari 305  ·  Sahih (al-Bukhari)",
        notes: [
          `As in the hadith of ‘Aisha above, tawaf around the Ka‘bah is the one rite suspended. Sa‘i, standing at ‘Arafah, Muzdalifah, the stoning, the talbiyah and every other part of Hajj and ‘Umrah continue normally.`,
        ],
      },
      {
        id: "intercourse",
        title: "Intercourse — paused; everything short of it continues",
        source: "quran.com 2:222  ·  Qur'an",
        arabic: `وَيَسْأَلُونَكَ عَنِ الْمَحِيضِ ۖ قُلْ هُوَ أَذًى فَاعْتَزِلُوا النِّسَاءَ فِي الْمَحِيضِ ۖ وَلَا تَقْرَبُوهُنَّ حَتَّىٰ يَطْهُرْنَ ۖ فَإِذَا تَطَهَّرْنَ فَأْتُوهُنَّ مِنْ حَيْثُ أَمَرَكُمُ اللَّهُ ۚ إِنَّ اللَّهُ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ`,
        transliteration: `Wa yasʾalūnaka ʿani ʾl-maḥīḍ. Qul huwa adhan, fa-ʿtazilu ʾn-nisāʾa fi ʾl-maḥīḍ, wa lā taqrabūhunna ḥattā yaṭhurn…`,
        translation: `And they ask you about menstruation. Say, “It is harm, so keep away from wives during menstruation. And do not approach them until they are pure. And when they have purified themselves, then come to them from where Allah has ordained for you. Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.”`,
        notes: [
          `What is forbidden is intercourse itself. Affection, sleeping together, touching and everything short of intercourse remain permitted — the practice of the Prophet ﷺ with his wives during their periods is recorded in detail and is covered in What Continues.`,
        ],
      },
      {
        id: "divorce",
        title: "Divorce during the period",
        source: "Agreed upon by the four schools",
        notes: [
          `A husband may not pronounce divorce while his wife is menstruating. This is a ruling on him rather than on her, but it belongs in any complete treatment of the topic.`,
        ],
      },
    ],
  },
  {
    id: "continues",
    title: "What Continues",
    intro: `The assumption that everything stops is the most common and the most discouraging error.`,
    items: [
      {
        id: "dhikr",
        title: "Dhikr, du‘a, tasbih, istighfar and salawat — all continue",
        source: "Agreed upon",
        notes: [dhikrNote],
      },
      {
        id: "listening",
        title: "Listening to the Qur’an — agreed permitted",
        source: "Bukhari 297  ·  Sahih (al-Bukhari)",
        arabic: `أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ يَتَّكِئُ فِي حَجْرِي وَأَنَا حَائِضٌ، ثُمَّ يَقْرَأُ الْقُرْآنَ`,
        translation: `Narrated ‘Aisha: The Prophet (ﷺ) used to lean on my lap and recite the Qur’an while I was menstruating.`,
        notes: [
          `No scholar disputes that she may listen. This hadith goes further than that: the Qur’an was recited with his head in her lap while she was in her period. Whatever position one takes on her reciting, the idea that the Qur’an must be kept at a distance from her is answered here.`,
        ],
      },
      {
        id: "household",
        title: "Her husband, her home, her ordinary life",
        source: "Bukhari 295  ·  Muslim 300  ·  Sahih (al-Bukhari, Muslim)",
        arabic: `كُنْتُ أَشْرَبُ وَأَنَا حَائِضٌ، ثُمَّ أُنَاوِلُهُ النَّبِيَّ صلى الله عليه وسلم فَيَضَعُ فَاهُ عَلَى مَوْضِعِ فِيَّ فَيَشْرَبُ وَأَتَعَرَّقُ الْعَرْقَ وَأَنَا حَائِضٌ ثُمَّ أُنَاوِلُهُ النَّبِيَّ صلى الله عليه وسلم فَيَضَعُ فَاهُ عَلَى مَوْضِعِ فِيَّ`,
        translation: `‘Aisha said: I would drink while I was menstruating, then hand the vessel to the Prophet (ﷺ) and he would put his mouth where mine had been and drink. And I would eat meat from a bone while menstruating, then hand it to the Prophet (ﷺ) and he would put his mouth where mine had been.`,
        narration: `And in al-Bukhari 295, ‘Aisha said: “I used to comb the hair of the Messenger of Allah (ﷺ) while I was menstruating.” (كُنْتُ أُرَجِّلُ رَأْسَ رَسُولِ اللَّهِ صلى الله عليه وسلم وَأَنَا حَائِضٌ)`,
        notes: [householdNote],
      },
      {
        id: "eid",
        title: "‘Eid — she goes out with everyone else",
        source: "Bukhari 324  ·  Bukhari 974  ·  Sahih (al-Bukhari)",
        arabic: `وَيَعْتَزِلْنَ الْحُيَّضُ الْمُصَلَّى`,
        translation: `…and the menstruating women should keep away from the prayer-place.`,
        narration: `Umm ‘Atiyyah reported that they were commanded to bring out the young women and those in seclusion, and that the menstruating women should come out and witness the good and the supplication of the Muslims, but keep away from the musalla.`,
        notes: [eidNote],
      },
      {
        id: "nails",
        title: "Cutting nails, cutting or removing hair, washing and bathing",
        source: "No prohibition",
        notes: [nailsNote],
        callout: {
          tone: "grey",
          label: "Cultural myth, not Sunnah",
          text: `This is one of the most common beliefs passed down in families with no evidence behind it.`,
        },
      },
    ],
  },
  {
    id: "differ",
    title: "Scholars Differ On",
    items: [
      {
        id: "reciting",
        title: "Reciting the Qur’an — scholars differ",
        source: "Disputed",
        notes: [
          `Three positions, all held by recognised scholars. (1) The majority of jurists: she does not recite until she is pure, though dhikr and du‘a continue. (2) Malik’s school, a narration from Ahmad, Ibn Taymiyyah and ash-Shawkani: she may recite, because — in Ibn Taymiyyah’s words — there is no clear authentic text forbidding it, and the narration usually cited is weak. IslamQA, having surveyed both, concludes that “the evidence of those who allow a menstruating woman to recite Qur’an is stronger,” while restricting her from touching the mushaf itself. (3) Al-Albani: she may recite and may read from the mushaf, since prohibition requires evidence and none is authentic; he explicitly said a Qur’an teacher need not excuse herself during her period.`,
        ],
        callout: {
          tone: "amber",
          label: "Three positions",
          text: `Majority: no recitation. Ibn Taymiyyah, ash-Shawkani, IslamQA: recitation permitted, but not touching the mushaf. Al-Albani: both permitted. A phone or app screen is not a mushaf in the fiqh sense, which is why many who follow position (2) still read Qur’an from their phone during the period.`,
        },
      },
      {
        id: "masjid",
        title: "Staying in the masjid — scholars differ",
        source: "Bukhari 974  ·  Disputed",
        notes: [
          `The majority across all four schools, and the Standing Committee and Shaykh Ibn ‘Uthaymin, hold that she does not remain in the masjid, though passing through for a need is allowed. Their evidence is the hadith of Umm ‘Atiyyah instructing menstruating women to keep away from the prayer-place. Shaykh al-Albani held the opposite: he graded the narration “I do not permit the masjid to a menstruating woman” as weak — as al-Bukhari and al-Bayhaqi did before him — and argued from “your menstruation is not in your hand” that the default of permissibility stands. Both positions are held by recognised scholars.`,
        ],
        callout: {
          tone: "amber",
          label: "Scholars differ",
          text: `Majority (four schools, Ibn ‘Uthaymin, Standing Committee): she does not sit in the masjid. Al-Albani: she may, since no authentic text forbids it.`,
        },
      },
    ],
  },
  {
    id: "duas",
    title: "Duas for Pain & Hardship",
    intro: DUAS_NOTE,
    items: [
      PAIN_DUA,
      {
        id: "illness",
        title: "For illness — the Prophet’s ﷺ own ruqyah",
        source: "Bukhari 5675  ·  Sahih (al-Bukhari)",
        arabic: `أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ، شِفَاءً لاَ يُغَادِرُ سَقَمًا`,
        transliteration: `Adhhibi ʾl-baʾsa Rabba ʾn-nās, ishfi wa anta ʾsh-Shāfī, lā shifāʾa illā shifāʾuk, shifāʾan lā yughādiru saqaman.`,
        translation: `Take away the harm, O Lord of mankind. Heal, for You are the Healer. There is no healing but Your healing — a healing that leaves no illness behind.`,
        notes: [`Said by the Prophet ﷺ when treating illness, and said over oneself as well. It can be used for cramps, headaches, nausea or anything else.`],
      },
      {
        id: "unwell",
        title: "Said over someone unwell — seven times",
        source: "Abu Dawud 3106  ·  Sahih (al-Albani)",
        arabic: `أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ`,
        transliteration: `Asʾalu ʾllāha ʾl-ʿAẓīm, Rabba ʾl-ʿarshi ʾl-ʿaẓīm, an yashfiyak. (7x)`,
        translation: `I ask Allah the Magnificent, Lord of the Magnificent Throne, to heal you. (seven times)`,
        narration: `Ibn ‘Abbas reported that the Prophet (ﷺ) said: “Whoever visits a sick person whose time has not yet come and says seven times: ‘I ask Allah the Magnificent, Lord of the Magnificent Throne, to heal you’ — Allah will heal him of that illness.”`,
        notes: [`Phrased for someone else. To say it for oneself, the ending becomes “an yashfiyanī” (أَنْ يَشْفِيَنِي).`],
      },
      {
        id: "distress",
        title: "For distress and hardship",
        source: "Bukhari 6346  ·  Sahih (al-Bukhari)",
        arabic: `لاَ إِلَهَ إِلاَّ اللَّهُ الْعَظِيمُ الْحَلِيمُ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ، لاَ إِلَهَ إِلاَّ اللَّهُ رَبُّ السَّمَوَاتِ، وَرَبُّ الأَرْضِ، وَرَبُّ الْعَرْشِ الْكَرِيمِ`,
        transliteration: `Lā ilāha illā ʾllāhu ʾl-ʿAẓīmu ʾl-Ḥalīm. Lā ilāha illā ʾllāhu Rabbu ʾl-ʿarshi ʾl-ʿaẓīm. Lā ilāha illā ʾllāhu Rabbu ʾs-samāwāti wa Rabbu ʾl-arḍi wa Rabbu ʾl-ʿarshi ʾl-karīm.`,
        translation: `There is no god but Allah, the Magnificent, the Forbearing. There is no god but Allah, Lord of the Magnificent Throne. There is no god but Allah, Lord of the heavens and Lord of the earth and Lord of the Noble Throne.`,
        narration: `Ibn ‘Abbas reported that the Prophet (ﷺ) used to say this at times of distress (عِنْدَ الْكَرْبِ).`,
        notes: [`The Prophet’s ﷺ own du‘a when something weighed on him. Nothing in it is specific to one kind of hardship.`],
      },
      {
        id: "anxiety",
        title: "For anxiety and grief",
        source: "Bukhari 6369  ·  Sahih (al-Bukhari)",
        arabic: `اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ`,
        transliteration: `Allāhumma innī aʿūdhu bika mina ʾl-hammi wa ʾl-ḥazan, wa ʾl-ʿajzi wa ʾl-kasal, wa ʾl-jubni wa ʾl-bukhl, wa ḍalaʿi ʾd-dayn, wa ghalabati ʾr-rijāl.`,
        translation: `O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, from being overwhelmed by debt and from being overpowered by men.`,
        narration: `Narrated Anas ibn Malik: The Prophet (ﷺ) used to say this frequently.`,
        notes: [`Hamm is anxiety about what is coming; hazan is grief about what has passed. The pairing covers both directions at once, which is why this du‘a is the standard one for low mood.`],
      },
      {
        id: "too-much",
        title: "When everything feels like too much",
        source: "Hisn al-Muslim 88  ·  Sahih chain (al-Hakim 1/545; al-Albani, Sahih at-Targhib 1/273)",
        arabic: `يا حَـيُّ يا قَيّـومُ بِـرَحْمَـتِكِ أَسْتَـغـيث ، أَصْلِـحْ لي شَـأْنـي كُلَّـه ، وَلا تَكِلـني إِلى نَفْـسي طَـرْفَةَ عَـين`,
        transliteration: `Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth, aṣliḥ lī shaʾnī kullah, wa lā takilnī ilā nafsī ṭarfata ʿayn.`,
        translation: `O Ever-Living, O Sustainer, by Your mercy I seek help. Set right all my affairs, and do not entrust me to myself for the blink of an eye.`,
        notes: [`Part of the morning and evening adhkar, and the natural du‘a for a day when she is not coping. Note that sunnah.com prints بِرَحْمَتِكِ with a kasra; the correct reading is بِرَحْمَتِكَ.`],
      },
    ],
  },
  {
    id: "earning",
    title: "What She's Still Earning",
    intro: `Her record has not gone quiet.`,
    items: [
      EARNING_HADITH,
      {
        id: "expiation",
        title: "The discomfort itself is expiation",
        source: "Bukhari 5641  ·  Sahih (al-Bukhari)",
        arabic: `مَا يُصِيبُ الْمُسْلِمَ مِنْ نَصَبٍ وَلاَ وَصَبٍ وَلاَ هَمٍّ وَلاَ حُزْنٍ وَلاَ أَذًى وَلاَ غَمٍّ حَتَّى الشَّوْكَةِ يُشَاكُهَا، إِلاَّ كَفَّرَ اللَّهُ بِهَا مِنْ خَطَايَاهُ`,
        transliteration: `Mā yuṣību ʾl-muslima min naṣabin wa lā waṣabin wa lā hammin wa lā ḥuznin wa lā adhan wa lā ghammin, ḥatta ʾsh-shawkati yushākuhā, illā kaffara ʾllāhu bihā min khaṭāyāh.`,
        translation: `No fatigue, nor disease, nor sorrow, nor sadness, nor hurt, nor distress befalls a Muslim, even the prick of a thorn, but that Allah expiates some of his sins for it.`,
        narration: `Narrated Abu Sa‘id al-Khudri and Abu Hurairah from the Prophet (ﷺ).`,
        notes: [`Cramps, exhaustion and low mood all fall inside the words of this hadith — naṣab (fatigue), hamm (anxiety), ḥuzn (grief), adhan (hurt). None of it is wasted.`],
      },
    ],
  },
  {
    id: "ends",
    title: "Aftercare & Ghusl",
    intro: `The farḍ ghusl is simple: intend purification in the heart, rinse the mouth and nose, and ensure water reaches every part of the body including the roots of the hair. Once this is done, the ghusl is valid and prayer is valid. Everything else below is additional Sunnah and reward, not a condition.`,
    items: [
      {
        id: "ghusl-minimum",
        title: "The minimum valid ghusl",
        source: "Qur’an 5:6  ·  Scholarly agreement",
        notes: [
          `Confirm the bleeding has fully stopped — by the white discharge (al-qaṣṣah al-bayḍāʾ) or complete dryness.`,
          `Farḍ — Intend purification in the heart. Nothing is said aloud.`,
          `Farḍ — Rinse the mouth and nose.`,
          `Farḍ — Ensure water reaches every part of the body, including the roots of the hair.`,
          `If she does only this, the ghusl is complete and valid. She prays. Nothing is deficient and nothing needs repeating.`,
        ],
      },
      {
        id: "ghusl-sunnah-sequence",
        title: "The full Sunnah ghusl — in order",
        source: "Bukhari 248  ·  Bukhari 257  ·  Sahih (al-Bukhari)",
        notes: [
          `1. Intention in the heart. 2. Say Bismillah. 3. Wash the hands two or three times. 4. Wash the private parts and any remaining traces with the left hand. 5. Wash that hand — with soap now, as he wiped it on the ground. 6. Perform a complete wudu as for prayer, optionally leaving the feet to the end. 7. Run wet fingers through the roots of the hair until the scalp is wet. 8. Pour three handfuls of water over the head. 9. Pour water over the whole body, beginning with the right side then the left. 10. Move aside and wash the feet. 11. Apply the musk.`,
          `Water must reach the roots of the hair, but braids need not be undone.`,
        ],
      },
      {
        id: "ghusl",
        title: "The Sunnah of scent afterwards",
        source: "Muslim 332a  ·  Sahih (Muslim)  ·  Recommended, not obligatory",
        arabic: `قَالَتْ سَأَلَتِ امْرَأَةٌ النَّبِيَّ صلى الله عليه وسلم كَيْفَ تَغْتَسِلُ مِنْ حَيْضَتِهَا قَالَ فَذَكَرَتْ أَنَّهُ عَلَّمَهَا كَيْفَ تَغْتَسِلُ ثُمَّ تَأْخُذُ فِرْصَةً مِنْ مِسْكٍ فَتَطَهَّرُ بِهَا . قَالَتْ كَيْفَ أَتَطَهَّرُ بِهَا قَالَ تَطَهَّرِي بِهَا . سُبْحَانَ اللَّهِ . وَاسْتَتَرَ`,
        transliteration: `Thumma taʾkhudhu firṣatan min miskin fa-taṭahharu bihā.`,
        translation: `‘Aisha reported: A woman asked the Prophet (ﷺ) how she should perform ghusl after her period. He taught her how to wash, then said: “then take a piece of cotton scented with musk and purify yourself with it.” She said: How do I purify myself with it? He said: “Purify yourself with it — Subhan Allah!” and he covered his face out of modesty. ‘Aisha said: I drew her to me and said: Follow the traces of blood with it.`,
        notes: [
          `This is recommended, not required. If musk is unavailable, any perfume may be used. If no perfume is available, something that removes odour such as soap may be used. Water alone is sufficient and the ghusl is complete.`,
        ],
      },
      {
        id: "not-required",
        title: "What is not required",
        source: "No basis in the Sunnah",
        notes: [
          `None of the following is required: wearing new or different clothes; washing all clothes worn during the period; undoing braids or plaits; washing the hair a set number of times; saying a spoken intention; reciting a specific du‘a for ghusl; waiting after the bleeding stops before performing ghusl; or making up missed prayers.`,
        ],
        callout: {
          tone: "grey",
          label: "Keep it simple",
          text: `The first three elements — intention, rinsing the mouth and nose, and water reaching the whole body — determine validity. The remaining steps bring additional Sunnah and reward.`,
        },
      },
    ],
  },
  {
    id: "post-period",
    title: "Post-Period",
    intro: `Once the bleeding has stopped and ghusl is complete, worship resumes normally. These are the practical next steps.`,
    items: [
      {
        id: "post-period-next",
        title: "What to do next",
        source: "Bukhari 227  ·  Agreed rulings",
        notes: [
          `Resume prayer at once with the next prayer due.`,
          `Note the days missed from Ramadan, to be made up before the next Ramadan. Prayers are not made up.`,
          `If needed, scrape, rub and rinse any menstrual blood on a garment. Then pray in it. The garment does not need replacing.`,
          `There is no requirement to wear new or different clothes after ghusl. Clean, fresh clothes are a personal preference, not a Sunnah step.`,
        ],
      },
    ],
  },
  {
    id: "myths",
    title: "Myths vs. Sunnah",
    items: [
      { id: "myth-nails", title: "Myth: “Can't cut nails or hair”", source: "No prohibition · Ibn ‘Uthaymin", notes: [nailsNote] },
      { id: "myth-unclean", title: "Myth: “She is unclean or contaminated”", source: "Bukhari 295  ·  Muslim 300", notes: [householdNote] },
      { id: "myth-stops", title: "Myth: “Everything stops”", source: "Agreed upon", notes: [dhikrNote] },
      { id: "myth-eid", title: "Myth: “She should stay home from ‘Eid”", source: "Bukhari 324  ·  Bukhari 974", notes: [eidNote] },
    ],
  },
];
