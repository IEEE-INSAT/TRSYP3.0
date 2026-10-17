import { NextResponse } from 'next/server';
import { isModerator, moderatorKeySet } from '@/lib/state';

/** Lets the control page check a key before showing its buttons. */
export async function POST(request: Request) {
  if (!moderatorKeySet()) {
    return NextResponse.json({ message: 'MODERATOR_KEY is not set on the server.' }, { status: 503 });
  }
  if (!isModerator(request.headers.get('x-moderator-key'))) {
    return NextResponse.json({ message: 'Wrong moderator key.' }, { status: 403 });
  }
  return new NextResponse(null, { status: 204 });
}
