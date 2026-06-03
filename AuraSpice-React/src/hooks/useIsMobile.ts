import { useState, useEffect } from 'react';

/**
 * Hook that returns true when the viewport is at or below the given breakpoint.
 *
 * Bug fix: Uses window.matchMedia instead of window.innerWidth to:
 * 1. Safely handle environments where window may not be available (SSR-safe guard).
 * 2. Fire only when the breakpoint boundary is crossed — not on every pixel change
 *    (much better performance than the resize listener approach).
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
