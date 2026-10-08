// CapacitorBridge.swift
// Sahih Al-Adhkar
// Bridges data from the Capacitor webview to the widget extension via App Groups.

import Foundation
import WidgetKit

class AdhkarWidgetBridge {
    static let shared = AdhkarWidgetBridge()
    private let defaults = UserDefaults(suiteName: appGroupID)

    // MARK: - Location (for prayer time widgets)

    func updateLocation(latitude: Double, longitude: Double, calcMethod: Int = 2, school: Int = 0) {
        defaults?.set(latitude, forKey: WidgetDataKeys.latitude)
        defaults?.set(longitude, forKey: WidgetDataKeys.longitude)
        defaults?.set(calcMethod, forKey: WidgetDataKeys.calcMethod)
        defaults?.set(school, forKey: WidgetDataKeys.school)
        // Clear cached prayer times so widgets re-fetch with new settings
        defaults?.removeObject(forKey: WidgetDataKeys.prayerTimes)
        defaults?.removeObject(forKey: WidgetDataKeys.prayerTimesDate)
        reloadPrayerWidgets()
    }

    // MARK: - Prayer Times Sync (from web app)

    /// Saves the exact prayer times the app calculated, so widgets show identical times.
    /// Each dict: { "id": "Fajr", "hour": 5, "minute": 23 }
    func syncPrayerTimes(_ timesArray: [[String: Any]]) {
        let cal = Calendar.current
        let now = Date()

        let prayers: [PrayerTime] = timesArray.compactMap { dict in
            guard let id = dict["id"] as? String,
                  let hour = dict["hour"] as? Int,
                  let minute = dict["minute"] as? Int else { return nil }

            var comps = cal.dateComponents([.year, .month, .day], from: now)
            comps.hour = hour
            comps.minute = minute
            comps.second = 0
            guard let date = cal.date(from: comps) else { return nil }

            return PrayerTime(
                id: id,
                name: id,
                abbreviation: PrayerTime.abbreviations[id] ?? String(id.prefix(3)).uppercased(),
                time: date,
                timeString: DateFormatter.timeOnly.string(from: date)
            )
        }

        if !prayers.isEmpty {
            SharedData.shared.savePrayerTimes(prayers)
            reloadPrayerWidgets()
        }
    }

    // MARK: - Tasbih Counter

    func updateTasbihCount(count: Int, target: Int, phrase: String) {
        defaults?.set(count, forKey: WidgetDataKeys.tasbihCount)
        defaults?.set(target, forKey: WidgetDataKeys.tasbihTarget)
        defaults?.set(phrase, forKey: WidgetDataKeys.tasbihPhrase)
        WidgetCenter.shared.reloadTimelines(ofKind: "TasbihQuickAccessWidget")
    }

    // MARK: - Theme

    func updateTheme(_ theme: String) {
        defaults?.set(theme, forKey: WidgetDataKeys.userTheme)
        WidgetCenter.shared.reloadAllTimelines()
    }

    // MARK: - Reload Widgets

    func reloadAllWidgets() {
        WidgetCenter.shared.reloadAllTimelines()
    }

    func reloadPrayerWidgets() {
        WidgetCenter.shared.reloadTimelines(ofKind: "NextThreePrayersWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "AllFivePrayerTimesWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "NextPrayersGridWidget")
        WidgetCenter.shared.reloadTimelines(ofKind: "AllPrayersGridWidget")
    }
}
