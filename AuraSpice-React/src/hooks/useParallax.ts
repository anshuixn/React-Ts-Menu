import { useEffect, useRef } from 'react';

// ============================================
// useParallax — ports initParallax() from main.js
// ============================================
export function useParallax() {
  useEffect(() => {
    const isMobile = 'ontouchstart' in window || window.innerWidth <= 768;
    const elements = document.querySelectorAll<HTMLElement>('[data-parallax]');
    if (elements.length === 0) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          elements.forEach((el) => {
            const speed = (parseFloat(el.dataset.parallax ?? '0.1')) * (isMobile ? 0.3 : 1);
            const rect = el.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const offset = (window.innerHeight / 2 - center) * speed;
            el.style.transform = `translateY(${offset}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

// ============================================
// useParticles — ports initParticles() from main.js
// ============================================
export function useParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const foodEmojis = ['🍕', '🥟', '🍝', '🥩', '🌶️', '🍜', '🧀', '🫕', '🍖', '🥘', '🍣', '🍛', '🥗', '🍤', '🍲'];
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 8 : 20;

    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'particle';
      span.textContent = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
      span.style.left = Math.random() * 100 + '%';
      span.style.fontSize = (Math.random() * (isMobile ? 14 : 18) + (isMobile ? 10 : 14)) + 'px';
      span.style.animationDuration = (Math.random() * 18 + 12) + 's';
      span.style.animationDelay = (Math.random() * 12) + 's';
      span.style.opacity = String(Math.random() * 0.3 + 0.15);
      container.appendChild(span);
      spans.push(span);
    }

    return () => spans.forEach((s) => s.remove());
  }, []);

  return containerRef;
}
