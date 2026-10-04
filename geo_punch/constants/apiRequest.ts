import { getApiUrl } from "./API_URL";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = RequestInit & {
  token?: string | null;
  onUnauthorized?: () => Promise<void>;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, onUnauthorized, headers: requestHeaders, ...requestOptions } = options;
  const headers = new Headers(requestHeaders);

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(getApiUrl(path), {
    ...requestOptions,
    headers,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
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
    throw new ApiError(message, response.status);
  }

  return body as T;
}
