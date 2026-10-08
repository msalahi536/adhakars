# Verify and harden Android prayer locations

## What will change
- Use `navigator.geolocation.getCurrentPosition()` for Android location requests, log permission status and acquired coordinates, and preserve the existing offline coordinate cache.
- Request location on first app launch when no prayer location has been saved, while retaining the manual city search and friendly denied-permission guidance on both Salah and Settings.
- Add diagnostic logs showing the exact coordinates and calculated Fajr, Dhuhr, Asr, Maghrib, and Isha times.
- Add scheduling logs for every real prayer alert and ensure native and standard Android scheduling receive the exact calculated prayer timestamp.

## Verification
- Simulate an Android device location in the browser and confirm coordinates are saved and used in the prayer-time API request.
- Exercise notification scheduling with controlled calculated times and confirm the scheduled timestamps match those times exactly.
- Check the app build and current error logs.

## Technical details
- Keep Aladhan as the calculation provider, including the selected method, Hanafi Asr option, and device timezone.
- Keep cached prayer days for offline use and avoid replacing valid schedules when the prayer-time request fails.
- Do not change iPhone adhan playback or reciter behavior.
