import { redirect } from 'next/navigation';

/**
 * The avatar editor used to live here, as a mandatory stop between signing in
 * and registering. It is now a dashboard section; this route stays only so old
 * links and bookmarks land somewhere sensible.
 */
export default function LegacyAvatarPage() {
  redirect('/dashboard/avatar');
}
