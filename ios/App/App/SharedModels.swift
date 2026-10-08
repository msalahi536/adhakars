// SharedModels.swift
// Sahih Al-Adhkar Widget Extension
// Shared data models between the main app and widget extensions.

import Foundation
import WidgetKit

// MARK: - App Group
let appGroupID = "group.com.mindcastmedia.adhkar"

// MARK: - UserDefaults Keys
struct WidgetDataKeys {
    static let prayerTimes      = "widget_prayer_times"
    static let prayerTimesDate  = "widget_prayer_times_date"
    static let dailyDhikr       = "widget_daily_dhikr"
    static let dailyDua         = "widget_daily_dua"
    static let quranVerse       = "widget_quran_verse"
    static let sunnahOfTheDay   = "widget_sunnah_of_the_day"
    static let nameOfAllah      = "widget_name_of_allah"
    static let tasbihCount      = "widget_tasbih_count"
    static let tasbihTarget     = "widget_tasbih_target"
    static let tasbihPhrase     = "widget_tasbih_phrase"
    static let latitude         = "widget_latitude"
    static let longitude        = "widget_longitude"
    static let calcMethod       = "widget_calc_method"
    static let school          = "widget_school"           // 0 = Shafi, 1 = Hanafi
    static let userTheme        = "widget_user_theme"
    static let lastUpdated      = "widget_last_updated"
}

// MARK: - Prayer Model
struct PrayerTime: Codable, Identifiable {
    let id: String       // "Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"
    let name: String
    let abbreviation: String
    let time: Date
    let timeString: String

    var icon: String {
        switch id {
        case "Fajr":    return "sunrise"
        case "Dhuhr":   return "sun.max"
        case "Asr":     return "sun.haze"
        case "Maghrib": return "sunset"
        case "Isha":    return "moon.stars"
        default:        return "clock"
        }
    }

    static let abbreviations: [String: String] = [
        "Fajr": "FJR",
        "Dhuhr": "DHR",
        "Asr": "ASR",
        "Maghrib": "MGH",
        "Isha": "ISH"
    ]
}

// MARK: - CMS Content Models
struct DhikrContent: Codable {
    let arabic: String
    let transliteration: String
    let translation: String
    let source: String?
    let category: String?
}

struct DuaContent: Codable {
    let arabic: String
    let transliteration: String
    let translation: String
    let source: String?
    let category: String?
    let occasion: String?
}

struct QuranVerseContent: Codable {
    let arabic: String
    let translation: String
    let surah: String
    let ayah: String
    let reference: String  // e.g. "Al-Ahzab 33:35"
}

struct SunnahContent: Codable {
    let title: String
    let description: String
    let source: String?
    let arabic: String?
    let transliteration: String?
}

struct NameOfAllah: Codable {
    let number: Int
    let arabic: String
    let transliteration: String
    let meaning: String
}

// MARK: - Hijri Date
struct HijriDate: Codable {
    let day: Int
    let month: String
    let monthNumber: Int
    let year: Int
    let designation: String  // "AH"

    var formatted: String {
        "\(day) \(month) \(year) \(designation)"
    }
}

// MARK: - Theme
enum AppTheme: String, Codable {
    case light
    case dark
    case system

    static func current() -> AppTheme {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let raw = defaults.string(forKey: WidgetDataKeys.userTheme),
              let theme = AppTheme(rawValue: raw)
        else { return .system }
        return theme
    }
}

// MARK: - Shared UserDefaults Access
class SharedData {
    static let shared = SharedData()
    let defaults: UserDefaults?

    private init() {
        defaults = UserDefaults(suiteName: appGroupID)
    }

    func savePrayerTimes(_ prayers: [PrayerTime]) {
        guard let data = try? JSONEncoder().encode(prayers) else { return }
        defaults?.set(data, forKey: WidgetDataKeys.prayerTimes)
        defaults?.set(DateFormatter.yyyyMMdd.string(from: Date()), forKey: WidgetDataKeys.prayerTimesDate)
    }

    func loadPrayerTimes() -> [PrayerTime]? {
        guard let data = defaults?.data(forKey: WidgetDataKeys.prayerTimes),
              let dateStr = defaults?.string(forKey: WidgetDataKeys.prayerTimesDate),
              dateStr == DateFormatter.yyyyMMdd.string(from: Date()),
              let prayers = try? JSONDecoder().decode([PrayerTime].self, from: data)
        else { return nil }
        return prayers
    }

    func saveContent<T: Encodable>(_ content: T, forKey key: String) {
        guard let data = try? JSONEncoder().encode(content) else { return }
        defaults?.set(data, forKey: key)
    }

    func loadContent<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = defaults?.data(forKey: key),
              let content = try? JSONDecoder().decode(T.self, from: data)
        else { return nil }
        return content
    }
}

// MARK: - DateFormatter Extension
extension DateFormatter {
    static let yyyyMMdd: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static let timeOnly: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f
    }()

    static let timeOnly24: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "HH:mm"
        return f
    }()
}
