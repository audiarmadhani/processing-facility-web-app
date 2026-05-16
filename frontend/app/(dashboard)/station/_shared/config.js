export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://processing-facility-backend.onrender.com';

/** Build URL matching receiving/transport style (base + /api + path). */
export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/api')) {
    return `${API_BASE_URL}${normalized}`;
  }
  return `${API_BASE_URL}/api${normalized}`;
}

/** Preprocessing station uses base that already ends with /api */
export const API_BASE_WITH_API_SUFFIX = `${API_BASE_URL}/api`;

export function apiUrlFromApiBase(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_WITH_API_SUFFIX}${normalized}`;
}
