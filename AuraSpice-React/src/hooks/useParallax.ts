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

// Realistic fire-like palette (oranges, yellows, reds)
const PARTICLE_COLORS = [
  'rgba(255, 69, 0, 0.7)',   // Red-orange
  'rgba(255, 140, 0, 0.6)',  // Dark orange
  'rgba(255, 165, 0, 0.7)',  // Orange
  'rgba(255, 215, 0, 0.5)',  // Gold/Yellow
  'rgba(255, 99, 71, 0.6)',  // Tomato red
];

export function useParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 40 : 96; // 4x the previous count

    const spans: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'particle';

      // Randomised sizing (3–16px) for varying fireball sizes
      const size = Math.random() * 13 + 3;
      const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      
      // Calculate random horizontal drift for swaying
      const drift = (Math.random() - 0.5) * 100; // Drift between -50px and +50px

      span.style.cssText = `
        left: ${Math.random() * 100}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 ${size * 2}px ${size / 2}px ${color}, inset 0 0 ${size / 2}px rgba(255,255,255,0.4);
        --drift: ${drift}px;
        animation-duration: ${Math.random() * 8 + 6}s; /* Faster for fire */
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
