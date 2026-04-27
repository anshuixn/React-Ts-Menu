import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';

// ============================================================
// PHASE 2 — Input length caps prevent oversized payloads.
// PHASE 5 — Server returns a session token; we pass it to login().
// Removed: "Default admin: admin / admin" hint in the UI.
// ============================================================

const MAX_ID_LEN   = 32;
const MAX_PASS_LEN = 128;

export function StaffLogin() {
  const [staffId,  setStaffId]  = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);
  const { login } = useAuth();

  const handleShake = () => {
    setShake(false);
    setTimeout(() => setShake(true),  10);
    setTimeout(() => setShake(false), 410);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side guard — server validates too
    if (!staffId || !password) {
      setError('Please enter both Staff ID and password.');
      handleShake();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/staff/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:       staffId.slice(0, MAX_ID_LEN).trim(),
          password: password.slice(0, MAX_PASS_LEN),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        login(data.account, data.token); // Phase 5: store token via AuthContext
      } else {
        // VULN FIXED: generic message — don't reveal whether ID or password was wrong
        setError('Invalid credentials. Please try again.');
        handleShake();
      }
    } catch {
      setError('Network error. Please check your connection.');
      handleShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Staff ID</label>
        <input
          type="text"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value.slice(0, MAX_ID_LEN))}
          placeholder="Enter your Staff ID"
          required
          autoComplete="username"
          maxLength={MAX_ID_LEN}
          style={{
            width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)', borderRadius: 10,
            color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value.slice(0, MAX_PASS_LEN))}
          placeholder="Enter password"
          required
          autoComplete="current-password"
          maxLength={MAX_PASS_LEN}
          style={{
            width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)', borderRadius: 10,
            color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box',
          }}
        />
      </div>
      {error && (
        <div style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '0.8rem', minHeight: '1.2em' }}>
          {/* PHASE 2: error is a static string — never render raw server HTML */}
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: 13, background: 'var(--accent-gold)', color: 'var(--bg-dark)',
          border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1,
          textTransform: 'uppercase', transition: 'all 0.3s ease', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Signing in…' : 'Sign In to Kitchen'}
      </button>
      {/* VULN FIXED: removed "Default admin: admin / admin" hint — credentials must never appear in UI */}
    </form>
  );
}
