// DailyDuaTranslitWidget.swift
// Sahih Al-Adhkar Widget Extension
// Transliteration-only daily dua — phonetic for learning.

import WidgetKit
import SwiftUI

// MARK: - View
struct DailyDuaTranslitView: View {
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

            Text(entry.dua.transliteration)
                .font(.system(size: family == .systemSmall ? 15 : 20, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
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
        VStack(alignment: .leading, spacing: 2) {
            Text("Dua")
                .font(.system(size: 10, weight: .bold))
            Text(entry.dua.transliteration)
                .font(.system(size: 11, weight: .medium).italic())
                .lineLimit(2)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dua.transliteration)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDuaTranslitWidget: Widget {
    let kind = "DailyDuaTranslitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDuaProvider()) { entry in
            DailyDuaTranslitView(entry: entry)
        }
        .configurationDisplayName("Daily Dua (Translit)")
        .description("Transliteration — phonetic pronunciation for learning.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
