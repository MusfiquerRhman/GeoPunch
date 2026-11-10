import { getApiUrl } from "./API_URL";
import { fetch as expoFetch } from "expo/fetch";
import { DEVICE_HEADER, getDeviceCredential } from "../utils/deviceIdentity";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
  onUnauthorized?: () => Promise<void>;
  device?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, onUnauthorized, device, headers: requestHeaders, ...requestOptions } = options;
  const url = getApiUrl(path);
  const headers = new Headers(requestHeaders);

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (token || device) {
    const { protocol, hostname } = new URL(url);
    const isLocal = ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"].includes(hostname);
    if (protocol !== "https:" && !(protocol === "http:" &&
        (isLocal || (__DEV__ && process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT_HTTP === "true")))) {
      throw new Error("Device approval requires a secure server connection. Contact your administrator.");
    }
    headers.set(DEVICE_HEADER, await getDeviceCredential());
  }
  const redirect = token || device ? "error" : requestOptions.redirect;

  const response = requestOptions.body instanceof FormData
    ? await expoFetch(url, {
        method: requestOptions.method,
        body: requestOptions.body,
        headers,
        redirect,
        credentials: "omit",
      })
    : await fetch(url, { ...requestOptions, headers, redirect, credentials: "omit" });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401 && token) {
    await onUnauthorized?.();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
          ? body.message
          : `Request failed (${response.status})`;
    const code = typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
      ? body.code
      : undefined;
    throw new ApiError(message, response.status, code);
  }

  if (body === null) {
    throw new ApiError("The server returned an invalid response. Please try again.", response.status);
  }

  return body as T;
}
