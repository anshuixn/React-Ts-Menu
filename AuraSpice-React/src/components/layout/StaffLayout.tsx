import { useState } from 'react';
import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { EmployeeManagerModal } from '../staff/EmployeeManagerModal';

export function StaffLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [showEmpModal, setShowEmpModal] = useState(false);

  const isAdmin = user?.id.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'admin';

  return (
    <div className="staff-portal" style={{ minHeight: '100vh', background: 'var(--bg-dark)', paddingTop: 80 }}>
      {/* Header */}
      <header
        id="header"
        className="scrolled"
        style={{
          display: 'flex', justifyContent: 'space-between', padding: '1rem 3%',
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)'
        }}
      >
        <div className="logo">
          Aura<span>&</span>Spice{' '}
          <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: 5 }}>
            Kitchen Portal
          </span>
        </div>
        <div className="staff-header-bar" style={{ display: 'flex', alignItems: 'center', gap: 15, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span className="staff-name-badge" style={{ color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/icons/chef.png" alt="Chef" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: '50%' }} draggable={false} />
            {user?.name}
          </span>
          <span>
            <span
              className="pulse-indicator"
              style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--status-ready)', borderRadius: '50%', marginRight: 8, boxShadow: '0 0 8px var(--status-ready)', animation: 'pulse 1.5s infinite' }}
            />
            Live Monitoring
          </span>
          {isAdmin && (
            <button
              onClick={() => setShowEmpModal(true)}
              style={{
                background: 'transparent', border: '1px solid rgba(212, 175, 55, 0.4)',
                color: 'var(--accent-gold)', padding: '6px 14px', borderRadius: 8,
                cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem',
                transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Users size={14} strokeWidth={2} />
              Employees
            </button>
          )}
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)', padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.8rem', transition: 'all 0.3s ease'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ paddingTop: 20 }}>
        {children}
      </div>

      {isAdmin && <EmployeeManagerModal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} />}
    </div>
  );
}
