// AppDelegate.swift
// Sahih Al-Adhkar
// Handles notification delegate, adhan playback on tap, background audio,
// Dynamic Island Live Activity, and deep links.

import UIKit
import Capacitor
import UserNotifications
import WebKit
import AVFoundation

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    /// Pending adhan info to play after the webview is ready (cold launch case)
    private var pendingAdhanInfo: [String: Any]?
    /// Pending route to navigate to after the webview is ready (cold launch case)
    private var pendingRoute: String?
    /// Background task identifier for keeping audio alive
    private var backgroundTaskID: UIBackgroundTaskIdentifier = .invalid

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Register as notification delegate so we receive taps
        UNUserNotificationCenter.current().delegate = self
        print("[AppDelegate] didFinishLaunchingWithOptions - notification delegate set")

        // Pre-configure audio session so it's ready for background playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            print("[AppDelegate] Audio session configured for playback")
        } catch {
            print("[AppDelegate] Failed to configure audio session: \(error)")
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {
        // If adhan is playing, start a background task to keep it alive
        if AdhanAudioManager.shared.isPlaying {
            startBackgroundTask()
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        endBackgroundTask()
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Verify our delegate is still in place
        let center = UNUserNotificationCenter.current()
        if !(center.delegate is AppDelegate) {
            print("[AppDelegate] Delegate was overridden! Re-asserting...")
            center.delegate = self
        }

        // On cold launch after notification tap, check if we have pending adhan to play
        if let pending = pendingAdhanInfo {
            print("[AppDelegate] applicationDidBecomeActive - processing pending adhan")
            processPendingAdhan(pending)
            pendingAdhanInfo = nil
        }

        // On cold launch after notification tap, navigate to pending route
        if let route = pendingRoute {
            print("[AppDelegate] applicationDidBecomeActive - processing pending route: \(route)")
            navigateWebViewWithRetry(to: route, attempts: 0)
            pendingRoute = nil
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if url.scheme == "sahihaladhkar" {
            handleWidgetDeepLink(url)
        }
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // MARK: - Background Task

    private func startBackgroundTask() {
        guard backgroundTaskID == .invalid else { return }
        backgroundTaskID = UIApplication.shared.beginBackgroundTask(withName: "AdhanPlayback") { [weak self] in
            self?.endBackgroundTask()
        }
        print("[AppDelegate] Started background task for adhan playback")
    }

    private func endBackgroundTask() {
        guard backgroundTaskID != .invalid else { return }
        UIApplication.shared.endBackgroundTask(backgroundTaskID)
        backgroundTaskID = .invalid
    }

    // MARK: - Deep Links

    private func handleWidgetDeepLink(_ url: URL) {
        let page = url.host ?? "home"
        let webPath: String
        switch page {
        case "salah":    webPath = "/app/salah"
        case "tasbih":   webPath = "/app/tasbih"
        case "morning":  webPath = "/app/morning"
        case "evening":  webPath = "/app/evening"
        case "qibla":    webPath = "/app/qibla"
        case "settings": webPath = "/app/settings"
        default:         webPath = "/app"
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.navigateWebView(to: webPath)
        }
    }

    private func navigateWebView(to path: String) {
        guard let rootVC = window?.rootViewController else { return }
        if let bridgeVC = findBridgeVC(rootVC) {
            let js = "window.location.href = 'https://sahihaladhkar.com\(path)';"
            bridgeVC.bridge?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    /// Shared helper to find the CAPBridgeViewController in the view hierarchy
    private func findBridgeVC(_ vc: UIViewController) -> CAPBridgeViewController? {
        if let bridgeVC = vc as? CAPBridgeViewController { return bridgeVC }
        for child in vc.children {
            if let found = findBridgeVC(child) { return found }
        }
        return nil
    }

    // MARK: - Route Navigation

    /// Known notification IDs → web routes (fallback when extra.route is missing)
    private func routeForNotificationId(_ identifier: String) -> String? {
        // Capacitor LocalNotifications use the notification ID as the request identifier
        switch identifier {
        case "1":  return "/app/"         // morning adhkar
        case "2":  return "/app/evening"  // evening adhkar
        case "3":  return "/app/more"     // nudge / streak
        default:   return nil
        }
    }

    /// Navigate webview with retry for cold launch (webview may not be ready yet)
    private func navigateWebViewWithRetry(to path: String, attempts: Int) {
        let maxAttempts = 5
        let delay = attempts == 0 ? 1.0 : 2.0

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self else { return }
            guard let rootVC = self.window?.rootViewController,
                  let bridgeVC = self.findBridgeVC(rootVC),
                  let webView = bridgeVC.bridge?.webView else {
                print("[AppDelegate] WebView not ready for route (attempt \(attempts + 1)/\(maxAttempts))")
                if attempts + 1 < maxAttempts {
                    self.navigateWebViewWithRetry(to: path, attempts: attempts + 1)
                }
                return
            }

            let checkJS = "typeof window !== 'undefined' && document.readyState === 'complete'"
            webView.evaluateJavaScript(checkJS) { [weak self] result, error in
                let isReady = (result as? Bool) == true
                print("[AppDelegate] WebView ready for route (attempt \(attempts + 1)): \(isReady)")

                if isReady {
                    self?.navigateWebView(to: path)
                } else if attempts + 1 < maxAttempts {
                    self?.navigateWebViewWithRetry(to: path, attempts: attempts + 1)
                } else {
                    print("[AppDelegate] Max attempts for route, navigating anyway")
                    self?.navigateWebView(to: path)
                }
            }
        }
    }

    // MARK: - Adhan Helpers

    /// Extract a Double from userInfo safely — handles both Double and NSNumber
    private func doubleFromUserInfo(_ userInfo: [AnyHashable: Any], key: String) -> Double? {
        if let val = userInfo[key] as? Double { return val }
        if let val = userInfo[key] as? NSNumber { return val.doubleValue }
        return nil
    }

    /// Extract adhan info from a notification's userInfo dict
    private func extractAdhanInfo(from userInfo: [AnyHashable: Any]) -> (prayer: String, reciterId: String, soundMode: String, firedAt: Double)? {
        guard let prayer = userInfo["prayer"] as? String,
              let reciterId = userInfo["reciterId"] as? String,
              let soundMode = userInfo["soundMode"] as? String,
              let firedAt = doubleFromUserInfo(userInfo, key: "firedAt") else {
            return nil
        }
        return (prayer, reciterId, soundMode, firedAt)
    }

    /// Start full adhan playback from elapsed position
    private func startAdhanPlayback(prayer: String, reciterId: String, firedAt: Double) {
        let elapsed = Date().timeIntervalSince1970 - firedAt
        let seekTo = elapsed > 0 && elapsed < 300 ? elapsed : 0
        print("[AppDelegate] Starting adhan: \(prayer), elapsed=\(elapsed)s, seekTo=\(seekTo)s")
        AdhanAudioManager.shared.playFullAdhan(reciterId: reciterId, seekTo: seekTo, prayer: prayer)

        // Keep audio alive if we go to background
        startBackgroundTask()
    }

    /// Process pending adhan after app becomes active (cold launch)
    private func processPendingAdhan(_ info: [String: Any]) {
        guard let prayer = info["prayer"] as? String,
              let reciterId = info["reciterId"] as? String,
              let seekTo = info["seekTo"] as? TimeInterval else { return }

        print("[AppDelegate] processPendingAdhan: \(prayer), reciter=\(reciterId), seekTo=\(seekTo)")
        AdhanAudioManager.shared.playFullAdhan(reciterId: reciterId, seekTo: seekTo, prayer: prayer)
        startBackgroundTask()
        notifyWebAppWithRetry(prayer: prayer, reciterId: reciterId, attempts: 0)
    }

    /// Notify web app with retry mechanism for cold launch
    private func notifyWebAppWithRetry(prayer: String, reciterId: String, attempts: Int) {
        let maxAttempts = 5
        let delay = attempts == 0 ? 1.0 : 2.0

        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self = self else { return }
            guard let rootVC = self.window?.rootViewController,
                  let bridgeVC = self.findBridgeVC(rootVC),
                  let webView = bridgeVC.bridge?.webView else {
                print("[AppDelegate] WebView not ready yet (attempt \(attempts + 1)/\(maxAttempts))")
                if attempts + 1 < maxAttempts {
                    self.notifyWebAppWithRetry(prayer: prayer, reciterId: reciterId, attempts: attempts + 1)
                }
                return
            }

            let checkJS = "typeof window !== 'undefined' && document.readyState === 'complete'"
            webView.evaluateJavaScript(checkJS) { [weak self] result, error in
                let isReady = (result as? Bool) == true
                print("[AppDelegate] WebView ready check (attempt \(attempts + 1)): \(isReady)")

                if isReady {
                    self?.dispatchAdhanEvent(prayer: prayer, reciterId: reciterId, in: webView)
                } else if attempts + 1 < maxAttempts {
                    self?.notifyWebAppWithRetry(prayer: prayer, reciterId: reciterId, attempts: attempts + 1)
                } else {
                    print("[AppDelegate] Max attempts reached, dispatching event anyway")
                    self?.dispatchAdhanEvent(prayer: prayer, reciterId: reciterId, in: webView)
                }
            }
        }
    }

    /// Dispatch the adhan:playing event to the webview
    private func dispatchAdhanEvent(prayer: String, reciterId: String, in webView: WKWebView) {
        let js = """
        window.dispatchEvent(new CustomEvent('adhan:playing', { detail: { prayer: '\(prayer)', reciterId: '\(reciterId)' } }));
        """
        webView.evaluateJavaScript(js) { result, error in
            if let error = error {
                print("[AppDelegate] Failed to dispatch adhan:playing event: \(error)")
            } else {
                print("[AppDelegate] Dispatched adhan:playing event for \(prayer)")
            }
        }
    }
}

// MARK: - Notification Tap Handler (Adhan continuation)

extension AppDelegate: UNUserNotificationCenterDelegate {

    /// Called when user taps a notification (app opens from background/terminated)
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        print("[AppDelegate] ✅ didReceive notification tap!")
        print("[AppDelegate] userInfo keys: \(userInfo.keys)")
        print("[AppDelegate] action: \(response.actionIdentifier)")

        guard let info = extractAdhanInfo(from: userInfo) else {
            print("[AppDelegate] Not an adhan notification — checking for route")
            print("[AppDelegate] Full userInfo: \(userInfo)")

            // Try to get the route — Capacitor nests extra data inside "cap_extra"
            var route: String? = nil

            // 1. Check cap_extra dict (where Capacitor LocalNotifications puts the extra field)
            if let capExtra = userInfo["cap_extra"] as? [String: Any],
               let extraRoute = capExtra["route"] as? String, !extraRoute.isEmpty {
                route = extraRoute
                print("[AppDelegate] Found route in cap_extra: \(extraRoute)")
            }
            // 2. Check top-level userInfo (in case some notifications put it there)
            else if let extraRoute = userInfo["route"] as? String, !extraRoute.isEmpty {
                route = extraRoute
                print("[AppDelegate] Found route in top-level userInfo: \(extraRoute)")
            }
            // 3. Fallback: derive route from the notification request identifier (the notification ID)
            else {
                let identifier = response.notification.request.identifier
                route = routeForNotificationId(identifier)
                print("[AppDelegate] Fallback route from ID '\(identifier)': \(route ?? "none")")
            }

            if let route = route {
                if window?.rootViewController == nil {
                    print("[AppDelegate] Cold launch — deferring route navigation to: \(route)")
                    pendingRoute = route
                } else {
                    print("[AppDelegate] Navigating to route: \(route)")
                    navigateWebViewWithRetry(to: route, attempts: 0)
                }
            } else {
                print("[AppDelegate] No route found for notification")
            }

            completionHandler()
            return
        }

        print("[AppDelegate] Prayer tap: \(info.prayer), reciter=\(info.reciterId), mode=\(info.soundMode)")

        guard info.soundMode == "adhan" else {
            print("[AppDelegate] Sound mode is '\(info.soundMode)', not playing adhan")
            completionHandler()
            return
        }

        // Check cold launch vs background
        if window?.rootViewController == nil {
            print("[AppDelegate] Cold launch detected - deferring adhan playback")
            let elapsed = Date().timeIntervalSince1970 - info.firedAt
            let seekTo = elapsed > 0 && elapsed < 300 ? elapsed : 0
            pendingAdhanInfo = [
                "prayer": info.prayer,
                "reciterId": info.reciterId,
                "seekTo": seekTo
            ]
        } else {
            print("[AppDelegate] App was in background - playing adhan now")
            startAdhanPlayback(prayer: info.prayer, reciterId: info.reciterId, firedAt: info.firedAt)
            notifyWebAppWithRetry(prayer: info.prayer, reciterId: info.reciterId, attempts: 0)
        }

        completionHandler()
    }

    /// Called when a notification arrives while the app is in the foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let userInfo = notification.request.content.userInfo
        print("[AppDelegate] willPresent - notification arrived in foreground")

        // If this is an adhan prayer notification, start AVAudioPlayer immediately
        // so the audio is independent of the notification banner lifecycle
        if let info = extractAdhanInfo(from: userInfo), info.soundMode == "adhan" {
            print("[AppDelegate] Foreground adhan notification — starting AVAudioPlayer directly")

            // Play via AVAudioPlayer (independent of notification sound)
            startAdhanPlayback(prayer: info.prayer, reciterId: info.reciterId, firedAt: info.firedAt)

            // Notify the web app
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                guard let rootVC = self?.window?.rootViewController,
                      let bridgeVC = self?.findBridgeVC(rootVC),
                      let webView = bridgeVC.bridge?.webView else { return }
                self?.dispatchAdhanEvent(prayer: info.prayer, reciterId: info.reciterId, in: webView)
            }

            // Show banner but NO sound (we're playing via AVAudioPlayer instead)
            completionHandler([.banner])
        } else {
            // Non-adhan notification: show normally
            completionHandler([.banner, .sound])
        }
    }
}
