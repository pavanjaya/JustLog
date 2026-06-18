const VERCEL_URL = "https://just-log-nu.vercel.app";

function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export function apiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  if (isCapacitorNative() || window.location.protocol === "file:") {
    return `${VERCEL_URL}${path}`;
  }
  return path;
}
