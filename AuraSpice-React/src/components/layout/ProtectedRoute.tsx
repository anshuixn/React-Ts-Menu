import type { ReactNode } from 'react';
import { useAuth } from '../../store/useAuth';
import { AuthTabs } from '../staff/AuthTabs';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg-dark)',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid var(--glass-border)',
              borderTopColor: 'var(--accent-gold)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          Verifying session…
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthTabs />;
  }

  return <>{children}</>;
}
