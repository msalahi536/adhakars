// AllPrayersGridWidget.swift
// Sahih Al-Adhkar Widget Extension
// Shows all 5 daily prayers SIDE BY SIDE in one widget (horizontal grid).
// Next prayer is bright — past prayers are dimmed.
// When all prayers have passed (late night), Fajr highlights as "next."

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct AllPrayersGridProvider: TimelineProvider {
    typealias Entry = AllPrayersGridEntry

    func placeholder(in context: Context) -> AllPrayersGridEntry {
        AllPrayersGridEntry(date: Date(), prayers: PrayerTime.sampleAll5, hasLocation: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (AllPrayersGridEntry) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.fetchPrayerTimes()
            completion(AllPrayersGridEntry(date: Date(), prayers: prayers, hasLocation: hasLoc))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AllPrayersGridEntry>) -> Void) {
        Task {
            let hasLoc = await WidgetDataProvider.shared.hasLocation()
            let prayers = await WidgetDataProvider.shared.fetchPrayerTimes()
            let entry = AllPrayersGridEntry(date: Date(), prayers: prayers, hasLocation: hasLoc)
            let now = Date()
            let nextPrayer = prayers.first(where: { $0.time > now })?.time
            let refreshDate = nextPrayer ?? now.addingTimeInterval(1800)
            completion(Timeline(entries: [entry], policy: .after(refreshDate)))
        }
    }
}

// MARK: - Entry
struct AllPrayersGridEntry: TimelineEntry {
    let date: Date
    let prayers: [PrayerTime]
    let hasLocation: Bool
}

// MARK: - Widget View
struct AllPrayersGridView: View {
    var entry: AllPrayersGridEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    /// Next upcoming prayer, or Fajr if all have passed (late night → Fajr is next tomorrow)
    private var nextPrayerId: String? {
        entry.prayers.first(where: { $0.time > Date() })?.id ?? entry.prayers.first?.id
    }

    var body: some View {
        switch family {
        case .systemSmall:
            ZStack {
                smallView
                if !entry.hasLocation {
                    LocationPermissionOverlayCompact(colorScheme: colorScheme)
                }
            }
        default:
            ZStack {
                mediumView
                if !entry.hasLocation {
                    LocationPermissionOverlay(colorScheme: colorScheme)
                }
            }
        }
    }

    // MARK: - Small (compact — 3 top, 2 bottom)
    private var smallView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("PRAYER TIMES")
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 4)

            // Top row: 3 prayers
            HStack(spacing: 2) {
                ForEach(Array(entry.prayers.prefix(3)), id: \.id) { prayer in
                    compactColumn(prayer)
                }
            }

            Spacer(minLength: 4)

            // Bottom row: 2 prayers centered
            HStack(spacing: 2) {
                Spacer()
                ForEach(Array(entry.prayers.dropFirst(3).prefix(2)), id: \.id) { prayer in
                    compactColumn(prayer)
                }
                Spacer()
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private func compactColumn(_ prayer: PrayerTime) -> some View {
        let isNext = prayer.id == nextPrayerId

        return VStack(spacing: 3) {
            Image(systemName: prayer.icon)
                .font(.system(size: 12, weight: isNext ? .bold : .medium))
                .foregroundColor(isNext ? .white : WidgetColors.primary(colorScheme))
                .frame(width: 24, height: 24)
                .background(
                    Circle()
                        .fill(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : Color.clear)
                )

            Text(prayer.abbreviation)
                .font(.system(size: 9, weight: isNext ? .bold : .medium))
                .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))

            Text(prayer.timeString)
                .font(WidgetFont.mono(size: 8))
                .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Medium (5 columns side by side with glowing icons)
    private var mediumView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "moon.stars.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("PRAYER TIMES")
                    .widgetLabel(colorScheme)
                Spacer()
                Text(formattedDate())
                    .font(WidgetFont.caption(size: 9))
                    .foregroundColor(WidgetColors.gold(colorScheme))
            }
            .padding(.bottom, 10)

            Spacer(minLength: 0)

            HStack(spacing: 8) {
                ForEach(entry.prayers, id: \.id) { prayer in
                    let isNext = prayer.id == nextPrayerId

                    VStack(spacing: 6) {
                        GlowingIcon(
                            systemName: prayer.icon,
                            isHighlighted: isNext,
                            colorScheme: colorScheme,
                            size: 36
                        )

                        Text(prayer.name)
                            .font(.system(size: 12, weight: isNext ? .bold : .semibold))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.text(colorScheme))
                            .minimumScaleFactor(0.7)

                        Text(prayer.timeString)
                            .font(WidgetFont.mono(size: 11))
                            .foregroundColor(isNext ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.secondaryText(colorScheme))
                            .minimumScaleFactor(0.7)
                    }
                    .frame(maxWidth: .infinity)
                }
            }

            Spacer(minLength: 0)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private func formattedDate() -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f.string(from: Date())
    }
}

// MARK: - Widget Definition
struct AllPrayersGridWidget: Widget {
    let kind = "AllPrayersGridWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AllPrayersGridProvider()) { entry in
            AllPrayersGridView(entry: entry)
        }
        .configurationDisplayName("All Prayers (Side by Side)")
        .description("All 5 prayers side by side — next one bright, past dimmed.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
