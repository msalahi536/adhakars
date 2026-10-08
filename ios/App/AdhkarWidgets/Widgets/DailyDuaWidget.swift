// DailyDuaWidget.swift
// Sahih Al-Adhkar Widget Extension
// Arabic-only daily dua — large beautiful text.
// English and transliteration variants are separate widgets.

import WidgetKit
import SwiftUI

// MARK: - Shared Entry (used by all Dua variants)
struct DailyDuaEntry: TimelineEntry {
    let date: Date
    let dua: DuaContent
}

// MARK: - Shared Provider
struct DailyDuaProvider: TimelineProvider {
    typealias Entry = DailyDuaEntry

    func placeholder(in context: Context) -> DailyDuaEntry {
        DailyDuaEntry(date: Date(), dua: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyDuaEntry) -> Void) {
        Task {
            let dua = await WidgetDataProvider.shared.fetchDailyDua() ?? .sample
            completion(DailyDuaEntry(date: Date(), dua: dua))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyDuaEntry>) -> Void) {
        Task {
            let dua = await WidgetDataProvider.shared.fetchDailyDua() ?? .sample
            let entry = DailyDuaEntry(date: Date(), dua: dua)
            let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
            completion(Timeline(entries: [entry], policy: .after(tomorrow)))
        }
    }
}

// MARK: - Arabic View
struct DailyDuaArabicView: View {
    var entry: DailyDuaEntry
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
                Image(systemName: "hands.sparkles.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("DAILY DUA")
                    .widgetLabel(colorScheme)
                Spacer()
                if let occasion = entry.dua.occasion, !occasion.isEmpty {
                    Text(occasion)
                        .font(WidgetFont.caption(size: 8))
                        .foregroundColor(WidgetColors.gold(colorScheme))
                }
            }

            Spacer()

            Text(entry.dua.arabic)
                .font(ArabicFont.naskh(size: family == .systemSmall ? 18 : 24))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .lineSpacing(6)
                .minimumScaleFactor(0.6)

            Spacer()

            if let source = entry.dua.source, !source.isEmpty {
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
            Text("Dua")
                .font(.system(size: 10, weight: .bold))
            Text(entry.dua.arabic)
                .font(.system(size: 14))
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.center)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dua.arabic)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDuaWidget: Widget {
    let kind = "DailyDuaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDuaProvider()) { entry in
            DailyDuaArabicView(entry: entry)
        }
        .configurationDisplayName("Daily Dua (Arabic)")
        .description("Arabic dua — large, beautiful calligraphy.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Sample
extension DuaContent {
    static let sample = DuaContent(
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
        transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar",
        translation: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
        source: "Al-Baqarah 2:201",
        category: nil,
        occasion: "General"
    )
}
