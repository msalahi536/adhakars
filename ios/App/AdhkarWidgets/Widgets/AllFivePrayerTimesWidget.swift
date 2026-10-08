// AllFivePrayerTimesWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows all 5 daily prayer times in a stacked list (vertical).
// Next prayer is bright and highlighted — past prayers are dimmed.
// When all prayers have passed (late night), Fajr highlights as "next."

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct AllPrayersStackedProvider: TimelineProvider {
    typealias Entry = AllPrayersStackedEntry

    func placeholder(in context: Context) -> AllPrayersStackedEntry {
        AllPrayersStackedEntry(date: Date(), prayers: PrayerTime.sampleAll5, hasLocation: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (AllPrayersStackedEntry) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.fetchPrayerTimes()
            completion(AllPrayersStackedEntry(date: Date(), prayers: prayers, hasLocation: hasLoc))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AllPrayersStackedEntry>) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.fetchPrayerTimes()
            let entry = AllPrayersStackedEntry(date: Date(), prayers: prayers, hasLocation: hasLoc)
            let now = Date()
            let nextPrayer = prayers.first(where: { $0.time > now })?.time
            let refreshDate = nextPrayer ?? now.addingTimeInterval(1800)
            completion(Timeline(entries: [entry], policy: .after(refreshDate)))
        }
    }
}

// MARK: - Entry
struct AllPrayersStackedEntry: TimelineEntry {
    let date: Date
    let prayers: [PrayerTime]
    let hasLocation: Bool
}

// MARK: - Widget View
struct AllPrayersStackedView: View {
    var entry: AllPrayersStackedEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    /// Next upcoming prayer, or Fajr if all have passed (late night → Fajr is next tomorrow)
    private var nextPrayerId: String? {
        entry.prayers.first(where: { $0.time > Date() })?.id ?? entry.prayers.first?.id
    }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        default:
            ZStack {
                homeView
                if !entry.hasLocation {
                    if family == .systemSmall {
                        LocationPermissionOverlayCompact(colorScheme: colorScheme)
                    } else {
                        LocationPermissionOverlay(colorScheme: colorScheme)
                    }
                }
            }
        }
    }

    // MARK: - Home Screen (stacked list)
    private var homeView: some View {
        VStack(spacing: 0) {
            HStack(alignment: .center) {
                HStack(spacing: 4) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 8))
                        .foregroundColor(WidgetColors.primary(colorScheme))
                    Text("PRAYER TIMES")
                        .widgetLabel(colorScheme)
                }
                Spacer()
                Text(formattedDate())
                    .font(WidgetFont.caption(size: 9))
                    .foregroundColor(WidgetColors.gold(colorScheme))
            }
            .padding(.bottom, 6)

            Spacer(minLength: 0)

            VStack(spacing: family == .systemSmall ? 2 : 4) {
                ForEach(entry.prayers) { prayer in
                    prayerRow(prayer)
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private func prayerRow(_ prayer: PrayerTime) -> some View {
        let isNext = prayer.id == nextPrayerId
        let iconSize: CGFloat = family == .systemSmall ? 10 : 12
        let textSize: CGFloat = family == .systemSmall ? 12 : 14
        let timeSize: CGFloat = family == .systemSmall ? 11 : 13

        return HStack(spacing: 6) {
            Image(systemName: prayer.icon)
                .font(.system(size: iconSize, weight: isNext ? .bold : .regular))
                .foregroundColor(
                    isNext ? WidgetColors.nextPrayerAccent(colorScheme)
                    : WidgetColors.secondaryText(colorScheme)
                )
                .frame(width: 16)

            Text(prayer.name)
                .font(.system(size: textSize, weight: isNext ? .bold : .regular))
                .foregroundColor(
                    isNext ? WidgetColors.nextPrayerAccent(colorScheme)
                    : WidgetColors.text(colorScheme)
                )

            Spacer()

            Text(prayer.timeString)
                .font(WidgetFont.mono(size: timeSize))
                .foregroundColor(
                    isNext ? WidgetColors.nextPrayerAccent(colorScheme)
                    : WidgetColors.secondaryText(colorScheme)
                )
        }
        .padding(.vertical, 2)
        .padding(.horizontal, isNext ? 6 : 0)
        .background(
            isNext
                ? RoundedRectangle(cornerRadius: 6).fill(WidgetColors.nextPrayerAccent(colorScheme).opacity(0.15))
                : nil
        )
    }

    // MARK: - Lock Screen
    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 1) {
            ForEach(entry.prayers) { prayer in
                HStack {
                    Text(prayer.name)
                        .font(.system(size: 10, weight: prayer.id == nextPrayerId ? .bold : .medium))
                        .frame(width: 56, alignment: .leading)
                    Spacer()
                    Text(prayer.timeString)
                        .font(.system(size: 10, design: .monospaced))
                }
                .opacity(1.0)
            }
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        if let next = entry.prayers.first(where: { $0.time > Date() }) {
            Text("\(next.name) \(next.timeString)")
        } else if let first = entry.prayers.first {
            Text("\(first.name) \(first.timeString)")
        } else {
            Text("Prayer Times")
        }
    }

    private func formattedDate() -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f.string(from: Date())
    }
}

// MARK: - Widget Definition
struct AllFivePrayerTimesWidget: Widget {
    let kind = "AllFivePrayerTimesWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllPrayersStackedProvider()) { entry in
            AllPrayersStackedView(entry: entry)
        }
        .configurationDisplayName("All Prayer Times")
        .description("All 5 prayers in a vertical list — next prayer bright.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Sample Data
extension PrayerTime {
    static let sampleAll5: [PrayerTime] = {
        let now = Date()
        return [
            PrayerTime(id: "Fajr", name: "Fajr", abbreviation: "FJR",
                       time: now.addingTimeInterval(-18000), timeString: "5:30 AM"),
            PrayerTime(id: "Dhuhr", name: "Dhuhr", abbreviation: "DHR",
                       time: now.addingTimeInterval(3600), timeString: "12:15 PM"),
            PrayerTime(id: "Asr", name: "Asr", abbreviation: "ASR",
                       time: now.addingTimeInterval(10800), timeString: "3:45 PM"),
            PrayerTime(id: "Maghrib", name: "Maghrib", abbreviation: "MGH",
                       time: now.addingTimeInterval(21600), timeString: "6:30 PM"),
            PrayerTime(id: "Isha", name: "Isha", abbreviation: "ISH",
                       time: now.addingTimeInterval(28800), timeString: "8:00 PM")
        ]
    }()
}
