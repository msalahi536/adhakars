export type LegalSection = { heading: string; body: string };

export const LEGAL_UPDATED = "Last updated: November 1, 2026";

export const PRIVACY_INTRO =
  "Sahih Al-Adhkar is designed to keep worship progress and sensitive health entries on your device. Some features contact external services, and information you choose to submit may be processed online. This notice explains those distinctions; it does not promise that every network request is anonymous.";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "WHO IS RESPONSIBLE",
    body: "This notice covers the Sahih Al-Adhkar app and sahihaladhkar.com, operated by Mohammad Salahi. For privacy questions, requests or concerns, contact msalahi536@gmail.com. External websites, app stores and service providers have their own policies.",
  },
  {
    heading: "WORSHIP PROGRESS AND DEVICE STORAGE",
    body: "Dhikr counts, streaks, saved duas, tasbih sessions, prayer settings, fasting logs, Ruqyah and Hajj progress, reminders, appearance preferences and Hifz progress are ordinarily stored on your device. Personal appearance photos are stored on the device and are not sent for remote photo analysis. We do not automatically upload this local progress. Device or browser backups, shared devices, explicit exports and operating-system services are outside that promise. Local storage is not a substitute for device security or a guaranteed backup.",
  },
  {
    heading: "PERIOD AND MENSTRUAL HEALTH DATA",
    body: "Period Companion dates, cycle history, predictions and notes are stored locally. The app does not intentionally upload these entries or use them for advertising, profiling or model training. Someone with access to your unlocked device or its backups may see them. Protect your device with a passcode and consider operating-system backup settings. Predictions and devotional guidance are estimates, not medical advice, contraception, fertility guidance or a diagnosis.",
  },
  {
    heading: "MICROPHONE AND RECITATION",
    body: "Hifz checking, Follow the imam and voice ayah search process microphone audio on your device. They require microphone permission; you may refuse it or revoke it in device settings. Model and answer-key downloads require an internet connection but do not require sending your recitation to a recognition service. During an AI attempt, the app may make a temporary recording in memory for Replay and word clips. It is discarded when its result is dismissed, replaced or the feature is closed. Explicit debug exports save a recording and diagnostic details to a file you choose to keep or share; they are not automatically sent to us. Voice recordings can reveal your identity or background conversations, so record only yourself in a suitable private setting. Recognition is not used to identify you or create a voice identity profile.",
  },
  {
    heading: "OPTIONAL RECITATION PROBLEM REPORTS",
    body: "If sample reporting is made available, it must default off and accept reports only from people who confirm they are 18 or older. Enabling it alone must not upload audio: a separate Report a problem action is required for each submission. Before sending, the report must identify the recording, what the checker heard, word comparisons, passage, technical diagnostics and optional note included. A submitted report may also contain an account identifier and consent/submission dates. Reports are for investigating recitation-checker problems, not advertising, voice identification or unrelated AI training. They must be private, not sold or publicly shared; authorized operators and contracted hosting providers may process them for that purpose, and disclosure may be required by law. When available, Delete my samples must remove active reports and files; requests can also be sent to the contact address. Already downloaded copies and provider backups may not disappear immediately. If these controls are not available, do not submit audio; use a written description instead. Do not include someone else's voice, a child's recording or sensitive background conversations.",
  },
  {
    heading: "LOCATION, PRAYER TIMES AND SENSORS",
    body: "Saved coordinates, the selected calculation method and prayer source help prayer times, alerts, widgets and Qibla remain aligned. Qibla uses device sensors and coordinates locally. Fetching prayer timetables or resolving a place can send coordinates or a place query to the selected provider, including Aladhan, Waktu Solat for JAKIM, Open-Meteo geocoding or BigDataCloud reverse geocoding. Providers can also receive your IP address and routine request metadata. These requests are not anonymous merely because you have no account. You may deny or revoke location permission and use available manual location controls.",
  },
  {
    heading: "QURAN, HADITH, AUDIO AND OTHER ONLINE SERVICES",
    body: "Quran text, recitation audio, translations and tafsir are requested from Quran.com / Quran Foundation and audio providers; hadith browsing uses the app's source services. Requests can reveal requested passages or searches, IP address and technical metadata to those providers. Online AI search is separate from on-device recitation checking: submitted queries can be processed by the configured AI provider. Do not include health entries, private recordings or other sensitive information in online search. Hosting, content delivery and service providers may keep operational or security logs. We do not sell personal information or use recitation or health entries for targeted advertising.",
  },
  {
    heading: "ACCOUNTS, ADMINISTRATION AND OPTIONAL SUBMISSIONS",
    body: "Most devotional features do not require an account. Restricted administration uses authenticated sessions, and optional online features such as giveaway entries can store the details you provide, including email, consent and referral information, on our backend. Do not assume clearing local progress deletes a submitted entry or server-held information. Giveaway participation is optional; any prize and promotional email terms should be stated when you enter. Contact us about access, correction or deletion of information you submitted.",
  },
  {
    heading: "COOKIES, NOTIFICATIONS AND APP STORES",
    body: "Local storage remembers progress and preferences; authenticated features may use session cookies or similar security storage. Device reminders are scheduled locally and depend on permissions, the device clock and operating-system limits. External hosting, linked sites and app stores can process their own device, download, crash or request data under their own policies. This notice does not override those policies or guarantee that external services use no tracking technologies.",
  },
  {
    heading: "RETENTION, SECURITY AND DELETION",
    body: "Local information remains until removed through the relevant app controls, cleared from browser/device storage or otherwise deleted. Uninstalling or clearing browser data may not remove device backups, exported files or separately submitted online information. Server-held submissions should be retained only as needed for their stated purpose, security or legal obligations; ask the contact address about a particular record. We do not promise a fixed retention period or immediate backup erasure that has not been verified with the relevant provider. Reasonable safeguards reduce risk but no device, network or storage system is perfectly secure. Do not send passwords or unnecessary sensitive information in a report or email.",
  },
  {
    heading: "CHILDREN AND ADULT-ONLY AUDIO REPORTS",
    body: "Children may use suitable devotional reading tools with appropriate adult supervision, but recitation sample reporting is adults-only (18+). We do not knowingly accept children's recordings through that feature. If a child's information or recording has been submitted, contact us so we can investigate and remove it. A checkbox is a user declaration, not verified age identification. Other online features may have separate age and eligibility requirements.",
  },
  {
    heading: "YOUR PRIVACY RIGHTS",
    body: "Depending on where you live and the laws that apply, you may have rights to access, correct, delete or receive a copy of submitted personal information, object to or restrict processing, withdraw consent, or complain to a privacy regulator. Contact msalahi536@gmail.com; we may need limited information to verify that a request concerns you. Local information can be managed on your device. Withdrawal does not undo processing that was lawful before withdrawal. Necessary service processing, legal obligations and applicable exceptions may still apply. Information handled by hosting or other providers may be processed outside your country; applicable transfer requirements must be assessed for those services.",
  },
  {
    heading: "CHANGES AND CONTACT",
    body: "Material changes will be reflected here with a new date and, where required, a separate notice or renewed consent before new optional processing. Continuing to use the app is not a substitute for legally required privacy consent. Questions and requests: msalahi536@gmail.com.",
  },
];

export const TERMS_INTRO =
  "Sahih Al-Adhkar is offered free of charge as a benefit to the community. By using the app or this website you agree to these terms. Please read them carefully, including the disclaimers and the limits on our liability.";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "THE APP",
    body: "Sahih Al-Adhkar is provided free of charge, as is and as available, without warranty of any kind, express or implied, including any warranty of accuracy, fitness for a particular purpose, uninterrupted availability, or non-infringement. It is offered as a benefit to the community and is not a substitute for scholarly guidance. For any ruling or religious question, please return to the people of knowledge.",
  },
  {
    heading: "RELIGIOUS CONTENT AND ACCURACY",
    body: "Sources and grading are shown where available so you can verify religious content; missing labels do not establish authenticity. Translations and explanations are provided for understanding and are not formal legal rulings or fatwas. Scholars differ on many matters, including those relating to menstruation, purity, prayer, fasting, Ruqyah, and Hajj. Errors, incomplete references and translation differences are possible. Please report suspected errors for review; no correction deadline is guaranteed.",
  },
  {
    heading: "HEALTH AND MEDICAL DISCLAIMER",
    body: "The Period Companion, Fasting Companion, Ruqyah Companion, and all related guidance are for devotional, educational, and organisational purposes only. They do not provide medical, gynaecological, psychological, psychiatric, nutritional, or pharmaceutical advice, diagnosis, or treatment, and they are not a medical device. Nothing in this app is a contraceptive or fertility method. If you are pregnant, breastfeeding, diabetic, have an eating disorder, take medication, or have any medical or mental health condition, consult a qualified healthcare professional before fasting or relying on any information here. Never delay or disregard professional medical advice because of something you read in this app. In an emergency, contact your local emergency services.",
  },
  {
    heading: "PRAYER TIMES, QIBLA AND CALCULATIONS",
    body: "Prayer times, Hijri dates, Qibla direction, and cycle predictions use calculations, provider timetables or estimates and depend on your device's clock, location accuracy, sensor calibration, and chosen settings. Magnetic interference, poor GPS signal, and local conventions can affect results. Please verify against your local mosque or a trusted local authority. Verify important times and directions locally; notifications and widgets may be delayed or unavailable. The liability provisions below apply only to the extent permitted by law.",
  },
  {
    heading: "INTELLECTUAL PROPERTY AND THIRD-PARTY LICENSES",
    body: "We claim rights only in original branding, code, artwork and arrangements that we own or are licensed to use. Quran text, reciter recordings, translations, tafsir, hadith editions, mushaf fonts, libraries and model weights may belong to their respective rightsholders and are subject to their own licenses and terms. See the acknowledgements and Open-source licenses notices. Our terms do not override open-source license permissions, mandatory statutory rights or third-party ownership, and do not grant reuse rights we do not hold. Attribution alone does not grant a license or imply endorsement.",
  },
  {
    heading: "PERMITTED AND PROHIBITED USE",
    body: "You may use the app for personal devotional and educational purposes and share links. Do not upload unlawful content, another person's voice without permission, children's recordings to adult-only reports, or material that infringes others' rights. Do not attempt unauthorized access, bypass access controls, distribute malware, abuse network services or falsely claim affiliation. Copying or commercial exploitation of our original protected material requires permission except where applicable law or an applicable third-party license permits it. Restrictions do not prohibit reverse engineering or other acts that cannot lawfully be restricted.",
  },
  {
    heading: "BETA AND AUTOMATIC RECITATION FEEDBACK",
    body: "Hifz, Follow the imam, voice search and automatic tajweed tips are experimental aids, not certification of correct Quran recitation, memorization, pronunciation or tajweed. Scores, word matches, hesitation detection and similar-ayah suggestions can be wrong or incomplete, even when marked Solid or clean. Tajweed hints do not reliably assess all articulation or recitation rules. Learn and verify recitation with a qualified teacher; do not rely on the app for examinations, religious rulings or safety-critical decisions. Beta features may change or lose compatibility. The licensed recitation-checking feature is offered free; no accuracy, latency or device-support guarantee is made.",
  },
  {
    heading: "YOUR DATA, RECORDINGS AND OPTIONAL REPORTS",
    body: "You retain any rights you have in your entries and recordings. You are responsible for device security and for the content you intentionally export or submit. Submitting a problem report gives us limited permission to store, listen to, analyze and reproduce it internally only as needed to investigate and improve recitation checking, subject to the Privacy Policy and your deletion rights; it does not transfer ownership or authorize sale, public publication, voice identification or unrelated model training. Do not submit third-party or children's audio. Local data, exported recordings and online submissions have different deletion controls. We cannot guarantee recovery of lost local progress or remove copies you have independently shared.",
  },
  {
    heading: "ZAKAT, FINANCIAL ESTIMATES AND OTHER GUIDANCE",
    body: "Zakat calculations and other financial or devotional estimates depend on your inputs, chosen assumptions, valuations and differing scholarly views. They are educational aids, not personalized legal, tax, investment or financial advice. Verify obligations with a qualified scholar and, where relevant, a qualified professional. AI-generated search matches and external content must be checked against their cited source.",
  },
  {
    heading: "AVAILABILITY AND CHANGES TO THE APP",
    body: "Subject to applicable notice requirements and mandatory rights, we may add, change, suspend or discontinue features, and we do not guarantee uninterrupted or error-free operation. Updates may change how features behave.",
  },
  {
    heading: "THIRD-PARTY LINKS AND STORES",
    body: "The app may link to external websites or be distributed through the Apple App Store and Google Play. We do not control and are not responsible for third-party content, services, or policies. Your use of those platforms is governed by their own terms.",
  },
  {
    heading: "LIMITATION OF LIABILITY AND MANDATORY RIGHTS",
    body: "To the extent permitted by applicable law, we exclude liability for indirect, incidental, special or consequential losses arising from use of an as-is educational service, including lost local data or interrupted features. These exclusions do not apply where unlawful and do not exclude or limit liability for fraud, intentional misconduct, gross negligence where protected, death or personal injury caused by negligence where protected, or any non-waivable consumer, privacy or other statutory rights. We do not impose a zero-dollar cap on liabilities that the law requires us to bear. Your legal remedies remain available where they cannot lawfully be excluded.",
  },
  {
    heading: "RESPONSIBILITY FOR MISUSE",
    body: "You are responsible for unlawful misuse and content you submit. To the extent legally enforceable, you may be responsible for reasonable direct losses caused by your unlawful conduct or infringement of another person's rights. This does not make you responsible for our negligence or impose an indemnity that mandatory consumer law prohibits.",
  },
  {
    heading: "DISPUTES AND APPLICABLE LAW",
    body: "Contact msalahi536@gmail.com to try to resolve a concern. These terms do not require mandatory arbitration, waive class proceedings or remove a court, consumer-protection law or remedy that you are entitled to use. Applicable law and jurisdiction are determined by the relevant legal rules; no exclusive forum or governing jurisdiction is asserted here.",
  },
  {
    heading: "CHANGES TO THESE TERMS",
    body: "These terms may be updated with a new date. Material changes will be notified where required; separate agreement will be obtained where legally necessary. Changes do not retrospectively remove accrued rights.",
  },
  {
    heading: "SEVERABILITY",
    body: "If any provision of these terms is found unenforceable, the remaining provisions continue in full force.",
  },
  { heading: "CONTACT", body: "msalahi536@gmail.com" },
];

export const SITE_ORIGIN = "https://sahihaladhkar.com";
