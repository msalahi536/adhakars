// AdhanLiveActivity.swift
// Sahih Al-Adhkar Widget Extension
// Dynamic Island + Lock Screen Live Activity for adhan playback.
// Media-player style layout with play/pause, stop, progress bar.

import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Live Activity Widget

struct AdhanLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AdhanActivityAttributes.self) { context in
            // LOCK SCREEN / BANNER view
            AdhanLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // ── EXPANDED Dynamic Island ──

                DynamicIslandExpandedRegion(.leading) {
                    ZStack {
                        Circle()
                            .fill(Color(hex: "2D5A3D"))
                            .frame(width: 36, height: 36)
                        Image(systemName: "building.columns")
                            .font(.system(size: 14))
                            .foregroundColor(Color(hex: "C9A84C"))
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        Text(context.attributes.prayerName + " Adhan")
                            .font(.system(.caption, design: .rounded))
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Text(context.attributes.reciterName)
                            .font(.system(size: 10, design: .rounded))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if context.state.isPlaying {
                        Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                            .font(.system(.caption2, design: .rounded).monospacedDigit())
                            .fontWeight(.medium)
                            .foregroundColor(Color(hex: "7BAE8E"))
                            .frame(maxWidth: 48)
                    } else {
                        Text("Paused")
                            .font(.system(.caption2, design: .rounded))
                            .foregroundColor(Color(hex: "C9A84C"))
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        // Progress bar
                        if context.state.isPlaying {
                            ProgressView(
                                timerInterval: Date()...context.state.endDate,
                                countsDown: true
                            )
                            .tint(Color(hex: "C9A84C"))
                        } else {
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule()
                                        .fill(Color.white.opacity(0.15))
                                        .frame(height: 4)
                                    Capsule()
                                        .fill(Color(hex: "C9A84C"))
                                        .frame(width: geo.size.width * 0.5, height: 4)
                                }
                            }
                            .frame(height: 4)
                        }

                        // Controls: play/pause centered, stop on right via overlay
                        if #available(iOS 17.0, *) {
                            ZStack {
                                // Play/Pause — centered
                                Button(intent: ToggleAdhanIntent()) {
                                    Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                                        .font(.system(size: 18, weight: .bold))
                                        .foregroundColor(Color(hex: "1A1A2E"))
                                        .frame(width: 40, height: 40)
                                        .background(
                                            Circle()
                                                .fill(Color.white)
                                        )
                                }
                                .buttonStyle(.plain)

                                // Stop — right side
                                HStack {
                                    Spacer()
                                    Button(intent: StopAdhanIntent()) {
                                        Image(systemName: "xmark")
                                            .font(.system(size: 12, weight: .bold))
                                            .foregroundColor(.white.opacity(0.7))
                                            .frame(width: 28, height: 28)
                                            .background(
                                                Circle()
                                                    .fill(Color.white.opacity(0.12))
                                            )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(.top, 2)
                }
            } compactLeading: {
                // COMPACT — left pill: mosque icon
                Image(systemName: "building.columns")
                    .font(.system(size: 12))
                    .foregroundColor(Color(hex: "7BAE8E"))
            } compactTrailing: {
                // COMPACT — right pill
                if context.state.isPlaying {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .font(.system(.caption2, design: .rounded).monospacedDigit())
                        .foregroundColor(Color(hex: "C9A84C"))
                        .frame(maxWidth: 44)
                } else {
                    Image(systemName: "pause.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Color(hex: "C9A84C"))
                }
            } minimal: {
                Image(systemName: "building.columns")
                    .font(.caption2)
                    .foregroundColor(Color(hex: "7BAE8E"))
            }
        }
    }
}

// MARK: - Lock Screen View

struct AdhanLockScreenView: View {
    let context: ActivityViewContext<AdhanActivityAttributes>

    var body: some View {
        VStack(spacing: 10) {
            // Top: icon + info + timer
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color(hex: "2D5A3D"))
                        .frame(width: 44, height: 44)
                    Image(systemName: "building.columns")
                        .font(.system(size: 17))
                        .foregroundColor(Color(hex: "C9A84C"))
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.prayerName + " Adhan")
                        .font(.system(.subheadline, design: .rounded))
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                    Text(context.attributes.reciterName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if context.state.isPlaying {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .font(.system(.callout, design: .rounded).monospacedDigit())
                        .fontWeight(.medium)
                        .foregroundColor(Color(hex: "7BAE8E"))
                        .frame(minWidth: 44)
                }
            }

            // Progress bar
            if context.state.isPlaying {
                ProgressView(
                    timerInterval: Date()...context.state.endDate,
                    countsDown: true
                )
                .tint(Color(hex: "C9A84C"))
            } else {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(Color.white.opacity(0.15))
                            .frame(height: 4)
                        Capsule()
                            .fill(Color(hex: "C9A84C"))
                            .frame(width: geo.size.width * 0.5, height: 4)
                    }
                }
                .frame(height: 4)
            }

            // Controls
            if #available(iOS 17.0, *) {
                HStack(spacing: 12) {
                    // Play/Pause
                    Button(intent: ToggleAdhanIntent()) {
                        HStack(spacing: 6) {
                            Image(systemName: context.state.isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 13, weight: .semibold))
                            Text(context.state.isPlaying ? "Pause" : "Resume")
                                .font(.system(.caption, design: .rounded))
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(Color(hex: "1A1A2E"))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color.white)
                        )
                    }
                    .buttonStyle(.plain)

                    // Stop
                    Button(intent: StopAdhanIntent()) {
                        HStack(spacing: 6) {
                            Image(systemName: "stop.fill")
                                .font(.system(size: 11, weight: .semibold))
                            Text("Stop")
                                .font(.system(.caption, design: .rounded))
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(Color(hex: "EF4444"))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(Color(hex: "EF4444").opacity(0.12))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 14)
                                        .strokeBorder(Color(hex: "EF4444").opacity(0.2), lineWidth: 1)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(Color(hex: "1A1A2E"))
    }
}

// MARK: - Preview

#if DEBUG
struct AdhanLiveActivity_Previews: PreviewProvider {
    static let attributes = AdhanActivityAttributes(
        prayerName: "Fajr",
        reciterName: "Mishary Alafasy",
        reciterId: "mishary"
    )
    static let state = AdhanActivityAttributes.ContentState(
        isPlaying: true,
        endDate: Date().addingTimeInterval(180)
    )

    static var previews: some View {
        attributes
            .previewContext(state, viewKind: .dynamicIsland(.expanded))
            .previewDisplayName("Expanded")

        attributes
            .previewContext(state, viewKind: .dynamicIsland(.compact))
            .previewDisplayName("Compact")

        attributes
            .previewContext(state, viewKind: .content)
            .previewDisplayName("Lock Screen")
    }
}
#endif
