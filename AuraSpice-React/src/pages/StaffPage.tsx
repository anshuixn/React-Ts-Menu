import { AlertTriangle } from 'lucide-react';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { StaffLayout } from '../components/layout/StaffLayout';
import { KanbanBoard } from '../components/staff/KanbanBoard';
import { KanbanHeader } from '../components/staff/KanbanHeader';
import { useStaffOrdersRealtime } from '../hooks/useStaffOrdersRealtime';


// ============================================
// Staff Portal — Realtime Kanban Dashboard
// ============================================

function StaffPageInner() {
  const { orders, loading, error, isConnected, updateOrderStatus, clearOrders } = useStaffOrdersRealtime();

  return (
    <StaffLayout>
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <span className="section-label">Staff Dashboard</span>
          <h1 className="section-title">Live Order Management</h1>
          <div className="gold-line" />
          {/* Realtime connection badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 12px', borderRadius: 20, background: isConnected ? 'rgba(46,204,113,0.08)' : 'rgba(255,71,87,0.08)', border: `1px solid ${isConnected ? 'rgba(46,204,113,0.3)' : 'rgba(255,71,87,0.2)'}`, fontSize: '0.75rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? '#2ecc71' : '#ff4757', animation: isConnected ? 'pulse 1.5s infinite' : 'none', display: 'inline-block' }} />
            <span style={{ color: isConnected ? '#2ecc71' : '#ff4757' }}>{isConnected ? 'Realtime Connected' : 'Connecting…'}</span>
          </div>
        </div>

        <KanbanHeader onClearAll={clearOrders} />

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading orders…</p>
        ) : error ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.2)',
            borderRadius: 16, margin: '20px 0'
          }}>
            <AlertTriangle size={36} strokeWidth={1.5} style={{ color: '#ff4757', marginBottom: 12 }} />
            <p style={{ color: '#ff4757', fontWeight: 600, marginBottom: 8 }}>Backend Unavailable</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{error}</p>
          </div>
        ) : (
          <KanbanBoard orders={orders} onUpdateStatus={updateOrderStatus} />
        )}
      </div>
    </StaffLayout>
  );
}

export default function StaffPage() {
  return (
    <ProtectedRoute>
      <StaffPageInner />
    </ProtectedRoute>
  );
}
