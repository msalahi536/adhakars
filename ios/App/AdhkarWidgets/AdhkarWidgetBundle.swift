// AdhkarWidgetBundle.swift
// Sahih Al-Adhkar Widget Extension
// Main entry point registering all widgets.
// Users swipe through the widget picker to find their preferred style.

import WidgetKit
import SwiftUI

@main
struct AdhkarWidgetBundle: WidgetBundle {
    var body: some Widget {
        // Prayer time variants — stacked & grid layouts
        NextThreePrayersWidget()       // Next 3 — stacked list
        NextPrayersGridWidget()        // Next 3 — side by side grid
        AllFivePrayerTimesWidget()     // All 5 — stacked list
        AllPrayersGridWidget()         // All 5 — side by side grid

        // Wake/Sleep Dua — swipe to pick your language
        WakeSleepDuaWidget()           // Full — Arabic + transliteration + translation
        WakeSleepDuaArabicWidget()     // Arabic only — big calligraphy
        WakeSleepDuaEnglishWidget()    // English translation only
        WakeSleepDuaTranslitWidget()   // Transliteration only

        // Daily Dhikr — one language per widget
        DailyDhikrWidget()            // Arabic only
        DailyDhikrEnglishWidget()     // English only
        DailyDhikrTranslitWidget()    // Transliteration only

        // Daily Dua — one language per widget
        DailyDuaWidget()              // Arabic only
        DailyDuaEnglishWidget()       // English only
        DailyDuaTranslitWidget()      // Transliteration only

        // Quran Verse — one language per widget
        QuranVerseWidget()            // Arabic only
        QuranVerseEnglishWidget()     // English only

        // 99 Names of Allah — one language per widget
        NamesOfAllahWidget()          // Arabic only
        NamesOfAllahEnglishWidget()   // English (transliteration + meaning)

        // Sunnah of the Day — English content
        SunnahOfTheDayWidget()

        // Utility
        HijriDateWidget()

        // Live Activity — Dynamic Island for adhan playback
        AdhanLiveActivity()
    }
}
