import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindcastmedia.adhkar',
  appName: 'Sahih Al-Adhkar',
  webDir: 'dist',
  server: {
    url: 'https://sahihaladhkar.com/app',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      // Stay on the launch screen until the web app reports it has painted
      // (hidden from __root), with a safety timeout so it never sticks.
      launchAutoHide: false,
      launchShowDuration: 8000,
      backgroundColor: '#F4EFE6',
      showSpinner: true,
      iosSpinnerStyle: 'small',
      spinnerColor: '#8A7A55',
    },
  },
  ios: {
    backgroundColor: '#F4EFE6',
    // CRITICAL: Prevent Capacitor's NotificationRouter from stealing
    // UNUserNotificationCenter.delegate from our AppDelegate.
    // Without this, tapping an adhan notification goes to Capacitor's router
    // (which just emits a JS event) instead of our AppDelegate.didReceive
    // (which starts full adhan playback).
    handleApplicationNotifications: false
  }
};

export default config;
