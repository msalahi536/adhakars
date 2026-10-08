// NextPrayersGridWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows next 3 prayers SIDE BY SIDE in one widget (horizontal grid).
// Same data as NextThreePrayersWidget but laid out as columns.
// Next prayer is bright and highlighted.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct NextPrayersGridProvider: TimelineProvider {
    typealias Entry = NextPrayersGridEntry

    func placeholder(in context: Context) -> NextPrayersGridEntry {
        NextPrayersGridEntry(date: Date(), prayers: PrayerTime.sampleNext3, hasLocation: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextPrayersGridEntry) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.nextPrayers(count: 3)
            completion(NextPrayersGridEntry(date: Date(), prayers: prayers, hasLocation: hasLoc))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NextPrayersGridEntry>) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.nextPrayers(count: 3)
            let entry = NextPrayersGridEntry(date: Date(), prayers: prayers, hasLocation: hasLoc)
            let nextRefresh = prayers.first?.time ?? Date().addingTimeInterval(1800)
            completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
        }
    }
}

// MARK: - Entry
struct NextPrayersGridEntry: TimelineEntry {
    let date: Date
    let prayers: [PrayerTime]
    let hasLocation: Bool
}

// MARK: - Widget View
struct NextPrayersGridView: View {
    var entry: NextPrayersGridEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        switch family {
        case .systemSmall:
            ZStack {
                smallGridView
                if !entry.hasLocation {
                    LocationPermissionOverlayCompact(colorScheme: colorScheme)
                }
            }
        default:
            ZStack {
                mediumGridView
                if !entry.hasLocation {
                    LocationPermissionOverlay(colorScheme: colorScheme)
                }
            }
        }
    }

    // MARK: - Small (3 compact columns side by side)
    private var smallGridView: some View {
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

            HStack(spacing: 6) {
                ForEach(Array(entry.prayers.prefix(3).enumerated()), id: \.element.id) { index, prayer in
                    let isNext = index == 0

                    VStack(spacing: 6) {
                        Image(systemName: prayer.icon)
                            .font(.system(size: 16, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? .white : WidgetColors.primary(colorScheme))
                            .frame(width: 32, height: 32)
                            .background(
                                Circle()
                                    .fill(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.cardBackground(colorScheme))
                            )

                        Text(prayer.name)
                            .font(.system(size: 11, weight: isNext ? .bold : .medium))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)

                        Text(prayer.timeString)
                            .font(WidgetFont.mono(size: 10))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    // MARK: - Medium (3 big columns side by side with glowing icons)
    private var mediumGridView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "clock.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("NEXT PRAYERS")
                    .widgetLabel(colorScheme)
                Spacer()
            }
            .padding(.bottom, 10)

            Spacer(minLength: 0)

            HStack(spacing: 16) {
                ForEach(Array(entry.prayers.prefix(3).enumerated()), id: \.element.id) { index, prayer in
                    let isNext = index == 0

                    VStack(spacing: 8) {
                        GlowingIcon(
                            systemName: prayer.icon,
                            isHighlighted: isNext,
                            colorScheme: colorScheme,
                            size: 44
                        )

                        Text(prayer.name)
                            .font(.system(size: 14, weight: isNext ? .bold : .semibold))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))

                        Text(prayer.timeString)
                            .font(WidgetFont.mono(size: 13))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }
}

// MARK: - Widget Definition
struct NextPrayersGridWidget: Widget {
    let kind = "NextPrayersGridWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextPrayersGridProvider()) { entry in
            NextPrayersGridView(entry: entry)
        }
        .configurationDisplayName("Next Prayers (Side by Side)")
        .description("Next 3 prayers shown side by side — next one highlighted.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
