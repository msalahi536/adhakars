// QuranVerseWidget.swift
// Sahih Al-Adhkar Widget Extension
// Arabic-only Quran verse — large beautiful ayah.
// English variant is a separate widget.

import WidgetKit
import SwiftUI

// MARK: - Shared Entry (used by all Quran variants)
struct QuranVerseEntry: TimelineEntry {
    let date: Date
    let verse: QuranVerseContent
}

// MARK: - Shared Provider
struct QuranVerseProvider: TimelineProvider {
    typealias Entry = QuranVerseEntry

    func placeholder(in context: Context) -> QuranVerseEntry {
        QuranVerseEntry(date: Date(), verse: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuranVerseEntry) -> Void) {
        Task {
            let verse = await WidgetDataProvider.shared.fetchQuranVerse() ?? .sample
            completion(QuranVerseEntry(date: Date(), verse: verse))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuranVerseEntry>) -> Void) {
        Task {
            let verse = await WidgetDataProvider.shared.fetchQuranVerse() ?? .sample
            let entry = QuranVerseEntry(date: Date(), verse: verse)
            let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
            completion(Timeline(entries: [entry], policy: .after(tomorrow)))
        }
    }
}

// MARK: - Arabic View
struct QuranVerseArabicView: View {
    var entry: QuranVerseEntry
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
                Image(systemName: "book.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("QURAN")
                    .widgetLabel(colorScheme)
                Spacer()
                Text(entry.verse.reference)
                    .font(WidgetFont.caption(size: 9))
                    .foregroundColor(WidgetColors.gold(colorScheme))
            }

            Spacer()

            Text(entry.verse.arabic)
                .font(ArabicFont.naskh(size: family == .systemSmall ? 20 : 26))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .lineSpacing(6)
                .minimumScaleFactor(0.6)

            Spacer()

            IslamicDivider(colorScheme: colorScheme, width: 50)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .center, spacing: 2) {
            Text(entry.verse.reference)
                .font(.system(size: 9, weight: .semibold))
            Text(entry.verse.arabic)
                .font(.system(size: 14))
                .lineLimit(2)
                .minimumScaleFactor(0.6)
                .multilineTextAlignment(.center)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.verse.reference)
    }
}

// MARK: - Widget Definition
struct QuranVerseWidget: Widget {
    let kind = "QuranVerseWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuranVerseProvider()) { entry in
            QuranVerseArabicView(entry: entry)
        }
        .configurationDisplayName("Quran Verse (Arabic)")
        .description("Arabic ayah — large, beautiful calligraphy.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}

// MARK: - Sample
extension QuranVerseContent {
    static let sample = QuranVerseContent(
        arabic: "إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ وَالْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ",
        translation: "Indeed, the Muslim men and Muslim women, the believing men and believing women...",
        surah: "Al-Ahzab",
        ayah: "35",
        reference: "Al-Ahzab 33:35"
    )
}
