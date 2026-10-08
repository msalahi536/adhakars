// AdhanAppIntents.swift
// Sahih Al-Adhkar
// LiveActivityIntent structs for interactive buttons on the Dynamic Island.
// These allow play/pause and stop directly from the Lock Screen / Dynamic Island.
//
// THIS FILE MUST BE IN BOTH TARGETS: App AND AdhkarWidgetsExtension
// The perform() method runs in the main app process.
// The widget only needs the type definition.

import Foundation
import AppIntents

// MARK: - Toggle Play/Pause Intent

@available(iOS 17.0, *)
struct ToggleAdhanIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Toggle Adhan"
    static var description: IntentDescription = IntentDescription("Play or pause the current adhan")

    func perform() async throws -> some IntentResult {
        AdhanAudioManager.shared.togglePlayPause()
        return .result()
    }
}

// MARK: - Stop Adhan Intent

@available(iOS 17.0, *)
struct StopAdhanIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Stop Adhan"
    static var description: IntentDescription = IntentDescription("Stop the current adhan playback")

    func perform() async throws -> some IntentResult {
        AdhanAudioManager.shared.stop()
        return .result()
    }
}
