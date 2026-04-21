import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';

export function StaffLogin() {
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const { login } = useAuth();

  const handleShake = () => {
    setShake(false);
    setTimeout(() => setShake(true), 10);
    setTimeout(() => setShake(false), 410);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId, password }),
      });
      const data = await res.json();

      if (data.success) {
        login(data.account);
      } else {
        setError(`❌ ${data.message}`);
        handleShake();
      }
    } catch (_) {
      setError('❌ Network Error');
      handleShake();
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Staff ID</label>
        <input
          type="text"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          placeholder="e.g. STAFF001 or admin"
          required
          style={{
            width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)', borderRadius: 10,
            color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box'
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          style={{
            width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
            border: '1px solid var(--glass-border)', borderRadius: 10,
            color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box'
          }}
        />
      </div>
      {error && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '0.8rem', minHeight: '1.2em' }}>{error}</div>}
      <button
        type="submit"
        style={{
          width: '100%', padding: 13, background: 'var(--accent-gold)', color: 'var(--bg-dark)',
          border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
          cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.3s ease'
        }}
      >
        Sign In to Kitchen
      </button>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.8rem', lineHeight: 1.4 }}>
        Default admin: <strong>admin / admin</strong>
      </p>
    </form>
  );
}
