// DailyDhikrWidget.swift
// Sahih Al-Adhkar Widget Extension
// Arabic-only daily dhikr — large beautiful text.
// English and transliteration variants are separate widgets.

import WidgetKit
import SwiftUI

// MARK: - Shared Entry (used by all Dhikr variants)
struct DailyDhikrEntry: TimelineEntry {
    let date: Date
    let dhikr: DhikrContent
}

// MARK: - Shared Provider
struct DailyDhikrProvider: TimelineProvider {
    typealias Entry = DailyDhikrEntry

    func placeholder(in context: Context) -> DailyDhikrEntry {
        DailyDhikrEntry(date: Date(), dhikr: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyDhikrEntry) -> Void) {
        Task {
            let dhikr = await WidgetDataProvider.shared.fetchDailyDhikr() ?? .sample
            completion(DailyDhikrEntry(date: Date(), dhikr: dhikr))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyDhikrEntry>) -> Void) {
        Task {
            let dhikr = await WidgetDataProvider.shared.fetchDailyDhikr() ?? .sample
            let entry = DailyDhikrEntry(date: Date(), dhikr: dhikr)
            let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
            completion(Timeline(entries: [entry], policy: .after(tomorrow)))
        }
    }
}

// MARK: - Arabic View
struct DailyDhikrArabicView: View {
    var entry: DailyDhikrEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        switch family {
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        default:
            homeView
        }
    }

    private var homeView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("DAILY DHIKR")
                    .widgetLabel(colorScheme)
                Spacer()
                if let cat = entry.dhikr.category, !cat.isEmpty {
                    Text(cat)
                        .font(WidgetFont.caption(size: 8))
                        .foregroundColor(WidgetColors.gold(colorScheme))
                }
            }

            Spacer()

            Text(entry.dhikr.arabic)
                .font(ArabicFont.naskh(size: family == .systemSmall ? 20 : 26))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .lineSpacing(6)
                .minimumScaleFactor(0.6)

            Spacer()

            if let source = entry.dhikr.source, !source.isEmpty {
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

    private var lockRectView: some View {
        VStack(alignment: .center, spacing: 2) {
            Text("Dhikr")
                .font(.system(size: 10, weight: .bold))
            Text(entry.dhikr.arabic)
                .font(.system(size: 14))
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.center)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dhikr.arabic)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDhikrWidget: Widget {
    let kind = "DailyDhikrWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDhikrProvider()) { entry in
            DailyDhikrArabicView(entry: entry)
        }
        .configurationDisplayName("Daily Dhikr (Arabic)")
        .description("Arabic dhikr — large, beautiful calligraphy.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Sample
extension DhikrContent {
    static let sample = DhikrContent(
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        transliteration: "SubhanAllahi wa bihamdihi",
        translation: "Glory is to Allah and praise is to Him.",
        source: "Sahih Muslim 2731",
        category: "Morning"
    )
}
