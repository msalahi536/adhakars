// DailyDuaEnglishWidget.swift
// Sahih Al-Adhkar Widget Extension
// English-only daily dua — clean translation text.

import WidgetKit
import SwiftUI

// MARK: - View
struct DailyDuaEnglishView: View {
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

            Text(entry.dua.translation)
                .font(.system(size: family == .systemSmall ? 14 : 18, weight: .medium, design: .serif))
                .foregroundColor(WidgetColors.text(colorScheme))
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
            Text(entry.dua.translation)
                .font(.system(size: 11))
                .lineLimit(3)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.dua.translation)
            .lineLimit(1)
    }
}

// MARK: - Widget Definition
struct DailyDuaEnglishWidget: Widget {
    let kind = "DailyDuaEnglishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyDuaProvider()) { entry in
            DailyDuaEnglishView(entry: entry)
        }
        .configurationDisplayName("Daily Dua (English)")
        .description("English translation of the daily dua.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
