import { useState } from 'react';

// ============================================================
// PHASE 2 — Strict client-side validation before sending.
// Password and establishment key minimums match the server validator.
// All inputs capped at max lengths.
// ============================================================

const MAX_NAME_LEN = 64;
const MAX_ID_LEN   = 32;
const MAX_PASS_LEN = 128;
const MAX_KEY_LEN  = 128;
const STAFF_ID_RE  = /^[a-zA-Z0-9_]{1,32}$/;
const MIN_PASS_LEN = 8;
const MIN_KEY_LEN  = 12;

export function StaffRegister({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [name,     setName]     = useState('');
  const [staffId,  setStaffId]  = useState('');
  const [password, setPassword] = useState('');
  const [key,      setKey]      = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  const handleShake = () => {
    setShake(false);
    setTimeout(() => setShake(true),  10);
    setTimeout(() => setShake(false), 410);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ── Client-side validation ──────────────────────────────
    if (!name.trim()) {
      setError('Name is required.'); handleShake(); return;
    }
    if (!STAFF_ID_RE.test(staffId)) {
      setError('Staff ID must be 1–32 alphanumeric characters or underscores.'); handleShake(); return;
    }
    if (password.length < MIN_PASS_LEN) {
      setError(`Password must be at least ${MIN_PASS_LEN} characters.`); handleShake(); return;
    }
    if (key.length < MIN_KEY_LEN) {
      setError(`Establishment Key must be at least ${MIN_KEY_LEN} characters.`); handleShake(); return;
    }

    const newAccount = {
      id:       staffId.trim(),
      password: password,
      name:     name.trim(),
      role:     'Staff',
      registeredAt: new Date().toISOString(),
    };

    setLoading(true);
    try {
      const res = await fetch('/api/staff/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ account: newAccount, key }),
      });
      const data = await res.json();

      if (!data.success) {
        // PHASE 2: data.message is a static string from our server — safe to display
        setError(data.message ?? 'Registration failed.');
        handleShake();
        return;
      }
    } catch {
      setError('Network error. Please try again.');
      return;
    } finally {
      setLoading(false);
    }

    setSuccess(`Account created! Sign in with ID: ${staffId}`);
    setName(''); setStaffId(''); setPassword(''); setKey('');

    setTimeout(() => { onSwitchToLogin(); }, 1500);
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--bg-surface)',
    border: '1px solid var(--glass-border)', borderRadius: 10,
    color: 'var(--text-light)', fontSize: '0.95rem', boxSizing: 'border-box' as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Your Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LEN))} placeholder="e.g. Chef Rajan" required maxLength={MAX_NAME_LEN} autoComplete="name" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Choose Staff ID</label>
        <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value.slice(0, MAX_ID_LEN))} placeholder="e.g. CHEF_RAJAN (letters, numbers, underscores)" required maxLength={MAX_ID_LEN} autoComplete="username" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Choose Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value.slice(0, MAX_PASS_LEN))} placeholder={`Minimum ${MIN_PASS_LEN} characters`} required minLength={MIN_PASS_LEN} maxLength={MAX_PASS_LEN} autoComplete="new-password" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 }}>Establishment Key</label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value.slice(0, MAX_KEY_LEN))}
          placeholder="Ask your admin for this key"
          required
          maxLength={MAX_KEY_LEN}
          autoComplete="off"
          style={{ ...inputStyle, borderColor: 'rgba(212, 175, 55, 0.4)', background: 'rgba(212, 175, 55, 0.05)' }}
        />
      </div>

      {error   && <div style={{ color: '#ff4757', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{error}</div>}
      {success && <div style={{ color: '#2ecc71', fontSize: '0.85rem', marginBottom: '0.8rem' }}>{success}</div>}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: 13, background: '#2ecc71', color: 'var(--bg-dark)',
          border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: 1,
          textTransform: 'uppercase', transition: 'all 0.3s ease', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Creating…' : 'Create Staff Account'}
      </button>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: '0.8rem', lineHeight: 1.4 }}>
        You must enter the current establishment key provided by your restaurant admin to register.
      </p>
    </form>
  );
}
