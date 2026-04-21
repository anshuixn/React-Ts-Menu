import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================
// useCountUp — Agent 7
// Ports initCountUpStats() + animateCount() from main.js
// ============================================
export function useCountUp(target: number): { ref: React.RefObject<HTMLHeadingElement | null>; displayValue: string } {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const ref = useRef<HTMLHeadingElement>(null);
  const hasRun = useRef(false);

  const animate = useCallback(() => {
    const duration = 2000;
    const start = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);

      const formatted = current >= 1000
        ? (current / 1000).toFixed(current >= target ? 0 : 1) + 'K+'
        : current + '+';
      setDisplayValue(formatted);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(target >= 1000 ? (target / 1000) + 'K+' : target + '+');
      }
    };

    requestAnimationFrame(update);
  }, [target]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRun.current) {
            hasRun.current = true;
            animate();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return { ref, displayValue };
}
