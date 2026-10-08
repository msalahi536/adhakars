// AdhanPlugin.swift
// Sahih Al-Adhkar
// Capacitor plugin for per-salah adhan notifications.
// Schedules local notifications with custom adhan sounds (30s clips),
// and plays the full adhan audio when the user taps the notification.
//
// THIS FILE GOES IN THE MAIN APP TARGET (not the widget extension).
//
// NOTE: AdhanAudioManager and AdhanReciters are in AdhanAudioManager.swift
// (shared between App and AdhkarWidgetsExtension targets).

import Foundation
import Capacitor
import UserNotifications
import AVFoundation
import ActivityKit

// MARK: - Adhan Preferences (stored in UserDefaults)

struct AdhanPrefs {
    /// Per-prayer notification enabled state
    var enabledPrayers: [String: Bool]  // ["Fajr": true, "Dhuhr": false, ...]
    /// Sound mode: "adhan", "silent", or "default"
    var soundMode: String
    /// Selected reciter ID for Dhuhr/Asr/Maghrib/Isha (matches filename: adhan-{reciterId}-30.caf)
    var reciterId: String
    /// Selected reciter ID for Fajr only (Fajr has a different adhan melody)
    var fajrReciterId: String

    static let defaultPrefs = AdhanPrefs(
        enabledPrayers: [
            "Fajr": false,
            "Dhuhr": false,
            "Asr": false,
            "Maghrib": false,
            "Isha": false
        ],
        soundMode: "adhan",
        reciterId: "mishary",
        fajrReciterId: "fajr-mishary"
    )

    /// Returns the correct reciter ID for a given prayer
    func reciterForPrayer(_ prayer: String) -> String {
        return prayer == "Fajr" ? fajrReciterId : reciterId
    }
}

// MARK: - Capacitor Plugin

@objc(AdhanPlugin)
public class AdhanPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AdhanPlugin"
    public let jsName = "AdhanNotifications"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedulePrayerNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelAllPrayerNotifications", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updatePreferences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getPreferences", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopAdhan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAdhanPlaying", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pauseAdhan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resumeAdhan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "seekAdhan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getAdhanProgress", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "testPrayerNotification", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDiagnostics", returnType: CAPPluginReturnPromise),
    ]

    private let defaults = UserDefaults(suiteName: appGroupID)

    public override func load() {
        print("[AdhanPlugin] Plugin loaded! jsName=\(jsName)")
    }

    // Notification IDs: use prayer-based IDs so they don't conflict with adhkar reminders
    private let prayerNotifIds: [String: Int] = [
        "Fajr": 100,
        "Dhuhr": 101,
        "Asr": 102,
        "Maghrib": 103,
        "Isha": 104
    ]


    // MARK: - Test a Specific Prayer Notification

    /// Schedules a test notification for a SPECIFIC prayer (e.g., "Fajr") in 5 seconds.
    /// Bypasses the enabledPrayers check. Uses the current reciter and sound mode.
    /// Web call: AdhanNotifications.testPrayerNotification({ prayer: "Fajr" })
    @objc func testPrayerNotification(_ call: CAPPluginCall) {
        guard let prayerName = call.getString("prayer") else {
            call.reject("Missing 'prayer' parameter (e.g., 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha')")
            return
        }

        print("[AdhanPlugin] testPrayerNotification called for: \(prayerName)")

        let prefs = loadPrefs()
        let center = UNUserNotificationCenter.current()

        center.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, error in
            guard let self = self else { return }

            if let error = error {
                print("[AdhanPlugin] Permission error: \(error)")
            }

            guard granted else {
                call.resolve(["success": false, "error": "Permission denied"])
                return
            }

            // Use ID 199 for test notifications
            center.removePendingNotificationRequests(withIdentifiers: ["199"])

            let content = UNMutableNotificationContent()
            content.title = "It's time for \(prayerName)"
            content.body = self.prayerBodyText(for: prayerName, mode: prefs.soundMode)
            content.categoryIdentifier = "PRAYER_NOTIFICATION"

            let activeReciterId = prefs.reciterForPrayer(prayerName)
            let fireDate = Date().addingTimeInterval(5)
            content.userInfo = [
                "prayer": prayerName,
                "reciterId": activeReciterId,
                "soundMode": prefs.soundMode,
                "firedAt": fireDate.timeIntervalSince1970
            ]

            switch prefs.soundMode {
            case "adhan":
                let soundFileName = "adhan-\(activeReciterId)-30.caf"
                content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundFileName))
                print("[AdhanPlugin] Test using sound: \(soundFileName)")
            case "silent":
                content.sound = nil
            default:
                content.sound = .default
            }

            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            let request = UNNotificationRequest(identifier: "199", content: content, trigger: trigger)

            center.add(request) { error in
                if let error = error {
                    print("[AdhanPlugin] Failed to schedule test \(prayerName): \(error)")
                    call.resolve(["success": false, "error": error.localizedDescription])
                } else {
                    print("[AdhanPlugin] Test \(prayerName) notification scheduled in 5s")
                    call.resolve([
                        "success": true,
                        "prayer": prayerName,
                        "reciterId": activeReciterId,
                        "soundMode": prefs.soundMode,
                        "fireIn": 5
                    ])
                }
            }
        }
    }

    // MARK: - Diagnostics

    /// Returns current prefs, pending notification list, and enabled state for debugging.
    @objc func getDiagnostics(_ call: CAPPluginCall) {
        let prefs = loadPrefs()
        let center = UNUserNotificationCenter.current()

        center.getPendingNotificationRequests { requests in
            var pendingList: [[String: Any]] = []
            for req in requests {
                var info: [String: Any] = [
                    "id": req.identifier,
                    "title": req.content.title,
                    "prayer": req.content.userInfo["prayer"] as? String ?? "unknown"
                ]
                if let calTrigger = req.trigger as? UNCalendarNotificationTrigger {
                    let comps = calTrigger.dateComponents
                    info["triggerType"] = "calendar"
                    info["triggerDate"] = "\(comps.year ?? 0)-\(comps.month ?? 0)-\(comps.day ?? 0) \(comps.hour ?? 0):\(comps.minute ?? 0):\(comps.second ?? 0)"
                } else if let timeTrigger = req.trigger as? UNTimeIntervalNotificationTrigger {
                    info["triggerType"] = "timeInterval"
                    info["triggerInterval"] = timeTrigger.timeInterval
                }
                pendingList.append(info)
            }

            center.getNotificationSettings { settings in
                call.resolve([
                    "enabledPrayers": prefs.enabledPrayers,
                    "soundMode": prefs.soundMode,
                    "reciterId": prefs.reciterId,
                    "fajrReciterId": prefs.fajrReciterId,
                    "pendingNotifications": pendingList,
                    "pendingCount": pendingList.count,
                    "authorizationStatus": self.authStatusString(settings.authorizationStatus),
                    "alertSetting": self.settingString(settings.alertSetting),
                    "soundSetting": self.settingString(settings.soundSetting),
                    "notificationCenterSetting": self.settingString(settings.notificationCenterSetting),
                    "lockScreenSetting": self.settingString(settings.lockScreenSetting)
                ])
            }
        }
    }

    private func authStatusString(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .denied: return "denied"
        case .authorized: return "authorized"
        case .provisional: return "provisional"
        case .ephemeral: return "ephemeral"
        @unknown default: return "unknown"
        }
    }

    private func settingString(_ setting: UNNotificationSetting) -> String {
        switch setting {
        case .notSupported: return "notSupported"
        case .disabled: return "disabled"
        case .enabled: return "enabled"
        @unknown default: return "unknown"
        }
    }

    // MARK: - Schedule Prayer Notifications

    @objc func schedulePrayerNotifications(_ call: CAPPluginCall) {
        print("[AdhanPlugin] schedulePrayerNotifications called")

        guard let prayerTimesRaw = call.getArray("prayerTimes") as? [[String: Any]] else {
            print("[AdhanPlugin] ERROR: Missing prayerTimes array")
            call.reject("Missing prayerTimes array")
            return
        }
        print("[AdhanPlugin] Got \(prayerTimesRaw.count) prayer times")

        let prefs = loadPrefs()
        print("[AdhanPlugin] Current prefs - enabledPrayers: \(prefs.enabledPrayers), soundMode: \(prefs.soundMode), reciterId: \(prefs.reciterId)")

        let center = UNUserNotificationCenter.current()

        // FIX: Request permission FIRST, then schedule INSIDE the callback.
        center.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, error in
            guard let self = self else { return }

            if let error = error {
                print("[AdhanPlugin] Permission error: \(error)")
            }
            print("[AdhanPlugin] Notification permission granted: \(granted)")

            guard granted else {
                print("[AdhanPlugin] Permission denied, cannot schedule notifications")
                call.resolve(["scheduled": [], "error": "Permission denied"])
                return
            }

            // Cancel existing prayer notifications first
            let idsToCancel = self.prayerNotifIds.values.map { String($0) }
            let allIds = idsToCancel + ["199"]
            center.removePendingNotificationRequests(withIdentifiers: allIds)

            var scheduled: [String] = []
            var skipped: [[String: String]] = []

            for prayerData in prayerTimesRaw {
                guard let name = prayerData["name"] as? String,
                      let timestamp = prayerData["time"] as? Double else {
                    print("[AdhanPlugin] Skipping prayer data - missing name or time")
                    continue
                }

                // Allow test flag: web can send { name: "Fajr", time: ..., test: true }
                let isTest = (name == "Test") || (prayerData["test"] as? Bool == true)

                if !isTest {
                    guard prefs.enabledPrayers[name] == true else {
                        print("[AdhanPlugin] \(name) is disabled in prefs, skipping")
                        skipped.append(["prayer": name, "reason": "disabled"])
                        continue
                    }
                }

                let notifId = isTest ? 199 : (self.prayerNotifIds[name] ?? -1)
                let finalId = (prayerData["test"] as? Bool == true) ? 199 : notifId
                guard finalId >= 0 else {
                    print("[AdhanPlugin] Unknown prayer: \(name)")
                    skipped.append(["prayer": name, "reason": "unknown prayer name"])
                    continue
                }

                let prayerDate = Date(timeIntervalSince1970: timestamp / 1000.0)

                guard prayerDate > Date() else {
                    print("[AdhanPlugin] \(name) time already passed: \(prayerDate)")
                    skipped.append(["prayer": name, "reason": "time already passed"])
                    continue
                }

                let content = UNMutableNotificationContent()
                content.title = "It's time for \(name)"
                content.body = self.prayerBodyText(for: name, mode: prefs.soundMode)
                content.categoryIdentifier = "PRAYER_NOTIFICATION"

                let activeReciterId = prefs.reciterForPrayer(name)

                content.userInfo = [
                    "prayer": name,
                    "reciterId": activeReciterId,
                    "soundMode": prefs.soundMode,
                    "firedAt": prayerDate.timeIntervalSince1970
                ]

                switch prefs.soundMode {
                case "adhan":
                    let soundFileName = "adhan-\(activeReciterId)-30.caf"
                    content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundFileName))
                    print("[AdhanPlugin] Using sound: \(soundFileName)")
                case "silent":
                    content.sound = nil
                default:
                    content.sound = .default
                }

                let trigger: UNNotificationTrigger
                if isTest {
                    let interval = max(prayerDate.timeIntervalSinceNow, 1)
                    trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
                    print("[AdhanPlugin] Test notification in \(interval)s")
                } else {
                    let calendar = Calendar.current
                    let components = calendar.dateComponents([.year, .month, .day, .hour, .minute, .second], from: prayerDate)
                    trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
                    print("[AdhanPlugin] Scheduled \(name) at \(prayerDate)")
                }

                let request = UNNotificationRequest(
                    identifier: String(finalId),
                    content: content,
                    trigger: trigger
                )

                center.add(request) { error in
                    if let error = error {
                        print("[AdhanPlugin] Failed to schedule \(name): \(error)")
                    } else {
                        print("[AdhanPlugin] Successfully added \(name) notification (id=\(finalId))")
                    }
                }

                scheduled.append(name)
            }

            print("[AdhanPlugin] Scheduled prayers: \(scheduled)")
            print("[AdhanPlugin] Skipped prayers: \(skipped)")

            // After scheduling, verify what's pending
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                center.getPendingNotificationRequests { pending in
                    print("[AdhanPlugin] Verification - total pending notifications: \(pending.count)")
                    for p in pending {
                        print("[AdhanPlugin]   - id=\(p.identifier) title=\(p.content.title)")
                    }
                }
            }

            call.resolve(["scheduled": scheduled, "skipped": skipped])
        }
    }

    // MARK: - Cancel All

    @objc func cancelAllPrayerNotifications(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        let idsToCancel = prayerNotifIds.values.map { String($0) }
        center.removePendingNotificationRequests(withIdentifiers: idsToCancel)
        call.resolve()
    }

    // MARK: - Preferences

    @objc func updatePreferences(_ call: CAPPluginCall) {
        var prefs = loadPrefs()

        if let soundMode = call.getString("soundMode") {
            prefs.soundMode = soundMode
            defaults?.set(soundMode, forKey: "adhan_sound_mode")
        }

        if let reciterId = call.getString("reciterId") {
            prefs.reciterId = reciterId
            defaults?.set(reciterId, forKey: "adhan_reciter_id")
        }

        if let fajrReciterId = call.getString("fajrReciterId") {
            prefs.fajrReciterId = fajrReciterId
            defaults?.set(fajrReciterId, forKey: "adhan_fajr_reciter_id")
        }

        if let enabled = call.getObject("enabledPrayers") {
            for (prayer, value) in enabled {
                if let isEnabled = value as? Bool {
                    prefs.enabledPrayers[prayer] = isEnabled
                }
            }
            if let data = try? JSONEncoder().encode(prefs.enabledPrayers) {
                defaults?.set(data, forKey: "adhan_enabled_prayers")
            }
        }

        print("[AdhanPlugin] updatePreferences => enabledPrayers: \(prefs.enabledPrayers), soundMode: \(prefs.soundMode), reciterId: \(prefs.reciterId), fajrReciterId: \(prefs.fajrReciterId)")

        call.resolve([
            "soundMode": prefs.soundMode,
            "reciterId": prefs.reciterId,
            "fajrReciterId": prefs.fajrReciterId,
            "enabledPrayers": prefs.enabledPrayers
        ])
    }

    @objc func getPreferences(_ call: CAPPluginCall) {
        let prefs = loadPrefs()
        call.resolve([
            "soundMode": prefs.soundMode,
            "reciterId": prefs.reciterId,
            "fajrReciterId": prefs.fajrReciterId,
            "enabledPrayers": prefs.enabledPrayers
        ])
    }

    // MARK: - Audio Control

    @objc func stopAdhan(_ call: CAPPluginCall) {
        AdhanAudioManager.shared.stop()
        call.resolve()
    }

    @objc func isAdhanPlaying(_ call: CAPPluginCall) {
        let mgr = AdhanAudioManager.shared
        call.resolve([
            "playing": mgr.isPlaying,
            "hasSession": mgr.hasActiveSession,
            "prayer": mgr.currentPrayer ?? "",
            "reciterId": mgr.currentReciterId ?? ""
        ])
    }

    @objc func pauseAdhan(_ call: CAPPluginCall) {
        AdhanAudioManager.shared.pause()
        call.resolve()
    }

    @objc func resumeAdhan(_ call: CAPPluginCall) {
        AdhanAudioManager.shared.resume()
        call.resolve()
    }

    @objc func seekAdhan(_ call: CAPPluginCall) {
        guard let progress = call.getDouble("progress") else {
            call.reject("Missing progress parameter (0.0 to 1.0)")
            return
        }
        AdhanAudioManager.shared.seek(to: progress)
        call.resolve()
    }

    @objc func getAdhanProgress(_ call: CAPPluginCall) {
        let mgr = AdhanAudioManager.shared
        call.resolve([
            "currentTime": mgr.currentTime,
            "duration": mgr.duration,
            "progress": mgr.progress,
            "isPlaying": mgr.isPlaying,
            "hasSession": mgr.hasActiveSession,
            "prayer": mgr.currentPrayer ?? "",
            "reciterId": mgr.currentReciterId ?? ""
        ])
    }

    // MARK: - Helpers

    private func loadPrefs() -> AdhanPrefs {
        let soundMode = defaults?.string(forKey: "adhan_sound_mode") ?? "adhan"
        let reciterId = defaults?.string(forKey: "adhan_reciter_id") ?? "mishary"
        let fajrReciterId = defaults?.string(forKey: "adhan_fajr_reciter_id") ?? "fajr-mishary"

        var enabledPrayers = AdhanPrefs.defaultPrefs.enabledPrayers
        if let data = defaults?.data(forKey: "adhan_enabled_prayers"),
           let decoded = try? JSONDecoder().decode([String: Bool].self, from: data) {
            enabledPrayers = decoded
        }

        return AdhanPrefs(
            enabledPrayers: enabledPrayers,
            soundMode: soundMode,
            reciterId: reciterId,
            fajrReciterId: fajrReciterId
        )
    }

    private func prayerBodyText(for prayer: String, mode: String) -> String {
        switch mode {
        case "adhan":
            return "Tap to hear the full Adhan"
        case "silent":
            return "Time to pray"
        default:
            return "Time to pray"
        }
    }
}
