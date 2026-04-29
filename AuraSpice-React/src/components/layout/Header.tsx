import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ============================================
// Header — Agent 13
// Ports initHeader() + initMobileNav() from main.js
// ============================================
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header id="header" className={scrolled ? 'scrolled' : ''}>
      <div className="logo">Aura<span>&</span>Spice</div>

      <button
        className={`hamburger${menuOpen ? ' active' : ''}`}
        id="hamburger-btn"
        aria-label="Toggle menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <nav className={`nav-links${menuOpen ? ' mobile-open' : ''}`} id="nav-links">
        <a href="#home" onClick={closeMenu}>Home</a>
        <Link to="/order" onClick={closeMenu}>Cuisines</Link>
        <a href="#gallery" onClick={closeMenu}>Gallery</a>
        <Link to="/order?table=01" className="btn-outline btn-sm" onClick={closeMenu}>Order Now</Link>
        <Link
          to="/staff"
          className="btn-outline btn-sm"
          style={{ borderColor: 'var(--status-new)', color: 'var(--status-new)' }}
          onClick={closeMenu}
        >
          Staff Portal
        </Link>
      </nav>

      {menuOpen && (
        <div className="mobile-nav-overlay active" id="mobile-nav-overlay" onClick={closeMenu} />
      )}
    </header>
  );
}
