// NextThreePrayersWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows the next 3 upcoming prayers in a stacked list (vertical).
// Wraps into the next day (e.g., after Asr → Maghrib, Isha, Fajr).
// Next prayer is bright and highlighted — others are subdued.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct NextPrayersStackedProvider: TimelineProvider {
    typealias Entry = NextPrayersStackedEntry

    func placeholder(in context: Context) -> NextPrayersStackedEntry {
        NextPrayersStackedEntry(date: Date(), prayers: PrayerTime.sampleNext3, hasLocation: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextPrayersStackedEntry) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.nextPrayers(count: 3)
            completion(NextPrayersStackedEntry(date: Date(), prayers: prayers, hasLocation: hasLoc))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPrayersStackedEntry>) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.nextPrayers(count: 3)
            let entry = NextPrayersStackedEntry(date: Date(), prayers: prayers, hasLocation: hasLoc)
            let nextRefresh = prayers.first?.time ?? Date().addingTimeInterval(1800)
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }
}

// MARK: - Entry
struct NextPrayersStackedEntry: TimelineEntry {
    let date: Date
    let prayers: [PrayerTime]
    let hasLocation: Bool
}

// MARK: - Widget View
struct NextPrayersStackedView: View {
    var entry: NextPrayersStackedEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        switch family {
        case .systemSmall:
            ZStack {
                smallView
                if !entry.hasLocation {
                    LocationPermissionOverlayCompact(colorScheme: colorScheme)
                }
            }
        case .systemMedium:
            ZStack {
                mediumView
                if !entry.hasLocation {
                    LocationPermissionOverlay(colorScheme: colorScheme)
                }
            }
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        case .accessoryCircular:
            lockCircularView
        default:
            ZStack {
                mediumView
                if !entry.hasLocation {
                    LocationPermissionOverlay(colorScheme: colorScheme)
                }
            }
        }
    }

    // MARK: - Small (stacked rows)
    private var smallView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "clock.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("NEXT PRAYERS")
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 4)

            VStack(spacing: 5) {
                ForEach(Array(entry.prayers.prefix(3).enumerated()), id: \.element.id) { index, prayer in
                    let isNext = index == 0

                    HStack(spacing: 8) {
                        Image(systemName: prayer.icon)
                            .font(.system(size: 12, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                            .frame(width: 18)

                        Text(prayer.name)
                            .font(.system(size: 13, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))

                        Spacer()

                        Text(prayer.timeString)
                            .font(WidgetFont.mono(size: 12))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 6)
                    .background(
                        isNext
                            ? RoundedRectangle(cornerRadius: 8).fill(WidgetColors.nextPrayerAccent(colorScheme).opacity(0.15))
                            : nil
                    )
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    // MARK: - Medium (stacked rows, more room)
    private var mediumView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "clock.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("NEXT PRAYERS")
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 6)

            VStack(spacing: 6) {
                ForEach(Array(entry.prayers.prefix(3).enumerated()), id: \.element.id) { index, prayer in
                    let isNext = index == 0

                    HStack(spacing: 12) {
                        GlowingIcon(
                            systemName: prayer.icon,
                            isHighlighted: isNext,
                            colorScheme: colorScheme,
                            size: 32
                        )

                        Text(prayer.name)
                            .font(.system(size: 15, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))

                        Spacer()

                        Text(prayer.timeString)
                            .font(WidgetFont.mono(size: 14))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                    }
                    .padding(.vertical, 4)
                    .padding(.horizontal, 8)
                    .background(
                        isNext
                            ? RoundedRectangle(cornerRadius: 10).fill(WidgetColors.nextPrayerAccent(colorScheme).opacity(0.12))
                            : nil
                    )
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    // MARK: - Lock Screen
    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(Array(entry.prayers.prefix(3).enumerated()), id: \.element.id) { index, prayer in
                HStack {
                    Image(systemName: prayer.icon)
                        .font(.system(size: 10))
                        .frame(width: 14)
                    Text(prayer.name)
                        .font(.system(size: 12, weight: index == 0 ? .bold : .medium))
                    Spacer()
                    Text(prayer.timeString)
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                }
            }
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        if let next = entry.prayers.first {
            Text("\(next.name) \(next.timeString)")
        } else {
            Text("No upcoming prayers")
        }
    }

    private var lockCircularView: some View {
        VStack(spacing: 1) {
            if let next = entry.prayers.first {
                Image(systemName: next.icon)
                    .font(.system(size: 12))
                Text(next.name)
                    .font(.system(size: 8, weight: .bold))
                    .minimumScaleFactor(0.7)
                Text(next.timeString)
                    .font(.system(size: 8))
                    .minimumScaleFactor(0.6)
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Widget Definition
struct NextThreePrayersWidget: Widget {
    let kind = "NextThreePrayersWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextPrayersStackedProvider()) { entry in
            NextPrayersStackedView(entry: entry)
        }
        .configurationDisplayName("Next Prayers")
        .description("Next 3 prayers in a vertical list — next one highlighted.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}

// MARK: - Sample Data
extension PrayerTime {
    static let sampleNext3: [PrayerTime] = {
        let now = Date()
        return [
            PrayerTime(id: "Maghrib", name: "Maghrib", abbreviation: "MGH",
                       time: now.addingTimeInterval(3600), timeString: "6:30 PM"),
            PrayerTime(id: "Isha", name: "Isha", abbreviation: "ISH",
                       time: now.addingTimeInterval(7200), timeString: "8:00 PM"),
            PrayerTime(id: "Fajr", name: "Fajr", abbreviation: "FJR",
                       time: now.addingTimeInterval(36000), timeString: "5:30 AM")
        ]
    }()
}
