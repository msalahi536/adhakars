// NamesOfAllahWidget.swift
// Sahih Al-Adhkar Widget Extension
// Arabic-only 99 Names — large beautiful calligraphy.
// English variant is a separate widget.

import WidgetKit
import SwiftUI

// MARK: - Shared Entry (used by all Names variants)
struct NamesOfAllahEntry: TimelineEntry {
    let date: Date
    let name: NameOfAllah
}

// MARK: - Shared Provider
struct NamesOfAllahProvider: TimelineProvider {
    typealias Entry = NamesOfAllahEntry

    func placeholder(in context: Context) -> NamesOfAllahEntry {
        NamesOfAllahEntry(date: Date(), name: .sample)
    }

    func getSnapshot(in context: Context, completion: @escaping (NamesOfAllahEntry) -> Void) {
        Task {
            let name = await WidgetDataProvider.shared.fetchNameOfAllah() ?? .sample
            completion(NamesOfAllahEntry(date: Date(), name: name))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<NamesOfAllahEntry>) -> Void) {
        Task {
            let name = await WidgetDataProvider.shared.fetchNameOfAllah() ?? .sample
            let entry = NamesOfAllahEntry(date: Date(), name: name)
            let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
            completion(Timeline(entries: [entry], policy: .after(tomorrow)))
        }
    }
}

// MARK: - Arabic View
struct NamesOfAllahArabicView: View {
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

            // Arabic name — large, centered
            Text(entry.name.arabic)
                .font(ArabicFont.display(size: family == .systemSmall ? 32 : 42))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .minimumScaleFactor(0.7)

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
            Text("#\(entry.name.number)")
                .font(.system(size: 9, weight: .semibold))
            Text(entry.name.arabic)
                .font(.system(size: 18, weight: .bold))
                .minimumScaleFactor(0.7)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(entry.name.arabic)
    }

    private var circularView: some View {
        VStack(spacing: 1) {
            Text(entry.name.arabic)
                .font(.system(size: 14, weight: .bold))
            Text("\(entry.name.number)")
                .font(.system(size: 9))
        }
        .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Widget Definition
struct NamesOfAllahWidget: Widget {
    let kind = "NamesOfAllahWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NamesOfAllahProvider()) { entry in
            NamesOfAllahArabicView(entry: entry)
        }
        .configurationDisplayName("99 Names (Arabic)")
        .description("Arabic name of Allah — large, beautiful calligraphy.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline, .accessoryCircular])
    }
}

// MARK: - Sample
extension NameOfAllah {
    static let sample = NameOfAllah(
        number: 1,
        arabic: "الرَّحْمَنُ",
        transliteration: "Ar-Rahman",
        meaning: "The Most Gracious"
    )
}
