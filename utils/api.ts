export const getApiBaseUrl = () => {
  const customBase = (import.meta as any)?.env?.VITE_API_BASE_URL?.trim();
  if (customBase) return customBase.replace(/\/$/, '');
  return '';
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

const DEFAULT_FALLBACK_API_BASE = 'http://127.0.0.1:3000';

const shouldFallbackToLocalApi = async (response: Response) => {
  if (response.status === 404) return true;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return false;

  if (contentType.includes('text/html')) return true;

  if (response.ok) {
    const clone = response.clone();
    const body = await clone.text().catch(() => '');
    return body.trim().startsWith('<!DOCTYPE html') || body.includes('<html');
  }

  return false;
};

export const apiFetch = async (path: string, init?: RequestInit) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fallbackBase = getApiBaseUrl() || DEFAULT_FALLBACK_API_BASE;

  let sameOriginResponse: Response | null = null;
  try {
    sameOriginResponse = await fetch(normalizedPath, init);
    if (!(await shouldFallbackToLocalApi(sameOriginResponse))) {
      return sameOriginResponse;
    }
  } catch {
    sameOriginResponse = null;
  }

  if (fallbackBase === '') {
    if (sameOriginResponse) return sameOriginResponse;
    throw new TypeError(`Failed to fetch ${normalizedPath}`);
  }

  try {
    return await fetch(`${fallbackBase}${normalizedPath}`, init);
  } catch {
    if (sameOriginResponse) return sameOriginResponse;
    throw new TypeError(`Failed to fetch ${normalizedPath}`);
  }
};
