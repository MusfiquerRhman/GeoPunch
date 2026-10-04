export function protectedSelfieUrl(storedUrl: string) {
  const oldUpload = storedUrl.match(/^\/uploads\/([^/]+)$/);
  if (oldUpload) {
    return `/api/geo_punch/uploads/${encodeURIComponent(oldUpload[1])}`;
  }
  return storedUrl;
}
