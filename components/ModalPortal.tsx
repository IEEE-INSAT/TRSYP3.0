'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useHydrated } from '@/lib/store/use-hydrated';

/**
 * Renders an overlay into <body>, outside the page layout.
 *
 * A `position: fixed` overlay only sits on top if no ancestor has opened a
 * stacking context. `.gridbeam-wrap > main` sets `z-index: 1`, which traps
 * everything inside it: an overlay at `z-index: 200` mounted in there still
 * loses to the navbar (`z-index: 100`) and gets painted over by the footer
 * (same `z-index: 1`, but later in the DOM). Raising the overlay's own z-index
 * cannot fix that — the number is compared inside main's context, not against
 * the navbar. Portaling to <body> lifts it out so its z-index actually applies,
 * wherever it happens to be mounted from.
 *
 * Also freezes the page underneath, so the overlay stops reading as just
 * another scrolling section.
 */
export default function ModalPortal({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();

  useEffect(() => {
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;

    // Removing the scrollbar frees up its width and shifts the whole page
    // sideways; pad by exactly that much so nothing moves as the modal opens.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, []);

  if (!hydrated) return null;
  return createPortal(children, document.body);
}
