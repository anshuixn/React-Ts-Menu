import { useState, useEffect, useCallback } from 'react';
import type { StaffAccount } from '../../types';

export function EmployeeManagerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [employees, setEmployees] = useState<StaffAccount[]>([]);
  const [estKey, setEstKey] = useState('—');
  const [newKey, setNewKey] = useState('');

  const fetchData = useCallback(async () => {
    if (!isOpen) return;
    try {
      const [empRes, keyRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/key')
      ]);
      if (empRes.ok) setEmployees(await empRes.json());
      if (keyRes.ok) {
        const { key } = await keyRes.json();
        setEstKey(key);
      }
    } catch (_) {}
  }, [isOpen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemove = async (index: number, name: string, id: string) => {
    if (!window.confirm(`Remove "${name}" (${id}) from the employee list?\n\nThey will no longer be able to sign in.`)) return;
    
    try {
      await fetch(`/api/staff/${index}`, { method: 'DELETE' });
      fetchData();
    } catch (_) {}
  };

  const handleUpdateKey = async () => {
    if (!newKey || newKey.length < 4) {
      alert('Key must be at least 4 characters.');
      return;
    }
    try {
      await fetch('/api/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey })
      });
      setEstKey(newKey);
      setNewKey('');
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>👥 Employee Management</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p className="emp-section-title">Default Accounts (Built-in)</p>
        <table className="emp-table">
          <thead><tr><th>Name</th><th>Staff ID</th><th>Type</th><th></th></tr></thead>
          <tbody>
            <tr><td colSpan={4} className="emp-empty" style={{ padding: '1rem' }}>Administrators and built-in Chef roles are hidden and securely protected on the server layer.</td></tr>
          </tbody>
        </table>

        <p className="emp-section-title">Registered Employees</p>
        <table className="emp-table">
          <thead><tr><th>Name</th><th>Staff ID</th><th>Registered</th><th>Action</th></tr></thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={4} className="emp-empty">No registered employees yet</td></tr>
            ) : (
              employees.map((emp, idx) => (
                <tr key={idx}>
                  <td style={{ color: 'var(--text-light)', fontWeight: 500 }}>{emp.name}</td>
                  <td><code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, fontSize: '0.85rem' }}>{emp.id}</code></td>
                  <td><span className="emp-badge-custom">{emp.registeredAt ? new Date(emp.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span></td>
                  <td><button className="emp-remove-btn" onClick={() => handleRemove(idx, emp.name, emp.id)}>🗑 Remove</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Note: This effectively also serves Agent 16 (SettingsModal functionality for the Key), keeping it inside Employee Manager as in JS version */}
        <div className="emp-key-box">
          <label>Current Establishment Key</label>
          <div className="emp-key-value">{estKey}</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.72rem', marginTop: 8 }}>Share this key with new staff so they can register. You can change it below.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Enter new key"
              style={{
                flex: 1, padding: 10, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)',
                borderRadius: 8, color: 'var(--text-light)', borderStyle: 'solid', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
              }}
            />
            <button
              onClick={handleUpdateKey}
              style={{
                padding: '10px 16px', background: 'var(--accent-gold)', color: 'var(--bg-dark)', border: 'none',
                borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap'
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
