// AdhanActivityAttributes.swift
// Sahih Al-Adhkar
// Shared ActivityKit attributes for the Adhan Live Activity / Dynamic Island.
// ADD THIS FILE TO BOTH the main App target AND the AdhkarWidgets extension target.

import Foundation
import ActivityKit

struct AdhanActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var isPlaying: Bool
        var endDate: Date      // When the adhan audio will finish
    }

    // Fixed data set when the activity starts
    var prayerName: String     // "Fajr", "Dhuhr", etc.
    var reciterName: String    // Display name of the reciter
    var reciterId: String      // ID for icon purposes
}

// MARK: - Reciter Display Names

struct AdhanReciters {
    static let displayNames: [String: String] = [
        "mishary":       "Mishary Alafasy",
        "basit":         "Abdul Basit",
        "makkah":        "Makkah",
        "madinah":       "Madinah",
        "zaili":         "Zaili",
        "majale":        "Majale",
        "qatami":        "Nasser Al Qatami",
        "fajr-mishary":  "Mishary Alafasy (Fajr)",
        "fajr-madinah":  "Madinah (Fajr)"
    ]

    static func displayName(for id: String) -> String {
        return displayNames[id] ?? id.capitalized
    }
}
