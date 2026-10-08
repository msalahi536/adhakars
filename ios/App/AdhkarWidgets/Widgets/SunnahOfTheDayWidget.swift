// SunnahOfTheDayWidget.swift
// Sahih Al-Adhkar Widget Extension
// Daily Sunnah practice — English content, StaticConfiguration.
// Sunnah content is primarily English (title + description).
// If Arabic/transliteration exist, separate variants can be added later.

import WidgetKit
import SwiftUI

// MARK: - Shared Entry
struct SunnahOfTheDayEntry: TimelineEntry {
    let date: Date
    let sunnah: SunnahContent
}

// MARK: - Shared Provider
struct SunnahOfTheDayProvider: TimelineProvider {
    typealias Entry = SunnahOfTheDayEntry

    func placeholder(in context: Context) -> SunnahOfTheDayEntry {
        SunnahOfTheDayEntry(date: Date(), sunnah: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping @Sendable (SunnahOfTheDayEntry) -> Void) {
        Task {
            let sunnah = await WidgetDataProvider.shared.fetchSunnahOfTheDay() ?? .sample
            completion(SunnahOfTheDayEntry(date: Date(), sunnah: sunnah))
        }
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<SunnahOfTheDayEntry>) -> Void) {
        Task {
            let sunnah = await WidgetDataProvider.shared.fetchSunnahOfTheDay() ?? .sample
            let entry = SunnahOfTheDayEntry(date: Date(), sunnah: sunnah)
            let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
            completion(Timeline(entries: [entry], policy: .after(tomorrow)))
        }
    }
}

// MARK: - Widget View
struct SunnahOfTheDayWidgetView: View {
    var entry: SunnahOfTheDayEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        switch family {
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        case .systemLarge:
            largeView
        default:
            homeView
        }
    }

    // MARK: - Small / Medium
    private var homeView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Image(systemName: "leaf.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("SUNNAH OF THE DAY")
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer(minLength: 6)

            Text(entry.sunnah.title)
                .font(.system(size: family == .systemSmall ? 13 : 15, weight: .semibold))
                .foregroundColor(WidgetColors.text(colorScheme))
                .lineLimit(family == .systemSmall ? 2 : 1)

            Spacer(minLength: 4)

            Text(entry.sunnah.description)
                .font(.system(size: family == .systemSmall ? 10 : 12))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))
                .lineLimit(family == .systemSmall ? 3 : 4)
                .lineSpacing(2)

            Spacer(minLength: 0)

            if let source = entry.sunnah.source, !source.isEmpty {
                HStack {
                    Spacer()
                    Text(source)
                        .sourceBadge(colorScheme)
                }
            }
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    // MARK: - Large (more room for hadith text)
    private var largeView: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                HStack(spacing: 4) {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 8))
                        .foregroundColor(WidgetColors.primary(colorScheme))
                    Text("SUNNAH OF THE DAY")
                        .widgetLabel(colorScheme)
                }
                Spacer()
                Text(formattedDate())
                    .font(WidgetFont.caption(size: 9))
                    .foregroundColor(WidgetColors.gold(colorScheme))
            }

            Spacer(minLength: 12)

            Text(entry.sunnah.title)
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(WidgetColors.text(colorScheme))
                .lineLimit(2)

            Spacer(minLength: 8)

            IslamicDivider(colorScheme: colorScheme)

            Spacer(minLength: 8)

            Text(entry.sunnah.description)
                .font(.system(size: 14))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))
                .lineLimit(12)
                .lineSpacing(4)

            Spacer(minLength: 0)

            if let source = entry.sunnah.source, !source.isEmpty {
                HStack {
                    Spacer()
                    Text(source)
                        .font(WidgetFont.caption(size: 10))
                        .foregroundColor(WidgetColors.gold(colorScheme))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            RoundedRectangle(cornerRadius: 6)
                                .fill(WidgetColors.cardBackground(colorScheme))
                        )
                }
            }
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    // MARK: - Lock Screen
    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.sunnah.title)
                .font(.system(size: 12, weight: .bold))
                .lineLimit(1)
            Text(entry.sunnah.description)
                .font(.system(size: 11))
                .lineLimit(2)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.sunnah.title)
    }

    private func formattedDate() -> String {
        let f = DateFormatter()
        f.dateFormat = "MMM d"
        return f.string(from: Date())
    }
}

// MARK: - Widget Definition
struct SunnahOfTheDayWidget: Widget {
    let kind = "SunnahOfTheDayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SunnahOfTheDayProvider()) { entry in
            SunnahOfTheDayWidgetView(entry: entry)
        }
        .configurationDisplayName("Sunnah of the Day")
        .description("A daily Sunnah practice to follow.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Sample
extension SunnahContent {
    static let sample = SunnahContent(
        title: "Using the Miswak",
        description: "The Prophet ﷺ said: \"If I had not found it hard for my followers, I would have ordered them to use the Miswak before every prayer.\"",
        source: "Sahih al-Bukhari 887",
        arabic: nil,
        transliteration: nil
    )
}
