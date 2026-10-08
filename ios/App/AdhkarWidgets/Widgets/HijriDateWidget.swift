// HijriDateWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows the current Hijri date — StaticConfiguration, no config switches.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct HijriDateProvider: TimelineProvider {
    typealias Entry = HijriDateEntry

    func placeholder(in context: Context) -> HijriDateEntry {
        HijriDateEntry(date: Date(), hijri: HijriDateHelper.current())
    }

    func getSnapshot(in context: Context, completion: @escaping (HijriDateEntry) -> Void) {
        completion(HijriDateEntry(date: Date(), hijri: HijriDateHelper.current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<HijriDateEntry>) -> Void) {
        let entry = HijriDateEntry(date: Date(), hijri: HijriDateHelper.current())
        let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
        completion(Timeline(entries: [entry], policy: .after(tomorrow)))
    }
}

// MARK: - Entry (uses HijriDate from SharedModels)
struct HijriDateEntry: TimelineEntry {
    let date: Date
    let hijri: HijriDate
}

// MARK: - Widget View
struct HijriDateWidgetView: View {
    var entry: HijriDateEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    // Arabic month names for display
    private var monthArabic: String {
        HijriDateHelper.hijriMonthsArabic[max(0, min(11, entry.hijri.monthNumber - 1))]
    }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            accessoryRectangularView
        case .accessoryInline:
            accessoryInlineView
        case .accessoryCircular:
            accessoryCircularView
        default:
            homeScreenView
        }
    }

    private var homeScreenView: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("HIJRI DATE")
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 4)

            if family == .systemSmall {
                smallLayout
            } else {
                mediumLayout
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var smallLayout: some View {
        VStack(spacing: 6) {
            Spacer(minLength: 0)

            // Day number — large
            Text("\(entry.hijri.day)")
                .font(.system(size: 38, weight: .bold, design: .rounded))
                .foregroundColor(WidgetColors.primary(colorScheme))

            // Arabic month name
            Text(monthArabic)
                .font(ArabicFont.naskh(size: 16))
                .foregroundColor(WidgetColors.text(colorScheme))

            // English month + year
            Text("\(entry.hijri.month) \(entry.hijri.year)")
                .font(WidgetFont.caption(size: 10))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))

            Spacer(minLength: 0)
        }
    }

    private var mediumLayout: some View {
        HStack(spacing: 16) {
            // Left — large day number with decorative circle
            ZStack {
                Circle()
                    .fill(WidgetColors.primary(colorScheme).opacity(0.1))
                    .frame(width: 70, height: 70)

                VStack(spacing: 0) {
                    Text("\(entry.hijri.day)")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(WidgetColors.primary(colorScheme))
                }
            }

            // Right — text info
            VStack(alignment: .leading, spacing: 4) {
                Spacer(minLength: 0)

                // Arabic month
                Text(monthArabic)
                    .font(ArabicFont.naskh(size: 20))
                    .foregroundColor(WidgetColors.text(colorScheme))
                    .environment(\.layoutDirection, .rightToLeft)

                // English month
                Text(entry.hijri.month)
                    .font(WidgetFont.label(size: 14))
                    .foregroundColor(WidgetColors.secondaryText(colorScheme))

                // Year
                Text("\(entry.hijri.year) \(entry.hijri.designation)")
                    .font(WidgetFont.caption(size: 11))
                    .foregroundColor(WidgetColors.gold(colorScheme))

                Spacer(minLength: 0)
            }

            Spacer()
        }
    }

    // MARK: - Lock Screen Views

    private var accessoryRectangularView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(entry.hijri.day) \(entry.hijri.month)")
                .font(.system(size: 14, weight: .bold))

            Text("\(entry.hijri.year) \(entry.hijri.designation)")
                .font(.system(size: 12))

            Text(monthArabic)
                .font(.system(size: 12))
        }
        .containerBackground(.clear, for: .widget)
    }

    private var accessoryInlineView: some View {
        Text("\(entry.hijri.day) \(entry.hijri.month) \(entry.hijri.year)")
    }

    private var accessoryCircularView: some View {
        VStack(spacing: 1) {
            Text("\(entry.hijri.day)")
                .font(.system(size: 18, weight: .bold))
            Text(entry.hijri.month.prefix(3).uppercased())
                .font(.system(size: 8, weight: .semibold))
        }
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Widget Definition
struct HijriDateWidget: Widget {
    let kind = "HijriDateWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HijriDateProvider()) { entry in
            HijriDateWidgetView(entry: entry)
        }
        .configurationDisplayName("Hijri Date")
        .description("Today's Islamic (Hijri) date.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}

// MARK: - Hijri Date Helper (builds HijriDate from SharedModels)
struct HijriDateHelper {
    static let hijriMonthsArabic = [
        "مُحَرَّم", "صَفَر", "رَبِيعُ الأَوَّلِ", "رَبِيعُ الآخِرِ",
        "جُمَادَىٰ الأُولَىٰ", "جُمَادَىٰ الآخِرَةِ", "رَجَب", "شَعْبَان",
        "رَمَضَان", "شَوَّال", "ذُو القِعْدَةِ", "ذُو الحِجَّةِ"
    ]

    static let hijriMonthsEnglish = [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
        "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
        "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah"
    ]

    static func current() -> HijriDate {
        let islamic = Calendar(identifier: .islamicUmmAlQura)
        let comps = islamic.dateComponents([.day, .month, .year], from: Date())
        let monthIndex = max(0, min(11, (comps.month ?? 1) - 1))
        return HijriDate(
            day: comps.day ?? 1,
            month: hijriMonthsEnglish[monthIndex],
            monthNumber: (comps.month ?? 1),
            year: comps.year ?? 1446,
            designation: "AH"
        )
    }
}
