import { useEffect, useRef } from 'react';

// ============================================================
// useParallax — Scroll-driven parallax for [data-parallax] elements
// ============================================================
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

// ============================================================
// useParticles — Floating ambient dot particles in the hero.
// Premium replacement for legacy emoji particles.
// Uses pure CSS-drawn circles — no images, no emojis.
// ============================================================

// Spice-colored dot palette (charcoal-gold theme)
const PARTICLE_COLORS = [
  'rgba(212,175,55,0.55)',  // gold
  'rgba(212,175,55,0.3)',   // gold dim
  'rgba(230,126,34,0.4)',   // saffron
  'rgba(255,255,255,0.12)', // white glint
  'rgba(212,175,55,0.18)',  // ghost gold
];

export function useParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 10 : 24;

    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'particle';

      // Randomised dot sizing (4–14px) and positioning
      const size = Math.random() * 10 + 4;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];

      span.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${color};
        animation-duration: ${Math.random() * 18 + 12}s;
        animation-delay: ${Math.random() * 12}s;
        opacity: 0;
      `;
      container.appendChild(span);
      spans.push(span);
    }

    return () => spans.forEach((s) => s.remove());
  }, []);

  return containerRef;
}
