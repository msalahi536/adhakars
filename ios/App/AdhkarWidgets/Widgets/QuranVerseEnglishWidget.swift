// QuranVerseEnglishWidget.swift
// Sahih Al-Adhkar Widget Extension
// English-only Quran verse — clean translation text.

import WidgetKit
import SwiftUI

// MARK: - View
struct QuranVerseEnglishView: View {
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

            Text(entry.verse.translation)
                .font(.system(size: family == .systemSmall ? 14 : 18, weight: .medium, design: .serif))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)

            Spacer()

            IslamicDivider(colorScheme: colorScheme, width: 50)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.verse.reference)
                .font(.system(size: 9, weight: .semibold))
            Text(entry.verse.translation)
                .font(.system(size: 11))
                .lineLimit(3)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.verse.reference)
    }
}

// MARK: - Widget Definition
struct QuranVerseEnglishWidget: Widget {
    let kind = "QuranVerseEnglishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuranVerseProvider()) { entry in
            QuranVerseEnglishView(entry: entry)
        }
        .configurationDisplayName("Quran Verse (English)")
        .description("English translation of the daily verse.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
