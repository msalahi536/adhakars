/**
 * Zakat evidence. Arabic, English and grading are intentionally left empty:
 * they are filled verbatim from sunnah.com and quran.com by the project owner.
 * Never generate or paraphrase this text. When a field is empty the UI shows
 * the reference only.
 */
export interface Evidence {
  id: string;
  topic: string;
  title: string;
  source: string;
  url?: string;
  arabic: string;
  english: string;
  grading: string;
  /** Recorded for completeness, never displayed as evidence. */
  hidden?: boolean;
  note?: string;
}

export const EVIDENCE: Evidence[] = [
  { id: "rate-silver-abu-bakr", topic: "rate", title: "Rate of one quarter of a tenth on silver", source: "Sahih al-Bukhari 1454", url: "https://sunnah.com/bukhari:1454", arabic: "", english: "", grading: "" },
  { id: "five-awaq", topic: "nisab", title: "No zakat on less than five awaq of silver", source: "Sahih al-Bukhari 1405", url: "https://sunnah.com/bukhari:1405", arabic: "", english: "", grading: "" },
  { id: "five-awaq-muslim", topic: "nisab", title: "No zakat on less than five awaq of silver", source: "Sahih Muslim 979", url: "https://sunnah.com/muslim:979", arabic: "", english: "", grading: "" },
  { id: "nisab-hawl-ali", topic: "nisab", title: "Nisab of 20 dinars and 200 dirhams, and the year condition", source: "Sunan Abi Dawud 1573", url: "https://sunnah.com/abudawud:1573", arabic: "", english: "", grading: "" },
  { id: "hawl-ibn-majah", topic: "hawl", title: "No zakat until a year passes", source: "Sunan Ibn Majah 1792", url: "https://sunnah.com/ibnmajah:1792", arabic: "", english: "", grading: "" },
  { id: "jewelry-bracelets", topic: "jewelry", title: "The woman with two bracelets", source: "Sunan Abi Dawud 1563", url: "https://sunnah.com/abudawud:1563", arabic: "", english: "", grading: "" },
  { id: "jewelry-umm-salamah", topic: "jewelry", title: "Umm Salamah: what reaches the amount is not a hoard", source: "Sunan Abi Dawud 1564", url: "https://sunnah.com/abudawud:1564", arabic: "", english: "", grading: "" },
  { id: "jewelry-aisha-rings", topic: "jewelry", title: "Aisha's rings", source: "Sunan Abi Dawud 1565", url: "https://sunnah.com/abudawud:1565", arabic: "", english: "", grading: "" },
  { id: "jewelry-companions-muwatta", topic: "jewelry", title: "Aisha and Ibn Umar not paying zakat on their dependents' jewelry", source: "al-Muwatta, Book of Zakat", url: "https://sunnah.com/malik/17", arabic: "", english: "", grading: "" },
  { id: "no-zakat-jewelry-weak", topic: "jewelry", title: "Narration \"There is no zakat on jewelry\"", source: "Graded weak by Ibn Baz and others", arabic: "", english: "", grading: "", hidden: true },
  { id: "uthman-zakat-month", topic: "debts", title: "'Uthman: this is the month of your zakat", source: "al-Muwatta, Book of Zakat", url: "https://sunnah.com/malik/17", arabic: "", english: "", grading: "" },
  { id: "ali-doubtful-debt", topic: "receivables", title: "Report of 'Ali about a doubtful debt", source: "al-Albani, Irwa' al-Ghalil 3/252", arabic: "", english: "", grading: "" },
  { id: "abbas-advance", topic: "advance", title: "Advancing zakat: al-'Abbas", source: "Sunan Abi Dawud 1624", url: "https://sunnah.com/abudawud:1624", arabic: "", english: "", grading: "" },
  { id: "zaynab-husband", topic: "recipients", title: "Zaynab, the wife of Ibn Mas'ud, giving to her husband", source: "Sahih al-Bukhari 1466", url: "https://sunnah.com/bukhari:1466", arabic: "", english: "", grading: "" },
  { id: "zaynab-husband-muslim", topic: "recipients", title: "Zaynab, the wife of Ibn Mas'ud, giving to her husband", source: "Sahih Muslim 1000", url: "https://sunnah.com/muslim:1000", arabic: "", english: "", grading: "" },
  { id: "recipients-960", topic: "recipients", title: "The eight categories of recipients", source: "Qur'an 9:60", url: "https://quran.com/9/60", arabic: "", english: "", grading: "" },
  { id: "hoarding-934", topic: "hoarding", title: "Hoarding gold and silver", source: "Qur'an 9:34 to 35", url: "https://quran.com/9/34-35", arabic: "", english: "", grading: "" },
  { id: "iifa-28", topic: "shares", title: "Zakat on company shares", source: "International Islamic Fiqh Academy Resolution 28 (3/4), 1988", arabic: "", english: "", grading: "" },
  { id: "iifa-121", topic: "shares", title: "Shares held for income", source: "International Islamic Fiqh Academy Resolution 121 (3/13), 2001", arabic: "", english: "", grading: "" },
];

export const CONTEMPORARY_SOURCES = [
  "Fatawa al-Lajnah al-Da'imah, vol. 9 (including fatwa 9410 on the Hijri year)",
  "Council of Senior Scholars, resolution 10 (1393 AH)",
];

export const evidenceById = (id: string) => EVIDENCE.find((e) => e.id === id && !e.hidden);
export const evidenceByTopic = (topic: string) => EVIDENCE.filter((e) => e.topic === topic && !e.hidden);
