# GeoPunch Android app

GeoPunch lets employees sign in, take an attendance selfie, submit their current coordinates, and view their attendance history and profile. The Next.js app validates the attendance radius and stores the selfie.

## Configure the app

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the origin of the Next.js server (without `/api`). For an Android emulator, `http://10.0.2.2:3000` reaches a Next.js server running on the development computer. A physical Android device needs the computer's reachable LAN address or a deployed HTTPS URL.

For a local HTTP server, set `EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP=true`. The Android config only permits cleartext traffic for non-production profiles and only when the API URL is HTTP. Production EAS builds require an HTTPS API URL.

The attendance screen can show a map when `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set. Restrict that Google Maps key to the Android package `com.musfiquerrhman.geo_punch` and the required Maps SDK. Rebuild the native app after changing the key; without it, the app shows the current coordinates instead of a broken map.

## Run on Android

```sh
npm install
npx expo start
```

Use a development build or Android emulator. Camera and foreground location permission prompts appear only when the employee opens the attendance flow. No background location or photo-library permission is needed.

For EAS production builds, configure `EXPO_PUBLIC_API_URL` as an HTTPS URL and optionally `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in the EAS production environment before running `eas build --platform android --profile production`.
