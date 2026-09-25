// "Ruqyah Companion". Every hadith, du'a, ruling and scholarly position below is
// copied from the source document the owner supplied. Do not reword it.
import type { SunnahItem } from "@/data/period-sunnah";

export const RUQYAH_DISCLAIMER =
  "Nothing here replaces medical care. The Prophet ﷺ commanded seeking treatment and used physical remedies himself. If you have a medical or psychiatric condition, you should be under proper care. Ruqyah accompanies treatment; it does not replace it.";

// ---------- Core narrations ----------

export const MUSLIM_2200: SunnahItem = {
  id: "permission",
  title: "The permission, and its limit",
  source: "Muslim 2200  ·  Sahih (Muslim)",
  arabic: `اعْرِضُوا عَلَىَّ رُقَاكُمْ لاَ بَأْسَ بِالرُّقَى مَا لَمْ يَكُنْ فِيهِ شِرْكٌ`,
  transliteration: `Iʿriḍū ʿalayya ruqākum. Lā baʾsa bi-ʾr-ruqā mā lam yakun fīhi shirk.`,
  translation: `Show me your ruqyahs. There is no harm in ruqyah so long as it does not contain shirk.`,
  narration: `‘Awf ibn Malik al-Ashja‘i said: We used to perform ruqyah in the time of Jahiliyyah, so we said: O Messenger of Allah, what do you think of that? He said: “Show me your ruqyahs. There is no harm in ruqyah so long as it does not contain shirk.”`,
  notes: [
    `He did not forbid what they had inherited outright. He asked to inspect it, and set a single test: does it contain shirk? Everything in this guide follows from that question.`,
  ],
};

export const ABU_DAWUD_3883: SunnahItem = {
  id: "shirk",
  title: "“Ruqyah, amulets and love-charms are shirk”",
  source: "Abu Dawud 3883  ·  Sahih (al-Albani)",
  arabic: `إِنَّ الرُّقَى وَالتَّمَائِمَ وَالتِّوَلَةَ شِرْكٌ`,
  transliteration: `Inna ʾr-ruqā wa ʾt-tamāʾima wa ʾt-tiwalata shirk.`,
  translation: `Indeed ruqā, amulets and love-charms are shirk.`,
  narration: `‘Abdullah ibn Mas‘ud reported that he heard the Messenger of Allah (ﷺ) say this.`,
  notes: [
    `Placed next to the previous hadith, the two look contradictory. They are not. The ruqā condemned here are the ones of Jahiliyyah — invocations of jinn, unknown names, words whose meaning is not known. The ruqyah permitted is the one that passes the test in the next entry. This pairing is the whole of the subject in two narrations, and any honest guide has to give both.`,
  ],
};

export const THREE_CONDITIONS: SunnahItem = {
  id: "conditions",
  title: "The three conditions scholars agreed on",
  source: "Ibn Hajar, Fath al-Bari 10/195",
  notes: [
    `Ibn Hajar records the agreement of the scholars that ruqyah is permitted when three conditions are met. One: that it consists of the words of Allah, or His names and attributes. Two: that it is in Arabic, or in another language whose meaning is known. Three: that it is not believed to have effect in and of itself — any effect is by the leave of Allah alone.`,
  ],
  callout: {
    tone: "grey",
    label: "Use this as the test",
    text: `Any practice, product or healer can be checked against these three. If the words are unknown, or their meaning cannot be stated, or the thing is believed to work by itself, it fails.`,
  },
};

export const CONDITION_LIST = [
  "It consists of the words of Allah, or His names and attributes",
  "It is in Arabic, or in another language whose meaning is known",
  "It is not believed to have effect in and of itself — any effect is by the leave of Allah alone",
];

export const BUKHARI_5705: SunnahItem = {
  id: "seventy",
  title: "The 70,000 — and what it actually says",
  source: "Bukhari 5705  ·  Sahih (al-Bukhari)",
  arabic: `هُمُ الَّذِينَ لاَ يَسْتَرْقُونَ، وَلاَ يَتَطَيَّرُونَ، وَلاَ يَكْتَوُونَ وَعَلَى رَبِّهِمْ يَتَوَكَّلُونَ`,
  transliteration: `Humu ʾlladhīna lā yastarqūn, wa lā yataṭayyarūn, wa lā yaktawūn, wa ʿalā Rabbihim yatawakkalūn.`,
  translation: `They are those who do not ask others to perform ruqyah for them, nor believe in omens, nor seek cauterisation, and who rely upon their Lord.`,
  narration: `Ibn ‘Abbas reported that the Prophet (ﷺ) described the seventy thousand of his ummah who would enter Paradise without reckoning in these terms.`,
  notes: [
    `The word is lā yastarqūn — they do not ASK others. It is not lā yarqūn, they do not perform ruqyah. The Prophet ﷺ performed ruqyah on himself and on others, and taught it; he cannot be describing that as a deficiency. What is being praised is not turning to people as the first move. Performing ruqyah on yourself is sunnah, and doing it for your own family is sunnah.`,
  ],
  callout: {
    tone: "amber",
    label: "Common misreading",
    text: `Some people conclude from this hadith that ruqyah is for the spiritually weak, and avoid it altogether. That is a misreading of one word. Self-ruqyah is the Prophet’s ﷺ own nightly practice.`,
  },
};

export const BUKHARI_5017: SunnahItem = {
  id: "core-method",
  title: "The core method — cup, blow, recite, wipe, three times",
  source: "Bukhari 5017  ·  Sahih (al-Bukhari)",
  arabic: `أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ إِذَا أَوَى إِلَى فِرَاشِهِ كُلَّ لَيْلَةٍ جَمَعَ كَفَّيْهِ ثُمَّ نَفَثَ فِيهِمَا فَقَرَأَ فِيهِمَا قُلْ هُوَ اللَّهُ أَحَدٌ وَ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ وَ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ثُمَّ يَمْسَحُ بِهِمَا مَا اسْتَطَاعَ مِنْ جَسَدِهِ يَبْدَأُ بِهِمَا عَلَى رَأْسِهِ وَوَجْهِهِ وَمَا أَقْبَلَ مِنْ جَسَدِهِ يَفْعَلُ ذَلِكَ ثَلاَثَ مَرَّاتٍ`,
  translation: `Narrated ‘Aisha: Whenever the Prophet (ﷺ) went to his bed every night, he would cup his hands together, blow into them, and recite into them al-Ikhlāṣ, al-Falaq and an-Nās. Then he would wipe with them whatever he could of his body, beginning with his head, his face and the front of his body. He would do that three times.`,
  notes: [
    `This is the template for all self-ruqyah. Note the order in the narration: he joined his palms, then blew (nafath — a light blow carrying a trace of moisture, not spitting), recited into them, and wiped. Head first, then face, then the front of the body, then as much as he could reach. Three times.`,
  ],
};

export const BUKHARI_5675: SunnahItem = {
  id: "right-hand",
  title: "Ruqyah by another — the right hand on the place",
  source: "Bukhari 5675  ·  Sahih (al-Bukhari)",
  arabic: `أَذْهِبِ الْبَاسَ رَبَّ النَّاسِ، اشْفِ وَأَنْتَ الشَّافِي لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ، شِفَاءً لاَ يُغَادِرُ سَقَمًا`,
  transliteration: `Adhhibi ʾl-baʾsa Rabba ʾn-nās, ishfi wa anta ʾsh-Shāfī, lā shifāʾa illā shifāʾuk, shifāʾan lā yughādiru saqaman.`,
  translation: `Take away the harm, O Lord of mankind. Heal, for You are the Healer. There is no healing but Your healing — a healing that leaves no illness behind.`,
  narration: `‘Aisha reported that when the Prophet (ﷺ) visited a sick person, or a sick person was brought to him, he would wipe over him with his right hand and say this.`,
  notes: [`The right hand, placed on the person, with this du‘a. This is the standard form when performing ruqyah for someone else.`],
};

export const MUSLIM_2186: SunnahItem = {
  id: "jibril",
  title: "Jibril’s ruqyah on the Prophet ﷺ",
  source: "Muslim 2186  ·  Sahih (Muslim)",
  arabic: `بِاسْمِ اللَّهِ أَرْقِيكَ مِنْ كُلِّ شَىْءٍ يُؤْذِيكَ مِنْ شَرِّ كُلِّ نَفْسٍ أَوْ عَيْنِ حَاسِدٍ اللَّهُ يَشْفِيكَ بِاسْمِ اللَّهِ أَرْقِيكَ`,
  transliteration: `Bismillāhi arqīk, min kulli shayʾin yuʾdhīk, min sharri kulli nafsin aw ʿaynin ḥāsid, Allāhu yashfīk, bismillāhi arqīk.`,
  translation: `In the name of Allah I perform ruqyah for you, from everything that harms you, from the evil of every soul or envious eye. May Allah heal you. In the name of Allah I perform ruqyah for you.`,
  narration: `Abu Sa‘id al-Khudri reported that Jibril came to the Prophet (ﷺ) and said: “O Muhammad, are you ill?” He said: “Yes.” Jibril said: “In the name of Allah I perform ruqyah for you…”`,
  notes: [
    `Ruqyah performed on the Prophet ﷺ himself, by Jibril. For yourself, the endings change to arqī nafsī and yashfīnī. It explicitly covers the evil eye, which is why it is the standard du‘a for ‘ayn.`,
  ],
};

export const BUKHARI_5736: SunnahItem = {
  id: "fatihah",
  title: "Al-Fatihah as ruqyah",
  source: "Bukhari 5736  ·  Sahih (al-Bukhari)",
  arabic: `فَجَعَلَ يَقْرَأُ بِأُمِّ الْقُرْآنِ، وَيَجْمَعُ بُزَاقَهُ، وَيَتْفِلُ، فَبَرَأَ … فَضَحِكَ وَقَالَ وَمَا أَدْرَاكَ أَنَّهَا رُقْيَةٌ، خُذُوهَا، وَاضْرِبُوا لِي بِسَهْمٍ`,
  translation: `Abu Sa‘id al-Khudri reported that some of the Companions came upon an Arab tribe who did not host them. The chief of that tribe was stung, and they asked: “Do you have any medicine, or anyone who performs ruqyah?” They said: “You did not host us, and we will not do it unless you give us a payment.” They agreed on a flock of sheep. So one of them began reciting the Mother of the Qur’an, gathering his saliva and spitting lightly — and the man recovered. They brought the sheep and said: We will not take it until we ask the Prophet (ﷺ). They asked him, and he laughed and said: “How did you know it was a ruqyah? Take it, and assign me a share.”`,
  notes: [
    `Al-Fatihah is ruqyah, established by the Prophet ﷺ laughing at their discovery and confirming it. Notice also the mechanics: recite, gather saliva, blow lightly on the place. And notice the payment — he approved a fee taken for a genuine ruqyah, which is why charging is not in itself forbidden. What is condemned is the industry built around it.`,
  ],
};

export const MUSLIM_2202: SunnahItem = {
  id: "pain-place",
  title: "For pain in a specific place",
  source: "Muslim 2202  ·  Sahih (Muslim)",
  arabic: `بِسْمِ اللَّهِ — ثَلاَثاً\nأَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ — سَبْعَ مَرَّاتٍ`,
  transliteration: `Bismillāh (3x), then: Aʿūdhu billāhi wa qudratihi min sharri mā ajidu wa uḥādhir (7x).`,
  translation: `In the name of Allah (three times). I seek refuge in Allah and in His Power from the evil of what I find and of what I guard against (seven times).`,
  narration: `‘Uthman ibn Abi al-‘As complained to the Messenger of Allah (ﷺ) of pain in his body. He said: “Put your hand on the place where you feel pain and say Bismillah three times, and say seven times: I seek refuge in Allah and in His Power from the evil of what I find and of what I guard against.”`,
  notes: [`Hand on the specific place. This is the targeted form, as opposed to the whole-body method above.`],
};

export const BUKHARI_5745: SunnahItem = {
  id: "earth",
  title: "The saliva-and-earth ruqyah",
  source: "Bukhari 5745  ·  Sahih (al-Bukhari)",
  arabic: `بِسْمِ اللَّهِ، تُرْبَةُ أَرْضِنَا، بِرِيقَةِ بَعْضِنَا، يُشْفَى سَقِيمُنَا بِإِذْنِ رَبِّنَا`,
  transliteration: `Bismillāh, turbatu arḍinā, bi-rīqati baʿḍinā, yushfā saqīmunā, bi-idhni Rabbinā.`,
  translation: `In the name of Allah. The earth of our land, with the saliva of one of us, our sick one is healed by the permission of our Lord.`,
  narration: `‘Aisha reported that when a person complained of an ailment or had a sore or a wound, the Prophet (ﷺ) would put his forefinger to the ground and then raise it, saying this.`,
  notes: [
    `The method: index finger touched to the ground, a little saliva on it, applied to the sore or wound with these words. It is authentic and often unknown. Note the ending — by the permission of our Lord — which is condition three stated inside the du‘a itself.`,
  ],
};

const WATER: SunnahItem = {
  id: "water",
  title: "Ruqyah water — what the evidence actually is",
  source: "Abu Dawud 3885  ·  Bukhari 5651  ·  Da'if in chain (al-Albani)  ·  Sahih (al-Bukhari)",
  arabic: `مَرِضْتُ مَرَضًا، فَأَتَانِي النَّبِيُّ صلى الله عليه وسلم يَعُودُنِي وَأَبُو بَكْرٍ وَهُمَا مَاشِيَانِ، فَوَجَدَانِي أُغْمِيَ عَلَىَّ، فَتَوَضَّأَ النَّبِيُّ صلى الله عليه وسلم ثُمَّ صَبَّ وَضُوءَهُ عَلَىَّ، فَأَفَقْتُ`,
  translation: `Jabir said: I fell ill, and the Prophet (ﷺ) and Abu Bakr came walking to visit me, and found me unconscious. The Prophet (ﷺ) performed wudu and then poured his wudu water over me, and I regained consciousness.`,
  notes: [
    `The narration people usually cite for ruqyah water is the one about Thabit ibn Qays, where the Prophet ﷺ put dust in a bowl of water, blew into it and poured it over him. That narration is graded weak in its chain by al-Albani, so it cannot carry the practice by itself. What is authentic is Jabir’s account above — water connected to the Prophet ﷺ poured over a sick man, with effect. Reciting into water and then drinking it or washing with it is permitted by the scholars on the strength of the general permission for ruqyah rather than on a single explicit text, and it was the practice of Ibn Taymiyyah, who would recite al-Fatihah over water and drink it, as Ibn al-Qayyim reports.`,
  ],
  callout: {
    tone: "amber",
    label: "State this accurately",
    text: `Ruqyah water is permitted and has scholarly backing. It is not, however, established by an explicit authentic hadith describing the Prophet ﷺ reciting Qur’an into water for a patient.`,
  },
};

const OIL: SunnahItem = {
  id: "oil",
  title: "Ruqyah oil",
  source: "By analogy; no explicit hadith",
  notes: [
    `There is no narration of the Prophet ﷺ reciting over oil and applying it. The practice is permitted by the same reasoning as water — the general permission for ruqyah, and the absence of anything forbidding it. Olive oil itself is praised in the Sunnah as coming from a blessed tree, and anointing with it is recommended, but that is a separate matter from reciting over it.`,
  ],
  callout: { tone: "amber", label: "Presented honestly", text: `Ruqyah oil is a permissible extension, not a prophetic prescription.` },
};

export const MUSLIM_2188: SunnahItem = {
  id: "eye",
  title: "The evil eye is real — and has its own remedy",
  source: "Muslim 2188  ·  Sahih (Muslim)",
  arabic: `الْعَيْنُ حَقٌّ وَلَوْ كَانَ شَىْءٌ سَابَقَ الْقَدَرَ سَبَقَتْهُ الْعَيْنُ وَإِذَا اسْتُغْسِلْتُمْ فَاغْسِلُوا`,
  transliteration: `Al-ʿaynu ḥaqq. Wa law kāna shayʾun sābaqa ʾl-qadara sabaqat-hu ʾl-ʿayn. Wa idha ʾstughsiltum fa-ghsilū.`,
  translation: `The evil eye is real. If anything were to overtake the divine decree, it would be the evil eye. And when you are asked to wash, then wash.`,
  narration: `Ibn ‘Abbas reported that the Prophet (ﷺ) said this.`,
  notes: [
    `The last clause is a distinct remedy, separate from recitation: the person suspected of having given the eye is asked to wash, and that water is poured over the one affected. He must comply if asked — that is the force of the command. The fuller narration of Sahl ibn Hunayf describes the method in more detail. This is a prophetic remedy for ‘ayn specifically and is not a general ruqyah technique.`,
  ],
};

export const BUKHARI_5445: SunnahItem = {
  id: "ajwa",
  title: "Ajwa dates",
  source: "Bukhari 5445  ·  Sahih (al-Bukhari)",
  arabic: `مَنْ تَصَبَّحَ كُلَّ يَوْمٍ سَبْعَ تَمَرَاتٍ عَجْوَةً لَمْ يَضُرُّهُ فِي ذَلِكَ الْيَوْمِ سُمٌّ وَلاَ سِحْرٌ`,
  transliteration: `Man taṣabbaḥa kulla yawmin sabʿa tamarātin ʿajwatan, lam yaḍurruhu fī dhālika ʾl-yawmi summun wa lā siḥr.`,
  translation: `Whoever eats seven Ajwa dates in the morning will not be harmed that day by poison or magic.`,
  narration: `Sa‘d ibn Abi Waqqas reported that the Prophet (ﷺ) said this.`,
  notes: [`An authentic protective practice, in al-Bukhari. The virtue is stated for Ajwa specifically and for the morning.`],
};

const BLACK_SEED: SunnahItem = {
  id: "black-seed",
  title: "Black seed",
  source: "Bukhari 5688  ·  Sahih (al-Bukhari)",
  arabic: `فِي الْحَبَّةِ السَّوْدَاءِ شِفَاءٌ مِنْ كُلِّ دَاءٍ إِلاَّ السَّامَ`,
  transliteration: `Fi ʾl-ḥabbati ʾs-sawdāʾi shifāʾun min kulli dāʾin illa ʾs-sām.`,
  translation: `In black seed there is healing for every disease except death.`,
  narration: `Abu Hurairah reported that the Prophet (ﷺ) said this. The narrator explains that as-sām means death.`,
  notes: [`Prophetic medicine rather than ruqyah, but it belongs in the same companion, since it is authentic and frequently confused with folk remedies that are not.`],
};

const AMULETS: SunnahItem = {
  id: "amulets",
  title: "Amulets, ta‘wiz and hung objects",
  source: "Abu Dawud 3883  ·  Tirmidhi 2072  ·  Sahih (al-Albani)  ·  the second, da'if",
  arabic: `مَنْ تَعَلَّقَ شَيْئًا وُكِلَ إِلَيْهِ`,
  transliteration: `Man taʿallaqa shayʾan wukila ilayh.`,
  translation: `Whoever attaches himself to a thing is entrusted to it.`,
  notes: [
    `Tama’im — amulets hung on the body for protection — are named as shirk in the authentic narration of Ibn Mas‘ud: “Indeed ruqā, amulets and love-charms are shirk” (Abu Dawud 3883). The narration “whoever attaches himself to a thing is entrusted to it” carries the meaning well, though it is graded weak, so the ruling rests on the first. Scholars differed historically over amulets containing only Qur’an, but the position of Ibn Mas‘ud and those who followed him was to forbid them all, closing the door — which is the position generally taken today.`,
  ],
};

export const RAQI_FLAGS = [
  "Asking for the patient’s name and mother’s name before beginning",
  "Speaking to a jinn, asking it questions, or taking its answers as information",
  "Claiming to see or name the jinn afflicting someone",
  "Requiring payment before treatment, or large open-ended fees",
  "Striking or restraining the patient",
  "Using knives, salt, eggs, lead-pouring, or drawing symbols",
  "Prescribing recitation counts that are not reported",
  "Requiring the patient to return repeatedly",
  "Diagnosing magic in a person’s home and locating a buried object",
];

const RAQI: SunnahItem = {
  id: "raqi",
  title: "The practices of the commercial raqi",
  source: "Fails the three conditions",
  notes: [
    `None of this is from the Prophet ﷺ or the Companions. The method of the Prophet ﷺ is the whole of what was transmitted, and it is simple enough that a person performs it on themselves.`,
  ],
  callout: {
    tone: "grey",
    label: "The tell",
    text: `Ruqyah as transmitted needs no intermediary, no fee, no diagnosis and no secret. When a practice requires a specialist who alone knows what to say, that is the signal to walk away.`,
  },
};

const DISSOLVING: SunnahItem = {
  id: "dissolving",
  title: "Writing Qur’an and dissolving it, and similar",
  source: "Disputed among the salaf",
  callout: {
    tone: "amber",
    label: "Scholars differ",
    text: `Some of the salaf permitted writing Qur’anic verses and washing the ink into water to drink, and it is reported from Ibn ‘Abbas and permitted by Ibn Taymiyyah. Others disallowed it. It is therefore a genuine scholarly difference rather than an invention — but it is not an established prophetic practice.`,
  },
};

const MEDICINE: SunnahItem = {
  id: "medicine",
  title: "Turning ruqyah into a substitute for medicine",
  source: "Not from the Sunnah",
  notes: [
    `The Prophet ﷺ commanded seeking treatment: “O servants of Allah, seek treatment, for Allah has not created a disease without creating a cure for it.” He used ruqyah, and he used honey, cupping, and dietary remedies. Ruqyah is not an alternative to medical care, and framing it as one causes real harm. Anyone with a medical or psychiatric condition should be under proper care; ruqyah accompanies that, it does not replace it.`,
  ],
  callout: { tone: "grey", label: "See a doctor", text: `Symptoms warranting medical attention need a doctor.` },
};

export type RuqyahSection = { id: string; title: string; intro?: string; items: SunnahItem[]; flags?: boolean; myths?: boolean };

export const MYTHS: { myth: string; truth: string }[] = [
  { myth: "You need a shaykh or specialist to do ruqyah", truth: "False. The Prophet ﷺ performed ruqyah on himself nightly. Self-ruqyah is the sunnah." },
  { myth: "You need to pay someone for ruqyah", truth: "False. The method is simple enough that anyone does it on themselves." },
  { myth: "Ruqyah replaces medical treatment", truth: "False. The Prophet ﷺ commanded seeking treatment and used physical remedies himself." },
  { myth: "Amulets with Qur’an on them are okay", truth: "The position of Ibn Mas‘ud and those who followed him was to forbid them all, closing the door." },
  { myth: "You need special counts like “Surah al-Baqarah 7 times” or “313 repetitions”", truth: "False. No basis. Only the counts actually reported are prescribed." },
  { myth: "The evil eye isn’t real", truth: "False. The Prophet ﷺ said: “The evil eye is real” (Muslim 2188). It has its own specific remedy." },
];

export const RUQYAH_SECTIONS: RuqyahSection[] = [
  {
    id: "what",
    title: "What Ruqyah Is, and Its Three Conditions",
    intro: "Ruqyah is recitation of the Qur’an, the names of Allah and the du‘as reported from the Prophet ﷺ over oneself or another, seeking healing and protection. It is worship, not technique.",
    items: [MUSLIM_2200, ABU_DAWUD_3883, THREE_CONDITIONS],
  },
  { id: "seventy", title: "The 70,000 — and What It Actually Says", items: [BUKHARI_5705] },
  {
    id: "method",
    title: "The Prophet’s ﷺ Own Method",
    intro: "Three narrations give the complete mechanics: what to recite, what to do with the hands, and where to wipe.",
    items: [BUKHARI_5017, BUKHARI_5675, MUSLIM_2186, BUKHARI_5736, MUSLIM_2202, BUKHARI_5745],
  },
  {
    id: "remedies",
    title: "Water, Oil, the Evil Eye and Prophetic Remedies",
    intro: "This is where the evidence is more mixed, and where the honest answer is not the popular one.",
    items: [WATER, OIL, MUSLIM_2188, BUKHARI_5445, BLACK_SEED],
  },
  {
    id: "not-sunnah",
    title: "What Is Not From the Sunnah",
    intro: "Ruqyah attracts more invented practice than almost any other area of worship, because people are desperate and the market is unregulated. Each item below fails at least one of the three conditions.",
    items: [AMULETS, RAQI, DISSOLVING, MEDICINE],
    flags: true,
  },
  { id: "myths", title: "Myths vs. Sunnah", items: [], myths: true },
];

// ---------- Daily checklist ----------

export type RuqyahCheck = { id: string; label: string; to?: "/app" | "/app/evening" };
export const RUQYAH_CHECKLIST: { group: string; items: RuqyahCheck[] }[] = [
  {
    group: "Morning",
    items: [
      { id: "m-kursi", label: "Āyat al-Kursi, once", to: "/app" },
      { id: "m-quls", label: "Al-Ikhlāṣ, al-Falaq, an-Nās, three times each", to: "/app" },
      { id: "m-bismillah", label: "Bismillāhi ʾlladhī lā yaḍurru maʿa ʾsmihi shayʾ, three times", to: "/app" },
      { id: "m-audhu", label: "Aʿūdhu bi-kalimāti ʾllāhi ʾt-tāmmāti min sharri mā khalaq" },
      { id: "m-ajwa", label: "Seven Ajwa dates, if available" },
    ],
  },
  {
    group: "Through the day",
    items: [
      { id: "d-bismillah", label: "Say Bismillah before eating, drinking, entering the home, and undressing" },
      { id: "d-bless", label: "On seeing something you admire in another, ask Allah to bless it for them, so your own gaze carries no harm" },
    ],
  },
  {
    group: "Evening",
    items: [
      { id: "e-adhkar", label: "The same adhkar as the morning, in the evening wording", to: "/app/evening" },
      { id: "e-audhu", label: "Aʿūdhu bi-kalimāti ʾllāhi ʾt-tāmmāti min sharri mā khalaq, three times", to: "/app/evening" },
    ],
  },
  { group: "After each obligatory prayer", items: [{ id: "s-kursi", label: "Āyat al-Kursi" }] },
  {
    group: "At night",
    items: [
      { id: "n-baqarah", label: "The last two verses of al-Baqarah" },
      { id: "n-method", label: "The Prophet’s ﷺ method: cup the hands, blow, recite the three suras, wipe over the body, three times" },
      { id: "n-prayers", label: "Keep the obligatory prayers. Nothing in this list substitutes for them." },
    ],
  },
];

// ---------- Self-ruqyah steps ----------

export type RuqyahStep = { title: string; item?: SunnahItem; note?: string };
export const SELF_STEPS: RuqyahStep[] = [
  { title: "Place your right hand on the place of pain or on your chest." },
  { title: "Recite al-Fatihah." },
  { title: "Recite Āyat al-Kursi." },
  { title: "Recite al-Ikhlāṣ, al-Falaq and an-Nās." },
  { title: "Say: Adhhibi ʾl-baʾsa Rabba ʾn-nās…", item: BUKHARI_5675 },
  {
    title: "Say: Bismillāhi arqī nafsī min kulli shayʾin yuʾdhīnī… (adapted for yourself)",
    item: MUSLIM_2186,
    note: "For yourself, the endings change to arqī nafsī and yashfīnī.",
  },
  { title: "For localised pain: Bismillāh three times, then the refuge du‘a seven times, hand on the place.", item: MUSLIM_2202 },
  { title: "Blow lightly into the hands and wipe over yourself. Repeat as often as you wish — no upper limit is set." },
  { title: "If you suspect the evil eye from a specific person, ask them to wash, and pour that water over yourself.", item: MUSLIM_2188 },
];

// ---------- Verses ----------

export const VERSES: { title: string; source: string; tag: string; note: string; item?: SunnahItem; to?: "/app" }[] = [
  { title: "Al-Fatihah", source: "Bukhari 5736", tag: "For ruqyah and healing", note: "Established as ruqyah by the hadith of the stung chief.", item: BUKHARI_5736 },
  { title: "Āyat al-Kursi (2:255)", source: "Qur’an 2:255", tag: "Protection", note: "Established as protection.", to: "/app" },
  { title: "The last two verses of al-Baqarah (2:285–286)", source: "Qur’an 2:285–286", tag: "Nightly protection", note: "Nightly protection." },
  { title: "Al-Ikhlāṣ, al-Falaq and an-Nās", source: "Bukhari 5017", tag: "Protection from harm", note: "The Prophet’s ﷺ own nightly recitation, three times.", item: BUKHARI_5017 },
  { title: "The opening verses of al-Baqarah (2:1–5)", source: "Qur’an 2:1–5", tag: "Protection", note: "Named among the recitations of ruqyah." },
  { title: "Verses on magic", source: "Al-A‘raf 117–122 · Yunus 79–82 · Ta-Ha 65–69", tag: "Against magic", note: "Where relevant." },
];
