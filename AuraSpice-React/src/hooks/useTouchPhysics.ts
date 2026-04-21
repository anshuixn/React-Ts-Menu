import { useEffect, RefObject } from 'react';
import { useAudio } from './useAudio';

type Direction = 'left' | 'right';

export function useTouchPhysics(
  ref: RefObject<HTMLDivElement | null>,
  direction: Direction,
  isOpen: boolean,
  onClose: () => void
) {
  const { vibrateClick } = useAudio();

  useEffect(() => {
    const el = ref.current;
    if (!el || !isOpen) return;

    let startX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      el.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaX = e.touches[0].clientX - startX;

      if (direction === 'left' && deltaX < 0) {
        requestAnimationFrame(() => {
          if (el) el.style.transform = `translateX(${deltaX}px)`;
        });
      } else if (direction === 'right' && deltaX > 0) {
        requestAnimationFrame(() => {
          if (el) el.style.transform = `translateX(${deltaX}px)`;
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;
      el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';

      const deltaX = e.changedTouches[0].clientX - startX;
      const velocity = Math.abs(deltaX);

      if (direction === 'left' && (deltaX < -80 || velocity > 150)) {
        onClose();
        vibrateClick();
      } else if (direction === 'right' && (deltaX > 80 || velocity > 150)) {
        onClose();
        vibrateClick();
      } else {
        el.style.transform = ''; // snap back
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      el.style.transform = '';
      el.style.transition = '';
    };
  }, [ref, direction, isOpen, onClose, vibrateClick]);
}
