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
  /** Plain object — JSON-serialised automatically. */
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
