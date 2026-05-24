declare global {
  interface Window {
    OneSignalDeferred: any[];
    OneSignal: any;
  }
}

export const initOneSignal = () => {
  if (typeof window === "undefined") return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.init({
      appId: "9df9c06b-2877-4928-ba27-1fbc2aaf5734",
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
  });
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !window.OneSignal) return false;
  try {
    await window.OneSignal.Notifications.requestPermission();
    return window.OneSignal.Notifications.permission === true;
  } catch (e) {
    console.error("Notification permission error:", e);
    return false;
  }
};

export const getNotificationPermission = (): boolean => {
  if (typeof window === "undefined" || !window.OneSignal) return false;
  return window.OneSignal?.Notifications?.permission === true;
};
