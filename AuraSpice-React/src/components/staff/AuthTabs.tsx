import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { StaffLogin } from './StaffLogin';
import { StaffRegister } from './StaffRegister';

// ============================================================
// AuthTabs — Staff portal entry. ShieldCheck icon replaces emoji.
// ============================================================
export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-lock-icon">
          <ShieldCheck
            size={40}
            strokeWidth={1.5}
            style={{ color: 'var(--accent-gold)', filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))' }}
          />
        </div>
        <div className="logo" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Aura<span>&</span>Spice</div>
        <p className="login-subtitle" style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Staff Kitchen Portal — Authorized Access Only
        </p>

        <div className="auth-tabs" style={{ display: 'flex', marginBottom: '1.5rem', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1, padding: 10, background: activeTab === 'login' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'login' ? 'var(--bg-dark)' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s ease'
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1, padding: 10, background: activeTab === 'register' ? 'var(--accent-gold)' : 'transparent',
              color: activeTab === 'register' ? 'var(--bg-dark)' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s ease'
            }}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' ? <StaffLogin /> : <StaffRegister onSwitchToLogin={() => setActiveTab('login')} />}
      </div>
    </div>
  );
}
