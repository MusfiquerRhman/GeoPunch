const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

export const BASE_URL = configuredBaseUrl ?? "";
export const API_URL = BASE_URL ? `${BASE_URL}/api` : "";

export function getApiUrl(path: string) {
  if (!API_URL) {
    throw new Error(
      "The API server is not configured. Set EXPO_PUBLIC_API_URL and restart the app.",
    );
  }

  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}
