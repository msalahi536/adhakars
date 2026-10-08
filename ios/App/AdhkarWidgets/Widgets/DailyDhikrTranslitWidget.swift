// DailyDhikrTranslitWidget.swift
// Sahih Al-Adhkar Widget Extension
// Transliteration-only daily dhikr — phonetic for learning.

import WidgetKit
import SwiftUI

// MARK: - View
struct DailyDhikrTranslitView: View {
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

            Text(entry.dhikr.transliteration)
                .font(.system(size: family == .systemSmall ? 15 : 20, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
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
        VStack(alignment: .leading, spacing: 2) {
            Text("Dhikr")
                .font(.system(size: 10, weight: .bold))
            Text(entry.dhikr.transliteration)
                .font(.system(size: 11, weight: .medium).italic())
                .lineLimit(2)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dhikr.transliteration)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDhikrTranslitWidget: Widget {
    let kind = "DailyDhikrTranslitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDhikrProvider()) { entry in
            DailyDhikrTranslitView(entry: entry)
        }
        .configurationDisplayName("Daily Dhikr (Translit)")
        .description("Transliteration — phonetic pronunciation for learning.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
