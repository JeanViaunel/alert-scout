/**
 * Client-side only: get auth token from localStorage or cookie.
 * Login sets both; cookie may be present when localStorage is not (e.g. after refresh).
 * When we read from cookie we sync to localStorage so the rest of the app sees it.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem('auth-token');
  if (fromStorage) return fromStorage;
  const match = document.cookie.match(/\bauth-token=([^;]*)/);
  const fromCookie = match ? match[1].trim() || null : null;
  if (fromCookie) localStorage.setItem('auth-token', fromCookie);
  return fromCookie;
}
