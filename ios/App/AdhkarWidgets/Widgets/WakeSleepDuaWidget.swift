// WakeSleepDuaWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows the morning (wake) and evening (sleep) duas with full Arabic,
// transliteration, and translation. No configuration needed.
// Source: Al-Bukhari, hadith of Hudhaifah (May Allah be pleased with him).

import WidgetKit
import SwiftUI

// MARK: - Dua Data (shared across variants)
struct WakeSleepDua {
    let arabic: String
    let transliteration: String
    let translation: String
    let isWake: Bool

    var title: String { isWake ? "Waking Up" : "Before Sleep" }
    var icon: String { isWake ? "sunrise.fill" : "moon.zzz.fill" }

    static let sleep = WakeSleepDua(
        arabic: "اللهم باسمك أموت وأحيا",
        transliteration: "Allahumma bismika amutu wa ahya",
        translation: "O Allah, with Your Name will I die and live (wake up)",
        isWake: false
    )

    static let wake = WakeSleepDua(
        arabic: "الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور",
        transliteration: "Al-hamdu lillahil-ladhi ahyana ba'da ma amatana, wa ilaihin-nushur",
        translation: "All praise is due to Allah, Who has brought us back to life after He has caused us to die, and to Him is the return",
        isWake: true
    )

    /// 4 AM – 6 PM → wake dua, 6 PM – 4 AM → sleep dua
    static func current() -> WakeSleepDua {
        let hour = Calendar.current.component(.hour, from: Date())
        return (hour >= 4 && hour < 18) ? .wake : .sleep
    }

    /// Next transition point for timeline refresh
    static func nextRefreshDate(from now: Date) -> Date {
        let cal = Calendar.current
        let hour = cal.component(.hour, from: now)
        if hour >= 4 && hour < 18 {
            // Currently wake → refresh at 6 PM today
            var comps = cal.dateComponents([.year, .month, .day], from: now)
            comps.hour = 18; comps.minute = 0
            return cal.date(from: comps) ?? now.addingTimeInterval(3600)
        } else {
            // Currently sleep → refresh at 4 AM
            var comps = cal.dateComponents([.year, .month, .day], from: now)
            comps.hour = 4; comps.minute = 0
            let candidate = cal.date(from: comps) ?? now.addingTimeInterval(3600)
            if candidate <= now {
                return cal.date(byAdding: .day, value: 1, to: candidate) ?? now.addingTimeInterval(3600)
            }
            return candidate
        }
    }
}

// MARK: - Timeline Provider
struct WakeSleepDuaProvider: TimelineProvider {
    typealias Entry = WakeSleepDuaEntry

    func placeholder(in context: Context) -> WakeSleepDuaEntry {
        WakeSleepDuaEntry(date: Date(), dua: .wake)
    }

    func getSnapshot(in context: Context, completion: @escaping (WakeSleepDuaEntry) -> Void) {
        completion(WakeSleepDuaEntry(date: Date(), dua: WakeSleepDua.current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WakeSleepDuaEntry>) -> Void) {
        let now = Date()
        let entry = WakeSleepDuaEntry(date: now, dua: WakeSleepDua.current())
        let nextRefresh = WakeSleepDua.nextRefreshDate(from: now)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

// MARK: - Entry
struct WakeSleepDuaEntry: TimelineEntry {
    let date: Date
    let dua: WakeSleepDua
}

// MARK: - Widget View (Full — Arabic + Transliteration + Translation)
struct WakeSleepDuaView: View {
    var entry: WakeSleepDuaEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    private var dua: WakeSleepDua { entry.dua }

    var body: some View {
        switch family {
        case .systemSmall:
            smallView
        case .systemMedium:
            mediumView
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        default:
            mediumView
        }
    }

    private var smallView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 8))
                    .foregroundColor(dua.isWake ? WidgetColors.gold(colorScheme) : WidgetColors.primary(colorScheme))
                Text(dua.title.uppercased())
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 4)

            Text(dua.arabic)
                .font(ArabicFont.naskh(size: 15))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .minimumScaleFactor(0.6)
                .lineLimit(3)

            Spacer(minLength: 4)

            Text(dua.transliteration)
                .font(.system(size: 9, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)

            Spacer(minLength: 2)

            Text(dua.translation)
                .font(.system(size: 8))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var mediumView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 10))
                    .foregroundColor(dua.isWake ? WidgetColors.gold(colorScheme) : WidgetColors.primary(colorScheme))
                Text(dua.title.uppercased())
                    .widgetLabel(colorScheme)
                Spacer()
                Text("Al-Bukhari")
                    .sourceBadge(colorScheme)
            }

            Spacer(minLength: 6)

            Text(dua.arabic)
                .font(ArabicFont.naskh(size: 20))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .minimumScaleFactor(0.7)
                .lineLimit(2)

            Spacer(minLength: 4)

            IslamicDivider(colorScheme: colorScheme, width: 60)

            Spacer(minLength: 4)

            Text(dua.transliteration)
                .font(.system(size: 11, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)
                .padding(.bottom, 2)

            Text(dua.translation)
                .font(WidgetFont.body(size: 10))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(3)
                .minimumScaleFactor(0.7)

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 10))
                Text(dua.title)
                    .font(.system(size: 10, weight: .bold))
            }
            Text(dua.arabic)
                .font(.system(size: 14, design: .serif))
                .environment(\.layoutDirection, .rightToLeft)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
            Text(dua.transliteration)
                .font(.system(size: 10))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text("\(dua.isWake ? "☀️" : "🌙") \(dua.title)")
    }
}

// MARK: - Widget Definition
struct WakeSleepDuaWidget: Widget {
    let kind = "WakeSleepDuaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WakeSleepDuaProvider()) { entry in
            WakeSleepDuaView(entry: entry)
        }
        .configurationDisplayName("Wake & Sleep Dua")
        .description("Full dua — Arabic, transliteration & translation. Auto-switches by time of day.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
