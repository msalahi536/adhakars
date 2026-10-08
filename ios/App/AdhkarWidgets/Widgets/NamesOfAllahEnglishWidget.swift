// NamesOfAllahEnglishWidget.swift
// Sahih Al-Adhkar Widget Extension
// English-only 99 Names — transliteration + meaning, no Arabic.

import WidgetKit
import SwiftUI

// MARK: - View
struct NamesOfAllahEnglishView: View {
    var entry: NamesOfAllahEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        switch family {
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        case .accessoryCircular:
            circularView
        default:
            homeView
        }
    }

    private var homeView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "star.fill")
                    .font(.system(size: 8))
                    .foregroundColor(WidgetColors.primary(colorScheme))
                Text("99 NAMES OF ALLAH")
                    .widgetLabel(colorScheme)
                Spacer()
                Text("#\(entry.name.number)")
                    .font(WidgetFont.caption(size: 9))
                    .foregroundColor(WidgetColors.gold(colorScheme))
            }

            Spacer()

            // Transliteration — large, centered
            Text(entry.name.transliteration)
                .font(.system(size: family == .systemSmall ? 22 : 30, weight: .bold, design: .serif))
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.7)

            Spacer(minLength: 4)

            // Meaning
            Text(entry.name.meaning)
                .font(.system(size: family == .systemSmall ? 13 : 16, weight: .medium))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(2)

            Spacer()

            if family != .systemSmall {
                IslamicDivider(colorScheme: colorScheme, width: 40)
            }
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .center, spacing: 2) {
            Text(entry.name.transliteration)
                .font(.system(size: 13, weight: .bold))
            Text(entry.name.meaning)
                .font(.system(size: 11))
                .lineLimit(1)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text("\(entry.name.transliteration) — \(entry.name.meaning)")
    }

    private var circularView: some View {
        VStack(spacing: 1) {
            Text("\(entry.name.number)")
                .font(.system(size: 14, weight: .bold))
            Text(entry.name.transliteration)
                .font(.system(size: 8))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Widget Definition
struct NamesOfAllahEnglishWidget: Widget {
    let kind = "NamesOfAllahEnglishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NamesOfAllahProvider()) { entry in
            NamesOfAllahEnglishView(entry: entry)
        }
        .configurationDisplayName("99 Names (English)")
        .description("Transliteration and meaning — no Arabic.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}
