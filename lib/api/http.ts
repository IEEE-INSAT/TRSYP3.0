import { API_URL, isApiConfigured } from '../config';

/** Normalised error thrown by every service call. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Plain object - JSON-serialised automatically. */
  body?: unknown;
  /** Bearer token attached as `Authorization` header. */
  token?: string | null;
}

/**
 * Thin typed wrapper around `fetch` for the NestJS backend.
 *
 * - Prefixes `NEXT_PUBLIC_API_URL`.
 * - Serialises JSON bodies and parses JSON responses.
 * - Throws `ApiError` on non-2xx responses with the server message when present.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError(0, 'NEXT_PUBLIC_API_URL is not configured');
  }

  const { body, token, headers, ...rest } = options;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? res.statusText;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

/**
 * Multipart POST with upload progress.
 *
 * `fetch` cannot report how much of a request body has been sent, so anything
 * that wants a real progress bar has to go through `XMLHttpRequest`. Errors
 * are normalised to `ApiError` so callers cannot tell the two paths apart.
 *
 * The browser sets the multipart Content-Type (including the boundary) from
 * the FormData, so this deliberately does not set that header itself.
 */
export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  token?: string | null,
  onProgress?: (percent: number) => void,
): Promise<T> {
  if (!isApiConfigured) {
    return Promise.reject(new ApiError(0, 'NEXT_PUBLIC_API_URL is not configured'));
  }

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        // Not every request reports a total; leave the caller's last value
        // alone rather than reporting a bogus 0%.
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
    }

    xhr.onload = () => {
      let data: unknown = null;
      if (xhr.responseText) {
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
        return;
      }

      const message =
        (data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : null) ?? xhr.statusText;
      reject(new ApiError(xhr.status, message, data));
    };

    xhr.onerror = () => reject(new ApiError(0, 'Network error during upload'));
    xhr.onabort = () => reject(new ApiError(0, 'Upload cancelled'));

    xhr.send(form);
  });
}
