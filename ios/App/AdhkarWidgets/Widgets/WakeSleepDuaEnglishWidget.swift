// WakeSleepDuaEnglishWidget.swift
// Sahih Al-Adhkar Widget Extension
// English-only variant — just the translation, clean and readable.
// Auto-switches wake/sleep by time of day.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct WakeSleepEnglishProvider: TimelineProvider {
    typealias Entry = WakeSleepDuaEntry

    func placeholder(in context: Context) -> WakeSleepDuaEntry {
        WakeSleepDuaEntry(date: Date(), dua: .wake)
    }

    func getSnapshot(in context: Context, completion: @escaping (WakeSleepDuaEntry) -> Void) {
        completion(WakeSleepDuaEntry(date: Date(), dua: WakeSleepDua.current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WakeSleepDuaEntry>) -> Void) {
        let now = Date()
        let entry = WakeSleepDuaEntry(date: now, dua: WakeSleepDua.current())
        let nextRefresh = WakeSleepDua.nextRefreshDate(from: now)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

// MARK: - Widget View (English Translation Only)
struct WakeSleepEnglishView: View {
    var entry: WakeSleepDuaEntry
    @Environment(\.widgetFamily) var family
    @Environment(\.colorScheme) var colorScheme

    private var dua: WakeSleepDua { entry.dua }

    var body: some View {
        switch family {
        case .systemSmall:
            smallView
        case .systemMedium:
            mediumView
        case .accessoryRectangular:
            lockRectView
        case .accessoryInline:
            lockInlineView
        default:
            mediumView
        }
    }

    private var smallView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 8))
                    .foregroundColor(dua.isWake ? WidgetColors.gold(colorScheme) : WidgetColors.primary(colorScheme))
                Text(dua.title.uppercased())
                    .widgetLabel(colorScheme)
                Spacer()
            }

            Spacer()

            Text(dua.translation)
                .font(.system(size: 14, weight: .medium, design: .serif))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)

            Spacer()

            Text("Al-Bukhari")
                .sourceBadge(colorScheme)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var mediumView: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 10))
                    .foregroundColor(dua.isWake ? WidgetColors.gold(colorScheme) : WidgetColors.primary(colorScheme))
                Text(dua.title.uppercased())
                    .widgetLabel(colorScheme)
                Spacer()
                Text("Al-Bukhari")
                    .sourceBadge(colorScheme)
            }

            Spacer()

            Text(dua.translation)
                .font(.system(size: 18, weight: .medium, design: .serif))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)

            Spacer()

            IslamicDivider(colorScheme: colorScheme, width: 80)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 10))
                Text(dua.title)
                    .font(.system(size: 10, weight: .bold))
                Spacer()
            }
            Text(dua.translation)
                .font(.system(size: 11))
                .lineLimit(3)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text("\(dua.isWake ? "☀️" : "🌙") \(dua.title)")
    }
}

// MARK: - Widget Definition
struct WakeSleepDuaEnglishWidget: Widget {
    let kind = "WakeSleepDuaEnglishWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WakeSleepEnglishProvider()) { entry in
            WakeSleepEnglishView(entry: entry)
        }
        .configurationDisplayName("Wake & Sleep (English)")
        .description("English translation only — clean and readable. Auto-switches by time of day.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
