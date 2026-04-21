import { Link } from 'react-router-dom';
import { useParticles } from '../../hooks/useParallax';

// ============================================
// HeroSection — Agent 11
// ============================================
export function HeroSection() {
  const particlesRef = useParticles();

  return (
    <section className="hero" id="home">
      <div className="hero-bg" />
      <div className="hero-particles" id="particles" ref={particlesRef} />
      <div className="hero-content">
        <span className="hero-tagline">Est. 2024 · Global Fine Dining</span>
        <h1 className="hero-title">
          Where <span className="gold">Aura</span> Meets <span className="gold">Spice</span>
        </h1>
        <p className="hero-subtitle">
          A floating palette of Chinese wok, North Indian spice, South Indian tradition, crisp fast food,
          and refreshing beverages — crafted for connoisseurs.
        </p>
        <div className="hero-cta">
          <a href="#cuisines" className="btn-primary">Explore the Menu</a>
        </div>
      </div>
      <div className="hero-scroll-indicator">
        <span style={{ fontSize: '0.7rem', letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Scroll</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
}
