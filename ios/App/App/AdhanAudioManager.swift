// AdhanAudioManager.swift
// Sahih Al-Adhkar
// Manages full adhan audio playback with pause/resume/seek support
// and Dynamic Island Live Activity integration.
//
// THIS FILE MUST BE IN BOTH TARGETS: App AND AdhkarWidgetsExtension
// (Widget extension needs the type for AppIntents, but only App runs the audio)

import Foundation
import AVFoundation
import ActivityKit

// NOTE: AdhanReciters is defined in AdhanActivityAttributes.swift (shared between both targets)

// MARK: - Audio Manager

class AdhanAudioManager: NSObject, AVAudioPlayerDelegate {
    static let shared = AdhanAudioManager()
    private var audioPlayer: AVAudioPlayer?
    private(set) var currentPrayer: String?
    private(set) var currentReciterId: String?
    private var currentActivity: Activity<AdhanActivityAttributes>?

    /// Offset compensation for notification delivery + audio session setup delay
    private let syncCompensation: TimeInterval = 0.7

    // MARK: - Playback

    /// Play full adhan from a given offset (seconds elapsed since notification fired)
    func playFullAdhan(reciterId: String, seekTo: TimeInterval, prayer: String) {
        print("[AdhanAudio] playFullAdhan called: reciter=\(reciterId), seekTo=\(seekTo), prayer=\(prayer)")

        // Try multiple extensions for the full file
        let extensions = ["mp3", "caf", "m4a", "wav"]
        var fileURL: URL?

        for ext in extensions {
            let resource = "adhan-\(reciterId)-full"
            if let url = Bundle.main.url(forResource: resource, withExtension: ext) {
                fileURL = url
                print("[AdhanAudio] Found full adhan: \(resource).\(ext)")
                break
            } else {
                print("[AdhanAudio] Not found: \(resource).\(ext)")
            }
        }

        guard let url = fileURL else {
            print("[AdhanAudio] ERROR: Full adhan file not found for reciter: \(reciterId)")
            if let resourcePath = Bundle.main.resourcePath {
                let fm = FileManager.default
                if let files = try? fm.contentsOfDirectory(atPath: resourcePath) {
                    let adhanFiles = files.filter { $0.contains("adhan") }
                    print("[AdhanAudio] Adhan files in bundle: \(adhanFiles)")
                }
            }
            return
        }

        do {
            // Configure audio session for playback (plays even on silent switch)
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)

            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()

            let duration = audioPlayer?.duration ?? 0
            print("[AdhanAudio] Audio duration: \(duration)s")

            // Apply sync compensation: add a small offset to account for
            // notification delivery delay and audio session setup time
            let adjustedSeek = seekTo + syncCompensation

            // Seek to the elapsed position so it continues seamlessly
            if adjustedSeek > 0 && adjustedSeek < duration {
                audioPlayer?.currentTime = adjustedSeek
                print("[AdhanAudio] Seeking to \(adjustedSeek)s (original: \(seekTo)s + \(syncCompensation)s compensation)")
            }

            audioPlayer?.play()
            currentPrayer = prayer
            currentReciterId = reciterId
            print("[AdhanAudio] Playback started for \(prayer)")

            // Start Dynamic Island Live Activity
            let remainingDuration = duration - (adjustedSeek > 0 ? adjustedSeek : 0)
            startLiveActivity(prayer: prayer, reciterId: reciterId, duration: remainingDuration)

        } catch {
            print("[AdhanAudio] Audio playback error: \(error)")
        }
    }

    /// Stop current adhan playback
    func stop() {
        audioPlayer?.stop()
        audioPlayer = nil
        currentPrayer = nil
        currentReciterId = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        print("[AdhanAudio] Playback stopped")

        // End the Live Activity
        endLiveActivity()
    }

    /// Pause current adhan playback
    func pause() {
        guard let player = audioPlayer, player.isPlaying else { return }
        player.pause()
        print("[AdhanAudio] Playback paused at \(player.currentTime)s")
        updateLiveActivityState(isPlaying: false)
    }

    /// Resume paused adhan playback
    func resume() {
        guard let player = audioPlayer, !player.isPlaying else { return }

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("[AdhanAudio] Failed to reactivate audio session: \(error)")
        }

        player.play()
        print("[AdhanAudio] Playback resumed at \(player.currentTime)s")

        let remaining = player.duration - player.currentTime
        updateLiveActivityState(isPlaying: true, remainingDuration: remaining)
    }

    /// Toggle play/pause
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else if audioPlayer != nil {
            resume()
        }
    }

    /// Seek to a specific position (0.0 to 1.0 progress)
    func seek(to progress: Double) {
        guard let player = audioPlayer else { return }
        let targetTime = player.duration * max(0, min(1, progress))
        player.currentTime = targetTime
        print("[AdhanAudio] Seeked to \(targetTime)s (\(Int(progress * 100))%)")

        if player.isPlaying {
            let remaining = player.duration - targetTime
            updateLiveActivityState(isPlaying: true, remainingDuration: remaining)
        }
    }

    /// Check if currently playing
    var isPlaying: Bool {
        return audioPlayer?.isPlaying ?? false
    }

    /// Check if we have an active (possibly paused) session
    var hasActiveSession: Bool {
        return audioPlayer != nil
    }

    /// Current playback time in seconds
    var currentTime: TimeInterval {
        return audioPlayer?.currentTime ?? 0
    }

    /// Total duration in seconds
    var duration: TimeInterval {
        return audioPlayer?.duration ?? 0
    }

    /// Current progress (0.0 to 1.0)
    var progress: Double {
        guard let player = audioPlayer, player.duration > 0 else { return 0 }
        return player.currentTime / player.duration
    }

    // MARK: - AVAudioPlayerDelegate

    /// Called when audio finishes playing naturally
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        print("[AdhanAudio] Audio finished playing (success: \(flag))")
        currentPrayer = nil
        currentReciterId = nil
        endLiveActivity()
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    // MARK: - Live Activity

    private func startLiveActivity(prayer: String, reciterId: String, duration: TimeInterval) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("[AdhanAudio] Live Activities not enabled")
            return
        }

        // End any existing activity first
        endLiveActivity()

        let attributes = AdhanActivityAttributes(
            prayerName: prayer,
            reciterName: AdhanReciters.displayName(for: reciterId),
            reciterId: reciterId
        )

        let state = AdhanActivityAttributes.ContentState(
            isPlaying: true,
            endDate: Date().addingTimeInterval(duration)
        )

        let content = ActivityContent(state: state, staleDate: nil)

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil
            )
            currentActivity = activity
            print("[AdhanAudio] Live Activity started: \(activity.id)")
        } catch {
            print("[AdhanAudio] Failed to start Live Activity: \(error)")
        }
    }

    private func updateLiveActivityState(isPlaying: Bool, remainingDuration: TimeInterval? = nil) {
        guard let activity = currentActivity else { return }

        let endDate: Date
        if isPlaying, let remaining = remainingDuration {
            endDate = Date().addingTimeInterval(remaining)
        } else {
            // When paused, set endDate to current time (timer stops)
            endDate = Date()
        }

        let state = AdhanActivityAttributes.ContentState(
            isPlaying: isPlaying,
            endDate: endDate
        )

        let content = ActivityContent(state: state, staleDate: nil)

        Task {
            await activity.update(content)
            print("[AdhanAudio] Live Activity updated: isPlaying=\(isPlaying)")
        }
    }

    private func endLiveActivity() {
        guard let activity = currentActivity else { return }

        let finalState = AdhanActivityAttributes.ContentState(
            isPlaying: false,
            endDate: Date()
        )

        let finalContent = ActivityContent(state: finalState, staleDate: nil)

        Task {
            await activity.end(finalContent, dismissalPolicy: .immediate)
            print("[AdhanAudio] Live Activity ended")
        }

        currentActivity = nil
    }
}
