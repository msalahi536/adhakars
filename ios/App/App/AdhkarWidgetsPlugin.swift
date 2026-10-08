// AdhkarWidgetsPlugin.swift
// Sahih Al-Adhkar
// THIS FILE GOES IN THE MAIN APP TARGET (not the widget extension).
// Capacitor plugin that exposes widget bridge methods to JavaScript.

import Foundation
import Capacitor

@objc(AdhkarWidgetsPlugin)
public class AdhkarWidgetsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AdhkarWidgetsPlugin"
    public let jsName = "AdhkarWidgets"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncPrayerTimes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTasbih", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateTheme", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadWidgets", returnType: CAPPluginReturnPromise),
    ]

    private let bridge_helper = AdhkarWidgetBridge.shared

    // MARK: - Widget Data

    @objc func updateLocation(_ call: CAPPluginCall) {
        let lat = call.getDouble("latitude") ?? 0
        let lon = call.getDouble("longitude") ?? 0
        let method = call.getInt("method") ?? 2
        let school = call.getInt("school") ?? 0
        bridge_helper.updateLocation(latitude: lat, longitude: lon, calcMethod: method, school: school)
        call.resolve()
    }

    /// Receives the exact prayer times the app displays and saves them for widgets.
    /// Each entry: { id: "Fajr", time: "5:23 AM", hour: 5, minute: 23 }
    @objc func syncPrayerTimes(_ call: CAPPluginCall) {
        guard let timesArray = call.getArray("times") as? [[String: Any]] else {
            call.reject("Missing times array")
            return
        }
        bridge_helper.syncPrayerTimes(timesArray)
        call.resolve()
    }

    @objc func updateTasbih(_ call: CAPPluginCall) {
        let count = call.getInt("count") ?? 0
        let target = call.getInt("target") ?? 33
        let phrase = call.getString("phrase") ?? "SubhanAllah"
        bridge_helper.updateTasbihCount(count: count, target: target, phrase: phrase)
        call.resolve()
    }

    @objc func updateTheme(_ call: CAPPluginCall) {
        let theme = call.getString("theme") ?? "system"
        bridge_helper.updateTheme(theme)
        call.resolve()
    }

    @objc func reloadWidgets(_ call: CAPPluginCall) {
        bridge_helper.reloadAllWidgets()
        call.resolve()
    }
}
