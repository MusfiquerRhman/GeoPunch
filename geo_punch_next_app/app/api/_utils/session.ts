// One week from sign-in, shared by the JWT and both login cookies.
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
import type { AppTokenPayload } from "./jwt";


export function tokenMatchesRoute(payload: AppTokenPayload, pathname: string, hasBearer: boolean) {
  if (pathname.startsWith("/api/geo_punch/")) {
    if (payload.deviceId) return hasBearer;
    // The admin web panel uses the shared route to display attendance photos.
    return payload.isAdmin && pathname.startsWith("/api/geo_punch/uploads/");
  }
  return payload.deviceId === undefined;
}
