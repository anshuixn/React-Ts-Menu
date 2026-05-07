import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--text-light)',
        fontFamily: "'Inter', system-ui, sans-serif",
        textAlign: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          fontSize: '6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent-gold), #b8941f)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 16,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          maxWidth: 380,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          to="/"
          style={{
            background: 'linear-gradient(135deg, var(--accent-gold), #b8941f)',
            color: 'var(--bg-dark)',
            border: 'none',
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: '0.92rem',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
          }}
        >
          Go Home
        </Link>
        <Link
          to="/order"
          style={{
            background: 'transparent',
            color: 'var(--accent-gold)',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            padding: '14px 32px',
            borderRadius: 12,
            fontSize: '0.92rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          Order Now
        </Link>
      </div>
    </main>
  );
}
