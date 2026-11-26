package com.mindcastmedia.recitationaudio;

import android.content.Context;
import android.media.AudioManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "RecitationAudio")
public class RecitationAudioPlugin extends Plugin {
    private AudioManager audio;
    private Integer previousVolume;
    private int appliedVolume;

    @Override public void load() {
        audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    }
    @PluginMethod public void begin(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (audio == null) { call.reject("Media audio unavailable"); return; }
            try {
                if (previousVolume == null) previousVolume = audio.getStreamVolume(AudioManager.STREAM_MUSIC);
                appliedVolume = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                // Web Audio uses the media stream. Do not switch to voice-call mode.
                audio.setStreamVolume(AudioManager.STREAM_MUSIC, appliedVolume, 0);
                call.resolve();
            } catch (SecurityException error) { restore(); call.reject("Media volume unavailable", error); }
        });
    }
    private void restore() {
        if (audio == null || previousVolume == null) return;
        int saved = previousVolume;
        previousVolume = null;
        // Respect a volume-button change the listener made during recording.
        if (audio.getStreamVolume(AudioManager.STREAM_MUSIC) == appliedVolume) {
            try { audio.setStreamVolume(AudioManager.STREAM_MUSIC, saved, 0); }
            catch (SecurityException ignored) { }
        }
    }
    @PluginMethod public void end(PluginCall call) {
        getActivity().runOnUiThread(() -> { restore(); call.resolve(); });
    }
    @Override protected void handleOnDestroy() { restore(); }
}
