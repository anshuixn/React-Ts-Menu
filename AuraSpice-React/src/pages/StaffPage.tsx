import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { StaffLayout } from '../components/layout/StaffLayout';
import { KanbanBoard } from '../components/staff/KanbanBoard';
import { KanbanHeader } from '../components/staff/KanbanHeader';
import { useStaffOrdersPolling } from '../hooks/useStaffOrdersPolling';
import '../staff-dashboard.css';

// ============================================
// Staff Portal — Agent 15 & 19
// ============================================

function StaffPageInner() {
  const { orders, loading, error, updateOrderStatus, clearOrders } = useStaffOrdersPolling();

  return (
    <StaffLayout>
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ marginBottom: 20 }}>
          <span className="section-label">Staff Dashboard</span>
          <h1 className="section-title">Live Order Management</h1>
          <div className="gold-line" />
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
            <p style={{ fontSize: '2rem', marginBottom: 12 }}>⚠️</p>
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
