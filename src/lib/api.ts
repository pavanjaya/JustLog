const VERCEL_URL = "https://just-log-nu.vercel.app";

export function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  // If running as local file (Capacitor static export), use Vercel URL
  if (window.location.protocol === "file:" || window.location.hostname === "localhost" && window.location.port === "") {
    return `${VERCEL_URL}${path}`;
  }
  return path;
}
