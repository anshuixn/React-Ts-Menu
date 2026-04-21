import { useState } from 'react';

export function StaffRegister({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shake, setShake] = useState(false);

  const handleShake = () => {
    setShake(false);
    setTimeout(() => setShake(true), 10);
    setTimeout(() => setShake(false), 410);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 4) {
      setError('❌ Password must be at least 4 characters');
      return;
    }
    if (staffId.includes(' ')) {
      setError('❌ Staff ID cannot contain spaces');
      return;
    }

    const newAccount = {
      id: staffId,
      password: password,
      name: name,
      role: 'Staff',
      registeredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: newAccount, key }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        handleShake();
        return;
      }
    } catch (_) {
      setError('❌ Network error');
      return;
    }

    setSuccess(`✅ Account created! Sign in with ID: ${staffId}`);
    setName('');
    setStaffId('');
    setPassword('');
    setKey('');

    setTimeout(() => {
      onSwitchToLogin();
    }, 1500);
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
    border: '1px solid var(--glass-border)', borderRadius: 10,
    color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box' as const
  };

  return (
    <form onSubmit={handleSubmit} style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Your Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chef Rajan" required style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Choose Staff ID</label>
        <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="e.g. CHEF_RAJAN" required style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Choose Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 4 characters" required minLength={4} style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>🔑 Establishment Key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Ask your admin for this key"
          required
          style={{ ...inputStyle, borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.05)' }}
        />
      </div>
      
      {error && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '0.8rem', minHeight: '1.2em' }}>{error}</div>}
      {success && <div style={{ color: '#2ecc71', fontSize: '0.85rem', marginBottom: '0.8rem', minHeight: '1.2em' }}>{success}</div>}
      
      <button
        type="submit"
        style={{
          width: '100%', padding: 13, background: '#2ecc71', color: 'var(--bg-dark)',
          border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
          cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.3s ease'
        }}
      >
        Create Staff Account
      </button>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.8rem', lineHeight: 1.4 }}>
        ⚠ You must enter the correct Establishment Key provided by your restaurant admin to register.
      </p>
    </form>
  );
}
