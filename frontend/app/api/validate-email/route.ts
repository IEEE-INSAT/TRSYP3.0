import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';

/**
 * POST /api/validate-email
 *
 * Checks whether the domain part of an email address has valid MX (mail
 * exchange) records. This is the most reliable client-reachable check — if a
 * domain has no MX records it cannot receive email, so any address @that-domain
 * is guaranteed invalid.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Missing email.' }, { status: 400 });
    }

    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) {
      return NextResponse.json({ valid: false, reason: 'Invalid email format.' });
    }

    const domain = parts[1].toLowerCase();

    // Block well-known reserved / documentation domtrsyp (RFC 2606)
    const RESERVED_DOMAINS = ['example.com', 'example.net', 'example.org', 'test.com', 'test.net', 'test.org', 'localhost', 'invalid'];
    if (RESERVED_DOMAINS.includes(domain)) {
      return NextResponse.json({ valid: false, reason: `"${domain}" is a reserved domain and cannot receive email.` });
    }

    // DNS MX lookup
    const mxRecords = await new Promise<dns.MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });

    if (!mxRecords || mxRecords.length === 0) {
      return NextResponse.json({ valid: false, reason: `"${domain}" does not have any mail servers.` });
    }

    return NextResponse.json({ valid: true });
  } catch (err: unknown) {
    // DNS errors (ENOTFOUND, ENODATA, etc.) mean the domain doesn't exist
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'ENOTFOUND' || code === 'ENODATA' || code === 'ESERVFAIL') {
        return NextResponse.json({ valid: false, reason: 'This email domain does not exist.' });
      }
    }
    return NextResponse.json({ valid: false, reason: 'Could not verify email domain.' }, { status: 500 });
  }
}
