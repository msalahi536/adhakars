// WakeSleepDuaArabicWidget.swift
// Sahih Al-Adhkar Widget Extension
// Arabic-only variant of the Wake/Sleep Dua — large, beautiful Arabic text
// with no transliteration or translation. Just swipe the widget picker.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider (reuses WakeSleepDua data from WakeSleepDuaWidget)
struct WakeSleepArabicProvider: TimelineProvider {
    typealias Entry = WakeSleepDuaEntry  // Reuses same entry type

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

// MARK: - Widget View (Arabic Only — big beautiful text)
struct WakeSleepArabicView: View {
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

            Text(dua.arabic)
                .font(ArabicFont.naskh(size: 22))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
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

            Text(dua.arabic)
                .font(ArabicFont.naskh(size: 28))
                .foregroundColor(WidgetColors.text(colorScheme))
                .multilineTextAlignment(.center)
                .environment(\.layoutDirection, .rightToLeft)
                .minimumScaleFactor(0.6)

            Spacer()

            IslamicDivider(colorScheme: colorScheme, width: 80)
        }
        .padding()
        .containerBackground(WidgetColors.background(colorScheme), for: .widget)
    }

    private var lockRectView: some View {
        VStack(alignment: .center, spacing: 2) {
            HStack {
                Image(systemName: dua.icon)
                    .font(.system(size: 10))
                Text(dua.title)
                    .font(.system(size: 10, weight: .bold))
                Spacer()
            }
            Text(dua.arabic)
                .font(.system(size: 16, design: .serif))
                .environment(\.layoutDirection, .rightToLeft)
                .lineLimit(2)
                .minimumScaleFactor(0.5)
                .multilineTextAlignment(.center)
        }
        .containerBackground(.clear, for: .widget)
    }

    private var lockInlineView: some View {
        Text(dua.arabic)
            .lineLimit(1)
            .minimumScaleFactor(0.5)
    }
}

// MARK: - Widget Definition
struct WakeSleepDuaArabicWidget: Widget {
    let kind = "WakeSleepDuaArabicWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WakeSleepArabicProvider()) { entry in
            WakeSleepArabicView(entry: entry)
        }
        .configurationDisplayName("Wake & Sleep (Arabic)")
        .description("Arabic only — large, beautiful calligraphy. Auto-switches by time of day.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
    }
}
