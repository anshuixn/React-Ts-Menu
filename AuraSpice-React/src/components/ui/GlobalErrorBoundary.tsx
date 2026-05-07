import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('GlobalErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#e0e0e0',
            fontFamily: "'Inter', system-ui, sans-serif",
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255, 71, 87, 0.1)',
              border: '2px solid rgba(255, 71, 87, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: 24,
            }}
          >
            ⚠
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: '#888',
              fontSize: '0.95rem',
              maxWidth: 400,
              lineHeight: 1.6,
              marginBottom: 32,
            }}
          >
            An unexpected error occurred in <strong style={{ color: '#D4AF37' }}>Aura&Spice</strong>.
            Please try reloading the page.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '16px 20px',
                maxWidth: 500,
                overflow: 'auto',
                fontSize: '0.75rem',
                color: '#ff4757',
                textAlign: 'left',
                marginBottom: 32,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReload}
            style={{
              background: 'linear-gradient(135deg, #D4AF37, #b8941f)',
              color: '#0a0a0a',
              border: 'none',
              padding: '14px 36px',
              borderRadius: 12,
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(212, 175, 55, 0.3)',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
