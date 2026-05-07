import { useEffect, useState } from 'react';

/**
 * OfflineBanner — Persistent banner that appears when the device
 * loses network connectivity. Disappears automatically on reconnect.
 *
 * Mount this once at the app root level (inside App.tsx).
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline  = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      id="offline-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(90deg, #7f1d1d, #b91c1c)',
        color: '#fff',
        textAlign: 'center',
        padding: '10px 16px',
        fontSize: '0.875rem',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      <span aria-hidden="true">📡</span>
      <span>
        You are offline. Menu is available from cache — orders will resume when
        connection is restored.
      </span>
    </div>
  );
}
