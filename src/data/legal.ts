export type LegalSection = { heading: string; body: string };

export const LEGAL_UPDATED = "Last updated: July 2026";

export const PRIVACY_INTRO =
  "Sahih Al-Adhkar does not collect, transmit, or store any personal data. There are no analytics, no advertising, and no tracking of any kind.";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "WHAT IS STORED",
    body: "Your counts, streaks, lifetime totals, display preferences, and any custom adhkar you create are saved locally on your device. This information never leaves your device and is never sent to us or to anyone else.",
  },
  {
    heading: "COOKIES AND LOCAL STORAGE",
    body: "This app does not use advertising or tracking cookies. It uses your device's local storage only to remember your progress and preferences so the app works between sessions. This data stays on your device and is cleared when you reset your progress or uninstall the app.",
  },
  {
    heading: "LOCATION",
    body: "The Qibla Finder uses your device location and motion sensors to calculate the direction of the Ka'bah. This calculation happens entirely on your device. Your location is never stored, logged, or transmitted.",
  },
  {
    heading: "NOTIFICATIONS",
    body: "Daily reminders are scheduled on your device using your device clock. No reminder data is sent to any server.",
  },
  {
    heading: "DELETING YOUR DATA",
    body: "You can erase everything at any time using Reset all progress in Settings, or by uninstalling the app.",
  },
  {
    heading: "CHILDREN",
    body: "This app does not collect data from anyone, including children.",
  },
  {
    heading: "CHANGES",
    body: "If this policy changes, the updated version will appear here with a new date.",
  },
  {
    heading: "CONTACT",
    body: "Questions about privacy can be sent to msalahi536@gmail.com",
  },
];

export const TERMS_INTRO =
  "Sahih Al-Adhkar is free to use. Please read these terms before using the app.";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "THE APP",
    body: "Sahih Al-Adhkar is provided free of charge, as is, and without warranty of any kind. It is offered as a benefit to the community and is not a substitute for scholarly guidance. For any ruling or religious question, please return to the people of knowledge.",
  },
  {
    heading: "ACCURACY",
    body: "Every adhkar in this app is presented with its source so that you can verify it. Every effort has been made to be accurate. If you find a mistake, please report it and it will be corrected.",
  },
  {
    heading: "YOUR CONTENT",
    body: "Custom adhkar that you create are stored on your device only. You are responsible for what you add. We do not review, store, or have access to this content.",
  },
  {
    heading: "LIMITATION OF LIABILITY",
    body: "This app is provided without warranty. We are not responsible for any loss of data, including counts, streaks, or custom adhkar.",
  },
  {
    heading: "CHANGES",
    body: "These terms may be updated. Continued use of the app means you accept the current terms.",
  },
  { heading: "CONTACT", body: "msalahi536@gmail.com" },
];

export const SITE_ORIGIN = "https://sahihaladhkar.com";
