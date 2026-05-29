import { useRef, useEffect } from 'react';
import type { OrderStatus, TrackerState } from '../../types';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useFocusTrap } from '../../hooks/useFocusTrap';

/**
 * Premium animated order status drawer with parallax hero,
 * spring-staggered stepper, and confetti celebration.
 */

const STEP_ORDER: OrderStatus[] = ['new', 'cooking', 'ready', 'completed'];

const STEP_META: Record<OrderStatus, {
  image: string;
  heroImage: string;
  label: string;
  color: string;
  desc: string;
}> = {
  new: {
    image: '/icons/tracker/received.png',
    heroImage: '/icons/tracker/received.png',
    label: 'Order Received',
    color: 'var(--status-new)',
    desc: 'The kitchen has received your order and will start preparing it shortly.',
  },
  cooking: {
    image: '/icons/tracker/cooking.png',
    heroImage: '/icons/tracker/cooking.png',
    label: 'Chef is Cooking',
    color: 'var(--status-cooking)',
    desc: 'Your meal is being prepared with care and passion.',
  },
  ready: {
    image: '/icons/tracker/ready.png',
    heroImage: '/icons/tracker/ready.png',
    label: 'On the Way',
    color: 'var(--status-ready)',
    desc: 'A waiter is bringing your food to your table. Bon appétit!',
  },
  completed: {
    image: '/icons/tracker/served.png',
    heroImage: '/icons/tracker/served.png',
    label: 'Enjoyed',
    color: 'var(--status-ready)',
    desc: 'We hope you love it! Thank you for dining with us.',
  },
};

interface StatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: OrderStatus | null;
  trackerData: TrackerState | null;
}

// ── Confetti celebration ──────────────────────────────────
function fireCelebration() {
  const end = Date.now() + 1800;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#D4AF37', '#ffffff', '#2ecc71'],
      zIndex: 10010,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#D4AF37', '#e67e22', '#ffffff'],
      zIndex: 10010,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

// ── Hero section with parallax ────────────────────────────
function HeroParallax({ status }: { status: OrderStatus }) {
  const meta = STEP_META[status];
  const scrollY = useMotionValue(0);
  const rawY = useTransform(scrollY, [0, 300], [0, -40]);
  const smoothY = useSpring(rawY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    if (status === 'completed') {
      // Small delay so drawer is fully open first
      const t = setTimeout(fireCelebration, 400);
      return () => clearTimeout(t);
    }
  }, [status]);

  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        position: 'relative', width: '100%', height: 240,
        borderRadius: 20, overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)',
      }}
    >
      {/* Parallax image */}
      <motion.img
        src={meta.heroImage}
        alt={status}
        style={{
          width: '100%', height: '120%',
          objectFit: 'cover',
          y: smoothY,
          willChange: 'transform',
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(10,10,10,0.96) 100%)' }} />

      {/* Live status pill */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          position: 'absolute', bottom: 16, left: 16,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          border: `1px solid ${meta.color}55`,
          color: meta.color, fontWeight: 700, fontSize: '0.82rem',
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }}
        />
        {meta.label}
      </motion.div>
    </motion.div>
  );
}

// ── Individual step in the vertical stepper ───────────────
function JourneyStep({ step, idx, currentIndex }: { step: OrderStatus; idx: number; currentIndex: number }) {
  const isActive  = idx <= currentIndex;
  const isCurrent = idx === currentIndex;
  const isDone    = idx < currentIndex;
  const meta = STEP_META[step];

  return (
    <motion.div
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28, delay: idx * 0.09 }}
      style={{ display: 'flex', gap: 18 }}
    >
      {/* Icon column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <motion.div
          animate={{
            scale: isCurrent ? [1, 1.12, 1] : 1,
            borderColor: isActive ? meta.color : 'var(--glass-border)',
            backgroundColor: isActive ? `${meta.color}18` : 'rgba(255,255,255,0.03)',
          }}
          transition={isCurrent ? { duration: 2.4, repeat: Infinity } : { duration: 0.4 }}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '2px solid', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', zIndex: 2, position: 'relative',
          }}
        >
          {isDone && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: `${meta.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3.5 3.5 6.5-7" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          )}
          <img
            src={meta.image}
            alt={step}
            style={{ width: 28, height: 28, filter: isActive ? 'none' : 'grayscale(1) opacity(0.25)' }}
          />
        </motion.div>

        {/* Connector line */}
        {idx < STEP_ORDER.length - 1 && (
          <div style={{ width: 2, height: 44, background: 'var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: isDone ? 1 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
              style={{
                position: 'absolute', inset: 0,
                background: meta.color, opacity: 0.5,
                transformOrigin: 'top',
              }}
            />
          </div>
        )}
      </div>

      {/* Text column */}
      <div style={{ paddingTop: 8, paddingBottom: idx < STEP_ORDER.length - 1 ? 0 : 0 }}>
        <span style={{
          display: 'block', fontSize: '0.88rem',
          fontWeight: isCurrent ? 700 : 500,
          color: isActive ? 'var(--text-light)' : 'var(--text-dim)',
          letterSpacing: 0.2,
        }}>
          {meta.label}
        </span>
        {isCurrent && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 600, display: 'block', marginTop: 2 }}
          >
            Live Now
          </motion.span>
        )}
        {isDone && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
            Complete
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Drawer ───────────────────────────────────────────
export function StatusDrawer({ isOpen, onClose, status, trackerData }: StatusDrawerProps) {
  const currentIndex = status ? STEP_ORDER.indexOf(status) : -1;
  const currentMeta  = status ? STEP_META[status] : null;
  const contentRef   = useRef<HTMLDivElement>(null);
  const drawerRef    = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)', zIndex: 1000 }}
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-drawer-title"
            aria-hidden={!isOpen}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, left: 0,
              width: '100%', maxWidth: 420, height: '100%',
              background: 'var(--bg-dark)', zIndex: 1001,
              boxShadow: '20px 0 60px rgba(0,0,0,0.9)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              borderRight: '1px solid var(--glass-border)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '22px 20px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--glass-border)',
              background: 'rgba(10,10,10,0.6)', backdropFilter: 'blur(12px)',
            }}>
              <div>
                <h2 id="status-drawer-title" style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: 0.3, margin: 0 }}>
                  Order Status
                </h2>
                {status && currentMeta && (
                  <motion.p
                    key={status}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: '0.75rem', color: currentMeta.color, margin: '2px 0 0', fontWeight: 600 }}
                  >
                    {currentMeta.label}
                  </motion.p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close order status drawer"
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  color: 'var(--text-light)', width: 36, height: 36,
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s ease',
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 48px' }}>
              {!status ? (
                /* Empty state */
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '65%', textAlign: 'center', gap: 22,
                  }}
                >
                  <div style={{
                    width: 140, height: 140, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)', border: '2px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src="/icons/tracker/received.png" alt="Empty" style={{ width: 96, height: 96, filter: 'grayscale(1) opacity(0.18)' }} />
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-light)', fontWeight: 600, marginBottom: 8 }}>No active order</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>
                      Once you place an order, you can track every step of its journey here — in real time.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Hero with parallax */}
                  <HeroParallax status={status} />

                  {/* Description */}
                  <motion.p
                    key={status + '_desc'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}
                  >
                    {trackerData?.desc ?? currentMeta?.desc}
                  </motion.p>

                  {/* Vertical journey stepper */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 4 }}>
                    <AnimatePresence>
                      {STEP_ORDER.map((step, idx) => (
                        <JourneyStep key={step} step={step} idx={idx} currentIndex={currentIndex} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
