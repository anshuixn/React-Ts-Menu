import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './style.css'
import App from './App.tsx'
import { AuthProvider } from './store/AuthContext'
import { validateClientEnv } from './lib/envValidation'

// ─── Sentry — production error tracking ───────────────────────────────────────
// Only active when VITE_SENTRY_DSN is configured. Silent no-op in development.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    // Only send traces in production to avoid noise in dev
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 0,
    // Do not send customer PII (no user email, no full URL with tokens)
    beforeSend(event) {
      // Strip any tracking tokens from breadcrumb URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, 'token=[REDACTED]');
      }
      return event;
    },
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

// ─── Env validation ───────────────────────────────────────────────────────────
validateClientEnv()

// ─── Mount ────────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0a0a0a', color: '#888', fontFamily: 'Inter, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
            <p style={{ fontSize: '2rem', marginBottom: 16 }}>🍽️</p>
            <h1 style={{ color: '#d4af37', marginBottom: 8, fontSize: '1.25rem' }}>Something went wrong</h1>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              We've been notified and are looking into it. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 24, padding: '10px 24px', background: '#d4af37', color: '#0a0a0a', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
            >
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
