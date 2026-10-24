# GeoPunch Android app

GeoPunch lets employees sign in, take an attendance selfie, submit their current coordinates, and view their attendance history and profile. The Next.js app validates the attendance radius and stores the selfie.

## Configure the app

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the origin of the Next.js server (without `/api`). For an Android emulator, `http://10.0.2.2:3000` reaches a Next.js server running on the development computer. A physical Android device needs the computer's reachable LAN address or a deployed HTTPS URL.

For a local HTTP server, set `EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP=true`. The Android config only permits cleartext traffic for non-production profiles and only when the API URL is HTTP. Production EAS builds require an HTTPS API URL.

The attendance screen uses Leaflet with OpenStreetMap tiles on Android, iOS, and web. No map API key is required. Current-location and office markers remain available, with visible OpenStreetMap attribution. Maps need internet access; GPS attendance and the coordinate display continue to work if the map cannot load. Address lookup uses the device geocoder through Expo Location, which requires no API key.

Leaflet 1.9.4 loads from unpkg. Public OpenStreetMap tiles are best-effort and subject to the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). The map uses normal browser caching, no offline downloads or prefetching, and identifies native requests as GeoPunch/1.0. Rebuild existing native installations after updating dependencies to include react-native-webview and remove the Google Maps SDK.

## Run on Android

```sh
npm install
npx expo start
```

Use a development build or Android emulator. Camera and foreground location permission prompts appear only when the employee opens the attendance flow. No background location or photo-library permission is needed.

For EAS production builds, configure `EXPO_PUBLIC_API_URL` as an HTTPS URL in the EAS production environment before running `eas build --platform android --profile production`.
