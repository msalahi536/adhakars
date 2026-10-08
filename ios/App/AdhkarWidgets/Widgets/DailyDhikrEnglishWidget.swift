// DailyDhikrEnglishWidget.swift
// Sahih Al-Adhkar Widget Extension
// English-only daily dhikr — clean translation text.

import WidgetKit
import SwiftUI

// MARK: - View
struct DailyDhikrEnglishView: View {
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

            Text(entry.dhikr.translation)
                .font(.system(size: family == .systemSmall ? 14 : 18, weight: .medium, design: .serif))
                .foregroundColor(WidgetColors.text(colorScheme))
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
            Text(entry.dhikr.translation)
                .font(.system(size: 11))
                .lineLimit(3)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dhikr.translation)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDhikrEnglishWidget: Widget {
    let kind = "DailyDhikrEnglishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDhikrProvider()) { entry in
            DailyDhikrEnglishView(entry: entry)
        }
        .configurationDisplayName("Daily Dhikr (English)")
        .description("English translation of the daily dhikr.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
