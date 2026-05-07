import { Link } from 'react-router-dom';


export function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="container">
        <span className="section-label center reveal">Ready to dine?</span>
        <h2 className="section-title center reveal" style={{ marginBottom: 15 }}>
          Scan. Order. <span style={{ color: 'var(--accent-gold)' }}>Experience.</span>
        </h2>
        <p className="section-desc center reveal" style={{ marginBottom: 40 }}>
          Simply scan the QR code on your table to browse the full menu, customize your order,
          and watch it come to life in real-time.
        </p>
        <div className="reveal">
          <Link to="/order?table=01" className="btn-primary">Start Ordering</Link>
        </div>
      </div>
    </section>
  );
}
