/** Keep production cookies secure unless HTTP testing is explicitly enabled. */
export function isAuthCookieSecure(): boolean {
  const setting = process.env.AUTH_COOKIE_SECURE;
  if (setting === "true") return true;
  if (setting === "false") return false;
  return process.env.NODE_ENV === "production";
}
