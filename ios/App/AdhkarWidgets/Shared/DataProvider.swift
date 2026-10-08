// DataProvider.swift
// Sahih Al-Adhkar Widget Extension
// Handles fetching data from Al-Adhan API and the app's CMS API.
// Widgets fetch their own prayer times using stored location from app,
// or fall back to CLLocationManager if no location is stored yet.

import Foundation
import CoreLocation

class WidgetDataProvider: NSObject {
    static let shared = WidgetDataProvider()
    private let cmsBaseURL = "https://sahihaladhkar.com/api/widgets"
    private let adhanBaseURL = "https://api.aladhan.com/v1"

    // MARK: - Location Fallback

    /// Gets location from App Group (set by the app), or falls back to CLLocationManager
    private func getLocation() async -> (lat: Double, lon: Double)? {
        let defaults = UserDefaults(suiteName: appGroupID)
        let lat = defaults?.double(forKey: WidgetDataKeys.latitude) ?? 0
        let lon = defaults?.double(forKey: WidgetDataKeys.longitude) ?? 0

        // If app has synced location, use it
        if lat != 0 && lon != 0 {
            return (lat, lon)
        }

        // Fallback: try CLLocationManager (requires widget to have location permission via main app)
        let locManager = CLLocationManager()
        if let location = locManager.location {
            let newLat = location.coordinate.latitude
            let newLon = location.coordinate.longitude
            // Cache it for next time
            defaults?.set(newLat, forKey: WidgetDataKeys.latitude)
            defaults?.set(newLon, forKey: WidgetDataKeys.longitude)
            return (newLat, newLon)
        }

        return nil
    }

    /// Public check: does the user have a stored or detectable location?
    func hasLocation() async -> Bool {
        return await getLocation() != nil
    }

    // MARK: - Prayer Times (Al-Adhan API)

    func fetchPrayerTimes() async -> [PrayerTime] {
        // Primary: use the exact times the app synced via the Capacitor bridge.
        // This guarantees widgets show the same times as the Salah page.
        if let synced = SharedData.shared.loadPrayerTimes() {
            return synced
        }

        // Fallback: if the app hasn't synced yet (first install, widget added
        // before opening the app), call the API directly.
        guard let loc = await getLocation() else { return samplePrayerTimes() }

        let defaults = UserDefaults(suiteName: appGroupID)
        let method = defaults?.integer(forKey: WidgetDataKeys.calcMethod) ?? 2 // ISNA default
        let school = defaults?.integer(forKey: WidgetDataKeys.school) ?? 0     // 0 = Shafi, 1 = Hanafi

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "dd-MM-yyyy"
        let dateStr = dateFormatter.string(from: Date())

        let tz = TimeZone.current.identifier
        let urlStr = "\(adhanBaseURL)/timings/\(dateStr)?latitude=\(loc.lat)&longitude=\(loc.lon)&method=\(method)&school=\(school)&timezonestring=\(tz)"
        guard let url = URL(string: urlStr) else { return samplePrayerTimes() }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(AdhanResponse.self, from: data)
            let timings = response.data.timings
            let cal = Calendar.current

            let prayers = [
                makePrayerTime(id: "Fajr", timeStr: timings.Fajr, cal: cal),
                makePrayerTime(id: "Dhuhr", timeStr: timings.Dhuhr, cal: cal),
                makePrayerTime(id: "Asr", timeStr: timings.Asr, cal: cal),
                makePrayerTime(id: "Maghrib", timeStr: timings.Maghrib, cal: cal),
                makePrayerTime(id: "Isha", timeStr: timings.Isha, cal: cal)
            ].compactMap { $0 }

            SharedData.shared.savePrayerTimes(prayers)
            return prayers
        } catch {
            return samplePrayerTimes()
        }
    }

    /// Fetches prayer times for tomorrow (for wraparound into next day)
    func fetchTomorrowPrayerTimes() async -> [PrayerTime] {
        guard let loc = await getLocation() else { return [] }

        let defaults = UserDefaults(suiteName: appGroupID)
        let method = defaults?.integer(forKey: WidgetDataKeys.calcMethod) ?? 2
        let school = defaults?.integer(forKey: WidgetDataKeys.school) ?? 0     // 0 = Shafi, 1 = Hanafi

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "dd-MM-yyyy"
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date()) ?? Date()
        let dateStr = dateFormatter.string(from: tomorrow)

        let tz = TimeZone.current.identifier
        let urlStr = "\(adhanBaseURL)/timings/\(dateStr)?latitude=\(loc.lat)&longitude=\(loc.lon)&method=\(method)&school=\(school)&timezonestring=\(tz)"
        guard let url = URL(string: urlStr) else { return [] }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(AdhanResponse.self, from: data)
            let timings = response.data.timings
            let cal = Calendar.current

            return [
                makePrayerTime(id: "Fajr", timeStr: timings.Fajr, cal: cal, dayOffset: 1),
                makePrayerTime(id: "Dhuhr", timeStr: timings.Dhuhr, cal: cal, dayOffset: 1),
                makePrayerTime(id: "Asr", timeStr: timings.Asr, cal: cal, dayOffset: 1),
                makePrayerTime(id: "Maghrib", timeStr: timings.Maghrib, cal: cal, dayOffset: 1),
                makePrayerTime(id: "Isha", timeStr: timings.Isha, cal: cal, dayOffset: 1)
            ].compactMap { $0 }
        } catch {
            return []
        }
    }

    private func makePrayerTime(id: String, timeStr: String, cal: Calendar, dayOffset: Int = 0) -> PrayerTime? {
        // Al-Adhan returns times like "05:23" or "05:23 (PKT)"
        let cleaned = timeStr.components(separatedBy: " ").first ?? timeStr
        let parts = cleaned.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2 else { return nil }

        let baseDate = dayOffset > 0
            ? (cal.date(byAdding: .day, value: dayOffset, to: Date()) ?? Date())
            : Date()

        var comps = cal.dateComponents([.year, .month, .day], from: baseDate)
        comps.hour = parts[0]
        comps.minute = parts[1]
        comps.second = 0

        guard let date = cal.date(from: comps) else { return nil }

        return PrayerTime(
            id: id,
            name: id,
            abbreviation: PrayerTime.abbreviations[id] ?? id.prefix(3).uppercased(),
            time: date,
            timeString: DateFormatter.timeOnly.string(from: date)
        )
    }

    /// Returns the next `count` prayers, wrapping into tomorrow if needed
    func nextPrayers(count: Int = 3) async -> [PrayerTime] {
        let all = await fetchPrayerTimes()
        let now = Date()
        var upcoming = all.filter { $0.time > now }

        // If we don't have enough for today, fetch tomorrow's and append
        if upcoming.count < count {
            let tomorrowAll = await fetchTomorrowPrayerTimes()
            upcoming.append(contentsOf: tomorrowAll)
        }

        return Array(upcoming.prefix(count))
    }

    func nextPrayer() async -> PrayerTime? {
        let all = await fetchPrayerTimes()
        let now = Date()
        return all.first { $0.time > now } ?? all.first
    }

    // MARK: - CMS Content Fetching (single /api/widgets endpoint)

    /// Cached combined widget payload — refreshed once per day
    private var cachedPayload: WidgetAPIPayload?
    private var cachedPayloadDate: String?

    /// Fetches the combined widget payload from the CMS API.
    /// Caches by date so all widgets share one network call per day.
    private func fetchWidgetPayload() async -> WidgetAPIPayload? {
        let today = DateFormatter.yyyyMMdd.string(from: Date())

        // Return cache if still valid for today
        if let cached = cachedPayload, cachedPayloadDate == today {
            return cached
        }

        guard let url = URL(string: cmsBaseURL) else { return nil }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let payload = try JSONDecoder().decode(WidgetAPIPayload.self, from: data)
            cachedPayload = payload
            cachedPayloadDate = today
            return payload
        } catch {
            return nil
        }
    }

    func fetchDailyDhikr() async -> DhikrContent? {
        guard let payload = await fetchWidgetPayload(),
              let dh = payload.daily_dhikr else { return nil }
        return DhikrContent(
            arabic: dh.arabic,
            transliteration: dh.transliteration ?? "",
            translation: dh.translation ?? "",
            source: dh.reference,
            category: nil
        )
    }

    func fetchDailyDua() async -> DuaContent? {
        guard let payload = await fetchWidgetPayload(),
              let du = payload.daily_dua else { return nil }
        return DuaContent(
            arabic: du.arabic,
            transliteration: du.transliteration ?? "",
            translation: du.translation ?? "",
            source: du.reference,
            category: nil,
            occasion: nil
        )
    }

    func fetchQuranVerse() async -> QuranVerseContent? {
        guard let payload = await fetchWidgetPayload(),
              let q = payload.quran_verse else { return nil }
        // Reference comes as e.g. "Al-Baqarah 2:201" — use as-is
        let ref = q.reference ?? ""
        return QuranVerseContent(
            arabic: q.arabic,
            translation: q.translation ?? "",
            surah: ref,
            ayah: "",
            reference: ref
        )
    }

    func fetchSunnahOfTheDay() async -> SunnahContent? {
        guard let payload = await fetchWidgetPayload(),
              let su = payload.sunnah_of_day else { return nil }
        return SunnahContent(
            title: su.reference ?? "Sunnah of the Day",
            description: su.translation ?? "",
            source: su.reference,
            arabic: su.arabic,
            transliteration: su.transliteration
        )
    }

    func fetchNameOfAllah() async -> NameOfAllah? {
        guard let payload = await fetchWidgetPayload(),
              let n = payload.name_of_allah else { return nil }
        // Day-based index for the number field
        let dayOfYear = Calendar.current.ordinality(of: .day, in: .year, for: Date()) ?? 1
        let nameNumber = ((dayOfYear - 1) % 99) + 1
        return NameOfAllah(
            number: nameNumber,
            arabic: n.arabic,
            transliteration: n.transliteration ?? "",
            meaning: n.meaning ?? ""
        )
    }

    // MARK: - Tasbih Data (from UserDefaults)

    func fetchTasbihData() -> (count: Int, target: Int) {
        let defaults = UserDefaults(suiteName: appGroupID)
        let count = defaults?.integer(forKey: WidgetDataKeys.tasbihCount) ?? 0
        let target = defaults?.integer(forKey: WidgetDataKeys.tasbihTarget) ?? 33
        return (count, target)
    }

    func fetchTasbihPhrase() -> String {
        let defaults = UserDefaults(suiteName: appGroupID)
        return defaults?.string(forKey: WidgetDataKeys.tasbihPhrase) ?? "سُبْحَانَ اللَّهِ"
    }

    // MARK: - Hijri Date

    func fetchHijriDate() async -> HijriDate? {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "dd-MM-yyyy"
        let dateStr = dateFormatter.string(from: Date())

        guard let url = URL(string: "\(adhanBaseURL)/gToH/\(dateStr)") else { return nil }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(HijriDateResponse.self, from: data)
            let hijri = response.data.hijri
            return HijriDate(
                day: Int(hijri.day) ?? 1,
                month: hijri.month.en,
                monthNumber: hijri.month.number,
                year: Int(hijri.year) ?? 1446,
                designation: hijri.designation.abbreviated
            )
        } catch {
            return nil
        }
    }

    // MARK: - Sample Data (Fallback)

    func samplePrayerTimes() -> [PrayerTime] {
        let cal = Calendar.current
        let now = Date()
        let times: [(String, Int, Int)] = [
            ("Fajr", 5, 30),
            ("Dhuhr", 12, 15),
            ("Asr", 15, 45),
            ("Maghrib", 18, 30),
            ("Isha", 20, 0)
        ]
        return times.compactMap { (id, hour, minute) in
            var comps = cal.dateComponents([.year, .month, .day], from: now)
            comps.hour = hour
            comps.minute = minute
            guard let date = cal.date(from: comps) else { return nil }
            return PrayerTime(
                id: id,
                name: id,
                abbreviation: PrayerTime.abbreviations[id] ?? id.prefix(3).uppercased(),
                time: date,
                timeString: DateFormatter.timeOnly.string(from: date)
            )
        }
    }
}

// MARK: - Al-Adhan API Response Models

struct AdhanResponse: Codable {
    let data: AdhanData
}

struct AdhanData: Codable {
    let timings: AdhanTimings
}

struct AdhanTimings: Codable {
    let Fajr: String
    let Sunrise: String
    let Dhuhr: String
    let Asr: String
    let Maghrib: String
    let Isha: String
}

struct HijriDateResponse: Codable {
    let data: HijriDateData
}

struct HijriDateData: Codable {
    let hijri: HijriInfo
}

struct HijriInfo: Codable {
    let day: String
    let month: HijriMonth
    let year: String
    let designation: HijriDesignation
}

struct HijriMonth: Codable {
    let number: Int
    let en: String
    let ar: String
}

struct HijriDesignation: Codable {
    let abbreviated: String
}

// MARK: - CMS Widget API Response Models

/// Combined payload from /api/widgets
struct WidgetAPIPayload: Codable {
    let date: String?
    let quran_verse: WidgetAPIQuranVerse?
    let daily_dhikr: WidgetAPICMSItem?
    let daily_dua: WidgetAPICMSItem?
    let name_of_allah: WidgetAPINameOfAllah?
    let sunnah_of_day: WidgetAPICMSItem?
    // morning_adhkar / evening_adhkar are arrays — not used by widgets currently
}

/// Generic CMS item shape (dhikr, dua, sunnah)
struct WidgetAPICMSItem: Codable {
    let arabic: String
    let transliteration: String?
    let translation: String?
    let reward: String?
    let reference: String?
}

/// Quran verse shape (no transliteration/reward)
struct WidgetAPIQuranVerse: Codable {
    let arabic: String
    let translation: String?
    let reference: String?
}

/// 99 Names of Allah shape
struct WidgetAPINameOfAllah: Codable {
    let arabic: String
    let transliteration: String?
    let meaning: String?
}
