import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** IEEE can take close to half a minute to answer (~28 s has been seen). */
const REQUEST_TIMEOUT_MS = 45_000;

/** Refresh the token this long before IEEE says it expires. */
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

/** One GetMemberStatus answer. Names are initials only. */
export type IeeeLookupResult =
  | { found: false }
  | {
      found: true;
      memberStatus: string | null;
      grade: string | null;
      societies: string[];
      firstInitial: string | null;
      lastInitial: string | null;
    };

/**
 * IEEE could not be asked or gave an answer we don't understand. Never a
 * statement about membership: the caller retries later and records nothing.
 */
export class IeeeApiError extends Error {}

/**
 * Client for IEEE's GetMemberStatus API (client-credentials OAuth).
 *
 * Server-side only: the client secret is read from the environment and never
 * leaves this class. The access token is cached per process.
 */
@Injectable()
export class IeeeApiClient {
  private readonly logger = new Logger(IeeeApiClient.name);
  private token: { value: string; expiresAt: number } | null = null;
  private tokenRequest: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  /** False when the credentials aren't set (local development): no checks run. */
  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('IEEE_API_BASE_URL') &&
        this.config.get<string>('IEEE_CLIENT_ID') &&
        this.config.get<string>('IEEE_CLIENT_SECRET'),
    );
  }

  /**
   * Look a member up by IEEE member number or email.
   *
   * "Not found" arrives as HTTP 200 with a `reasons` body, so the answer is
   * decided by the body's shape rather than the status code.
   */
  async getStatus(memberId: string): Promise<IeeeLookupResult> {
    let response = await this.post('/Customer/getstatus', memberId, await this.accessToken());
    if (response.status === 401) {
      // The cached token was revoked or expired early: refresh once.
      this.token = null;
      response = await this.post('/Customer/getstatus', memberId, await this.accessToken());
    }
    if (!response.ok) {
      throw new IeeeApiError(`GetMemberStatus answered HTTP ${response.status}`);
    }
    return parseStatus(await readJson(response));
  }

  private async post(path: string, memberId: string, token: string): Promise<Response> {
    return this.request(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ MemberID: memberId }),
    });
  }

  /** The cached token, or a new one. Concurrent callers share one request. */
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) return this.token.value;
    this.tokenRequest ??= this.fetchToken().finally(() => {
      this.tokenRequest = null;
    });
    return this.tokenRequest;
  }

  private async fetchToken(): Promise<string> {
    const response = await this.request(`${this.baseUrl()}/api/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.get<string>('IEEE_CLIENT_ID') ?? '',
        client_secret: this.config.get<string>('IEEE_CLIENT_SECRET') ?? '',
        scope: 'GetMemberStatus',
      }).toString(),
    });
    if (!response.ok) {
      throw new IeeeApiError(`IEEE token request answered HTTP ${response.status}`);
    }
    const body = (await readJson(response)) as { access_token?: unknown; expires_in?: unknown };
    if (typeof body.access_token !== 'string' || !body.access_token) {
      throw new IeeeApiError('IEEE token response had no access_token');
    }
    const lifetimeMs = (typeof body.expires_in === 'number' ? body.expires_in : 3600) * 1000;
    this.token = {
      value: body.access_token,
      expiresAt: Date.now() + Math.max(lifetimeMs - TOKEN_EXPIRY_MARGIN_MS, 0),
    };
    return this.token.value;
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      // Timeouts and network failures. Log the reason, never the request body.
      const reason = error instanceof Error ? error.name : 'unknown error';
      this.logger.warn(`IEEE request failed: ${reason}`);
      throw new IeeeApiError(`IEEE request failed: ${reason}`);
    }
  }

  private baseUrl(): string {
    return (this.config.get<string>('IEEE_API_BASE_URL') ?? '').replace(/\/+$/, '');
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new IeeeApiError('IEEE answered with a body that is not JSON');
  }
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/** `"UH3001,MEMRA024"` -> `['UH3001', 'MEMRA024']`; `"None"` or empty -> `[]`. */
export function parseSocietyList(value: unknown): string[] {
  const text = asText(value);
  if (!text || text.toLowerCase() === 'none') return [];
  return text
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
}

/** A GetMemberStatus body -> a result. Throws on any shape we don't recognise. */
export function parseStatus(body: unknown): IeeeLookupResult {
  if (typeof body !== 'object' || body === null) {
    throw new IeeeApiError('IEEE answered with an unexpected body');
  }
  const record = body as Record<string, unknown>;

  if ('MemberStatus' in record) {
    return {
      found: true,
      memberStatus: asText(record.MemberStatus),
      grade: asText(record.Grade),
      societies: parseSocietyList(record.SocietyList),
      firstInitial: asText(record.FirstName),
      lastInitial: asText(record.LastName),
    };
  }

  const reasons = Array.isArray(record.reasons) ? record.reasons : [];
  const notFound = reasons.some(
    (reason) =>
      typeof reason === 'object' &&
      reason !== null &&
      /record not found/i.test(String((reason as { message?: unknown }).message ?? '')),
  );
  if (notFound) return { found: false };

  throw new IeeeApiError('IEEE answered with an unexpected body');
}
