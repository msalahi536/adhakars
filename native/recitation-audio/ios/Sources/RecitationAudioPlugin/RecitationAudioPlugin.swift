import Capacitor
import AVFoundation

@objc(RecitationAudioPlugin)
public class RecitationAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "RecitationAudioPlugin"
    public let jsName = "RecitationAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "begin", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]
    private var previous: (AVAudioSession.Category, AVAudioSession.Mode, AVAudioSession.CategoryOptions)?
    private var observer: NSObjectProtocol?
    private let options: AVAudioSession.CategoryOptions = [.defaultToSpeaker, .mixWithOthers]

    private func apply() throws {
        let audio = AVAudioSession.sharedInstance()
        try audio.setCategory(.playAndRecord, mode: .default, options: options)
        try audio.setAllowHapticsAndSystemSoundsDuringRecording(true)
        try audio.setActive(true)
    }
    @objc public func begin(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let audio = AVAudioSession.sharedInstance()
            if self.previous == nil { self.previous = (audio.category, audio.mode, audio.categoryOptions) }
            do {
                try self.apply()
                // WebKit can reconfigure the shared session as capture starts.
                if self.observer == nil {
                    self.observer = NotificationCenter.default.addObserver(forName: AVAudioSession.routeChangeNotification, object: audio, queue: .main) { [weak self] _ in
                        guard let self, self.previous != nil, audio.category == .playAndRecord else { return }
                        if audio.categoryOptions != self.options { try? self.apply() }
                    }
                }
                call.resolve()
            } catch {
                self.restore()
                call.reject("Could not configure recitation speaker", nil, error)
            }
        }
    }
    private func restore() {
        if let observer { NotificationCenter.default.removeObserver(observer); self.observer = nil }
        guard let previous else { return }
        self.previous = nil
        let audio = AVAudioSession.sharedInstance()
        // Do not overwrite a different player's newly selected audio category.
        guard audio.category == .playAndRecord else { return }
        try? audio.setCategory(previous.0, mode: previous.1, options: previous.2)
        // WebKit owns activation/deactivation; do not deactivate qari/other playback.
    }
    @objc public func end(_ call: CAPPluginCall) {
        DispatchQueue.main.async { self.restore(); call.resolve() }
    }
    deinit { restore() }
}
