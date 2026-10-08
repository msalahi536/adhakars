// WidgetTheme.swift
// Sahih Al-Adhkar Widget Extension
// Premium theming with proper Arabic typography and refined color palette.

import SwiftUI

// MARK: - Color Palette
struct WidgetColors {
    // Primary green palette (matches app)
    static let primaryGreen = Color(hex: "2D5A3D")
    static let lightGreen = Color(hex: "4A7C5C")
    static let mintGreen = Color(hex: "7BAE8E")
    static let accentGold = Color(hex: "C9A84C")
    static let warmGold = Color(hex: "D4AF37")

    // Bright accent for "next prayer" selected state
    static let brightGreen = Color(hex: "3DA35D")       // vivid green — light mode
    static let brightGreenDark = Color(hex: "6BCB8B")   // bright mint — dark mode

    // Backgrounds
    static let creamLight = Color(hex: "FDF8F0")
    static let creamMedium = Color(hex: "F5EDE0")
    static let creamWarm = Color(hex: "FAF5EB")
    static let darkBg = Color(hex: "1A1A2E")
    static let darkCard = Color(hex: "252540")
    static let darkElevated = Color(hex: "2D2D4A")

    // Text
    static let textPrimary = Color(hex: "2D2D2D")
    static let textSecondary = Color(hex: "6B6B6B")
    static let textTertiary = Color(hex: "9A9A9A")
    static let textOnDark = Color(hex: "F0ECE3")
    static let textOnDarkSecondary = Color(hex: "A0A0B0")

    // Adaptive colors based on color scheme
    static func background(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? darkBg : creamLight
    }

    static func cardBackground(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? darkCard : creamMedium
    }

    static func elevatedBackground(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? darkElevated : creamWarm
    }

    static func primary(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? lightGreen : primaryGreen
    }

    /// Bright accent used for the "next prayer" highlight — pops more than primary
    static func nextPrayerAccent(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? brightGreenDark : brightGreen
    }

    static func text(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? textOnDark : textPrimary
    }

    static func secondaryText(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? textOnDarkSecondary : textSecondary
    }

    static func tertiaryText(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? textOnDarkSecondary.opacity(0.6) : textTertiary
    }

    static func gold(_ scheme: ColorScheme) -> Color {
        scheme == .dark ? warmGold : accentGold
    }
}

// MARK: - Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}

// MARK: - Typography Helpers

/// Arabic text with proper Naskh-style rendering
struct ArabicFont {
    /// Uses the system's built-in Arabic Naskh typeface for authentic rendering
    static func naskh(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        // .serif on Arabic locales maps to a proper Naskh variant on iOS
        .system(size: size, weight: weight, design: .serif)
    }

    static func display(size: CGFloat) -> Font {
        .system(size: size, weight: .regular, design: .serif)
    }
}

/// Latin text with refined widget typography
struct WidgetFont {
    static func title(size: CGFloat) -> Font {
        .system(size: size, weight: .semibold, design: .rounded)
    }

    static func label(size: CGFloat) -> Font {
        .system(size: size, weight: .bold, design: .rounded)
    }

    static func body(size: CGFloat) -> Font {
        .system(size: size, weight: .regular, design: .default)
    }

    static func caption(size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .default)
    }

    static func mono(size: CGFloat) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
}

// MARK: - Common Widget Styles

struct WidgetLabelStyle: ViewModifier {
    let colorScheme: ColorScheme

    func body(content: Content) -> some View {
        content
            .font(WidgetFont.label(size: 9))
            .foregroundColor(WidgetColors.primary(colorScheme))
            .textCase(.uppercase)
            .tracking(1.2)
    }
}

struct ArabicTextStyle: ViewModifier {
    let size: CGFloat
    let colorScheme: ColorScheme

    func body(content: Content) -> some View {
        content
            .font(ArabicFont.naskh(size: size))
            .foregroundColor(WidgetColors.text(colorScheme))
            .multilineTextAlignment(.trailing)
            .environment(\.layoutDirection, .rightToLeft)
            .lineSpacing(size * 0.3) // generous line height for Arabic
    }
}

struct SourceBadgeStyle: ViewModifier {
    let colorScheme: ColorScheme

    func body(content: Content) -> some View {
        content
            .font(WidgetFont.caption(size: 8))
            .foregroundColor(WidgetColors.tertiaryText(colorScheme))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(WidgetColors.cardBackground(colorScheme).opacity(0.6))
            )
    }
}

// MARK: - Decorative Elements

struct IslamicDivider: View {
    let colorScheme: ColorScheme
    var width: CGFloat = 40

    var body: some View {
        HStack(spacing: 6) {
            Rectangle()
                .fill(WidgetColors.gold(colorScheme).opacity(0.3))
                .frame(width: width * 0.35, height: 1)
            Circle()
                .fill(WidgetColors.gold(colorScheme).opacity(0.6))
                .frame(width: 3, height: 3)
            Rectangle()
                .fill(WidgetColors.gold(colorScheme).opacity(0.3))
                .frame(width: width * 0.35, height: 1)
        }
    }
}

struct GlowingIcon: View {
    let systemName: String
    let isHighlighted: Bool
    let colorScheme: ColorScheme
    var size: CGFloat = 32

    var body: some View {
        ZStack {
            if isHighlighted {
                Circle()
                    .fill(WidgetColors.nextPrayerAccent(colorScheme).opacity(0.2))
                    .frame(width: size + 8, height: size + 8)
            }

            Circle()
                .fill(isHighlighted ? WidgetColors.nextPrayerAccent(colorScheme) : WidgetColors.cardBackground(colorScheme))
                .frame(width: size, height: size)

            Image(systemName: systemName)
                .font(.system(size: size * 0.44, weight: .medium))
                .foregroundColor(isHighlighted ? .white : WidgetColors.primary(colorScheme))
        }
    }
}

// MARK: - Location Permission Overlay

/// Blurred placeholder overlay shown when location is not available.
/// Place this as a ZStack overlay on the widget content.
struct LocationPermissionOverlay: View {
    let colorScheme: ColorScheme

    var body: some View {
        ZStack {
            // Semi-opaque background that blurs the content behind
            Rectangle()
                .fill(.ultraThinMaterial)

            VStack(spacing: 8) {
                Image(systemName: "location.slash.fill")
                    .font(.system(size: 24, weight: .medium))
                    .foregroundColor(WidgetColors.primary(colorScheme))

                Text("Enable Location")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(WidgetColors.text(colorScheme))

                Text("Open the app to set your location for accurate prayer times")
                    .font(.system(size: 10))
                    .foregroundColor(WidgetColors.secondaryText(colorScheme))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 12)
            }
        }
    }
}

/// Compact version for small widgets
struct LocationPermissionOverlayCompact: View {
    let colorScheme: ColorScheme

    var body: some View {
        ZStack {
            Rectangle()
                .fill(.ultraThinMaterial)

            VStack(spacing: 4) {
                Image(systemName: "location.slash.fill")
                    .font(.system(size: 18, weight: .medium))
                    .foregroundColor(WidgetColors.primary(colorScheme))

                Text("Enable Location")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(WidgetColors.text(colorScheme))

                Text("Open app to set location")
                    .font(.system(size: 9))
                    .foregroundColor(WidgetColors.secondaryText(colorScheme))
            }
        }
    }
}

// MARK: - View Extensions

extension View {
    func widgetLabel(_ scheme: ColorScheme) -> some View {
        modifier(WidgetLabelStyle(colorScheme: scheme))
    }

    func arabicText(size: CGFloat = 20, scheme: ColorScheme) -> some View {
        modifier(ArabicTextStyle(size: size, colorScheme: scheme))
    }

    func sourceBadge(_ scheme: ColorScheme) -> some View {
        modifier(SourceBadgeStyle(colorScheme: scheme))
    }
}
