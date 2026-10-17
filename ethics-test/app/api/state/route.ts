import { NextResponse } from 'next/server';
import { isModerator, moderatorKeySet, readState, StoreError, writeState } from '@/lib/state';

// Read at request time, never prerendered at build.
export const dynamic = 'force-dynamic';

/**
 * Every phone asks for this every few seconds. Vercel's CDN keeps each answer
 * for 2 seconds, so however many phones there are, the store is read about
 * once every 2 seconds - well inside the free plan. Browsers don't keep it.
 */
export async function GET() {
  const state = await readState();
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Vercel-CDN-Cache-Control': 'max-age=2, stale-while-revalidate=4',
    },
  });
}

/** Moderators only: move every screen to a step, and open or close voting. */
export async function PUT(request: Request) {
  if (!moderatorKeySet()) {
    return NextResponse.json({ message: 'MODERATOR_KEY is not set on the server.' }, { status: 503 });
  }
  if (!isModerator(request.headers.get('x-moderator-key'))) {
    return NextResponse.json({ message: 'Wrong moderator key.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { step?: unknown; votingOpen?: unknown } | null;
  const step = body?.step;
  const votingOpen = body?.votingOpen;
  if (typeof step !== 'number' || !Number.isInteger(step) || step < 0 || step > 50 || typeof votingOpen !== 'boolean') {
    return NextResponse.json({ message: 'Send a step (0-50) and votingOpen (true or false).' }, { status: 400 });
  }

  try {
    const state = await writeState({ step, votingOpen });
    return NextResponse.json(state, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof StoreError ? error.message : 'The screens were not updated. Try again.';
    return NextResponse.json({ message }, { status: 502 });
  }
}
