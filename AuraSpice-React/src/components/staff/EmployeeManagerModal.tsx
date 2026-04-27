import { useState, useEffect, useCallback } from 'react';
import type { StaffAccount } from '../../types';
import { useAuth } from '../../store/AuthContext';

// ============================================================
// PHASE 5 — All requests use authFetch (X-Staff-Token header).
// PHASE 3 — Server enforces requireAdmin; this component is an
//            extra UI guard but NOT the security boundary.
// ============================================================

const MIN_KEY_LEN = 6;

export function EmployeeManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { authFetch } = useAuth();
  const [employees,  setEmployees]  = useState<StaffAccount[]>([]);
  const [estKey,     setEstKey]     = useState('—');
  const [newKey,     setNewKey]     = useState('');
  const [keySuccess, setKeySuccess] = useState(false);
  const [keyError,   setKeyError]   = useState('');

  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    try {
      const [empRes, keyRes] = await Promise.all([
        authFetch('/api/staff'),
        authFetch('/api/key'),
      ]);
      if (empRes.ok)  setEmployees(await empRes.json());
      if (keyRes.ok) {
        const { key } = await keyRes.json();
        setEstKey(key);
      }
    } catch {
      // Network error — silently fail; UI shows stale data
    }
  }, [isOpen, authFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRemove = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" (${id}) from the employee list?\n\nThey will no longer be able to sign in.`)) return;
    try {
      const res = await authFetch(`/api/staff/by-id/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? 'Failed to remove employee.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
  };

  const handleUpdateKey = async () => {
    setKeyError('');
    if (!newKey || newKey.length < MIN_KEY_LEN) {
      setKeyError(`Key must be at least ${MIN_KEY_LEN} characters.`);
      return;
    }
    // PHASE 2: Only allow printable ASCII, no HTML-injectable chars
    if (/[<>"'`]/.test(newKey)) {
      setKeyError('Key contains invalid characters.');
      return;
    }
    try {
      const res = await authFetch('/api/key', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: newKey }),
      });
      if (res.ok) {
        const { key } = await res.json();
        setEstKey(key);
        setNewKey('');
        setKeySuccess(true);
        setTimeout(() => setKeySuccess(false), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setKeyError(data.error ?? 'Failed to update key.');
      }
    } catch {
      setKeyError('Network error. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>Employee Management</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="emp-section-title">Default Accounts (Built-in)</p>
        <table className="emp-table">
          <thead><tr><th>Name</th><th>Staff ID</th><th>Type</th><th></th></tr></thead>
          <tbody>
            <tr><td colSpan={4} className="emp-empty">Administrators and built-in Chef roles are securely protected on the server layer.</td></tr>
          </tbody>
        </table>

        <p className="emp-section-title">Registered Employees</p>
        <table className="emp-table">
          <thead><tr><th>Name</th><th>Staff ID</th><th>Registered</th><th>Action</th></tr></thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={4} className="emp-empty">No registered employees yet</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>{emp.name}</td>
                  <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, fontSize: '0.85rem' }}>{emp.id}</code></td>
                  <td><span className="emp-badge-custom">{emp.registeredAt ? new Date(emp.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></td>
                  <td><button className="emp-remove-btn" onClick={() => handleRemove(emp.id, emp.name)}>Remove</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="emp-key-box">
          <label>Current Establishment Key</label>
          <div className="emp-key-value">{estKey}</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 8 }}>
            Share this key with new staff so they can register. Change it below (min {MIN_KEY_LEN} characters).
          </p>

          {keySuccess && <div className="emp-key-success">Establishment key updated successfully.</div>}
          {keyError   && <div style={{ color: '#ff4757', fontSize: '0.82rem', marginTop: 6 }}>{keyError}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.slice(0, 128))}
              placeholder={`Enter new key (min ${MIN_KEY_LEN} chars)`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateKey(); }}
              maxLength={128}
              style={{
                flex: 1, padding: 10, background: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)', borderRadius: 8,
                color: 'var(--text-light)', fontSize: '0.9rem',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleUpdateKey}
              style={{
                padding: '10px 16px', background: 'var(--accent-gold)', color: 'var(--bg-dark)', border: 'none',
                borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
              }}
            >
              Update Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
