# GeoPunch Android app

GeoPunch lets employees sign in, take an attendance selfie, submit their current coordinates, and view their attendance history and profile. The Next.js app accepts attendance from any location and stores the selfie and coordinates.

Sessions last seven days from sign-in and survive closing the app. Expired or invalid saved sessions are cleared at startup, and expiry is checked again when the app returns to the foreground. Employees can sign in again after expiry; late requests from their previous session cannot clear the new login. Login errors show the server's credential error instead of a session-expired message.

Session fixes require an updated Android build. Deploy the matching Next.js backend so new sign-ins receive a token valid for the full seven days; existing tokens keep their original expiry.

## Configure the app

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the origin of the Next.js server (without `/api`). For an Android emulator, `http://10.0.2.2:3000` reaches a Next.js server running on the development computer. A physical Android device needs the computer's reachable LAN address or a deployed HTTPS URL.

For a local HTTP server, set `EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP=true`. The Android config only permits cleartext traffic for non-production profiles and only when the API URL is HTTP. Production EAS builds require an HTTPS API URL.

The attendance screen uses Leaflet with OpenStreetMap tiles on Android, iOS, and web. No map API key is required. Current-location and office markers remain available, with visible OpenStreetMap attribution. Maps need internet access; GPS attendance and the coordinate display continue to work if the map cannot load. Address lookup uses the device geocoder through Expo Location, which requires no API key.

Leaflet 1.9.4 loads from unpkg. Public OpenStreetMap tiles are best-effort and subject to the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/). The map uses normal browser caching, no offline downloads or prefetching, and identifies native requests as GeoPunch/1.0. Rebuild existing native installations after updating dependencies to include react-native-webview and remove the Google Maps SDK.

## Attendance history

History opens in List view with 10 punch cards per page, newest first, including older months. Calendar view shows the selected month's total recorded, pending, and rejected punches above the calendar. Each calendar date has one colored dot per individual punch (green approved, amber pending, red rejected); dates without punches stay blank. Selecting a date expands its first/last times and every punch card directly below the calendar. All dates and times use Asia/Dhaka.

Each punch card includes the protected selfie, date/time, saved address, coordinates, and status. View on map opens the saved punch location in a popup. Use the List and Calendar tabs to switch views, and Previous and Next to move between list pages. Each page starts at the top; the final page can contain fewer than 10 punches. Pull to refresh or use the refresh button to update review statuses; the visible screen also refreshes when returning to the app and once a minute. Legacy records without an address use the device geocoder only when location access is already granted.

This History screen requires the matching `GET /api/geo_punch/history` backend route. Existing app versions continue using the unchanged latest-20 endpoint. The new route is read-only, scopes every request to the signed-in employee, and uses the existing protected photo service and map tiles. Release the updated backend before distributing a new Android build.

## Run on Android

```sh
npm install
npx expo start
```

Use a development build or Android emulator. Camera and foreground location permission prompts appear only when the employee opens the attendance flow. No background location or photo-library permission is needed.

For EAS production builds, configure `EXPO_PUBLIC_API_URL` as an HTTPS URL in the EAS production environment before running `eas build --platform android --profile production`.
