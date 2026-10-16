# Roadmap

## Always Evening: complete page walkthrough
- [ ] Remove conflicting route-based day palettes and complete shared evening surface/text tokens.
- [ ] Verify all eight evening presets across every app page, reading-card transitions, More icons, Tasbih, Settings and prayer popups.

- [x] Add the Adhan Settings prayer calculation pill and themed popup; verify shared method, Asr, and location saving.

- [x] Match the custom appearance popup reference and verify the fixed non-interactive preview

- [x] Remove Gemini appearance matching and simplify the popup
- [x] Add an accurate live home-screen preview and verify photo/color saving

- [x] Add device-photo backgrounds and independent Morning/Evening per-page colors above Suggest a theme
- [x] Connect Gemini palette suggestions with manual editing and verify persistence and page isolation

- [x] Replace stale shared-link image with the current homepage and verify homepage/download previews

- [x] Defer automatic location permission to Salah and prevent repeated prompts
- [x] Repair notification enablement for already-granted permissions and verify all five adhans plus the modify notice

- [x] Remove Run diagnostics from Adhan Settings
- [x] Enable all five adhans on notification permission grant and show an actionable themed notice
- [x] Show the themed release notice once during October 13–19 for new and current users

- [x] Fix the explicit Rate app action so it opens the review destination instead of silently closing
- [x] Remove the entire onboarding process and verify fresh launch

- [x] Keep empty-location Salah controls fully visible and show a ticking sample Fajr countdown

- [x] Add JAKIM prayer times using the Waktu Solat API and verify settings and times
- [x] Remove calculation method and Hanafi Asr from Adhan Settings; retain in main Settings

- [x] Correct widget prayer settings, saved location, and immediate sync; test all four rules
- [x] Verify populated widget content, daily rotation, and live endpoint freshness

- [x] Qibla compass jitter fix (smoothing + removed CSS transition)
- [x] Adhan player: keep minimized state across page navigation
- [x] Replace Self-Ruqyah and Ruqyah for Others steps from the supplied document
- [x] Replace both Ruqyah walkthroughs with the new simple guide and separate source cards
- [x] Rebuild both Ruqyah walkthroughs from the full guide with expandable sources and scrollable readings
- [x] Remove incorrect morning card 21 and evening card 20
- [x] Synchronize recitation visualizer and refine the mini player
- [x] Add previous and next controls to the recitation mini player
- [x] Fix recitation player next button greying out (wrong end-of-list detection)
- [x] Rework More into a tools-first page with compact consistency details and refined Sunnah banner
- [x] Add an All Duas entry with the complete library in one swipe reader
- [x] Restore reliable real-time Salah alerts and period-start encouragement

- [x] Polish onboarding with stable transitions, feature previews, and theme guidance
- [x] Compact the welcome, remove spotlight pulses, and stabilize live walkthrough transitions
- [x] Remove "Available now" eyebrow from homepage download section
- [x] Polish /download page for masjid QR-code visitors (store badges front and center)
- [x] Drop the JS prayer-times handoff; native widgets fetch times from the Al-Adhan API themselves

## Open: Dark Red / always-evening audit (added Oct 16 2026)
- [x] After-Isha adhkar sheet + Adhan Settings sheet outlined in harsh white on Dark Red — restyled to the muted rose card outline.
- [x] Full "always evening" diagnosis across every preset: root cause was .salah-page's legacy light tokens (white --card-border, dark-green ink) beating theme tokens. Evening now inherits each theme's own outline on all presets; Dark Red morning text (countdown, card titles, sample pill) switched to the theme's card ink; "Prayer Times" pill border themed. Verified with computed-style audit + screenshots on all eight presets; no stray green text on Evening/Tasbih/More/Settings.
- [ ] Real-device check on the always-evening Salah page (preview-only fix, not published).
