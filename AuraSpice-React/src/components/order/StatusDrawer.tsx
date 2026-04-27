import { useRef } from 'react';
import type { OrderStatus, TrackerState } from '../../types';
import { useTouchPhysics } from '../../hooks/useTouchPhysics';

// ============================================
// StatusTracker — Agent 15
// ============================================
const STEP_ORDER: OrderStatus[] = ['new', 'cooking', 'ready', 'completed'];
const STEP_COLORS: Record<OrderStatus, string> = {
  new:       'var(--status-new)',
  cooking:   'var(--status-cooking)',
  ready:     'var(--status-ready)',
  completed: 'var(--text-muted)',
};
const STEP_LABELS: Record<OrderStatus, string> = {
  new: 'Received', cooking: 'Cooking', ready: 'On the Way', completed: 'Enjoyed',
};

export function StatusTracker({ status }: { status: OrderStatus | null }) {
  const currentIndex = status ? STEP_ORDER.indexOf(status) : -1;

  return (
    <div className="tracker-steps">
      {STEP_ORDER.map((step, idx) => {
        const isActive = idx <= currentIndex;
        const color = STEP_COLORS[step];
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className="tracker-step"
              data-step={step}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div
                className="step-circle"
                style={{
                  width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${isActive ? color : 'var(--glass-border)'}`,
                  boxShadow: isActive ? `0 0 16px ${color}` : 'none',
                }}
              >
              </div>
              <span style={{ fontSize: '0.7rem', color: isActive ? color : 'var(--text-dim)', letterSpacing: 1 }}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {idx < STEP_ORDER.length - 1 && (
              <div
                className="step-line"
                style={{
                  height: 2, flex: 1, margin: '0 8px', marginBottom: 20,
                  background: idx < currentIndex ? STEP_COLORS[STEP_ORDER[idx + 1]] : 'var(--glass-border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// StatusDrawer — Agent 15
// ============================================
interface StatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: OrderStatus | null;
  trackerData: TrackerState | null;
}

export function StatusDrawer({ isOpen, onClose, status, trackerData }: StatusDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useTouchPhysics(drawerRef, 'left', isOpen, onClose);

  return (
    <div
      ref={drawerRef}
      id="status-drawer"
      className={`status-drawer${isOpen ? ' open' : ''}`}
      aria-hidden={!isOpen}
    >
      <div className="drawer-header">
        <h2 className="drawer-title">Order Status</h2>
        <button className="close-drawer" data-close="status" onClick={onClose} aria-label="Close status">✕</button>
      </div>

      {!status ? (
        <div id="status-empty" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <img src="/icons/status.png" alt="No orders" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', marginBottom: 12 }} draggable={false} />
          <p>No active order yet.<br />Place an order to track it here.</p>
        </div>
      ) : (
        <div id="live-tracker" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              id="tracker-dot"
              style={{ width: 10, height: 10, borderRadius: '50%', background: trackerData?.color, boxShadow: `0 0 12px ${trackerData?.color}`, flexShrink: 0 }}
            />
            <span id="tracker-status" style={{ fontWeight: 600, color: trackerData?.color }}>{trackerData?.title}</span>
          </div>
          <p id="tracker-desc" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{trackerData?.desc}</p>
          <StatusTracker status={status} />
        </div>
      )}
    </div>
  );
}
