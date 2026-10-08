// WakeSleepDuaTranslitWidget.swift
// Sahih Al-Adhkar Widget Extension
// Transliteration-only variant — phonetic pronunciation for learning.
// Auto-switches wake/sleep by time of day.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider
struct WakeSleepTranslitProvider: TimelineProvider {
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

// MARK: - Widget View (Transliteration Only)
struct WakeSleepTranslitView: View {
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

            Text(dua.transliteration)
                .font(.system(size: 14, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
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

            Text(dua.transliteration)
                .font(.system(size: 20, weight: .medium).italic())
                .foregroundColor(WidgetColors.primary(colorScheme))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)

            Spacer(minLength: 6)

            Text(dua.translation)
                .font(.system(size: 11))
                .foregroundColor(WidgetColors.secondaryText(colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.7)

            Spacer(minLength: 0)
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
            Text(dua.transliteration)
                .font(.system(size: 11, weight: .medium).italic())
                .lineLimit(2)
                .minimumScaleFactor(0.6)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text("\(dua.isWake ? "☀️" : "🌙") \(dua.title)")
    }
}

// MARK: - Widget Definition
struct WakeSleepDuaTranslitWidget: Widget {
    let kind = "WakeSleepDuaTranslitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WakeSleepTranslitProvider()) { entry in
            WakeSleepTranslitView(entry: entry)
        }
        .configurationDisplayName("Wake & Sleep (Translit)")
        .description("Transliteration — phonetic pronunciation for learning. Auto-switches by time of day.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
