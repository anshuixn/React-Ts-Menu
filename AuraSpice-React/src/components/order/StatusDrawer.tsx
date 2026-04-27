import { useRef } from 'react';
import type { OrderStatus, TrackerState } from '../../types';
import { useTouchPhysics } from '../../hooks/useTouchPhysics';

// ============================================
// Tracker image + metadata per status
// ============================================
const STEP_ORDER: OrderStatus[] = ['new', 'cooking', 'ready', 'completed'];

const STEP_META: Record<OrderStatus, {
  image: string;
  label: string;
  color: string;
}> = {
  new: {
    image: '/icons/tracker/received.png',
    label: 'Received',
    color: 'var(--status-new)',
  },
  cooking: {
    image: '/icons/tracker/cooking.png',
    label: 'Cooking',
    color: 'var(--status-cooking)',
  },
  ready: {
    image: '/icons/tracker/ready.png',
    label: 'On the Way',
    color: 'var(--status-ready)',
  },
  completed: {
    image: '/icons/tracker/served.png',
    label: 'Enjoyed',
    color: 'var(--text-muted)',
  },
};

// ============================================
// StatusTracker — image-based step indicators
// ============================================
export function StatusTracker({ status }: { status: OrderStatus | null }) {
  const currentIndex = status ? STEP_ORDER.indexOf(status) : -1;

  return (
    <div className="tracker-steps">
      {STEP_ORDER.map((step, idx) => {
        const isActive = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        const meta = STEP_META[step];

        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: idx < STEP_ORDER.length - 1 ? '1' : 'none' }}>
            <div className="tracker-step" data-step={step}>
              {/* Step image circle */}
              <div
                className={`step-img-wrap${isActive ? ' active' : ''}${isCurrent ? ' current' : ''}`}
                style={{ borderColor: isActive ? meta.color : 'var(--glass-border)' }}
              >
                <img
                  src={meta.image}
                  alt={meta.label}
                  className="step-img"
                  style={{
                    opacity: isActive ? 1 : 0.25,
                    filter: isCurrent ? 'brightness(1.1)' : isActive ? 'brightness(0.85)' : 'grayscale(1) brightness(0.4)',
                  }}
                  draggable={false}
                />
                {/* Glow ring for current step */}
                {isCurrent && (
                  <div
                    className="step-glow-ring"
                    style={{ boxShadow: `0 0 0 3px ${meta.color}44, 0 0 18px ${meta.color}88` }}
                  />
                )}
              </div>
              {/* Step label */}
              <span
                className="step-label"
                style={{ color: isActive ? meta.color : 'var(--text-dim)' }}
              >
                {meta.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEP_ORDER.length - 1 && (
              <div
                className="step-line"
                style={{
                  background: idx < currentIndex
                    ? STEP_META[STEP_ORDER[idx + 1]].color
                    : 'var(--glass-border)',
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
// StatusDrawer — with hero image area
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

  const currentMeta = status ? STEP_META[status] : null;

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
        /* ── Empty state ── */
        <div id="status-empty" className="tracker-empty">
          <div className="tracker-hero-img-wrap tracker-hero-empty">
            <img
              src="/icons/tracker/received.png"
              alt="No active order"
              className="tracker-hero-img"
              style={{ opacity: 0.25, filter: 'grayscale(0.6)' }}
              draggable={false}
            />
          </div>
          <p className="tracker-empty-text">
            No active order yet.<br />Place an order to track it here.
          </p>
        </div>
      ) : (
        /* ── Live tracker ── */
        <div id="live-tracker" className="tracker-live">

          {/* Hero image — shows the CURRENT step's photo */}
          <div className="tracker-hero-img-wrap">
            <img
              key={status}
              src={currentMeta!.image}
              alt={currentMeta!.label}
              className="tracker-hero-img tracker-hero-enter"
              draggable={false}
            />
            {/* Overlay gradient at bottom */}
            <div className="tracker-hero-overlay" />
            {/* Status pill on image */}
            <div
              className="tracker-status-pill"
              style={{ background: `${currentMeta!.color}22`, borderColor: `${currentMeta!.color}66`, color: currentMeta!.color }}
            >
              <span
                className="tracker-status-dot"
                style={{ background: currentMeta!.color, boxShadow: `0 0 6px ${currentMeta!.color}` }}
              />
              {trackerData?.title ?? currentMeta!.label}
            </div>
          </div>

          {/* Description */}
          <p id="tracker-desc" className="tracker-desc">
            {trackerData?.desc}
          </p>

          {/* Step-by-step tracker */}
          <StatusTracker status={status} />
        </div>
      )}
    </div>
  );
}
