import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindcastmedia.adhkar',
  appName: 'Sahih Al-Adhkar',
  webDir: 'dist',
  server: {
    url: 'https://sahihaladhkar.com/app',
    cleartext: false
  },
  ios: {
    // CRITICAL: Prevent Capacitor's NotificationRouter from stealing
    // UNUserNotificationCenter.delegate from our AppDelegate.
    // Without this, tapping an adhan notification goes to Capacitor's router
    // (which just emits a JS event) instead of our AppDelegate.didReceive
    // (which starts full adhan playback).
    handleApplicationNotifications: false
  }
};

export default config;
