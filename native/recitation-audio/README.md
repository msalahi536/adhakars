# Recitation audio routing

Local Capacitor plugin. iOS records with playAndRecord/defaultToSpeaker/mixWithOthers and restores the previous category/mode/options. Android temporarily raises STREAM_MUSIC, leaving voice-call mode untouched, and restores the saved volume unless the user adjusted it.

Run `bunx cap sync ios` / `bunx cap sync android` in the native release checkout, then rebuild the app. Android's application project is maintained outside this checkout; the plugin is discovered by Capacitor during sync. Never force-install this as a web-only change: existing binaries do not contain it.

Safari/PWA uses navigator.audioSession where supported and peak-normalized Web Audio, but cannot force speaker routing, bypass the mute switch, or set hardware volume. iOS native software gain cannot set hardware volume either. No qari graph is modified.
