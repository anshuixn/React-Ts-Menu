import { Link } from 'react-router-dom';

// ============================================
// Footer — Agent 13 (presentational)
// ============================================
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo" style={{ marginBottom: 15 }}>Aura<span>&</span>Spice</div>
            <p>Where culinary artistry meets antigravity design. A dining experience that floats above the ordinary.</p>
          </div>
          <div className="footer-col">
            <h4>Navigate</h4>
            <a href="#home">Home</a>
            <a href="#cuisines">Cuisines</a>
            <a href="#gallery">Gallery</a>
            <Link to="/order?table=01">Order</Link>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="#">reservations@auraspice.com</a>
            <a href="#">+1 (555) 234-5678</a>
            <a href="#">42 Gourmet Lane, NY</a>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; 2026 Aura &amp; Spice. All rights reserved. Crafted with the Antigravity Design System.
        </div>
      </div>
    </footer>
  );
}
